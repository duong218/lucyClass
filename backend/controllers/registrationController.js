const Registration = require('../models/Registration');
const Course = require('../models/Course');
const xlsx = require('xlsx');
const axios = require('axios');
const mongoose = require('mongoose');
const { logAction } = require('../utils/logger');
const logAdminAction = require('../utils/logAdminAction');
const emailService = require('../utils/emailService');
const { appendToSheet } = require("../googleSheets");

// Lightweight regex escape utility
const escapeStringRegexp = (string) => {
  return string.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
};

// GET /api/registrations
exports.getAll = async (req, res) => {
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

    const total = await Registration.countDocuments(query);
    const registrations = await Registration.find(query)
      .populate('courseId', 'name')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({
      success: true,
      data: {
        registrations,
        total,
        pages: Math.ceil(total / Number(limit)),
        currentPage: Number(page)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/registrations/:id
exports.getById = async (req, res) => {
  try {
    const reg = await Registration.findById(req.params.id).populate('courseId', 'name');
    if (!reg) return res.status(404).json({ success: false, message: 'Registration not found' });
    res.json({ success: true, data: reg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
  const normPhone = phone?.replace(/\D/g, '') || '';
  const normEmail = email?.trim()?.toLowerCase() || '';
  const normParent = parentName?.trim()?.toLowerCase() || '';
  const normChild = childName?.trim()?.toLowerCase() || '';

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

      // 5. STRICT Duplicate Validation
      if (!ignoreDuplicate) {
        // CASE 1: Full Match
        const existingFullMatch = await Registration.findOne({
          courseId,
          phone: normPhone,
          ...(normEmail && { email: normEmail }),
          parentName: normParent,
          childName: normChild
        }).session(session);

        if (existingFullMatch) {
          throw { statusCode: 409, message: 'Student already exists in this course', type: 'DUPLICATE_FULL' };
        }

        // CASE 2 & 3: Check email/phone and parent count
        const contactMatches = await Registration.find({
          courseId,
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

  // Success response
  res.status(201).json({ success: true, data: reg, message: 'Registration created successfully' });
};

// PUT /api/registrations/:id
exports.update = async (req, res) => {
  // ✅ FIX: Thay findByIdAndUpdate truyền thẳng req.body bằng logic Whitelist (Chống Mass Assignment)
  const ALLOWED = ['childName', 'parentName', 'phone', 'email', 'note', 'message', 'childAge', 'status'];
  const updateData = {};
  for (const field of ALLOWED) {
    if (req.body[field] !== undefined) updateData[field] = req.body[field];
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
    res.json({ success: true, data: reg, message: 'Registration updated successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE /api/registrations/:id
exports.remove = async (req, res) => {
  try {
    const reg = await Registration.findByIdAndDelete(req.params.id);
    if (!reg) return res.status(404).json({ success: false, message: 'Registration not found' });
    res.json({ success: true, message: 'Registration deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/courses/:id/students
exports.getStudentsByCourse = async (req, res) => {
  try {
    const students = await Registration.find({
      courseId: req.params.id,
      status: 'registered'
    })
    .populate('courseId', 'name')
    .select('childName childAge parentName phone email isActive courseId')
    .sort({ createdAt: -1 })
    .lean();

    res.json({ success: true, data: students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/students/:id/remove
exports.removeStudent = async (req, res) => {
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
    res.json({ success: true, message: 'Đã cho học sinh nghỉ' });
  } catch (error) {
    try { await session.abortTransaction(); } catch (_) { /* already aborted */ }
    res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

// GET /api/registrations/export-excel
exports.exportExcel = async (req, res) => {
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

    // Create a new workbook and add Registrations sheet
    const workbook = xlsx.utils.book_new();
    const regSheet = xlsx.utils.json_to_sheet(regData);

    // Style Header Row (Blue background, white text, bold, center) and auto-adjust widths
    const wscols = [
      { wch: 20 }, // Time
      { wch: 20 }, // Parent Name
      { wch: 15 }, // Phone
      { wch: 20 }, // Child Name
      { wch: 10 }, // Child Age
      { wch: 25 }, // Course
      { wch: 25 }, // Email
      { wch: 30 }, // Message
      { wch: 15 }  // Status
    ];
    regSheet['!cols'] = wscols;

    xlsx.utils.book_append_sheet(workbook, regSheet, 'Registrations');

    // Create Statistics sheet
    const courseStats = {};
    registrations.forEach(reg => {
      const cName = reg.courseId?.name || 'Unknown';
      courseStats[cName] = (courseStats[cName] || 0) + 1;
    });

    const statsData = Object.keys(courseStats).map(course => ({
      'Course': course,
      'Registrations': courseStats[course]
    }));

    const statsSheet = xlsx.utils.json_to_sheet(statsData);
    statsSheet['!cols'] = [{ wch: 25 }, { wch: 15 }];
    xlsx.utils.book_append_sheet(workbook, statsSheet, 'Statistics');

    // 6. Generate Excel buffer
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // 7. Send file with correct headers
    res.status(200);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="registrations.xlsx"');
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
