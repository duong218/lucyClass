const driveService = require('../services/drive.service');
const restoreService = require('../services/restore.service');
const AuditLog = require('../models/AuditLog');
const path = require('path');
const fs = require('fs').promises;
const bcrypt = require('bcrypt');

// Lazy-load User model to avoid circular dependency issues
const Admin = require('../models/Admin');

/**
 * List backups from Google Drive
 * Requires Admin Auth
 */
exports.listBackups = async (req, res, next) => {
  try {
    const drive = await driveService.getDrive();
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!folderId) {
      return res.status(500).json({ success: false, message: 'GOOGLE_DRIVE_FOLDER_ID is not configured' });
    }

    let files;
    try {
      files = await driveService.listFiles(drive, folderId);
    } catch (err) {
      if (err.response?.data?.error === 'invalid_grant' || err.code === 401) {
        throw new Error('GOOGLE_TOKEN_EXPIRED');
      }
      throw err;
    }

    const enrichedFiles = files.map(file => ({
      ...file,
      // Add a cleaner display name for the UI by stripping .enc if present
      displayName: file.name.endsWith('.enc') ? file.name.slice(0, -4) : file.name,
      isEncrypted: file.name.endsWith('.enc')
    }));

    res.json({ success: true, data: enrichedFiles });
  } catch (error) {
    console.error('[RESTORE:LIST] Error:', error.response?.data || error.message);

    if (error.message === 'GOOGLE_TOKEN_EXPIRED' || error.status === 401) {
      return res.status(401).json({
        success: false,
        message: 'Google token expired, please reconnect'
      });
    }

    next(error);
  }
};

/**
 * Trigger Database Restore
 * Restricted to ADMIN only
 */
exports.restoreBackup = async (req, res, next) => {
  const { fileId, confirm, password } = req.body;

  // 1. Security: Identity Check
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Unauthorized: Admin access required' });
  }

  // 2. Input Validation
  if (!fileId || typeof fileId !== 'string') {
    return res.status(400).json({ success: false, message: 'Invalid fileId' });
  }

  // ── GUARD 1: Explicit string confirmation ──────────────────────────────────
  // Replaced the old `confirm !== true` (boolean) check with a stricter string
  // literal. This prevents accidental triggers from API clients that coerce
  // truthy values and makes the intent unmistakably deliberate.
  if (confirm !== 'CONFIRM') {
    return res.status(400).json({ success: false, message: 'Invalid confirmation' });
  }

  // ── GUARD 2: Re-authentication — verify admin password ────────────────────
  // Even if the JWT/session token is compromised, the attacker still needs the
  // plaintext password to proceed. We fetch the full user record so we have the
  // hashed password (req.user from middleware usually omits it).
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ success: false, message: 'Password is required' });
  }

  // ── GUARD 3: Anti-automation safety delay ─────────────────────────────────
  // Delay TRƯỚC khi kiểm tra password để penalize mọi attempt (kể cả sai password).
  // Nếu delay nằm sau password check thì attacker nhận 401 ngay lập tức và brute-force
  // tự do mà không bị throttle.
  await new Promise(resolve => setTimeout(resolve, 4000));

  try {
    const Admin = require('../models/Admin');
    const adminUser = await Admin.findById(req.user.id || req.user._id).select('+password');
    if (!adminUser) {
      return res.status(401).json({ success: false, message: 'Admin user not found' });
    }

    const passwordMatch = await bcrypt.compare(password, adminUser.password);
    if (!passwordMatch) {
      console.warn(
        `[RESTORE:AUTH_FAIL] Admin ${req.user.username} (id: ${req.user.id || req.user._id}) ` +
        `failed password re-auth at ${new Date().toISOString()}`
      );
      return res.status(401).json({ success: false, message: 'Password incorrect' });
    }
  } catch (authErr) {
    console.error('[RESTORE:AUTH_ERROR]', authErr.message);
    return res.status(500).json({ success: false, message: 'Authentication check failed' });
  }

  // ── GUARD 4: Attempt logging ───────────────────────────────────────────────
  console.log(
    `[RESTORE:ATTEMPT] Admin "${req.user.username}" (id: ${req.user.id || req.user._id}) ` +
    `triggered restore for fileId: "${fileId}" at ${new Date().toISOString()}`
  );

  // 3. Environment Preparation
  const B_PATH = process.env.BACKUP_PATH;
  if (!B_PATH) {
    return res.status(500).json({ success: false, message: 'BACKUP_PATH is not configured' });
  }
  const BACKUP_DIR = path.resolve(B_PATH);

  try {
    if (!(await exists(BACKUP_DIR))) {
      await fs.mkdir(BACKUP_DIR, { recursive: true });
    }
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Storage initialization failed' });
  }

  // Fix: declare tempZipPath in the outer try scope so the catch block can
  // reference it for cleanup (it was previously scoped inside the try block,
  // causing a ReferenceError on cleanup).
  let tempZipPath;

  try {
    console.log(`[RESTORE:SECURE] Admin ${req.user.username} initiated restore for fileId: ${fileId}`);

    // A. Fetch file metadata to get the correct extension
    const drive = await driveService.getDrive();

    const fileMetadata = await drive.files.get({ fileId, fields: 'name' });
    const fileName = fileMetadata.data.name;
    const extension = fileName.endsWith('.enc') ? '.zip.enc' : '.zip';

    tempZipPath = path.join(BACKUP_DIR, `restore-temp-${Date.now()}${extension}`);

    // B. Download (Must await before starting restore)
    await restoreService.downloadFileFromDrive(fileId, tempZipPath);

    // C. Background Restore (Non-blocking)
    restoreService.performRestore(tempZipPath)
      .then(async () => {
        console.log('[RESTORE:SUCCESS] Background task finished.');
        await AuditLog.create({
          adminId: req.user.id || req.user._id,
          adminName: req.user.username,
          action: 'RESTORE_SUCCESS',
          description: `Database restore successful (fileId: ${fileId})`,
          ipAddress: req.ip
        });
      })
      .catch(async (err) => {
        console.error('[RESTORE:FAILURE] Background task error:', err.message);
        await AuditLog.create({
          adminId: req.user.id || req.user._id,
          adminName: req.user.username,
          action: 'RESTORE_FAILED',
          description: `Database restore failed: ${err.message}`,
          ipAddress: req.ip
        });
      });

    // D. Respond Immediately
    res.json({
      success: true,
      message: 'Tiến trình khôi phục đã bắt đầu trong nền. Vui lòng theo dõi thanh tiến độ.'
    });

  } catch (error) {
    console.error('[RESTORE:INIT_FAILED] Error:', error.response?.data || error.message);

    // Quick cleanup of failed download
    if (tempZipPath && await exists(tempZipPath)) {
      await fs.rm(tempZipPath, { force: true }).catch(() => { });
    }

    if (error.message === 'GOOGLE_TOKEN_EXPIRED' || error.status === 401) {
      return res.status(401).json({
        success: false,
        message: 'Google token expired, please reconnect'
      });
    }

    next(error);
  }
};

/**
 * GET current progress
 */
exports.getRestoreProgress = (req, res) => {
  res.json({ progress: restoreService.getRestoreProgress() });
};

/**
 * Helper: Async Path Exists
 */
async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}
