const Course = require('../models/Course');
const mongoose = require('mongoose');
const { logAction } = require('../utils/logger');
const logAdminAction = require('../utils/logAdminAction');
const { uploadImageBuffer, deleteImageFromCloudinary } = require('../utils/cloudinary');
const { cleanInput } = require('../utils/sanitize');
const { clearCache } = require('../middlewares/cacheMiddleware');

// GET /api/courses
exports.getAll = async (req, res, next) => {
  try {
    const Registration = require('../models/Registration');
    const courses = await Course.find({ isDeleted: { $ne: true } })
      .populate({ path: 'teacher', match: { isDeleted: { $ne: true } } })
      .populate({ path: 'additionalTeachers', match: { isDeleted: { $ne: true } } })
      .sort({ createdAt: -1 });

    const counts = await Registration.aggregate([
      { $match: { status: 'registered', isActive: true } },
      { $group: { _id: '$courseId', count: { $sum: 1 } } }
    ]);

    const countMap = counts.reduce((acc, curr) => {
      acc[curr._id.toString()] = curr.count;
      return acc;
    }, {});

    const enrichedCourses = courses.map(course => {
      const courseObj = course.toObject();
      courseObj.activeStudentCount = countMap[course._id.toString()] || 0;
      return courseObj;
    });

    return res.json({ success: true, data: enrichedCourses });
  } catch (error) {
    next(error);
  }
};

// GET /api/courses/:id
exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }
    const course = await Course.findOne({ _id: id, isDeleted: { $ne: true } })
      .populate({ path: 'teacher', match: { isDeleted: { $ne: true } } })
      .populate({ path: 'additionalTeachers', match: { isDeleted: { $ne: true } } });
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    return res.json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
};

// ── Attendance handlers ────────────────────────────────────────────────────

/**
 * Helper: kiểm tra teacher có thuộc khóa học này không.
 * Admin luôn được phép. Teacher phải là giáo viên chính hoặc giáo viên phụ.
 * Trả về course nếu được phép, null nếu không tìm thấy, false nếu không có quyền.
 *
 * Lưu ý: req.user.teacherId được gắn bởi auth middleware (Teacher._id lookup từ staffAccountId).
 * req.admin chỉ được set khi role thực sự là 'admin' (xem auth.js).
 */
const checkCourseAccess = async (courseId, req) => {
  const course = await Course.findOne({ _id: courseId, isDeleted: { $ne: true } }).lean();
  if (!course) return null;

  // Admin luôn có quyền
  if (req.admin) return course;

  // Teacher: req.user.teacherId được auth middleware populate từ Teacher.staffAccountId
  const teacherId = req.user?.teacherId;
  if (!teacherId) return false;

  const teacherIdStr = teacherId.toString();
  const isMainTeacher = course.teacher?.toString() === teacherIdStr;
  const isAdditional  = (course.additionalTeachers || [])
    .some(t => t.toString() === teacherIdStr);

  return (isMainTeacher || isAdditional) ? course : false;
};

// Export để registrationController dùng chung, tránh duplicate logic
exports.checkCourseAccess = checkCourseAccess;

/**
 * GET /api/courses/:id/attendance?date=YYYY-MM-DD
 * Lấy bản ghi điểm danh của 1 buổi học (theo ngày).
 * Nếu chưa có → trả về records rỗng để FE tự render danh sách học sinh.
 */
exports.getAttendance = async (req, res, next) => {
  try {
    const Attendance = require('../models/Attendance');
    const { id } = req.params;
    const { date } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid course ID' });
    }

    const access = await checkCourseAccess(id, req);
    if (access === null) return res.status(404).json({ success: false, message: 'Course not found' });
    if (access === false) return res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập lớp học này' });

    // Normalize ngày về 00:00:00 UTC
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setUTCHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({ courseId: id, date: targetDate });

    return res.json({
      success: true,
      data: attendance
        ? { date: attendance.date, records: attendance.records, takenBy: attendance.takenBy }
        : { date: targetDate, records: [] }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/courses/:id/attendance
 * Body: { date: 'YYYY-MM-DD', records: [{ studentId, status }] }
 * Upsert: nếu đã có buổi đó thì ghi đè, chưa có thì tạo mới.
 */
exports.saveAttendance = async (req, res, next) => {
  try {
    const Attendance = require('../models/Attendance');
    const { id } = req.params;
    const { date, records } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid course ID' });
    }

    const access = await checkCourseAccess(id, req);
    if (access === null) return res.status(404).json({ success: false, message: 'Course not found' });
    if (access === false) return res.status(403).json({ success: false, message: 'Bạn không có quyền điểm danh lớp học này' });

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, message: 'records array is required' });
    }
    // Validate từng record
    for (const r of records) {
      if (!mongoose.Types.ObjectId.isValid(r.studentId)) {
        return res.status(400).json({ success: false, message: `Invalid studentId: ${r.studentId}` });
      }
      if (!['present', 'absent'].includes(r.status)) {
        return res.status(400).json({ success: false, message: `status phải là present hoặc absent` });
      }
    }

    // Verify mọi studentId gửi lên phải là học viên đang active của lớp này
    const Registration = require('../models/Registration');
    const validRegistrations = await Registration.find({
      courseId: id,
      status: 'registered',
      isActive: true,
    }).select('_id').lean();

    const validIdSet = new Set(validRegistrations.map(r => r._id.toString()));
    const invalidIds = records
      .map(r => r.studentId.toString())
      .filter(sid => !validIdSet.has(sid));

    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: `studentId không thuộc lớp học này: ${invalidIds.join(', ')}`,
      });
    }

    const targetDate = date ? new Date(date) : new Date();
    targetDate.setUTCHours(0, 0, 0, 0);

    // Xác định người điểm danh (teacher hoặc admin)
    const takenBy = req.user?.id || req.admin?.id || null;

    const attendance = await Attendance.findOneAndUpdate(
      { courseId: id, date: targetDate },
      { courseId: id, date: targetDate, records, takenBy },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({
      success: true,
      message: 'Lưu điểm danh thành công',
      data: { date: attendance.date, records: attendance.records }
    });
  } catch (error) {
    next(error);
  }
};

// ── Helpers ────────────────────────────────────────────────────────────────

const parseHighlights = (highlights) => {
  if (!highlights) return undefined;
  let arr = typeof highlights === 'string'
    ? highlights.split(',').map(h => h.trim()).filter(h => h)
    : Array.isArray(highlights)
      ? highlights.map(h => h.trim()).filter(h => h)
      : [];
  if (arr.some(h => h.length > 40)) {
    throw Object.assign(new Error('Each highlight max 40 characters'), { status: 400 });
  }
  return arr;
};

const parseAdditionalTeachers = (additionalTeachers) => {
  if (additionalTeachers === undefined || additionalTeachers === null) return undefined;
  let arr = Array.isArray(additionalTeachers)
    ? additionalTeachers
    : typeof additionalTeachers === 'string' && additionalTeachers.trim()
      ? [additionalTeachers]
      : [];
  arr = arr.filter(id => id && id.toString().trim());
  if (arr.length > 15) {
    throw Object.assign(new Error('Maximum 15 additional teachers allowed'), { status: 400 });
  }
  for (const id of arr) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw Object.assign(new Error(`Invalid teacher ID: ${id}`), { status: 400 });
    }
  }
  return arr;
};

// POST /api/courses
exports.create = async (req, res) => {
  let uploadResult = null;
  try {
    const { name, description, highlights, teacher, additionalTeachers, ageGroup, duration, classSize } = req.body;

    if (name?.length > 40) return res.status(400).json({ success: false, message: 'Course name max 40 characters' });
    const size = parseInt(classSize);
    if (isNaN(size) || size < 1 || size > 100) return res.status(400).json({ success: false, message: 'Class size must be between 1 and 100' });

    const data = {
      name: cleanInput(name),
      description: cleanInput(description),
      teacher: teacher || null,
      ageGroup: cleanInput(ageGroup),
      duration: cleanInput(duration),
      classSize: size
    };

    try {
      const parsed = parseHighlights(highlights);
      if (parsed !== undefined) data.highlights = parsed.map(h => cleanInput(h));
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    try {
      const parsedAdditional = parseAdditionalTeachers(additionalTeachers);
      if (parsedAdditional !== undefined) data.additionalTeachers = parsedAdditional;
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, message: 'Course image is required' });
    }

    try {
      uploadResult = await uploadImageBuffer(req.file.buffer, 'courses');
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Image upload failed' });
    }
    data.image = uploadResult.secure_url;
    data.imagePublicId = uploadResult.public_id;

    const course = await Course.create(data);
    await clearCache('/api/courses');
    await logAdminAction({
      adminId: req.admin?.id || null,
      adminName: req.admin?.username || 'system',
      action: 'CREATE_COURSE',
      targetType: 'course',
      targetId: course._id,
      description: `Created course: ${course.name}`,
      req
    });
    return res.status(201).json({ success: true, data: course, message: 'Course created successfully' });
  } catch (error) {
    if (uploadResult?.public_id) {
      try { await deleteImageFromCloudinary(uploadResult.public_id); } catch (_) {}
    }
    const isValidationError = error?.name === 'ValidationError' || error?.name === 'CastError';
    if (isValidationError) return res.status(400).json({ success: false, message: error.message });
    return res.status(500).json({ success: false, message: 'Failed to create course' });
  }
};

// PUT /api/courses/:id
exports.update = async (req, res) => {
  let uploadResult = null;
  let dbUpdated = false;
  try {
    const { name, description, highlights, teacher, additionalTeachers, ageGroup, duration, classSize } = req.body;

    if (name !== undefined && typeof name === 'string' && name.trim().length === 0)
      return res.status(400).json({ success: false, message: 'Course name cannot be empty' });
    if (description !== undefined && typeof description === 'string' && description.trim().length === 0)
      return res.status(400).json({ success: false, message: 'Description cannot be empty' });
    if (ageGroup !== undefined && typeof ageGroup === 'string' && ageGroup.trim().length === 0)
      return res.status(400).json({ success: false, message: 'Age group cannot be empty' });
    if (duration !== undefined && typeof duration === 'string' && duration.trim().length === 0)
      return res.status(400).json({ success: false, message: 'Duration cannot be empty' });
    if (name !== undefined && name?.length > 40)
      return res.status(400).json({ success: false, message: 'Course name max 40 characters' });

    let size;
    if (classSize !== undefined) {
      size = parseInt(classSize);
      if (isNaN(size) || size < 1 || size > 100)
        return res.status(400).json({ success: false, message: 'Class size must be between 1 and 100' });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: 'Invalid ID format' });

    const existing = await Course.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!existing) return res.status(404).json({ success: false, message: 'Course not found' });

    const data = {};
    if (name !== undefined) data.name = cleanInput(name);
    if (description !== undefined) data.description = cleanInput(description);
    if (teacher !== undefined) data.teacher = teacher || null;
    if (ageGroup !== undefined) data.ageGroup = cleanInput(ageGroup);
    if (duration !== undefined) data.duration = cleanInput(duration);
    if (classSize !== undefined) data.classSize = size;

    try {
      if (highlights !== undefined) {
        const parsed = parseHighlights(highlights);
        if (parsed !== undefined) data.highlights = parsed.map(h => cleanInput(h));
      }
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    if (additionalTeachers !== undefined) {
      try {
        const parsedAdditional = parseAdditionalTeachers(additionalTeachers);
        data.additionalTeachers = parsedAdditional ?? [];
      } catch (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
    }

    if (req.file && req.file.buffer) {
      try {
        uploadResult = await uploadImageBuffer(req.file.buffer, 'courses');
      } catch (err) {
        return res.status(500).json({ success: false, message: 'Image upload failed' });
      }
      data.image = uploadResult.secure_url;
      data.imagePublicId = uploadResult.public_id;
    }

    let course;
    try {
      course = await Course.findByIdAndUpdate(id, data, { new: true, runValidators: true })
        .populate({ path: 'teacher', match: { isDeleted: { $ne: true } } })
        .populate({ path: 'additionalTeachers', match: { isDeleted: { $ne: true } } });
      dbUpdated = true;
    } catch (dbError) {
      if (uploadResult?.public_id) {
        try { await deleteImageFromCloudinary(uploadResult.public_id); } catch (_) {}
      }
      throw dbError;
    }

    await clearCache('/api/courses');
    if (uploadResult && existing.imagePublicId) {
      try { await deleteImageFromCloudinary(existing.imagePublicId); } catch (_) {}
    }
    try {
      await logAdminAction({
        adminId: req.admin?.id || null,
        adminName: req.admin?.username || 'system',
        action: 'UPDATE_COURSE',
        targetType: 'course',
        targetId: course._id,
        description: `Updated course: ${course.name}`,
        req
      });
    } catch (_) {}
    return res.json({ success: true, data: course, message: 'Course updated successfully' });
  } catch (error) {
    if (!dbUpdated && uploadResult?.public_id) {
      try { await deleteImageFromCloudinary(uploadResult.public_id); } catch (_) {}
    }
    const isValidationError = error?.name === 'ValidationError' || error?.name === 'CastError';
    if (isValidationError) return res.status(400).json({ success: false, message: error.message });
    return res.status(500).json({ success: false, message: 'Failed to update course' });
  }
};

// DELETE /api/courses/:id
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: 'Invalid ID format' });

    const course = await Course.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    // Ảnh Cloudinary sẽ được xóa bởi deepCleanService sau 6 tháng
    await clearCache('/api/courses');
    await logAdminAction({
      adminId: req.admin?.id || null,
      adminName: req.admin?.username || 'system',
      action: 'DELETE_COURSE',
      targetType: 'course',
      targetId: course._id,
      description: `Deleted course: ${course.name}`,
      req
    });
    return res.json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// GET /api/courses/:id/attendance/export-excel?date=YYYY-MM-DD
// Xuất điểm danh 1 buổi ra file Excel — có màu header, kẻ khung, in đậm
exports.exportAttendanceExcel = async (req, res, next) => {
  try {
    const ExcelJS    = require('exceljs');
    const Attendance = require('../models/Attendance');
    const Registration = require('../models/Registration');
    const Course     = require('../models/Course');
    const { id }     = req.params;
    const { date }   = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid course ID' });
    }

    // Ownership check
    const access = await checkCourseAccess(id, req);
    if (access === null) return res.status(404).json({ success: false, message: 'Course not found' });
    if (access === false) return res.status(403).json({ success: false, message: 'Bạn không có quyền xuất dữ liệu lớp học này' });

    // 1. Lấy thông tin khóa học
    const course = await Course.findOne({ _id: id, isDeleted: { $ne: true } }).lean();
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    // 2. Lấy danh sách học sinh đang active của lớp (bao gồm note)
    const registrations = await Registration.find({
      courseId: id,
      status: 'registered',
      isActive: true
    }).select('childName childAge parentName phone note').lean();

    // 3. Lấy bản ghi điểm danh theo ngày
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setUTCHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({ courseId: id, date: targetDate }).lean();

    // Map studentId -> status
    const statusMap = {};
    (attendance?.records || []).forEach(r => {
      statusMap[r.studentId.toString()] = r.status;
    });

    const dateStr = targetDate.toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC'
    });

    // 4. Tạo workbook ExcelJS
    const workbook  = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Diem danh');

    // ── Màu sắc ─────────────────────────────────────────────────────────────
    const HEADER_BG   = '1D4ED8'; // xanh đậm
    const PRESENT_BG  = 'D1FAE5'; // xanh lá nhạt
    const ABSENT_BG   = 'FEE2E2'; // đỏ nhạt
    const PENDING_BG  = 'F3F4F6'; // xám nhạt

    // Kiểm tra role: teacher thì ẩn SĐT
    const isTeacher = req.user?.role === 'teacher';
    const TOTAL_COLS = 7; // STT, Tên, Tuổi, Phụ huynh, SĐT (ẩn với teacher), Ghi chú, Trạng thái

    // ── Tiêu đề file (merge 7 cột) ──────────────────────────────────────────
    worksheet.mergeCells('A1:G1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value         = `BẢNG ĐIỂM DANH — ${course.name.toUpperCase()}`;
    titleCell.font          = { bold: true, size: 14, color: { argb: '1D4ED8' } };
    titleCell.alignment     = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 30;

    worksheet.mergeCells('A2:G2');
    const subCell = worksheet.getCell('A2');
    subCell.value       = `Ngày: ${dateStr}   |   Sĩ số: ${registrations.length} học sinh`;
    subCell.font        = { size: 11, italic: true, color: { argb: '6B7280' } };
    subCell.alignment   = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(2).height = 22;

    // Dòng trống
    worksheet.addRow([]);

    // ── Header row ───────────────────────────────────────────────────────────
    const headerRow = worksheet.addRow([
      'STT',
      'Họ và tên học sinh',
      'Tuổi',
      'Tên phụ huynh',
      isTeacher ? '—' : 'Số điện thoại',
      'Ghi chú',
      'Trạng thái điểm danh'
    ]);
    headerRow.height = 28;
    headerRow.eachCell(cell => {
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_BG } };
      cell.font      = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border    = {
        top:    { style: 'thin', color: { argb: 'FFFFFF' } },
        left:   { style: 'thin', color: { argb: 'FFFFFF' } },
        bottom: { style: 'thin', color: { argb: 'FFFFFF' } },
        right:  { style: 'thin', color: { argb: 'FFFFFF' } }
      };
    });

    // ── Data rows ────────────────────────────────────────────────────────────
    registrations.forEach((reg, idx) => {
      const status    = statusMap[reg._id.toString()];
      const statusLabel =
        status === 'present' ? 'Có mặt' :
        status === 'absent'  ? 'Vắng'   : 'Chưa điểm danh';
      const rowBg =
        status === 'present' ? PRESENT_BG :
        status === 'absent'  ? ABSENT_BG  : PENDING_BG;

      const dataRow = worksheet.addRow([
        idx + 1,
        reg.childName  || '',
        reg.childAge   || '',
        reg.parentName || '',
        isTeacher ? '***' : (reg.phone || ''),
        reg.note       || '',
        statusLabel
      ]);

      dataRow.height = 22;
      dataRow.eachCell((cell, colNumber) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
        cell.alignment = {
          horizontal: colNumber === 1 || colNumber === 3 ? 'center' : 'left',
          vertical: 'middle',
          wrapText: colNumber === 6, // wrap cột ghi chú
        };
        cell.border = {
          top:    { style: 'thin', color: { argb: 'D1D5DB' } },
          left:   { style: 'thin', color: { argb: 'D1D5DB' } },
          bottom: { style: 'thin', color: { argb: 'D1D5DB' } },
          right:  { style: 'thin', color: { argb: 'D1D5DB' } }
        };
        // In đậm cột tên học sinh
        if (colNumber === 2) cell.font = { bold: true };
        // Màu chữ cột trạng thái
        if (colNumber === 7) {
          cell.font = {
            bold: true,
            color: {
              argb: status === 'present' ? '065F46' :
                    status === 'absent'  ? '991B1B' : '6B7280'
            }
          };
        }
      });
    });

    // ── Dòng tổng kết ────────────────────────────────────────────────────────
    const presentCount = registrations.filter(r => statusMap[r._id.toString()] === 'present').length;
    const absentCount  = registrations.filter(r => statusMap[r._id.toString()] === 'absent').length;
    const pendingCount = registrations.length - presentCount - absentCount;

    worksheet.addRow([]);
    const summaryRow = worksheet.addRow([
      '', 'TỔNG KẾT',
      `Có mặt: ${presentCount}`,
      `Vắng: ${absentCount}`,
      `Chưa điểm danh: ${pendingCount}`,
      '',
      `Tổng: ${registrations.length}`
    ]);
    summaryRow.height = 24;
    summaryRow.eachCell(cell => {
      cell.font      = { bold: true, size: 11, color: { argb: '1D4ED8' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border    = {
        top:    { style: 'medium', color: { argb: '1D4ED8' } },
        left:   { style: 'thin',   color: { argb: 'D1D5DB' } },
        bottom: { style: 'medium', color: { argb: '1D4ED8' } },
        right:  { style: 'thin',   color: { argb: 'D1D5DB' } }
      };
    });

    // ── Độ rộng cột ──────────────────────────────────────────────────────────
    worksheet.getColumn(1).width = 6;   // STT
    worksheet.getColumn(2).width = 25;  // Tên học sinh
    worksheet.getColumn(3).width = 8;   // Tuổi
    worksheet.getColumn(4).width = 22;  // Tên phụ huynh
    worksheet.getColumn(5).width = 16;  // SĐT (hoặc ẩn với teacher)
    worksheet.getColumn(6).width = 30;  // Ghi chú
    worksheet.getColumn(7).width = 20;  // Trạng thái

    // ── Gửi file ─────────────────────────────────────────────────────────────
    const safeName = course.name.replace(/[^a-zA-Z0-9_\-]/g, '_');
    const fileName = `diemdanh_${safeName}_${date || 'hom_nay'}.xlsx`;

    res.setHeader('Content-Type',        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};