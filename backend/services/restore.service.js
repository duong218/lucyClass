const fs = require('fs').promises;
const fsStandard = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const { google } = require('googleapis');
const oauth2Client = require('../config/google');
const { spawn, execSync } = require('child_process');

const GoogleToken = require('../models/GoogleToken');
const backupService = require('./backup.service');

// 🔒 Global State (In-Memory Lock & Progress)
let isRestoring = false;
let restoreProgress = 0;

/**
 * Expose progress for API polling
 */
exports.getRestoreProgress = () => restoreProgress;

/**
 * Async Path Existence Check
 */
const exists = async (p) => {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate Mongorestore Binary Existence
 */
const getMongorestorePath = () => {
  const customPath = process.env.MONGORESTORE_PATH;
  if (customPath) return customPath;

  try {
    // Check if mongorestore is in system PATH
    const cmd = process.platform === 'win32' ? 'where mongorestore' : 'which mongorestore';
    execSync(cmd, { stdio: 'ignore' });
    return 'mongorestore';
  } catch (e) {
    return null;
  }
};

/**
 * Async Recursive Folder Search for BSONs
 */
const findBsonFolder = async (basePath) => {
  try {
    if (!(await exists(basePath))) return null;
    const elements = await fs.readdir(basePath);
    if (elements.some(f => f.endsWith('.bson'))) return basePath;

    for (const element of elements) {
      const fullPath = path.join(basePath, element);
      if ((await fs.stat(fullPath)).isDirectory()) {
        const found = await findBsonFolder(fullPath);
        if (found) return found;
      }
    }
  } catch (err) {
    console.error(`[RESTORE:ERR] findBsonFolder @ ${basePath}:`, err.message);
  }
  return null;
};

/**
 * Async Target Folder Search (uploads/db)
 */
const findTargetFolder = async (basePath, targetName) => {
  try {
    if (!(await exists(basePath))) return null;
    const elements = await fs.readdir(basePath);
    for (const element of elements) {
      const fullPath = path.join(basePath, element);
      if ((await fs.stat(fullPath)).isDirectory()) {
        if (element === targetName) return fullPath;
        const found = await findTargetFolder(fullPath, targetName);
        if (found) return found;
      }
    }
  } catch (err) {
    console.error(`[RESTORE:ERR] findTargetFolder @ ${basePath}:`, err.message);
  }
  return null;
};

/**
 * Download with Retry Logic
 */
exports.downloadFileFromDrive = async (fileId, outputPath, attempts = 3) => {
  const tokenData = await GoogleToken.findOne();
  if (!tokenData) throw new Error('Google account not connected');
  oauth2Client.setCredentials(tokenData);

  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  for (let i = 1; i <= attempts; i++) {
    try {
      console.log(`[RESTORE:DRIVE] Download attempt ${i}/${attempts} for ${fileId}`);
      const dest = fsStandard.createWriteStream(outputPath);
      let res;
      try {
        res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' });
      } catch (err) {
        console.error('[RESTORE:DRIVE] Drive download error:', err.response?.data || err.message);
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
      const stats = await fs.stat(outputPath);
      if (stats.size === 0) throw new Error('Downloaded file is empty');

      console.log(`[RESTORE:DRIVE] Download successful: ${stats.size} bytes`);
      return;
    } catch (err) {
      if (i === attempts) throw new Error(`Google Drive download failed after ${attempts} attempts: ${err.message}`);
      console.warn(`[RESTORE:DRIVE] Attempt ${i} failed, retrying in 2s...`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
};

/**
 * Production-Ready Restore Logic
 */
exports.performRestore = async (zipFilePath) => {
  if (isRestoring) throw new Error('Restoration in progress. Please wait.');

  // --- 🔒 GUARD: ENV & BINARY VALIDATION ---
  const MONGO_URI = process.env.MONGO_URI;
  const B_PATH = process.env.BACKUP_PATH;
  if (!MONGO_URI || !B_PATH) {
    throw new Error('Critical Configuration Missing: MONGO_URI and BACKUP_PATH must be defined');
  }

  const mongorestoreBin = getMongorestorePath();
  if (!mongorestoreBin) {
    throw new Error('Security Error: mongorestore utility not found. Please install it or set MONGORESTORE_PATH');
  }

  isRestoring = true;
  restoreProgress = 5; // Milestone 1: Initialization

  const BACKUP_DIR = path.resolve(B_PATH);
  const extractPath = path.join(BACKUP_DIR, `temp-extract-${Date.now()}`);

  try {
    // 1. Validation: ZIP Integrity
    if (!(await exists(zipFilePath))) throw new Error('Source ZIP not found');
    const zipStats = await fs.stat(zipFilePath);
    if (zipStats.size === 0) throw new Error('Source ZIP is empty/corrupted');

    // 2. Phase: Safety Backup
    console.log("[RESTORE:SECURE] Milestone: Creating safety backup before destructive changes...");
    await backupService.createSafetyBackup();
    restoreProgress = 15; // Estimated 15%

    // 3. Phase: Unzip
    console.log("[RESTORE:SECURE] Milestone: Extracting backup ZIP...");
    try {
      const zip = new AdmZip(zipFilePath);
      const extractBase = path.resolve(extractPath);

      zip.getEntries().forEach(entry => {
        const entryName = entry.entryName;
        const resolvedPath = path.resolve(extractBase, entryName);

        // Security check: Prevent Zip Slip (path traversal)
        if (!resolvedPath.startsWith(extractBase)) {
          throw new Error(`Zip Slip detected: ${entryName}`);
        }

        if (entry.isDirectory) {
          fsStandard.mkdirSync(resolvedPath, { recursive: true });
        } else {
          fsStandard.mkdirSync(path.dirname(resolvedPath), { recursive: true });
          fsStandard.writeFileSync(resolvedPath, entry.getData());
        }
      });
    } catch (e) {
      throw new Error(`ZIP extraction failed: ${e.message}`);
    }
    restoreProgress = 30; // Estimated 30%

    // 4. Phase: DB Structure Detection
    const dbRoot = (await findTargetFolder(extractPath, 'db')) || extractPath;
    const dumpPath = await findBsonFolder(dbRoot);
    if (!dumpPath) throw new Error('Invalid Backup: No BSON data found');
    
    restoreProgress = 45; // Estimated 45%

    // 5. Phase: Mongorestore execution
    console.warn("[RESTORE:DANGER] Executing 'mongorestore --drop'. Current collections will be replaced.");
    
    await new Promise((resolve, reject) => {
      const args = [`--uri=${MONGO_URI}`, '--drop', '--nsExclude=*.admins', dumpPath];
      const mongorestore = spawn(mongorestoreBin, args, { stdio: ['ignore', 'pipe', 'pipe'] });

      let lastActivity = Date.now();
      const INACTIVITY_LIMIT = 30000; // 30s
      const WARNING_TIME = 45000; // 45s

      // 1. Inactivity Tracker
      const interval = setInterval(() => {
        if (Date.now() - lastActivity > INACTIVITY_LIMIT) {
          console.error('[RESTORE] No activity detected for 30s, killing mongorestore...');
          mongorestore.kill('SIGTERM');
          clearInterval(interval);
        }
      }, 5000);

      // 2. Long-running Warning
      const warningTimeout = setTimeout(() => {
        console.warn('[RESTORE] Warning: Restore is taking longer than expected (45s+)...');
      }, WARNING_TIME);

      // 3. Absolute Timeout (Safety Guard)
      const absoluteTimeout = setTimeout(() => {
        mongorestore.kill('SIGTERM');
        reject(new Error('Restoration Timed Out (10 min limit)'));
      }, 600000);

      restoreProgress = 50; 
      let stderr = '';

      mongorestore.stdout.on('data', (data) => {
        lastActivity = Date.now();
        console.log(`[mongorestore:log] ${data.toString().trim()}`);
      });
      
      mongorestore.stderr.on('data', (data) => {
        lastActivity = Date.now();
        const output = data.toString();
        stderr += output;
        process.stderr.write(`[mongorestore:stderr] ${output}`);
        if (restoreProgress < 85) restoreProgress = Math.min(85, restoreProgress + 1);
      });

      mongorestore.on('close', (code) => {
        clearInterval(interval);
        clearTimeout(warningTimeout);
        clearTimeout(absoluteTimeout);

        if (code !== 0) {
          reject(new Error(`mongorestore error (code ${code}): ${stderr}`));
        } else {
          restoreProgress = 90;
          resolve();
        }
      });
    });

    // 6. Phase: Uploads Restore
    const U_PATH = process.env.UPLOAD_PATH;
    const backupUploads = await findTargetFolder(extractPath, 'uploads');
    if (U_PATH && backupUploads) {
      console.log("[RESTORE:SECURE] Milestone: Restoring uploads folder...");
      const targetUploads = path.resolve(U_PATH);
      if (await exists(targetUploads)) await fs.rm(targetUploads, { recursive: true, force: true });
      await fs.mkdir(targetUploads, { recursive: true });
      await fs.cp(backupUploads, targetUploads, { recursive: true, force: true });
    }

    restoreProgress = 100;
    console.log("[RESTORE:SUCCESS] Full restoration completed successfully.");
    return true;

  } catch (error) {
    console.error(`[RESTORE:CRITICAL] Failed: ${error.message}`);
    restoreProgress = 0;
    throw error;
  } finally {
    isRestoring = false;
    // CRITICAL: Cleanup MUST always run
    if (await exists(zipFilePath)) await fs.rm(zipFilePath, { force: true }).catch(console.error);
    if (await exists(extractPath)) await fs.rm(extractPath, { recursive: true, force: true }).catch(console.error);
    console.log("[RESTORE:CLEANUP] Maintenance artifacts removed.");
  }
};
