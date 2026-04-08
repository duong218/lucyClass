const Teacher = require('../models/Teacher');
const mongoose = require('mongoose');
const { logAction } = require('../utils/logger');
const logAdminAction = require('../utils/logAdminAction');
const { uploadImageBuffer, deleteImageFromCloudinary } = require('../utils/cloudinary');

// GET /api/teachers
exports.getAll = async (req, res, next) => {
  try {
    const teachers = await Teacher.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 });
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
    const teacher = await Teacher.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });
    return res.status(200).json({ success: true, data: teacher });
  } catch (error) {
    next(error);
  }
};

// POST /api/teachers
exports.create = async (req, res) => {
  let uploadResult = null;
  try {
    const { name, specialization, experience, description } = req.body;

    // Validation
    if (name?.length > 40) return res.status(400).json({ success: false, message: 'Teacher name max 40 characters' });
    if (specialization?.length > 100) return res.status(400).json({ success: false, message: 'Specialization max 100 characters' });
    const exp = parseInt(experience);
    if (isNaN(exp) || exp < 1 || exp > 40) return res.status(400).json({ success: false, message: 'Experience must be 1-40 years' });
    if (description?.length > 50) return res.status(400).json({ success: false, message: 'Short description max 50 characters' });

    const data = { name, specialization, experience: exp, description };

    if (req.file && req.file.buffer) {
      try {
        uploadResult = await uploadImageBuffer(req.file.buffer);
      } catch (err) {
        return res.status(500).json({ success: false, message: 'Image upload failed' });
      }
      data.avatar = uploadResult.secure_url;
      data.avatarPublicId = uploadResult.public_id;
    }

    const teacher = await Teacher.create(data);
    await logAdminAction({
      adminId: req.admin?.id || null,
      adminName: req.admin?.username || 'system',
      action: 'CREATE_TEACHER',
      targetType: 'teacher',
      targetId: teacher._id,
      description: `Created teacher: ${teacher.name}`,
      req
    });
    return res.status(201).json({ success: true, data: teacher, message: 'Teacher created successfully' });
  } catch (error) {
    // Rollback uploaded image if DB save fails
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
    const { name, specialization, experience, description } = req.body;

    // Validation
    if (name !== undefined && typeof name === 'string' && name.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Teacher name cannot be empty' });
    }
    if (specialization !== undefined && typeof specialization === 'string' && specialization.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Specialization cannot be empty' });
    }
    if (description !== undefined && typeof description === 'string' && description.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Short description cannot be empty' });
    }
    if (name !== undefined && name?.length > 40) return res.status(400).json({ success: false, message: 'Teacher name max 40 characters' });
    if (specialization !== undefined && specialization?.length > 100) return res.status(400).json({ success: false, message: 'Specialization max 100 characters' });
    let exp;
    if (experience !== undefined) {
      exp = parseInt(experience);
      if (isNaN(exp) || exp < 1 || exp > 40) return res.status(400).json({ success: false, message: 'Experience must be 1-40 years' });
    }
    if (description !== undefined && description?.length > 50) return res.status(400).json({ success: false, message: 'Short description max 50 characters' });

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }

    const existing = await Teacher.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!existing) return res.status(404).json({ success: false, message: 'Teacher not found' });

    const data = {};
    if (name !== undefined) data.name = name;
    if (specialization !== undefined) data.specialization = specialization;
    if (experience !== undefined) data.experience = exp;
    if (description !== undefined) data.description = description;

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
    return res.json({ success: true, data: teacher, message: 'Teacher updated successfully' });
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

    // Delete image from Cloudinary after soft-delete
    if (teacher.avatarPublicId) {
      try { await deleteImageFromCloudinary(teacher.avatarPublicId); } catch (_) {}
    }

    await logAdminAction({
      adminId: req.admin?.id || null,
      adminName: req.admin?.username || 'system',
      action: 'DELETE_TEACHER',
      targetType: 'teacher',
      targetId: teacher._id,
      description: `Deleted teacher: ${teacher.name}`,
      req
    });
    return res.json({ success: true, message: 'Teacher deleted successfully' });
  } catch (error) {
    next(error);
  }
};