/**
 * Cleanup script for leftover _restore_tmp_ databases.
 *
 * Connects to MongoDB, lists all databases whose name contains
 * `_restore_tmp_`, extracts the Unix timestamp (seconds) from the
 * suffix, and drops every database created BEFORE the start of today
 * (00:00:00 local time).
 *
 * Usage:
 *   node scripts/cleanRestoreTmp.js
 *   npm run clean:restore-tmp
 */

require('dotenv').config();
const mongoose = require('mongoose');
const isDryRun = process.env.DRY_RUN === 'true';
const run = async () => {
  const uri = process.env.MONGO_CLEANUP_URI;
  if (!uri) {
    console.error('[CleanRestoreTmp] MONGO_CLEANUP_URI is not defined');
    process.exit(1);
  }

  const conn = await mongoose.createConnection(uri).asPromise();

  try {
    const { databases } = await conn.db.admin().listDatabases();
    
    const tmpDbs = databases.filter(db => {
      // NEVER TOUCH MAIN DB
      if (db.name === 'lucy_class') return false; 
      // Chỉ xử lý các database có tên bắt đầu bằng lucy_class_restore_tmp_
      return db.name.startsWith('lucy_class_restore_tmp_');
    });

    if (tmpDbs.length === 0) {
      console.log('[CleanRestoreTmp] Nothing to delete');
      return;
    }

    // Today at 00:00:00 local time
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayDbs = [];
    const oldDbs = [];

    // Parse và phân tách databases
    for (const db of tmpDbs) {
      const match = db.name.match(/_restore_tmp_(\d+)$/);
      if (!match) {
        console.log(`[CleanRestoreTmp] Skipping "${db.name}" (no valid timestamp suffix)`);
        continue;
      }

      const timestampSeconds = Number(match[1]);
      const createdAt = new Date(timestampSeconds * 1000);

      db.createdAt = createdAt;
      db.timestampSeconds = timestampSeconds;

      if (createdAt < startOfToday) {
        oldDbs.push(db);
      } else {
        todayDbs.push(db);
      }
    }

    let deletedCount = 0;

    // Bước 1: XÓA TOÀN BỘ oldDbs
    for (const db of oldDbs) {
      if (isDryRun) {
        console.log(`[DRY RUN] Would delete: ${db.name}`);
      } else {
        await conn.useDb(db.name).dropDatabase();
        console.log(`[CleanRestoreTmp] Deleted: ${db.name}`);
        deletedCount++;
      }
    }

    // Bước 2: Với todayDbs, Sort theo timestamp DESC (mới → cũ)
    todayDbs.sort((a, b) => b.timestampSeconds - a.timestampSeconds);

    for (let i = 0; i < todayDbs.length; i++) {
      const db = todayDbs[i];
      // Chỉ giữ lại 5 DB mới nhất
      if (i < 5) {
        console.log(`[CleanRestoreTmp] Kept (today, top 5): ${db.name}`);
      } else {
        // Xóa phần còn lại (index > 4)
        if (isDryRun) {
          console.log(`[DRY RUN] Would delete: ${db.name}`);
        } else {
          await conn.useDb(db.name).dropDatabase();
          console.log(`[CleanRestoreTmp] Deleted: ${db.name}`);
          deletedCount++;
        }
      }
    }

    if (deletedCount === 0) {
      if (isDryRun) {
        console.log('[CleanRestoreTmp] DRY RUN complete — no databases were actually deleted');
      } else {
        console.log('[CleanRestoreTmp] Nothing to delete (all temp databases are kept)');
      }
    } else {
      console.log(`[CleanRestoreTmp] Done — deleted ${deletedCount} database(s)`);
    }
  } finally {
    await conn.close();
  }
};

run().catch((err) => {
  console.error('[CleanRestoreTmp] Fatal error:', err.message);
  process.exit(1);
});
