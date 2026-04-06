const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { spawn } = require('child_process');
const { google } = require('googleapis');
const oauth2Client = require('../config/google');
const GoogleToken = require('../models/GoogleToken');

/**
 * PRODUCTION-READY BACKUP SERVICE
 */

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

  console.log(`[BackupService] Starting ${fileNamePrefix} process...`);

  const now = new Date();
  const timestamp = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}-${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}`;
  const zipFileName = `${fileNamePrefix}-${timestamp}.zip`;
  
  const U_PATH = process.env.UPLOAD_PATH;
  const B_PATH = process.env.BACKUP_PATH;

  if (!U_PATH || !B_PATH) {
    throw new Error('UPLOAD_PATH or BACKUP_PATH not defined in .env');
  }

  const BACKUP_DIR = path.resolve(B_PATH);
  const UPLOADS_DIR_LOCAL = path.resolve(U_PATH);
  
  if (fileNamePrefix === 'safety') {
    const safetyDir = path.join(BACKUP_DIR, 'safety');
    if (!fs.existsSync(safetyDir)) fs.mkdirSync(safetyDir, { recursive: true });
  } else {
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const tempDir = path.join(BACKUP_DIR, `temp-${timestamp}`);
  const dbDir = path.join(tempDir, 'db');
  const uploadsDirInZip = path.join(tempDir, 'uploads');
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
    if (fs.existsSync(UPLOADS_DIR_LOCAL)) {
      console.log(`[BackupService] Copying uploads...`);
      if (!fs.existsSync(uploadsDirInZip)) fs.mkdirSync(uploadsDirInZip, { recursive: true });
      
      const copyRecursive = (src, dest) => {
        try {
          const stats = fs.statSync(src);
          if (stats.isDirectory()) {
            if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
            fs.readdirSync(src).forEach(child => {
              copyRecursive(path.join(src, child), path.join(dest, child));
            });
          } else {
            fs.copyFileSync(src, dest);
          }
        } catch (copyErr) {
          console.error(`[BackupService] Failed to copy ${src}:`, copyErr.message);
          // Continue with other files
        }
      };

      copyRecursive(UPLOADS_DIR_LOCAL, uploadsDirInZip);
    }

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
      console.log(`[BackupService] Uploading to Google Drive...`);
      const tokenData = await GoogleToken.findOne();
      if (!tokenData) throw new Error('Google Drive account not connected');
      
      oauth2Client.setCredentials(tokenData);
      const drive = google.drive({ version: 'v3', auth: oauth2Client });
      
      try {
        const driveResponse = await drive.files.create({
          requestBody: {
            name: zipFileName,
            mimeType: 'application/zip',
            parents: [targetFolderId]
          },
          media: {
            mimeType: 'application/zip',
            body: fs.createReadStream(zipFilePath),
          },
        });
        driveFileId = driveResponse.data.id;
        console.log(`[BackupService] Uploaded to Drive. FileID: ${driveFileId}`);
      } catch (err) {
        console.error('[BackupService] Drive upload error:', err.response?.data || err.message);
        if (err.response?.data?.error === 'invalid_grant') {
          throw new Error('GOOGLE_TOKEN_EXPIRED');
        }
        throw err;
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
