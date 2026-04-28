const Registration = require('../models/Registration');
const Course = require('../models/Course');
const ExcelJS = require('exceljs');
const axios = require('axios');
const mongoose = require('mongoose');
const { logAction } = require('../utils/logger');
const logAdminAction = require('../utils/logAdminAction');
const emailService = require('../utils/emailService');
const { appendToSheet } = require("../googleSheets");
const { cleanInput } = require("../utils/sanitize");
const { clearCache } = require('../middlewares/cacheMiddleware');
const { checkCourseAccess } = require('./courseController');

// Lightweight regex escape utility
const escapeStringRegexp = (string) => {
  return string.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
};

// GET /api/registrations
exports.getAll = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    let query = {};
    if (search && typeof search === 'string' && search.length < 50) {
      const sanitizedSearch = escapeStringRegexp(search);
      query.$or = [
        { parentName: { $regex: sanitizedSearch, $options: 'i' } },
        { phone: { $regex: sanitizedSearch, $options: 'i' } },
        { childName: { $regex: sanitizedSearch, $options: 'i' } }
      ];
    }
    if (status && typeof status === 'string') {
      query.status = status;
    }

    const safePage  = Math.max(Number(page)  || 1,  1);
    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);

    const total = await Registration.countDocuments(query);
    const registrations = await Registration.find(query)
      .populate('courseId', 'name')
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit);

    res.json({
      success: true,
      data: {
        registrations,
        total,
        pages: Math.ceil(total / safeLimit),
        currentPage: safePage
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/registrations/:id
exports.getById = async (req, res, next) => {
  try {
    const reg = await Registration.findById(req.params.id).populate('courseId', 'name');
    if (!reg) return res.status(404).json({ success: false, message: 'Registration not found' });
    res.json({ success: true, data: reg });
  } catch (error) {
    next(error);
  }
};

// POST /api/registrations
exports.create = async (req, res) => {
  const { captchaToken } = req.body;

  // --- PRE-TRANSACTION VALIDATION (no DB writes, no session needed) ---

  // 1. Basic Validation
  const { phone, email, courseId, parentName, childName, childAge, ignoreDuplicate } = req.body;
  if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
    return res.status(400).json({ success: false, message: 'INVALID_COURSE_ID' });
  }

  // Trim all string inputs early to prevent abuse/spam payloads
  for (const [key, value] of Object.entries(req.body)) {
    if (typeof value === 'string') req.body[key] = value.trim();
  }

  // Max-length validation (reject oversized payloads)
  if (req.body.parentName !== undefined && typeof req.body.parentName === 'string' && req.body.parentName.length > 50) {
    return res.status(400).json({ success: false, message: 'parentName_max_50' });
  }
  if (req.body.childName !== undefined && typeof req.body.childName === 'string' && req.body.childName.length > 50) {
    return res.status(400).json({ success: false, message: 'childName_max_50' });
  }
  if (req.body.email !== undefined && typeof req.body.email === 'string' && req.body.email.length > 100) {
    return res.status(400).json({ success: false, message: 'email_max_100' });
  }
  if (req.body.phone !== undefined && typeof req.body.phone === 'string' && req.body.phone.length > 15) {
    return res.status(400).json({ success: false, message: 'phone_max_15' });
  }

  // 2. reCAPTCHA Verification (external API call — do BEFORE transaction)
  if (process.env.NODE_ENV === 'production') {
    if (!captchaToken) {
      return res.status(400).json({ success: false, message: 'captcha_required' });
    }
    try {
      const resp = await axios.post(
        'https://www.google.com/recaptcha/api/siteverify',
        null,
        {
          params: {
            secret: process.env.RECAPTCHA_SECRET_KEY,
            response: captchaToken
          },
          timeout: 5000
        }
      );
      if (!resp.data.success) {
        console.warn('[Captcha] Failed:', resp.data['error-codes']);
        return res.status(400).json({ success: false, message: 'captcha_invalid' });
      }
    } catch (captchaErr) {
      console.error('[Captcha] Network error:', captchaErr.message);
      return res.status(500).json({ success: false, message: 'captcha_error' });
    }
  }

  // 3. Normalization
  const rawPhone = req.body.phone || '';

  let normPhone = rawPhone.replace(/\D/g, '');

  if (normPhone.startsWith('84')) {
    normPhone = '0' + normPhone.slice(2);
  }

  const normEmail = req.body.email?.toLowerCase().trim() || '';
  const normParent = req.body.parentName?.toLowerCase() || '';
  const normChild = req.body.childName?.toLowerCase() || '';

  // --- TRANSACTION: all DB reads/writes happen here ---
  const session = await mongoose.startSession();

  // These variables are populated inside the transaction, used for side effects after
  let reg = null;
  let resolvedCourseName = null;

  try {
    await session.withTransaction(async () => {
      // 4. Rate limiting (Daily phone registration limit)
      const maxPerDay = process.env.NODE_ENV === 'production' ? Number(process.env.MAX_REG_PER_DAY) : 100;
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const todayCount = await Registration.countDocuments({
        phone: normPhone,
        createdAt: { $gte: startOfToday }
      }).session(session);

      if (todayCount >= maxPerDay) {
        throw { statusCode: 429, message: 'LIMIT_REACHED' };
      }

      const MAX_ACTIVE_COURSES =
        process.env.NODE_ENV === 'production'
          ? Number(process.env.MAX_ACTIVE_COURSES) || 4
          : 100;
      const activeCourseCount = await Registration.countDocuments({
        phone: normPhone,
        isActive: true
      }).session(session);

      if (activeCourseCount >= MAX_ACTIVE_COURSES) {
        throw {
          statusCode: 400,
          message: `Số điện thoại này đã đạt tối đa ${MAX_ACTIVE_COURSES} khóa học đang hoạt động`
        };
      }

      // 5. STRICT Duplicate Validation (active registrations only)
      if (!ignoreDuplicate) {
        // CASE 1: Full Match
        const existingFullMatch = await Registration.findOne({
          courseId,
          phone: normPhone,
          ...(normEmail && { email: normEmail }),
          parentName: normParent,
          childName: normChild,
          isActive: true
        }).session(session);

        if (existingFullMatch) {
          throw { statusCode: 409, message: 'Student already exists in this course', type: 'DUPLICATE_FULL' };
        }

        // CASE 2 & 3: Check email/phone and parent count
        const contactMatches = await Registration.find({
          courseId,
          isActive: true,
          $or: [
            { phone: normPhone },
            ...(normEmail ? [{ email: normEmail }] : [])
          ]
        }).session(session);

        if (contactMatches.length > 0) {
          const sameParentCount = contactMatches.filter(m =>
            m.parentName?.trim()?.toLowerCase() === normParent
          ).length;

          if (sameParentCount >= 2) {
            const studentExists = contactMatches.some(m =>
              m.parentName?.trim()?.toLowerCase() === normParent &&
              m.childName?.trim()?.toLowerCase() === normChild
            );
            if (studentExists) {
              throw {
                statusCode: 200,
                message: 'Có thể học sinh này đã tồn tại',
                warning: true,
                type: 'DUPLICATE_WARN'
              };
            }
          }
        }
      }

      // 6. ATOMIC Capacity Check
      const course = await Course.findById(courseId).session(session);
      if (!course || course.isDeleted) {
        throw { statusCode: 404, message: 'COURSE_NOT_FOUND' };
      }

      const activeRegisteredCount = await Registration.countDocuments({
        courseId,
        status: 'registered',
        isActive: true
      }).session(session);

      if (activeRegisteredCount >= course.classSize) {
        throw { statusCode: 400, message: 'CLASS_FULL' };
      }

      // 7. Save Registration
      const ALLOWED_FIELDS = ['parentName', 'phone', 'email', 'childName', 'childAge', 'courseId', 'message'];
      const filteredData = {};
      for (const field of ALLOWED_FIELDS) {
        if (req.body[field] !== undefined) filteredData[field] = req.body[field];
      }

      filteredData.phone = cleanInput(normPhone);
      filteredData.email = cleanInput(normEmail);
      filteredData.parentName = cleanInput(req.body.parentName);
      filteredData.childName = cleanInput(req.body.childName);
      if (filteredData.message) {
        filteredData.message = cleanInput(filteredData.message);
      }

      reg = new Registration(filteredData);
      await reg.save({ session });

      // Capture course name for post-transaction side effects
      resolvedCourseName = req.body.courseName || course.name;
    });
    // --- withTransaction auto-commits on success, auto-aborts on throw ---

  } catch (error) {
    // Business logic errors thrown inside withTransaction
    if (error.statusCode) {
      const responseBody = { success: false, message: error.message };
      if (error.type) responseBody.type = error.type;
      if (error.warning) responseBody.warning = true;
      return res.status(error.statusCode).json(responseBody);
    }
    // Unexpected DB/system errors
    console.error('[DEBUG] REGISTRATION ERROR:', error);
    return res.status(400).json({ success: false, message: error.message });
  } finally {
    // Session is ALWAYS cleaned up, exactly once
    session.endSession();
  }

  // --- POST-TRANSACTION SIDE EFFECTS (fire-and-forget) ---
  // These run ONLY after a successful commit. Failures here do NOT affect the response.

  // Logging (non-critical — don't let it crash the response)
  logAction(req, 'CREATE_REGISTRATION', { registrationId: reg._id, parentName: reg.parentName })
    .catch(err => console.error('[Log] Action log failed:', err));

  // Email notifications
  const emailPromises = [];
  if (email && email.trim()) {
    emailPromises.push(
      emailService.sendRegistrationEmail(email, reg.childName, resolvedCourseName)
        .catch(err => console.error('[Email] Gửi xác nhận thất bại:', err))
    );
  }
  emailPromises.push(
    emailService.sendAdminNotification(reg.parentName, reg.phone, reg.childName, resolvedCourseName, reg.email)
      .catch(err => console.error('[Email] Gửi admin thất bại:', err))
  );
  Promise.allSettled(emailPromises);

  // Google Sheets sync
  const sheetData = {
    parentName: reg.parentName,
    phone: reg.phone,
    childName: reg.childName,
    childAge: reg.childAge,
    course: resolvedCourseName,
    email: reg.email || '',
    message: reg.message || ''
  };
  appendToSheet(sheetData).catch(err => console.error('[Sheets] Background sync failed:', err));
  await clearCache('/api/courses');
  // Success response
  res.status(201).json({ success: true, data: reg, message: 'Registration created successfully' });
};

// PUT /api/registrations/:id
exports.update = async (req, res) => {
  // ✅ FIX: Thay findByIdAndUpdate truyền thẳng req.body bằng logic Whitelist (Chống Mass Assignment)
  const ALLOWED = ['childName', 'parentName', 'phone', 'email', 'note', 'message', 'childAge', 'status'];
  const updateData = {};
  for (const field of ALLOWED) {
    if (req.body[field] !== undefined) {
      updateData[field] = (typeof req.body[field] === 'string' && field !== 'status')
        ? cleanInput(req.body[field])
        : req.body[field];
    }
  }

  // Reject empty strings after trim (only when explicitly provided)
  for (const field of ALLOWED) {
    if (updateData[field] !== undefined && typeof updateData[field] === 'string' && updateData[field].trim().length === 0) {
      return res.status(400).json({ success: false, message: `${field} cannot be empty` });
    }
  }

  // ✅ CAPACITY CHECK: If transitioning TO "registered", enforce maxStudents
  const isSettingRegistered = updateData.status === 'registered';

  if (isSettingRegistered) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Load current registration inside transaction
      const current = await Registration.findById(req.params.id).session(session);
      if (!current) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ success: false, message: 'Registration not found' });
      }

      // 2. Skip capacity check if already registered (no actual change)
      if (current.status === 'registered') {
        const reg = await Registration.findByIdAndUpdate(
          req.params.id, { $set: updateData }, { new: true, runValidators: true, session }
        );
        await session.commitTransaction();
        session.endSession();
        await clearCache('/api/courses');
        return res.json({ success: true, data: reg, message: 'Registration updated successfully' });
      }

      // 3. Atomic capacity check
      const course = await Course.findById(current.courseId).session(session);
      if (!course || course.isDeleted) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ success: false, message: 'Course not found' });
      }

      const activeCount = await Registration.countDocuments({
        courseId: current.courseId,
        status: 'registered',
        isActive: true
      }).session(session);

      if (activeCount >= course.classSize) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ success: false, message: 'Lớp đã đủ học viên' });
      }

      // 4. Safe to update
      const reg = await Registration.findByIdAndUpdate(
        req.params.id, { $set: updateData }, { new: true, runValidators: true, session }
      );

      await session.commitTransaction();
      session.endSession();
      await clearCache('/api/courses');
      return res.json({ success: true, data: reg, message: 'Registration updated successfully' });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  // Non-registered status updates (no capacity check needed)
  try {
    const reg = await Registration.findByIdAndUpdate(
      req.params.id, { $set: updateData }, { new: true, runValidators: true }
    );
    if (!reg) return res.status(404).json({ success: false, message: 'Registration not found' });
    await clearCache('/api/courses');
    return res.json({ success: true, data: reg, message: 'Registration updated successfully' });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE /api/registrations/:id
exports.remove = async (req, res, next) => {
  try {
    const reg = await Registration.findByIdAndDelete(req.params.id);
    if (!reg) return res.status(404).json({ success: false, message: 'Registration not found' });
    await clearCache('/api/courses');
    res.json({ success: true, message: 'Registration deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// GET /api/courses/:id/students
exports.getStudentsByCourse = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid course ID' });
    }

    // Dùng chung checkCourseAccess — tránh duplicate logic với attendance handlers
    const access = await checkCourseAccess(id, req);
    if (access === null) return res.status(404).json({ success: false, message: 'Course not found' });
    if (access === false) return res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập lớp học này' });

    const students = await Registration.find({
      courseId: id,
      status: 'registered'
    })
      .populate('courseId', 'name')
      .select('childName childAge parentName phone email isActive courseId note transferHistory')
      .sort({ isActive: -1, createdAt: -1 })
      .lean();

    res.json({ success: true, data: students });
  } catch (error) {
    next(error);
  }
};

// PUT /api/students/:id/remove
exports.removeStudent = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const student = await Registration.findById(req.params.id).session(session);

    if (!student) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Không tìm thấy học sinh' });
    }

    if (!student.isActive) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Học sinh đã được xóa trước đó' });
    }

    student.isActive = false;
    await student.save({ session });

    // Log action safely (guard against missing admin context)
    if (req.admin) {
      await logAdminAction({
        adminId: req.admin.id,
        adminName: req.admin.username,
        action: 'REMOVE_STUDENT',
        targetType: 'registration',
        targetId: student._id,
        description: `Removed student ${student.childName} from course ${student.courseId}`,
        req
      });
    }

    await session.commitTransaction();
    await clearCache('/api/courses');
    res.json({ success: true, message: 'Đã cho học sinh nghỉ' });
  } catch (error) {
    try { await session.abortTransaction(); } catch (_) { /* already aborted */ }
    next(error);
  } finally {
    session.endSession();
  }
};

// GET /api/registrations/export-excel
exports.exportExcel = async (req, res, next) => {
  try {
    const registrations = await Registration.find().populate('courseId', 'name').sort({ createdAt: -1 });

    // Map data for Registrations sheet
    const regData = registrations.map(reg => ({
      'Time': new Date(reg.createdAt).toLocaleString(),
      'Parent Name': reg.parentName,
      'Phone': reg.phone,
      'Child Name': reg.childName,
      'Child Age': reg.childAge,
      'Course': reg.courseId?.name || 'N/A',
      'Email': reg.email || '',
      'Message': reg.message || '',
      'Status': reg.status
    }));

    // Create workbook
    const workbook = new ExcelJS.Workbook();

    // --- Sheet 1: Registrations ---
    const regSheet = workbook.addWorksheet('Registrations');
    regSheet.columns = [
      { header: 'Time',        key: 'Time',        width: 20 },
      { header: 'Parent Name', key: 'Parent Name',  width: 20 },
      { header: 'Phone',       key: 'Phone',        width: 15 },
      { header: 'Child Name',  key: 'Child Name',   width: 20 },
      { header: 'Child Age',   key: 'Child Age',    width: 10 },
      { header: 'Course',      key: 'Course',       width: 25 },
      { header: 'Email',       key: 'Email',        width: 25 },
      { header: 'Message',     key: 'Message',      width: 30 },
      { header: 'Status',      key: 'Status',       width: 15 },
    ];
    regSheet.addRows(regData);

    // --- Sheet 2: Statistics ---
    const courseStats = {};
    registrations.forEach(reg => {
      const cName = reg.courseId?.name || 'Unknown';
      courseStats[cName] = (courseStats[cName] || 0) + 1;
    });

    const statsSheet = workbook.addWorksheet('Statistics');
    statsSheet.columns = [
      { header: 'Course',        key: 'Course',        width: 25 },
      { header: 'Registrations', key: 'Registrations', width: 15 },
    ];
    Object.entries(courseStats).forEach(([course, count]) => {
      statsSheet.addRow({ Course: course, Registrations: count });
    });

    // Generate buffer and send
    const buffer = await workbook.xlsx.writeBuffer();

    res.status(200);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="registrations.xlsx"');
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

// PUT /api/courses/students/:id/transfer
exports.transferStudent = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { toCourseId } = req.body;
    const studentId = req.params.id;

    // 1. Validate input
    if (!toCourseId || !mongoose.Types.ObjectId.isValid(toCourseId)) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'toCourseId không hợp lệ' });
    }

    // 2. Load registration
    const student = await Registration.findById(studentId).session(session);
    if (!student) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Không tìm thấy học viên' });
    }
    if (!student.isActive) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Học viên này đã ngưng hoạt động' });
    }

    const fromCourseId = student.courseId.toString();
    if (fromCourseId === toCourseId) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Học viên đã ở trong khóa học này rồi' });
    }

    // 3. Validate destination course & check capacity
    const toCourse = await Course.findById(toCourseId).session(session);
    if (!toCourse || toCourse.isDeleted) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Khóa học đích không tồn tại' });
    }

    const activeCount = await Registration.countDocuments({
      courseId: toCourseId,
      status: 'registered',
      isActive: true
    }).session(session);

    if (activeCount >= toCourse.classSize) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: `Lớp "${toCourse.name}" đã đủ học viên (${toCourse.classSize})` });
    }

    // 4. Perform transfer — ghi lịch sử, đổi courseId
    const transferredBy = req.admin?.username || 'admin';

    student.transferHistory.push({
      fromCourseId,
      toCourseId,
      transferredAt: new Date(),
      transferredBy
    });
    student.courseId = toCourseId;

    await student.save({ session });
    await session.commitTransaction();

    // 5. Audit log (non-critical)
    if (req.admin) {
      logAdminAction({
        adminId: req.admin.id,
        adminName: req.admin.username,
        action: 'TRANSFER_STUDENT',
        targetType: 'registration',
        targetId: student._id,
        description: `Chuyển học viên "${student.childName}" từ lớp ${fromCourseId} sang lớp ${toCourseId}`,
        req
      }).catch(err => console.error('[AuditLog] transferStudent failed:', err));
    }

    await clearCache('/api/courses');

    return res.json({
      success: true,
      message: `Đã chuyển "${student.childName}" sang lớp "${toCourse.name}" thành công`,
      data: student
    });

  } catch (error) {
    try { await session.abortTransaction(); } catch (_) { }
    next(error);
  } finally {
    session.endSession();
  }
};

// PUT /api/registrations/:id/note
// Cho phép cả admin và teacher chỉnh sửa ghi chú học sinh.
// Teacher chỉ được sửa note của học sinh thuộc lớp mình phụ trách.
//
exports.updateNote = async (req, res, next) => {
  try {
    const { note } = req.body;
 
    // Validate note
    if (note === undefined) {
      return res.status(400).json({ success: false, message: 'Thiếu trường note' });
    }
    if (typeof note !== 'string') {
      return res.status(400).json({ success: false, message: 'note phải là chuỗi' });
    }
 
    const MAX_NOTE = 500;
    const cleaned = cleanInput(note.trim());
    if (cleaned.length > MAX_NOTE) {
      return res.status(400).json({ success: false, message: `Ghi chú tối đa ${MAX_NOTE} ký tự` });
    }
 
    // Tải registration
    const reg = await Registration.findById(req.params.id).populate('courseId', 'name teacherId');
    if (!reg) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy học viên' });
    }
 
    // Kiểm tra quyền: admin qua isAdmin middleware, teacher kiểm tra courseId
    const isAdmin = req.user?.role === 'admin';
    const isTeacher = req.user?.role === 'teacher';
 
    if (!isAdmin && !isTeacher) {
      return res.status(403).json({ success: false, message: 'Không có quyền truy cập' });
    }
 
    if (isTeacher) {
      // Dùng lại checkCourseAccess để kiểm tra teacher có phụ trách lớp này không
      const access = await checkCourseAccess(reg.courseId._id || reg.courseId, req);
      if (access === null) {
        return res.status(404).json({ success: false, message: 'Khóa học không tồn tại' });
      }
      if (access === false) {
        return res.status(403).json({ success: false, message: 'Bạn không phụ trách lớp học này' });
      }
    }
 
    reg.note = cleaned;
    await reg.save();
 
    return res.json({
      success: true,
      message: 'Cập nhật ghi chú thành công',
      data: { _id: reg._id, note: reg.note }
    });
  } catch (error) {
    next(error);
  }
};