/**
 * Scheduled Tasks — Side-effect only module
 *
 * Registers a daily job at 02:00 AM (Asia/Ho_Chi_Minh) to clean up
 * leftover _restore_tmp_ databases created before today.
 */

const cron = require('node-cron');
const { exec } = require('child_process');
const path = require('path');

// Resolve the cleanup script path relative to this file
const scriptPath = path.resolve(__dirname, '..', 'scripts', 'cleanRestoreTmp.js');

cron.schedule('0 2 * * *', () => {
  console.log('[ScheduledTasks] Running restore-tmp cleanup...');

  exec(`node "${scriptPath}"`, (error, stdout, stderr) => {
    if (error) {
      console.error('[ScheduledTasks] Cleanup failed:', error.message);
      if (stderr) console.error('[ScheduledTasks] stderr:', stderr);
      return;
    }
    if (stdout) console.log('[ScheduledTasks] Cleanup output:', stdout.trim());
  });
}, {
  timezone: 'Asia/Ho_Chi_Minh',
});

console.log('🧹 Scheduled restore-tmp cleanup (daily at 02:00 AM ICT)');
