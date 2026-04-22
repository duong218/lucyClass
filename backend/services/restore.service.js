const fs = require('fs').promises;
const fsStandard = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const { spawn, execSync } = require('child_process');

const backupService = require('./backup.service');
const driveService = require('./drive.service');
const { decryptFile } = require('../utils/encryptionUtils');
const { clearAllCache } = require('../middlewares/cacheMiddleware');

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
 * Download with Retry Logic (delegated to drive.service.js)
 */
exports.downloadFileFromDrive = async (fileId, outputPath, attempts = 3) => {
  const drive = await driveService.getDrive();
  await driveService.downloadFromDrive(drive, fileId, outputPath, attempts);
};

/**
 * Production-Ready Restore Logic
 */
exports.performRestore = async (zipFilePath) => {
  if (isRestoring) throw new Error('Restoration in progress. Please wait.');
  console.log(`[RESTORE:START] Requested restore from: ${zipFilePath}`);

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
  let workingZipPath = zipFilePath;
  let decryptedPath = null;

  try {
    // 1. Validation: ENC Integrity (required)
    if (!zipFilePath || typeof zipFilePath !== 'string' || !zipFilePath.endsWith('.enc')) {
      throw new Error('Invalid backup file: only .enc files are allowed for restore');
    }
    if (!(await exists(zipFilePath))) throw new Error('Source backup file not found');
    const fileStats = await fs.stat(zipFilePath);
    if (fileStats.size === 0) throw new Error('Source backup file is empty/corrupted');

    // 1.1 Decrypt (required for .enc input)
    console.log("[RESTORE:SECURE] Milestone: Decrypting backup file...");
    const encryptionKey = process.env.BACKUP_ENCRYPTION_KEY;
    if (!encryptionKey) {
      throw new Error('BACKUP_ENCRYPTION_KEY is missing in .env. Cannot decrypt backup.');
    }
    decryptedPath = zipFilePath.replace(/\.enc$/, '.dec.zip');
    try {
      await decryptFile(zipFilePath, decryptedPath, encryptionKey);
      workingZipPath = decryptedPath;
    } catch (decErr) {
      throw new Error(`Decryption failed: ${decErr.message}. Ensure your BACKUP_ENCRYPTION_KEY is correct.`);
    }

    // 2. Phase: Safety Backup
    console.log("[RESTORE:SECURE] Milestone: Creating safety backup before destructive changes...");
    await backupService.createSafetyBackup();
    restoreProgress = 15; // Estimated 15%

    // 3. Phase: Unzip
    console.log("[RESTORE:SECURE] Milestone: Extracting backup ZIP...");
    try {
      const zip = new AdmZip(workingZipPath);
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

    const runMongorestore = async (args, label) => {
      console.log(`[RESTORE] ${label}: mongorestore ${args.join(' ')}`);
      return await new Promise((resolve, reject) => {
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
    };

    // 5. Phase (Advanced Safety): Restore into a temporary DB first (validation run)
    // This prevents touching the current DB unless the backup can be restored successfully.
    const sourceDbName = path.basename(dumpPath);
    const tempDbName = `${sourceDbName}_restore_tmp_${Date.now()}`;
    console.log(`[RESTORE:SAFE] Validating backup by restoring into temp DB: ${tempDbName}`);
    await runMongorestore(
      [
        `--uri=${MONGO_URI}`,
        `--nsFrom=${sourceDbName}.*`,
        `--nsTo=${tempDbName}.*`,
        dumpPath
      ],
      'Temp restore (non-destructive)'
    );
    console.log('[RESTORE:SAFE] Temp restore completed. Proceeding to destructive restore...');

    // 6. Phase: Mongorestore execution (destructive to main DB)
    console.warn("[RESTORE:DANGER] Executing 'mongorestore --drop'. Current collections will be replaced.");
    await runMongorestore(
      [`--uri=${MONGO_URI}`, '--drop', '--nsExclude=*.admins', dumpPath],
      'Main restore (destructive)'
    );

    // 6. Phase: Uploads Restore
    // Images are now stored in Cloudinary and are NOT part of backup

    // 7. Phase: Cache Invalidation — CRITICAL
    // MongoDB collections have been replaced. Redis still holds stale data
    // from the previous DB state. Without this flush, cached routes
    // (teachers, feedback, courses, rankings, announcements) will return
    // pre-restore data for up to 5 minutes (CACHE_TTL).
    console.log('[RESTORE:CACHE] Flushing all Redis cache keys...');
    await clearAllCache();

    restoreProgress = 100;
    console.log("[RESTORE:SUCCESS] Restore completed successfully.");
    return true;

  } catch (error) {
    console.error(`[RESTORE:FAIL] Restore failed: ${error.message}`);
    restoreProgress = 0;
    throw error;
  } finally {
    isRestoring = false;
    // CRITICAL: Cleanup MUST always run
    if (await exists(zipFilePath)) await fs.rm(zipFilePath, { force: true }).catch(console.error);
    if (decryptedPath && await exists(decryptedPath)) await fs.rm(decryptedPath, { force: true }).catch(console.error);
    if (await exists(extractPath)) await fs.rm(extractPath, { recursive: true, force: true }).catch(console.error);
    console.log("[RESTORE:CLEANUP] Maintenance artifacts removed.");
  }
};
