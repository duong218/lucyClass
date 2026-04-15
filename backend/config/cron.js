const cron = require('node-cron');
const backupService = require('../services/backup.service');
const AuditLog = require('../models/AuditLog');
const Admin = require('../models/Admin');
const { cleanOldRankings } = require('../controllers/rankingController');

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
  let isRankingCleanupRunning = false;

  // Schedule: '0 2 * * *' (Every day at 02:00 AM)
  cron.schedule('0 2 * * *', async () => {
    if (isDevelopment) {
      console.log('[Cron] Starting scheduled daily backup at 2:00 AM...');
    }
    
    try {
      const result = await backupService.runBackup({ 
        uploadToDrive: true, 
        fileNamePrefix: 'auto-backup' 
      });
      
      if (isDevelopment) {
        console.log(`[Cron] Scheduled backup successful: ${result.fileName}`);
      }

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

  // Schedule: '15 2 * * *' (Every day at 02:15 AM)
  cron.schedule('15 2 * * *', async () => {
    if (isRankingCleanupRunning) {
      if (isDevelopment) {
        console.log('[Cron] Ranking cleanup skipped (previous run still active)');
      }
      return;
    }

    isRankingCleanupRunning = true;
    try {
      const result = await cleanOldRankings();
      if (isDevelopment) {
        console.log(`[Cron] Ranking cleanup completed. Deleted: ${result.deletedCount || 0}`);
      }
    } catch (error) {
      console.error('[Cron] Ranking cleanup failed:', error.message);
    } finally {
      isRankingCleanupRunning = false;
    }
  }, cronOptions);

  console.log('⏰ Scheduled jobs initialized (backup + ranking cleanup)');
};

module.exports = initCronJobs;
