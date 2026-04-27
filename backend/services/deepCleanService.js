/**
 * deepCleanService.js
 *
 * Dịch vụ dọn dẹp dữ liệu duy nhất — gộp sync hàng ngày + deep clean 6 tháng.
 *
 * Export:
 *  - cleanOrphanRankings()  → dùng cho cron hàng ngày + trigger thủ công từ admin UI
 *  - runDeepClean()         → dùng cho cron 6 tháng/lần + trigger thủ công từ admin UI
 *
 * Thứ tự xóa trong runDeepClean (quan trọng, không đổi):
 *   1. Course đã xóa > 6 tháng  → xóa Registration liên quan trước, xóa ảnh Cloudinary
 *   2. Teacher đã xóa > 6 tháng → null ref trong Course, xóa StaffAccount, xóa avatar Cloudinary
 *   3. Registration orphan       → courseId không còn tồn tại
 *   4. Ranking orphan            → studentId / courseId không còn tồn tại
 *   5. Announcement đã xóa > 6 tháng → xóa ảnh Cloudinary
 *   6. Feedback đã xóa > 6 tháng     → xóa ảnh Cloudinary
 */

const Course       = require('../models/Course');
const Teacher      = require('../models/Teacher');
const StaffAccount = require('../models/StaffAccount');
const Registration = require('../models/Registration');
const Ranking      = require('../models/Ranking');
const Announcement = require('../models/Announcement');
const Feedback     = require('../models/Feedback');
const { deleteImageFromCloudinary } = require('../utils/cloudinary');
const { clearCache } = require('../middlewares/cacheMiddleware');

const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;
const log = (...args) => console.log('[DeepClean]', ...args);

// ─────────────────────────────────────────────────────────────────────────────
// PHẦN 1 — Dọn Ranking orphan (chạy hàng ngày)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Xóa Ranking mồ côi: studentId hoặc courseId không còn tồn tại.
 * Dùng cho cron 03:00 AM hàng ngày và endpoint POST /api/sync/rankings.
 * @returns {{ deletedOrphanStudents, deletedOrphanCourses, total }}
 */
const cleanOrphanRankings = async () => {
  log('Bắt đầu dọn Ranking orphan...');

  const activeRegistrationIds = await Registration.distinct('_id', { isActive: true });
  const activeCourseIds       = await Course.distinct('_id', { isDeleted: { $ne: true } });

  const byStudent = await Ranking.deleteMany({
    studentId: { $nin: activeRegistrationIds }
  });

  const byCourse = await Ranking.deleteMany({
    courseId: { $exists: true, $ne: null, $nin: activeCourseIds }
  });

  const total = byStudent.deletedCount + byCourse.deletedCount;

  if (total > 0) {
    await clearCache('/api/rankings');
    await clearCache('/api/rankings/top');
  }

  const report = {
    deletedOrphanStudents: byStudent.deletedCount,
    deletedOrphanCourses:  byCourse.deletedCount,
    total
  };

  log('Ranking orphan hoàn thành:', report);
  return report;
};

// ─────────────────────────────────────────────────────────────────────────────
// PHẦN 2 — Deep clean 6 tháng
// ─────────────────────────────────────────────────────────────────────────────

const getCutoffDate = () => new Date(Date.now() - SIX_MONTHS_MS);

/**
 * Bước 1: Xóa Course đã soft-delete > 6 tháng + Registration liên quan
 */
const _cleanDeletedCourses = async (cutoff) => {
  const deadCourses = await Course.find({
    isDeleted: true,
    deletedAt: { $lte: cutoff }
  }).select('_id name imagePublicId').lean();

  if (!deadCourses.length) {
    log('Không có Course nào cần xóa');
    return { courses: 0, registrations: 0 };
  }

  const deadCourseIds = deadCourses.map(c => c._id);
  log(`Xóa ${deadCourses.length} Course:`, deadCourses.map(c => c.name));

  const regResult    = await Registration.deleteMany({ courseId: { $in: deadCourseIds } });
  const courseResult = await Course.deleteMany({ _id: { $in: deadCourseIds } });

  // Xóa ảnh Cloudinary của các Course đã xóa thật
  const imageIds = deadCourses.map(c => c.imagePublicId).filter(Boolean);
  for (const publicId of imageIds) {
    try { await deleteImageFromCloudinary(publicId); } catch (_) {}
  }

  log(`→ ${courseResult.deletedCount} Course, ${regResult.deletedCount} Registration, ${imageIds.length} ảnh Cloudinary`);
  return { courses: courseResult.deletedCount, registrations: regResult.deletedCount };
};

/**
 * Bước 2: Xóa Teacher đã soft-delete > 6 tháng + null ref Course + xóa StaffAccount
 */
const _cleanDeletedTeachers = async (cutoff) => {
  const deadTeachers = await Teacher.find({
    isDeleted: true,
    deletedAt: { $lte: cutoff }
  }).select('_id name staffAccountId avatarPublicId').lean();

  if (!deadTeachers.length) {
    log('Không có Teacher nào cần xóa');
    return { teachers: 0, staffAccounts: 0 };
  }

  const deadTeacherIds = deadTeachers.map(t => t._id);
  const deadStaffIds   = deadTeachers.map(t => t.staffAccountId).filter(Boolean);
  log(`Xóa ${deadTeachers.length} Teacher:`, deadTeachers.map(t => t.name));

  // Null ref trong Course còn active
  await Course.updateMany(
    { teacher: { $in: deadTeacherIds }, isDeleted: { $ne: true } },
    { $set: { teacher: null } }
  );
  await Course.updateMany(
    { additionalTeachers: { $in: deadTeacherIds }, isDeleted: { $ne: true } },
    { $pull: { additionalTeachers: { $in: deadTeacherIds } } }
  );

  const teacherResult = await Teacher.deleteMany({ _id: { $in: deadTeacherIds } });

  // Xóa avatar Cloudinary của các Teacher đã xóa thật
  const avatarIds = deadTeachers.map(t => t.avatarPublicId).filter(Boolean);
  for (const publicId of avatarIds) {
    try { await deleteImageFromCloudinary(publicId); } catch (_) {}
  }

  // Chỉ xóa StaffAccount đã deactivate (isActive: false) — tránh xóa nhầm
  let staffCount = 0;
  if (deadStaffIds.length) {
    const staffResult = await StaffAccount.deleteMany({
      _id: { $in: deadStaffIds },
      isActive: false
    });
    staffCount = staffResult.deletedCount;
  }

  log(`→ ${teacherResult.deletedCount} Teacher, ${staffCount} StaffAccount, ${avatarIds.length} avatar Cloudinary`);
  return { teachers: teacherResult.deletedCount, staffAccounts: staffCount };
};

/**
 * Bước 3: Xóa Registration orphan (courseId không còn)
 */
const _cleanOrphanRegistrations = async () => {
  const activeCourseIds = await Course.distinct('_id', { isDeleted: { $ne: true } });
  const result = await Registration.deleteMany({ courseId: { $nin: activeCourseIds } });
  log(`→ ${result.deletedCount} Registration orphan`);
  return result.deletedCount;
};

/**
 * Bước 4: Xóa Announcement đã soft-delete > 6 tháng + ảnh Cloudinary
 */
const _cleanDeletedAnnouncements = async (cutoff) => {
  const deadAnnouncements = await Announcement.find({
    isDeleted: true,
    deletedAt: { $lte: cutoff }
  }).select('_id imagePublicId').lean();

  if (!deadAnnouncements.length) {
    log('Không có Announcement nào cần xóa');
    return 0;
  }

  const deadIds  = deadAnnouncements.map(a => a._id);
  const imageIds = deadAnnouncements.map(a => a.imagePublicId).filter(Boolean);

  await Announcement.deleteMany({ _id: { $in: deadIds } });

  for (const publicId of imageIds) {
    try { await deleteImageFromCloudinary(publicId); } catch (_) {}
  }

  log(`→ ${deadAnnouncements.length} Announcement, ${imageIds.length} ảnh Cloudinary`);
  return deadAnnouncements.length;
};

/**
 * Bước 5: Xóa Feedback đã soft-delete > 6 tháng + ảnh Cloudinary
 */
const _cleanDeletedFeedbacks = async (cutoff) => {
  const deadFeedbacks = await Feedback.find({
    isDeleted: true,
    deletedAt: { $lte: cutoff }
  }).select('_id photoPublicId').lean();

  if (!deadFeedbacks.length) {
    log('Không có Feedback nào cần xóa');
    return 0;
  }

  const deadIds  = deadFeedbacks.map(f => f._id);
  const photoIds = deadFeedbacks.map(f => f.photoPublicId).filter(Boolean);

  await Feedback.deleteMany({ _id: { $in: deadIds } });

  for (const publicId of photoIds) {
    try { await deleteImageFromCloudinary(publicId); } catch (_) {}
  }

  log(`→ ${deadFeedbacks.length} Feedback, ${photoIds.length} ảnh Cloudinary`);
  return deadFeedbacks.length;
};

/**
 * Hàm chính Deep Clean — chạy toàn bộ pipeline theo thứ tự an toàn.
 * Dùng cho cron 6 tháng/lần và endpoint POST /api/sync/deep-clean.
 */
const runDeepClean = async () => {
  const cutoff = getCutoffDate();
  log(`=== Bắt đầu Deep Clean (cutoff: ${cutoff.toISOString()}) ===`);

  const report = {
    cutoff:                  cutoff.toISOString(),
    courses:                 0,
    registrationsFromCourse: 0,
    teachers:                0,
    staffAccounts:           0,
    orphanRegistrations:     0,
    orphanRankings:          0,
    announcements:           0,
    feedbacks:               0,
  };

  try {
    const courseReport   = await _cleanDeletedCourses(cutoff);
    report.courses                 = courseReport.courses;
    report.registrationsFromCourse = courseReport.registrations;

    const teacherReport  = await _cleanDeletedTeachers(cutoff);
    report.teachers      = teacherReport.teachers;
    report.staffAccounts = teacherReport.staffAccounts;

    report.orphanRegistrations = await _cleanOrphanRegistrations();

    // Dùng lại hàm cleanOrphanRankings đã có ở trên
    const rankingReport        = await cleanOrphanRankings();
    report.orphanRankings      = rankingReport.total;

    report.announcements = await _cleanDeletedAnnouncements(cutoff);
    report.feedbacks     = await _cleanDeletedFeedbacks(cutoff);

    // Xóa cache nếu có thay đổi
    const totalDeleted = report.courses + report.registrationsFromCourse
      + report.teachers + report.orphanRegistrations + report.orphanRankings
      + report.announcements + report.feedbacks;

    if (totalDeleted > 0) {
      await Promise.all([
        clearCache('/api/courses'),
        clearCache('/api/teachers'),
        clearCache('/api/rankings'),
        clearCache('/api/rankings/top'),
        clearCache('/api/announcements'),
        clearCache('/api/feedback'),
      ]);
    }

    log('=== Deep Clean hoàn thành ===', report);
    return { success: true, report };

  } catch (err) {
    log('=== Deep Clean thất bại ===', err.message);
    return { success: false, error: err.message, report };
  }
};

module.exports = { cleanOrphanRankings, runDeepClean };