const Teacher = require('../models/Teacher');
const StaffAccount = require('../models/StaffAccount');
const mongoose = require('mongoose');
const logAdminAction = require('../utils/logAdminAction');
const { uploadImageBuffer, deleteImageFromCloudinary } = require('../utils/cloudinary');
const { cleanInput } = require('../utils/sanitize');
const { clearCache } = require('../middlewares/cacheMiddleware');

// Các field nội bộ không được trả về public API
const EXCLUDED_FIELDS = '-staffAccountId -avatarPublicId -isDeleted -deletedAt';

function pickTeacherInput(body) {
  if (!body || typeof body !== 'object') return {};
  return {
    name: body.name,
    specialization: body.specialization,
    experience: body.experience,
    description: body.description,
    feedback: body.feedback,
    rating: body.rating
  };
}

function trimStr(v) {
  return typeof v === 'string' ? v.trim() : v;
}

function parseRatingOrDefault(raw, fallback = 5) {
  if (raw === undefined || raw === null || (typeof raw === 'string' && raw.trim() === '')) {
    return fallback;
  }
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 5) return null;
  return n;
}

function parseRatingStrict(raw) {
  if (raw === undefined || raw === null || (typeof raw === 'string' && raw.trim() === '')) {
    return null;
  }
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 5) return null;
  return n;
}

// GET /api/teachers
exports.getAll = async (req, res, next) => {
  try {
    const teachers = await Teacher
      .find({ isDeleted: { $ne: true } })
      .select(EXCLUDED_FIELDS)
      .sort({ createdAt: -1 });
    return res.json({ success: true, data: teachers });
  } catch (error) {
    next(error);
  }
};

// GET /api/teachers/:id
exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }
    const teacher = await Teacher
      .findOne({ _id: id, isDeleted: { $ne: true } })
      .select(EXCLUDED_FIELDS);
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });
    return res.status(200).json({ success: true, data: teacher });
  } catch (error) {
    next(error);
  }
};

// POST /api/teachers
exports.create = async (req, res) => {
  let uploadResult = null;
  let createdStaff = null;
  try {
    const raw = pickTeacherInput(req.body);
    const name = trimStr(raw.name);
    const specialization = trimStr(raw.specialization);
    const experienceNum = Number(raw.experience);
    const descriptionRaw = trimStr(raw.description ?? '');
    const feedbackRaw = trimStr(raw.feedback ?? '');

    if (name.length > 40) return res.status(400).json({ success: false, message: 'Teacher name max 40 characters' });
    if (specialization.length > 100) return res.status(400).json({ success: false, message: 'Specialization max 100 characters' });
    if (!Number.isInteger(experienceNum) || experienceNum < 1 || experienceNum > 40) {
      return res.status(400).json({ success: false, message: 'Experience must be 1-40 years' });
    }
    if (descriptionRaw.length > 50) return res.status(400).json({ success: false, message: 'Short description max 50 characters' });
    if (feedbackRaw.length > 500) return res.status(400).json({ success: false, message: 'Feedback max 500 characters' });

    const ratingVal = parseRatingOrDefault(raw.rating, 5);
    if (ratingVal === null) return res.status(400).json({ success: false, message: 'Rating must be integer 1-5' });

    const data = {
      name: cleanInput(name),
      specialization: cleanInput(specialization),
      experience: experienceNum,
      description: cleanInput(descriptionRaw),
      feedback: cleanInput(feedbackRaw),
      rating: ratingVal
    };

    if (req.file && req.file.buffer) {
      try {
        uploadResult = await uploadImageBuffer(req.file.buffer);
      } catch (err) {
        return res.status(500).json({ success: false, message: 'Image upload failed' });
      }
      data.avatar = uploadResult.secure_url;
      data.avatarPublicId = uploadResult.public_id;
    }

    // ── Tự động tạo StaffAccount cho giáo viên ──────────────────────────────
    const username = await StaffAccount.generateUniqueUsername();
    const plainPassword = StaffAccount.generateRandomPassword();
    createdStaff = await StaffAccount.create({
      username,
      password: plainPassword, // pre-save hook sẽ hash
      role: 'teacher',
      displayName: cleanInput(name), // dùng tên giáo viên luôn
      phone: '',
      email: '',
      courseIds: []
    });
    // ────────────────────────────────────────────────────────────────────────

    // Gắn staffAccountId vào teacher
    data.staffAccountId = createdStaff._id;

    const teacher = await Teacher.create(data);

    await Promise.all([
      clearCache('/api/teachers'),
      clearCache('/api/courses')
    ]);

    await logAdminAction({
      adminId: req.admin?.id || null,
      adminName: req.admin?.username || 'system',
      action: 'CREATE_TEACHER',
      targetType: 'teacher',
      targetId: teacher._id,
      description: `Created teacher: ${teacher.name} (auto-created staff account: ${username})`,
      req
    });

    // toJSON transform trên schema sẽ tự strip staffAccountId, avatarPublicId, ...
    return res.status(201).json({
      success: true,
      data: teacher.toJSON(),
      message: 'Teacher created successfully',
      // Trả về thông tin tài khoản để admin thông báo cho giáo viên — chỉ xuất hiện 1 lần
      staffAccount: {
        _id: createdStaff._id,
        username: createdStaff.username,
        initialPassword: plainPassword,
        role: createdStaff.role,
        displayName: createdStaff.displayName
      }
    });
  } catch (error) {
    // Rollback: xoá StaffAccount vừa tạo nếu Teacher.create() thất bại
    if (createdStaff?._id) {
      try { await StaffAccount.findByIdAndDelete(createdStaff._id); } catch (_) {}
    }
    // Rollback: xoá ảnh đã upload nếu có lỗi
    if (uploadResult?.public_id) {
      try { await deleteImageFromCloudinary(uploadResult.public_id); } catch (_) {}
    }
    const isValidationError = error?.name === 'ValidationError' || error?.name === 'CastError';
    if (isValidationError) {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: 'Failed to create teacher' });
  }
};

// PUT /api/teachers/:id
exports.update = async (req, res) => {
  let uploadResult = null;
  let dbUpdated = false;
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }

    const existing = await Teacher.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!existing) return res.status(404).json({ success: false, message: 'Teacher not found' });

    const body = req.body;
    const data = {};

    if (Object.prototype.hasOwnProperty.call(body, 'name')) {
      const name = trimStr(body.name);
      if (name.length === 0) return res.status(400).json({ success: false, message: 'Teacher name cannot be empty' });
      if (name.length > 40) return res.status(400).json({ success: false, message: 'Teacher name max 40 characters' });
      data.name = cleanInput(name);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'specialization')) {
      const specialization = trimStr(body.specialization);
      if (specialization.length === 0) return res.status(400).json({ success: false, message: 'Specialization cannot be empty' });
      if (specialization.length > 100) return res.status(400).json({ success: false, message: 'Specialization max 100 characters' });
      data.specialization = cleanInput(specialization);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'experience')) {
      const experienceNum = Number(body.experience);
      if (!Number.isInteger(experienceNum) || experienceNum < 1 || experienceNum > 40) {
        return res.status(400).json({ success: false, message: 'Experience must be 1-40 years' });
      }
      data.experience = experienceNum;
    }
    if (Object.prototype.hasOwnProperty.call(body, 'description')) {
      const descriptionRaw = trimStr(body.description ?? '');
      if (descriptionRaw.length === 0) return res.status(400).json({ success: false, message: 'Short description cannot be empty' });
      if (descriptionRaw.length > 50) return res.status(400).json({ success: false, message: 'Short description max 50 characters' });
      data.description = cleanInput(descriptionRaw);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'feedback')) {
      const feedbackRaw = trimStr(body.feedback ?? '');
      if (feedbackRaw.length > 500) return res.status(400).json({ success: false, message: 'Feedback max 500 characters' });
      data.feedback = cleanInput(feedbackRaw);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'rating')) {
      const ratingVal = parseRatingStrict(body.rating);
      if (ratingVal === null) {
        return res.status(400).json({ success: false, message: 'Rating must be integer 1-5' });
      }
      data.rating = ratingVal;
    }

    if (req.file && req.file.buffer) {
      try {
        uploadResult = await uploadImageBuffer(req.file.buffer);
      } catch (err) {
        return res.status(500).json({ success: false, message: 'Image upload failed' });
      }
      data.avatar = uploadResult.secure_url;
      data.avatarPublicId = uploadResult.public_id;
    }

    let teacher;
    try {
      teacher = await Teacher.findByIdAndUpdate(id, data, { new: true, runValidators: true });
      dbUpdated = true;
    } catch (dbError) {
      if (uploadResult?.public_id) {
        try { await deleteImageFromCloudinary(uploadResult.public_id); } catch (_) {}
      }
      throw dbError;
    }

    // Đồng bộ displayName sang StaffAccount nếu tên giáo viên thay đổi
    if (data.name && existing.staffAccountId) {
      try {
        await StaffAccount.findByIdAndUpdate(existing.staffAccountId, {
          displayName: data.name
        });
      } catch (_) {}
    }

    // Delete old image ONLY after DB update succeeds
    if (uploadResult && existing.avatarPublicId) {
      try { await deleteImageFromCloudinary(existing.avatarPublicId); } catch (_) {}
    }

    try {
      await logAdminAction({
        adminId: req.admin?.id || null,
        adminName: req.admin?.username || 'system',
        action: 'UPDATE_TEACHER',
        targetType: 'teacher',
        targetId: teacher._id,
        description: `Updated teacher: ${teacher.name}`,
        req
      });
    } catch (_) {}
    await Promise.all([
      clearCache('/api/teachers'),
      clearCache('/api/courses')
    ]);

    // toJSON transform trên schema sẽ tự strip staffAccountId, avatarPublicId, ...
    return res.json({ success: true, data: teacher.toJSON(), message: 'Teacher updated successfully' });
  } catch (error) {
    // Rollback newly uploaded image if DB update fails
    if (!dbUpdated && uploadResult?.public_id) {
      try { await deleteImageFromCloudinary(uploadResult.public_id); } catch (_) {}
    }
    const isValidationError = error?.name === 'ValidationError' || error?.name === 'CastError';
    if (isValidationError) {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: 'Failed to update teacher' });
  }
};

// DELETE /api/teachers/:id
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }
    const teacher = await Teacher.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });

    // Avatar Cloudinary sẽ được xóa bởi deepCleanService sau 6 tháng

    // Deactivate StaffAccount liên kết (soft-disable, không xoá hẳn để giữ audit trail)
    if (teacher.staffAccountId) {
      try {
        await StaffAccount.findByIdAndUpdate(teacher.staffAccountId, {
          isActive: false,
          refreshTokens: [],
          activeSessionId: undefined
        });
      } catch (_) {}
    }

    await Promise.all([
      clearCache('/api/teachers'),
      clearCache('/api/courses')
    ]);
    await logAdminAction({
      adminId: req.admin?.id || null,
      adminName: req.admin?.username || 'system',
      action: 'DELETE_TEACHER',
      targetType: 'teacher',
      targetId: teacher._id,
      description: `Deleted teacher: ${teacher.name}${teacher.staffAccountId ? ' (staff account deactivated)' : ''}`,
      req
    });
    return res.json({ success: true, message: 'Teacher deleted successfully' });
  } catch (error) {
    next(error);
  }
};