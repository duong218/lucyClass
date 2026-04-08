const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { spawn } = require('child_process');
const { google } = require('googleapis');
const oauth2Client = require('../config/google');
const GoogleToken = require('../models/GoogleToken');
const { encryptFile } = require('../utils/encryptionUtils');

/**
 * PRODUCTION-READY BACKUP SERVICE
 */

const ensureDir = (dirPath) => {
  fs.mkdirSync(dirPath, { recursive: true });
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const uploadToDriveWithRetry = async ({ drive, encryptedFilePath, encryptedFileName, targetFolderId, attempts = 3 }) => {
  let lastErr = null;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    console.log(`[BackupService] Upload attempt ${attempt}/${attempts}: ${encryptedFileName}`);
    try {
      const driveResponse = await drive.files.create({
        requestBody: {
          name: encryptedFileName,
          mimeType: 'application/octet-stream',
          parents: [targetFolderId]
        },
        media: {
          mimeType: 'application/octet-stream',
          body: fs.createReadStream(encryptedFilePath),
        },
      });
      return driveResponse;
    } catch (err) {
      lastErr = err;
      console.error(`[BackupService] Upload attempt ${attempt} failed:`, err.response?.data || err.message);
      if (attempt < attempts) {
        await sleep(1000 * attempt);
      }
    }
  }
  throw lastErr;
};

const resolveBackupRoot = () => {
  const B_PATH = process.env.BACKUP_PATH;
  if (!B_PATH) throw new Error('BACKUP_PATH not defined in .env');
  return path.resolve(B_PATH);
};

const listUploadingFilesRecursive = (dir) => {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...listUploadingFilesRecursive(full));
    } else if (entry.isFile() && entry.name.endsWith('.uploading')) {
      results.push(full);
    }
  }
  return results;
};

/**
 * On startup: retry any interrupted uploads (files ending with .uploading)
 */
exports.retryPendingUploads = async () => {
  const BACKUP_DIR = resolveBackupRoot();
  ensureDir(BACKUP_DIR);

  const pending = listUploadingFilesRecursive(BACKUP_DIR);
  if (pending.length === 0) {
    console.log('[BackupService] Startup scan: no .uploading backups found');
    return;
  }

  console.log(`[BackupService] Startup scan: found ${pending.length} .uploading file(s), retrying upload...`);

  const tokenData = await GoogleToken.findOne();
  if (!tokenData) {
    console.warn('[BackupService] Startup retry skipped: Google Drive account not connected');
    return;
  }

  const encryptionKey = process.env.BACKUP_ENCRYPTION_KEY;
  if (!encryptionKey) {
    console.warn('[BackupService] Startup retry skipped: BACKUP_ENCRYPTION_KEY missing');
    return;
  }

  oauth2Client.setCredentials(tokenData);
  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  const targetFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID || '1grfEjnjRM-HlGHqhlHtbJyEY8tSdv41m';

  for (const uploadingPath of pending) {
    const baseName = path.basename(uploadingPath);
    const encryptedFileName = baseName + '.enc';
    const encryptedFilePath = uploadingPath + '.enc';

    console.log(`[BackupService] Retrying upload for: ${baseName}`);
    try {
      console.log(`[BackupService] Encrypting for retry: ${baseName} -> ${encryptedFileName}`);
      await encryptFile(uploadingPath, encryptedFilePath, encryptionKey);

      const driveResponse = await uploadToDriveWithRetry({
        drive,
        encryptedFilePath,
        encryptedFileName,
        targetFolderId,
        attempts: 3
      });

      console.log(`[BackupService] Retry upload success. FileID: ${driveResponse.data.id}. Deleting local: ${baseName}`);
      try { fs.unlinkSync(uploadingPath); } catch (_) {}
    } catch (err) {
      console.error('[BackupService] Retry upload failed (file kept):', err.response?.data || err.message);
      if (err.response?.data?.error === 'invalid_grant') {
        console.error('[BackupService] Retry upload aborted: GOOGLE_TOKEN_EXPIRED');
        break;
      }
    } finally {
      if (fs.existsSync(encryptedFilePath)) {
        try { fs.unlinkSync(encryptedFilePath); } catch (_) {}
      }
    }
  }
};

/**
 * Core function to run a database and uploads backup
 * @param {Object} options 
 * @param {string} options.fileNamePrefix - Prefix for the ZIP file (e.g. 'backup', 'safety')
 * @param {boolean} options.uploadToDrive - Whether to upload the final ZIP to Google Drive
 * @param {string} options.targetFolderId - Google Drive folder ID for upload
 * @returns {Promise<Object>} Backup results { filePath, fileName, driveFileId }
 */
exports.runBackup = async (options = {}) => {
  const { 
    fileNamePrefix = 'backup', 
    uploadToDrive = false, 
    targetFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID || '1grfEjnjRM-HlGHqhlHtbJyEY8tSdv41m' 
  } = options;

  console.log(`[BackupService] Start backup: ${fileNamePrefix}`);

  const now = new Date();
  const timestamp = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}-${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}`;
  const zipFileName = `${fileNamePrefix}-${timestamp}.zip`;
  
  const BACKUP_DIR = resolveBackupRoot();
  
  if (fileNamePrefix === 'safety') {
    const safetyDir = path.join(BACKUP_DIR, 'safety');
    ensureDir(safetyDir);
  } else {
    ensureDir(BACKUP_DIR);
  }

  const tempDir = path.join(BACKUP_DIR, `temp-${timestamp}`);
  const dbDir = path.join(tempDir, 'db');
  const zipFilePath = path.join(BACKUP_DIR, fileNamePrefix === 'safety' ? 'safety' : '', zipFileName);

  try {
    // 1. Create temp structure
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

    // 2. Perform mongodump
    console.log(`[BackupService] Running mongodump to ${dbDir}...`);
    // 🔥 FIX: replaced exec with spawn (secure)
    await new Promise((resolve, reject) => {
      const args = [
        `--uri=${process.env.MONGO_URI}`,
        `--out=${dbDir}`,
        '--quiet'
      ];
      
      const proc = spawn('mongodump', args);
      
      // Timeout protection (10 minutes)
      const timeout = setTimeout(() => {
        proc.kill();
        reject(new Error('Database backup timed out after 10 minutes'));
      }, 10 * 60 * 1000);

      let stderrOutput = '';
      proc.stderr.on('data', (data) => {
        stderrOutput += data.toString();
      });

      proc.on('error', (error) => {
        clearTimeout(timeout);
        console.error("[BackupService] Mongodump error:", error.message);
        reject(new Error(`Database backup failed: ${error.message}`));
      });

      proc.on('close', (code) => {
        clearTimeout(timeout);
        if (code !== 0) {
          console.error("[BackupService] Mongodump exited with code:", code);
          console.error("[BackupService] Stderr output:", stderrOutput);
          return reject(new Error(`Database backup failed with exit code ${code}`));
        }
        resolve();
      });
    });

    // 3. Copy uploads
    // Images are now stored in Cloudinary and are NOT part of backup

    // 4. Create ZIP
    console.log(`[BackupService] Creating ZIP: ${zipFileName}...`);
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    const zipPromise = new Promise((resolve, reject) => {
      output.on('close', resolve);
      archive.on('error', reject);
    });

    archive.pipe(output);
    archive.directory(tempDir, false); // No prefix folder inside ZIP
    await archive.finalize();
    await zipPromise;

    let driveFileId = null;

    // 5. Upload to Drive if requested
    if (uploadToDrive) {
      console.log(`[BackupService] Preparing to upload to Google Drive...`);
      
      const encryptionKey = process.env.BACKUP_ENCRYPTION_KEY;
      if (!encryptionKey) {
        throw new Error('BACKUP_ENCRYPTION_KEY is missing in .env. Cannot encrypt for Google Drive upload.');
      }

      const tokenData = await GoogleToken.findOne();
      if (!tokenData) throw new Error('Google Drive account not connected');
      
      oauth2Client.setCredentials(tokenData);
      const drive = google.drive({ version: 'v3', auth: oauth2Client });

      const encryptedFileName = zipFileName + '.enc';
      const uploadingZipPath = zipFilePath + '.uploading';
      const encryptedFilePath = uploadingZipPath + '.enc';

      // Mark local file as "in-flight" before upload (crash-safe)
      try {
        fs.renameSync(zipFilePath, uploadingZipPath);
      } catch (err) {
        console.error('[BackupService] Failed to mark backup as .uploading:', err.message);
        throw err;
      }

      try {
        // Encrypt ZIP before upload
        console.log(`[BackupService] Encrypting ${path.basename(uploadingZipPath)} -> ${encryptedFileName}...`);
        await encryptFile(uploadingZipPath, encryptedFilePath, encryptionKey);

        const driveResponse = await uploadToDriveWithRetry({
          drive,
          encryptedFilePath,
          encryptedFileName,
          targetFolderId,
          attempts: 3
        });
        
        driveFileId = driveResponse.data.id;
        console.log(`[BackupService] Upload success. FileID: ${driveFileId}`);

        // Upload succeeded -> delete local uploading file
        try {
          fs.unlinkSync(uploadingZipPath);
          console.log(`[BackupService] Deleted local backup: ${path.basename(uploadingZipPath)}`);
        } catch (err) {
          console.error('[BackupService] Failed to delete local backup after upload:', err.message);
        }
      } catch (err) {
        console.error('[BackupService] Upload failed (file kept for retry):', err.response?.data || err.message);
        if (err.response?.data?.error === 'invalid_grant') {
          throw new Error('GOOGLE_TOKEN_EXPIRED');
        }
        throw err;
      } finally {
        // Always clean up the encrypted temporary file 
        if (fs.existsSync(encryptedFilePath)) {
          fs.unlinkSync(encryptedFilePath);
        }
      }
    }

    return {
      filePath: zipFilePath,
      fileName: zipFileName,
      driveFileId
    };

  } finally {
    // Cleanup Temp Folder
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    // Note: We keep the ZIP file in the backups dir for a while if it's not a safety backup
    // Or we could delete it after upload. Let's keep it for now unless it's too big.
  }
};

/**
 * Creates a local safety backup before restore
 */
exports.createSafetyBackup = async () => {
  return await exports.runBackup({ 
    fileNamePrefix: 'safety', 
    uploadToDrive: false 
  });
};
