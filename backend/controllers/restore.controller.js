const { google } = require('googleapis');
const oauth2Client = require('../config/google');
const GoogleToken = require('../models/GoogleToken');
const restoreService = require('../services/restore.service');
const AuditLog = require('../models/AuditLog');
const path = require('path');
const fs = require('fs').promises;

/**
 * List backups from Google Drive
 * Requires Admin Auth
 */
exports.listBackups = async (req, res, next) => {
  try {
    const tokenData = await GoogleToken.findOne();
    if (!tokenData) return res.status(401).json({ message: 'Google account not connected' });
    oauth2Client.setCredentials(tokenData);

    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    
    if (!folderId) {
      return res.status(500).json({ success: false, message: 'GOOGLE_DRIVE_FOLDER_ID is not configured' });
    }

    let response;
    try {
      response = await drive.files.list({
        q: `'${folderId}' in parents and trashed = false and (mimeType = 'application/zip' or name contains '.zip.enc')`,
        fields: 'files(id, name, createdTime, size)',
        orderBy: 'createdTime desc'
      });
    } catch (err) {
      if (err.response?.data?.error === 'invalid_grant' || err.code === 401) {
        throw new Error('GOOGLE_TOKEN_EXPIRED');
      }
      throw err;
    }

    const files = (response.data.files || []).map(file => ({
      ...file,
      // Add a cleaner display name for the UI by stripping .enc if present
      displayName: file.name.endsWith('.enc') ? file.name.slice(0, -4) : file.name,
      isEncrypted: file.name.endsWith('.enc')
    }));

    res.json({ success: true, data: files });
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
  const { fileId, confirm } = req.body;

  // 1. Security: Identity Check
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Unauthorized: Admin access required' });
  }

  // 2. Input Validation
  if (!fileId || typeof fileId !== 'string') {
    return res.status(400).json({ success: false, message: 'Invalid fileId' });
  }

  if (confirm !== true) {
    return res.status(400).json({ success: false, message: 'Security check: Confirmation required for destructive restore' });
  }

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

  // const tempZipPath = path.join(BACKUP_DIR, `restore-temp-${Date.now()}.zip`);

  try {
    console.log(`[RESTORE:SECURE] Admin ${req.user.username} initiated restore for fileId: ${fileId}`);

    // A. Fetch file metadata to get the correct extension
    const tokenData = await GoogleToken.findOne();
    if (!tokenData) throw new Error('Google account not connected');
    oauth2Client.setCredentials(tokenData);
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    const fileMetadata = await drive.files.get({ fileId, fields: 'name' });
    const fileName = fileMetadata.data.name;
    const extension = fileName.endsWith('.enc') ? '.zip.enc' : '.zip';
    
    const tempZipPath = path.join(BACKUP_DIR, `restore-temp-${Date.now()}${extension}`);

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

    // C. Respond Immediately
    res.json({ 
      success: true, 
      message: 'Tiến trình khôi phục đã bắt đầu trong nền. Vui lòng theo dõi thanh tiến độ.' 
    });

  } catch (error) {
    console.error('[RESTORE:INIT_FAILED] Error:', error.response?.data || error.message);
    
    // Quick cleanup of failed download
    if (await exists(tempZipPath)) {
      await fs.rm(tempZipPath, { force: true }).catch(() => {});
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
