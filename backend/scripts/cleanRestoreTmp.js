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

const run = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('[CleanRestoreTmp] MONGO_URI is not defined');
    process.exit(1);
  }

  const conn = await mongoose.createConnection(uri).asPromise();

  try {
    const { databases } = await conn.db.admin().listDatabases();
    const tmpDbs = databases.filter(db => db.name.includes('_restore_tmp_'));

    if (tmpDbs.length === 0) {
      console.log('[CleanRestoreTmp] Nothing to delete');
      return;
    }

    // Today at 00:00:00 local time
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    let deletedCount = 0;

    for (const db of tmpDbs) {
      // Expected format: <original_db_name>_restore_tmp_<unix_seconds>
      const match = db.name.match(/_restore_tmp_(\d+)$/);
      if (!match) {
        console.log(`[CleanRestoreTmp] Skipping "${db.name}" (no valid timestamp suffix)`);
        continue;
      }

      const createdAt = new Date(Number(match[1]) * 1000);

      if (createdAt < startOfToday) {
        await conn.useDb(db.name).dropDatabase();
        console.log(`[CleanRestoreTmp] Deleted: ${db.name} (created ${createdAt.toISOString()})`);
        deletedCount++;
      } else {
        console.log(`[CleanRestoreTmp] Kept: ${db.name} (created today or later)`);
      }
    }

    if (deletedCount === 0) {
      console.log('[CleanRestoreTmp] Nothing to delete (all temp databases are from today)');
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
