const fs = require('fs');
const { google } = require('googleapis');
const oauth2Client = require('../config/google');
const GoogleToken = require('../models/GoogleToken');

/**
 * GOOGLE DRIVE SERVICE
 * Centralized Drive operations for backup & restore workflows.
 */

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/** Maximum number of backup files to retain on Google Drive */
const MAX_BACKUP_FILES = 20;

// ─── Authentication ─────────────────────────────────────────────────────────

/**
 * Initialize and return an authenticated Google Drive client.
 * Reads tokens from MongoDB and sets credentials on the shared oauth2Client.
 * @returns {Promise<import('googleapis').drive_v3.Drive>}
 */
exports.getDrive = async () => {
  const tokenData = await GoogleToken.findOne();
  if (!tokenData) throw new Error('Google Drive account not connected');

  oauth2Client.setCredentials(tokenData);
  return google.drive({ version: 'v3', auth: oauth2Client });
};

// ─── Upload ─────────────────────────────────────────────────────────────────

/**
 * Upload a file to Google Drive with exponential-backoff retry.
 * @param {import('googleapis').drive_v3.Drive} drive - Authenticated Drive client
 * @param {string} filePath  - Local path of the file to upload
 * @param {string} fileName  - Target filename on Drive
 * @param {string} folderId  - Drive folder ID to upload into
 * @param {number} [attempts=3] - Number of retry attempts
 * @returns {Promise<import('googleapis').drive_v3.Schema$File>} Drive file metadata
 */
exports.uploadToDrive = async (drive, filePath, fileName, folderId, attempts = 3) => {
  let lastErr = null;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    console.log(`[DriveService] Upload attempt ${attempt}/${attempts}: ${fileName}`);
    try {
      const response = await drive.files.create({
        requestBody: {
          name: fileName,
          mimeType: 'application/octet-stream',
          parents: [folderId],
        },
        media: {
          mimeType: 'application/octet-stream',
          body: fs.createReadStream(filePath),
        },
      });
      console.log(`[DriveService] Upload successful: ${fileName} → FileID: ${response.data.id}`);
      return response;
    } catch (err) {
      lastErr = err;
      console.error(`[DriveService] Upload attempt ${attempt} failed:`, err.response?.data || err.message);
      if (attempt < attempts) {
        const delay = 1000 * attempt;
        console.log(`[DriveService] Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  throw lastErr;
};

// ─── Download ───────────────────────────────────────────────────────────────

/**
 * Download a file from Google Drive with retry logic.
 * @param {import('googleapis').drive_v3.Drive} drive - Authenticated Drive client
 * @param {string} fileId    - Google Drive file ID
 * @param {string} outputPath - Local path to save the downloaded file
 * @param {number} [attempts=3] - Number of retry attempts
 */
exports.downloadFromDrive = async (drive, fileId, outputPath, attempts = 3) => {
  for (let i = 1; i <= attempts; i++) {
    try {
      console.log(`[DriveService] Download attempt ${i}/${attempts} for fileId: ${fileId}`);
      const dest = fs.createWriteStream(outputPath);
      let res;
      try {
        res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' });
      } catch (err) {
        console.error('[DriveService] Drive download error:', err.response?.data || err.message);
        if (err.response?.data?.error === 'invalid_grant' || err.code === 401) {
          throw new Error('GOOGLE_TOKEN_EXPIRED');
        }
        throw err;
      }

      await new Promise((resolve, reject) => {
        res.data.pipe(dest);
        res.data.on('error', (err) => { dest.close(); reject(err); });
        dest.on('finish', () => { dest.close(); resolve(); });
        dest.on('error', (err) => { dest.close(); reject(err); });
      });

      // Validate downloaded file
      const { promises: fsp } = require('fs');
      const stats = await fsp.stat(outputPath);
      if (stats.size === 0) throw new Error('Downloaded file is empty');

      console.log(`[DriveService] Download successful: ${stats.size} bytes`);
      return;
    } catch (err) {
      if (err.message === 'GOOGLE_TOKEN_EXPIRED') throw err;
      if (i === attempts) throw new Error(`Google Drive download failed after ${attempts} attempts: ${err.message}`);
      console.warn(`[DriveService] Attempt ${i} failed, retrying in 2s...`);
      await sleep(2000);
    }
  }
};

// ─── List Files ─────────────────────────────────────────────────────────────

/**
 * List backup files in a Google Drive folder.
 * @param {import('googleapis').drive_v3.Drive} drive - Authenticated Drive client
 * @param {string} folderId - Drive folder ID
 * @param {Object} [options] - Query options
 * @param {string} [options.query] - Additional Drive query filter
 * @param {string} [options.orderBy] - Ordering (default: createdTime desc)
 * @returns {Promise<import('googleapis').drive_v3.Schema$File[]>}
 */
exports.listFiles = async (drive, folderId, options = {}) => {
  const {
    query = `(mimeType = 'application/zip' or name contains '.zip.enc')`,
    orderBy = 'createdTime desc',
  } = options;

  const response = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false and ${query}`,
    fields: 'files(id, name, createdTime, size)',
    orderBy,
  });

  return response.data.files || [];
};

// ─── Cleanup / Rotation ────────────────────────────────────────────────────

/**
 * Enforce backup rotation on Google Drive.
 * Keeps at most MAX_BACKUP_FILES backup files; deletes the oldest ones first.
 *
 * Safety: only files whose name contains "backup" are considered.
 * This protects non-backup files that may live in the same folder.
 *
 * @param {import('googleapis').drive_v3.Drive} drive - Authenticated Drive client
 * @param {string} folderId - Drive folder ID to clean
 */
exports.cleanupDriveBackups = async (drive, folderId) => {
  console.log(`[DriveService] Starting backup rotation check (max ${MAX_BACKUP_FILES} files)...`);

  try {
    // 1. Fetch ALL files in the folder (not just .zip/.enc)
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, createdTime)',
      orderBy: 'createdTime asc', // oldest first
      pageSize: 1000,
    });

    const allFiles = response.data.files;

    // 2. Guard: empty or undefined file list
    if (!allFiles || allFiles.length === 0) {
      console.log('[DriveService] No files found in folder. Skipping rotation.');
      return { deleted: 0, remaining: 0 };
    }

    // 3. Filter: only include files with "backup" in the name
    //    This matches both "backup-" (manual) and "auto-backup-" (cron) prefixes
    const backupFiles = allFiles.filter(f => f.name && f.name.toLowerCase().includes('backup'));

    console.log(`[DriveService] Found ${backupFiles.length} backup file(s) in folder.`);

    if (backupFiles.length <= MAX_BACKUP_FILES) {
      console.log(`[DriveService] Within limit (${backupFiles.length}/${MAX_BACKUP_FILES}). No cleanup needed.`);
      return { deleted: 0, remaining: backupFiles.length };
    }

    // 4. Calculate how many to delete (oldest first — list is already sorted asc)
    const excessCount = backupFiles.length - MAX_BACKUP_FILES;
    const filesToDelete = backupFiles.slice(0, excessCount);

    console.log(`[DriveService] Deleting ${excessCount} oldest backup(s) to enforce rotation...`);

    let deletedCount = 0;
    for (const file of filesToDelete) {
      try {
        await drive.files.delete({ fileId: file.id });
        deletedCount++;
        console.log(`[DriveService] ✓ Deleted: ${file.name} (${file.id}) — created ${file.createdTime}`);
      } catch (err) {
        console.error(`[DriveService] ✗ Failed to delete ${file.name} (${file.id}):`, err.message);
      }
    }

    console.log(`[DriveService] Rotation complete. Deleted: ${deletedCount}/${excessCount}. Remaining: ${backupFiles.length - deletedCount}`);
    return { deleted: deletedCount, remaining: backupFiles.length - deletedCount };
  } catch (err) {
    // Non-fatal: log and continue — backup itself already succeeded
    console.error('[DriveService] Backup rotation failed (non-fatal):', err.response?.data || err.message);
    return { deleted: 0, remaining: -1, error: err.message };
  }
};
