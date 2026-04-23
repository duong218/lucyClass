const cron = require('node-cron');
const backupService = require('../services/backup.service');
const AuditLog = require('../models/AuditLog');
const Admin = require('../models/Admin');
const { cleanOldRankings } = require('../controllers/rankingController');
const { cleanOrphanRankings, runDeepClean } = require('../services/deepCleanService');
const mongoose = require('mongoose');

/**
 * PRODUCTION-READY CRON SETUP
 * Daily backup at 2:00 AM
 */
const initCronJobs = () => {
  if (process.env.ENABLE_CRON !== 'true') {
    console.log('⏰ Cron jobs disabled (ENABLE_CRON != true)');
    return;
  }

  const isDevelopment = process.env.NODE_ENV !== 'production';
  const cronOptions = process.env.CRON_TIMEZONE ? { timezone: process.env.CRON_TIMEZONE } : undefined;

  let isRankingCleanupRunning  = false;
  let isRestoreCleanupRunning  = false;
  let isOrphanCleanupRunning   = false;
  let isDeepCleanRunning       = false;

  // ─── 02:00 AM — Backup hàng ngày ──────────────────────────────────────────
  cron.schedule('0 2 * * *', async () => {
    if (isDevelopment) console.log('[Cron] Starting scheduled daily backup at 2:00 AM...');

    try {
      const result = await backupService.runBackup({
        uploadToDrive: true,
        fileNamePrefix: 'auto-backup'
      });

      if (isDevelopment) console.log(`[Cron] Scheduled backup successful: ${result.fileName}`);

      try {
        const systemAdmin = await Admin.findOne({ role: 'admin' });
        await AuditLog.create({
          adminId: systemAdmin?._id,
          adminName: 'System (Cron)',
          action: 'AUTO_BACKUP_SUCCESS',
          description: `Daily automated backup completed: ${result.fileName}`,
          ipAddress: 'system-cron'
        });
      } catch (logErr) {
        console.error('[Cron] Failed to create audit log:', logErr.message);
      }

    } catch (error) {
      console.error('[Cron] Scheduled backup failed:', error.message);

      try {
        const systemAdmin = await Admin.findOne({ role: 'admin' });
        await AuditLog.create({
          adminId: systemAdmin?._id,
          adminName: 'System (Cron)',
          action: 'AUTO_BACKUP_FAILED',
          description: `Daily automated backup failed: ${error.message}`,
          ipAddress: 'system-cron'
        });
      } catch (logErr) {
        console.error('[Cron] Failed to create failure audit log:', logErr.message);
      }
    }
  }, cronOptions);

  // ─── 02:15 AM — Dọn Ranking cũ hơn tháng trước ───────────────────────────
  cron.schedule('15 2 * * *', async () => {
    if (isRankingCleanupRunning) {
      if (isDevelopment) console.log('[Cron] Ranking cleanup skipped (previous run still active)');
      return;
    }

    isRankingCleanupRunning = true;
    try {
      const result = await cleanOldRankings();
      if (isDevelopment) console.log(`[Cron] Ranking cleanup completed. Deleted: ${result?.deletedCount ?? 0}`);
    } catch (error) {
      console.error('[Cron] Ranking cleanup failed:', error.message);
    } finally {
      isRankingCleanupRunning = false;
    }
  }, cronOptions);

  // ─── 02:30 AM — Dọn Ranking orphan (studentId / courseId không còn) ───────
  cron.schedule('30 2 * * *', async () => {
    if (isOrphanCleanupRunning) {
      if (isDevelopment) console.log('[Cron] Orphan ranking cleanup skipped (previous run still active)');
      return;
    }

    isOrphanCleanupRunning = true;
    try {
      const report = await cleanOrphanRankings();
      if (isDevelopment) console.log('[Cron] Orphan ranking cleanup completed:', report);
    } catch (error) {
      console.error('[Cron] Orphan ranking cleanup failed:', error.message);
    } finally {
      isOrphanCleanupRunning = false;
    }
  }, cronOptions);

  // ─── 03:00 AM — Dọn restore-tmp databases cũ ─────────────────────────────
  cron.schedule('0 3 * * *', async () => {
    if (isRestoreCleanupRunning) {
      if (isDevelopment) console.log('[Cron] Restore tmp cleanup skipped (previous run still active)');
      return;
    }

    isRestoreCleanupRunning = true;

    try {
      const uri = process.env.MONGO_CLEANUP_URI || process.env.MONGO_URI;
      if (!uri) {
        console.error('[Cron] Restore cleanup: No MongoDB URI available (MONGO_CLEANUP_URI / MONGO_URI)');
        return;
      }

      const conn = await mongoose.createConnection(uri).asPromise();

      try {
        const { databases } = await conn.db.admin().listDatabases();

        const tmpDbs = databases.filter(db =>
          db.name !== 'lucy_class' &&
          db.name.startsWith('lucy_class_restore_tmp_')
        );

        if (tmpDbs.length === 0) {
          if (isDevelopment) console.log('[Cron] Restore cleanup: nothing to delete');
          return;
        }

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const oldDbs = [];
        const todayDbs = [];

        for (const db of tmpDbs) {
          const match = db.name.match(/_restore_tmp_(\d+)$/);
          if (!match) continue;
          const createdAt = new Date(Number(match[1]) * 1000);
          db.createdAt = createdAt;
          db.timestampSeconds = Number(match[1]);
          createdAt < startOfToday ? oldDbs.push(db) : todayDbs.push(db);
        }

        let deletedCount = 0;

        for (const db of oldDbs) {
          await conn.useDb(db.name).dropDatabase();
          deletedCount++;
        }

        todayDbs.sort((a, b) => b.timestampSeconds - a.timestampSeconds);
        for (let i = 5; i < todayDbs.length; i++) {
          await conn.useDb(todayDbs[i].name).dropDatabase();
          deletedCount++;
        }

        if (isDevelopment) console.log(`[Cron] Restore cleanup completed. Deleted: ${deletedCount} database(s)`);

        if (deletedCount > 0) {
          try {
            const systemAdmin = await Admin.findOne({ role: 'admin' });
            await AuditLog.create({
              adminId: systemAdmin?._id,
              adminName: 'System (Cron)',
              action: 'AUTO_RESTORE_CLEANUP',
              description: `Restore tmp cleanup: removed ${deletedCount} temporary database(s)`,
              ipAddress: 'system-cron'
            });
          } catch (logErr) {
            console.error('[Cron] Failed to create restore cleanup audit log:', logErr.message);
          }
        }

      } finally {
        await conn.close();
      }

    } catch (error) {
      console.error('[Cron] Restore cleanup failed:', error.message);
    } finally {
      isRestoreCleanupRunning = false;
    }
  }, cronOptions);

  // ─── 04:00 AM ngày 1/1 và 1/7 — Deep clean 6 tháng/lần ──────────────────
  cron.schedule('0 4 1 1,7 *', async () => {
    if (isDeepCleanRunning) {
      console.log('[Cron] Deep clean skipped (previous run still active)');
      return;
    }

    isDeepCleanRunning = true;
    console.log('[Cron] Bắt đầu Deep Clean 6 tháng...');

    try {
      const result = await runDeepClean();

      console.log('[Cron] Deep Clean hoàn thành:', result.report);

      try {
        const systemAdmin = await Admin.findOne({ role: 'admin' });
        await AuditLog.create({
          adminId: systemAdmin?._id,
          adminName: 'System (Cron)',
          action: result.success ? 'AUTO_DEEP_CLEAN_SUCCESS' : 'AUTO_DEEP_CLEAN_FAILED',
          description: `Deep clean 6 tháng: ${JSON.stringify(result.report)}`,
          ipAddress: 'system-cron'
        });
      } catch (logErr) {
        console.error('[Cron] Failed to create deep clean audit log:', logErr.message);
      }

    } catch (error) {
      console.error('[Cron] Deep clean failed:', error.message);
    } finally {
      isDeepCleanRunning = false;
    }
  }, cronOptions);

  console.log('⏰ Scheduled jobs initialized:');
  console.log('   02:00 AM daily  → backup');
  console.log('   02:15 AM daily  → ranking cũ');
  console.log('   02:30 AM daily  → ranking orphan');
  console.log('   03:00 AM daily  → restore-tmp cleanup');
  console.log('   04:00 AM 1/1&7  → deep clean 6 tháng');
};

module.exports = initCronJobs;
