/**
 * MIGRATION SCRIPT — childAge: Number/String cũ → String key mới
 * ================================================================
 * 
 * Mapping:
 *   5, '5', '4-6'            → 'preschool'  (Mầm non)
 *   7, '7', '6-9', '7-10'   → 'primary'    (Tiểu học)
 *   12,'12', '9-15','11-15' → 'secondary'  (Trung học)
 *   'highschool', 'adult'    → giữ nguyên  (data mới, đã đúng)
 * 
 * CÁCH CHẠY:
 * ----------
 *   # Bước 1 — Dry run (chỉ đọc, KHÔNG ghi, xem trước kết quả)
 *   node migrate-childAge.js --dry-run
 * 
 *   # Bước 2 — Chạy thật sau khi xác nhận dry-run ổn
 *   node migrate-childAge.js
 * 
 *   # Bước 3 — Verify sau khi chạy xong
 *   node migrate-childAge.js --verify
 * 
 * ĐẶT FILE: cùng cấp với thư mục models/ của backend
 */

require('dotenv').config();
const mongoose = require('mongoose');

// ─── Config ────────────────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
const MODE = process.argv[2]; // '--dry-run' | '--verify' | undefined (= run thật)

const VALID_KEYS = ['preschool', 'primary', 'secondary', 'highschool', 'adult'];
const LEGACY_MAP = {
  // Number
  5:  'preschool',
  7:  'primary',
  12: 'secondary',
  // String số
  '5':  'preschool',
  '7':  'primary',
  '12': 'secondary',
  // String range cũ
  '4-6':   'preschool',
  '6-9':   'primary',
  '7-10':  'primary',
  '9-15':  'secondary',
  '11-15': 'secondary',
};

// ─── Helpers ───────────────────────────────────────────────────────────────
const log  = (msg) => console.log(msg);
const warn = (msg) => console.warn('\x1b[33m' + msg + '\x1b[0m');
const ok   = (msg) => console.log('\x1b[32m' + msg + '\x1b[0m');
const err  = (msg) => console.error('\x1b[31m' + msg + '\x1b[0m');

// ─── Connect ───────────────────────────────────────────────────────────────
async function connect() {
  if (!MONGO_URI) {
    err('❌  MONGO_URI không tìm thấy trong .env');
    process.exit(1);
  }
  await mongoose.connect(MONGO_URI);
  ok('✅  Kết nối MongoDB Atlas thành công');
}

// ─── VERIFY mode ───────────────────────────────────────────────────────────
async function verify() {
  await connect();
  const col = mongoose.connection.db.collection('registrations');

  const total = await col.countDocuments();
  const clean = await col.countDocuments({ childAge: { $in: VALID_KEYS } });
  const dirty = await col.countDocuments({ childAge: { $nin: VALID_KEYS } });

  log('\n══════════════════════════════════════════');
  log('  VERIFY KẾT QUẢ MIGRATION');
  log('══════════════════════════════════════════');
  log(`  Tổng documents    : ${total}`);
  ok( `  Đã là key mới     : ${clean}`);

  if (dirty > 0) {
    warn(`  ⚠️  Chưa migrate   : ${dirty}`);
    const samples = await col
      .find(
        { childAge: { $nin: VALID_KEYS } },
        { projection: { _id: 1, childAge: 1, childName: 1 } }
      )
      .limit(10)
      .toArray();
    warn('  Mẫu chưa migrate (tối đa 10):');
    samples.forEach(d =>
      warn(`    - ${d._id} | childAge: "${d.childAge}" | ${d.childName}`)
    );
  } else {
    ok('  ✅  Toàn bộ data đã sạch! An toàn để deploy.');
  }

  // Phân bố theo key
  const dist = await col
    .aggregate([
      { $group: { _id: '$childAge', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])
    .toArray();
  log('\n  Phân bố childAge hiện tại:');
  dist.forEach(d => log(`    ${String(d._id).padEnd(14)}: ${d.count} records`));
  log('══════════════════════════════════════════\n');

  await mongoose.disconnect();
}

// ─── MIGRATE mode (dry-run hoặc thật) ─────────────────────────────────────
async function migrate(isDryRun) {
  await connect();
  const col = mongoose.connection.db.collection('registrations');

  if (isDryRun) {
    warn('\n⚠️  CHẾ ĐỘ DRY-RUN — Không ghi gì vào DB, chỉ xem trước\n');
  } else {
    log('\n🚀  BẮT ĐẦU MIGRATE THẬT...\n');
  }

  const docs = await col
    .find(
      { childAge: { $nin: VALID_KEYS } },
      { projection: { _id: 1, childAge: 1, childName: 1, parentName: 1 } }
    )
    .toArray();

  if (docs.length === 0) {
    ok('✅  Không có document nào cần migrate. DB đã sạch!');
    await mongoose.disconnect();
    return;
  }

  log(`📋  Tìm thấy ${docs.length} document cần migrate:\n`);

  let updated = 0;
  let skipped = 0;
  const skippedList = [];

  for (const doc of docs) {
    const oldVal = doc.childAge;
    const newVal = LEGACY_MAP[oldVal];

    if (!newVal) {
      warn(`  ⚠️  SKIP | id: ${doc._id} | childAge: "${oldVal}" | ${doc.childName} (${doc.parentName})`);
      skipped++;
      skippedList.push({ id: doc._id, childAge: oldVal, childName: doc.childName });
      continue;
    }

    if (!isDryRun) {
      await col.updateOne({ _id: doc._id }, { $set: { childAge: newVal } });
    }
    log(`  ${isDryRun ? '[DRY]' : '✔ '} ${doc._id} | "${oldVal}" → "${newVal}" | ${doc.childName}`);
    updated++;
  }

  // ─── Summary ─────────────────────────────────────────────────────────────
  log('\n══════════════════════════════════════════');
  isDryRun ? warn('  KẾT QUẢ DRY-RUN (chưa ghi gì)') : ok('  KẾT QUẢ MIGRATION');
  log('══════════════════════════════════════════');
  log(`  Sẽ/Đã cập nhật : ${updated} documents`);

  if (skipped > 0) {
    warn(`  Bỏ qua          : ${skipped} (không có mapping — cần xử lý thủ công)`);
    skippedList.forEach(d =>
      warn(`    - id: ${d.id} | childAge: "${d.childAge}" | ${d.childName}`)
    );
  } else {
    ok('  Bỏ qua          : 0 — Toàn bộ đều có mapping!');
  }

  if (isDryRun) {
    log('\n  👆  Nếu kết quả trên ổn, chạy thật bằng:');
    log('      node migrate-childAge.js\n');
  } else {
    log('\n  👆  Chạy verify để xác nhận kết quả:');
    log('      node migrate-childAge.js --verify\n');
  }
  log('══════════════════════════════════════════\n');

  await mongoose.disconnect();
  ok('🔌  Đã ngắt kết nối MongoDB');
}

// ─── Entry point ───────────────────────────────────────────────────────────
(async () => {
  try {
    if (MODE === '--verify')        await verify();
    else if (MODE === '--dry-run')  await migrate(true);
    else                            await migrate(false);
  } catch (e) {
    err('❌  Lỗi: ' + e.message);
    console.error(e);
    process.exit(1);
  }
})();
