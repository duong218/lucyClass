const mongoose = require('mongoose');

/**
 * Một bản ghi duy nhất: tham số hệ thống tính lương (thay cho chỉnh .env).
 * getSingleton() tạo mặc định từ env (nếu có) hoặc bảng Lucy khi chưa có dữ liệu.
 */
const salarySystemSettingsSchema = new mongoose.Schema(
  {
    matchThresholdMinutes: {
      type: Number,
      default: 30,
      min: [1, 'Tối thiểu 1 phút'],
      max: [180, 'Tối đa 180 phút']
    },
    sessionMinutes: {
      type: Number,
      default: 90,
      min: [30, 'Tối thiểu 30 phút'],
      max: [300, 'Tối đa 300 phút']
    },
    partTimeMultiplier: {
      type: Number,
      default: 0.8,
      min: [0.01, 'Tối thiểu 0.01'],
      max: [1, 'Tối đa 1']
    },
    probationMultiplier: {
      type: Number,
      default: 0.7,
      min: [0.01, 'Tối thiểu 0.01'],
      max: [1, 'Tối đa 1']
    },
    defaultBonusTuyenSinh: {
      type: Number,
      default: 100000,
      min: [0, 'Không âm']
    },
    defaultBonusTestDauVao: {
      type: Number,
      default: 50000,
      min: [0, 'Không âm']
    },
    /** Mức full-time dùng khi seed bảng salary_config (DB trống) */
    seedFt1Hs: { type: Number, default: 150000, min: [1, 'Phải > 0'] },
    seedFt2Hs: { type: Number, default: 200000, min: [1, 'Phải > 0'] },
    seedFt3Hs: { type: Number, default: 250000, min: [1, 'Phải > 0'] },
    seedFt46Hs: { type: Number, default: 300000, min: [1, 'Phải > 0'] },
    seedTaFt: { type: Number, default: 75000, min: [1, 'Phải > 0'] },
    seedObserveFt: { type: Number, default: 50000, min: [1, 'Phải > 0'] }
  },
  { timestamps: true }
);

const parseIntEnv = (key, fallback) => {
  const n = parseInt(process.env[key], 10);
  return Number.isFinite(n) ? n : fallback;
};

const parseFloatEnv = (key, fallback) => {
  const n = parseFloat(process.env[key]);
  return Number.isFinite(n) ? n : fallback;
};

/** Giá trị khởi tạo lần đầu: ưu tiên env nếu đã cấu hình (triển khai cũ), không thì mặc định Lucy */
salarySystemSettingsSchema.statics.initialFromEnv = function initialFromEnv() {
  return {
    matchThresholdMinutes: parseIntEnv('SALARY_MATCH_THRESHOLD_MINUTES', 30),
    sessionMinutes: parseIntEnv('SALARY_SESSION_MINUTES', 90),
    partTimeMultiplier: parseFloatEnv('SALARY_PART_TIME_MULTIPLIER', 0.8),
    probationMultiplier: parseFloatEnv('SALARY_PROBATION_MULTIPLIER', 0.7),
    defaultBonusTuyenSinh: parseIntEnv('SALARY_BONUS_TUYEN_SINH_DEFAULT', 100000),
    defaultBonusTestDauVao: parseIntEnv('SALARY_BONUS_TEST_DAU_VAO_DEFAULT', 50000),
    seedFt1Hs: parseIntEnv('SALARY_SEED_FT_1HS', 150000),
    seedFt2Hs: parseIntEnv('SALARY_SEED_FT_2HS', 200000),
    seedFt3Hs: parseIntEnv('SALARY_SEED_FT_3HS', 250000),
    seedFt46Hs: parseIntEnv('SALARY_SEED_FT_4_6HS', 300000),
    seedTaFt: parseIntEnv('SALARY_SEED_TA_FT', 75000),
    seedObserveFt: parseIntEnv('SALARY_SEED_OBSERVE_FT', 50000)
  };
};

salarySystemSettingsSchema.statics.getSingleton = async function getSingleton() {
  let doc = await this.findOne();
  if (!doc) {
    doc = await this.create(this.initialFromEnv());
  }
  return doc;
};

module.exports = mongoose.model('SalarySystemSettings', salarySystemSettingsSchema);
