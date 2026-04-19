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
    const courses = await Course.find({ isDeleted: { $ne: true } }).populate('teacher').sort({ createdAt: -1 });

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
    const course = await Course.findOne({ _id: id, isDeleted: { $ne: true } }).populate('teacher');
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    return res.json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
};

// Helper: parse & validate highlights
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

// POST /api/courses
exports.create = async (req, res) => {
  let uploadResult = null;
  try {
    const { name, description, highlights, teacher, ageGroup, duration, classSize } = req.body;

    // Validation
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

    if (req.file && req.file.buffer) {
      try {
        uploadResult = await uploadImageBuffer(req.file.buffer, "courses");
      } catch (err) {
        return res.status(500).json({ success: false, message: 'Image upload failed' });
      }
      data.image = uploadResult.secure_url;
      data.imagePublicId = uploadResult.public_id;
    }

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
    if (isValidationError) {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: 'Failed to create course' });
  }
};

// PUT /api/courses/:id
exports.update = async (req, res) => {
  let uploadResult = null;
  let dbUpdated = false;
  try {
    const { name, description, highlights, teacher, ageGroup, duration, classSize } = req.body;

    // Validation
    if (name !== undefined && typeof name === 'string' && name.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Course name cannot be empty' });
    }
    if (description !== undefined && typeof description === 'string' && description.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Description cannot be empty' });
    }
    if (ageGroup !== undefined && typeof ageGroup === 'string' && ageGroup.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Age group cannot be empty' });
    }
    if (duration !== undefined && typeof duration === 'string' && duration.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Duration cannot be empty' });
    }
    if (name !== undefined && name?.length > 40) return res.status(400).json({ success: false, message: 'Course name max 40 characters' });
    let size;
    if (classSize !== undefined) {
      size = parseInt(classSize);
      if (isNaN(size) || size < 1 || size > 100) return res.status(400).json({ success: false, message: 'Class size must be between 1 and 100' });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }

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

    if (req.file && req.file.buffer) {
      try {
        uploadResult = await uploadImageBuffer(req.file.buffer, "courses");
      } catch (err) {
        return res.status(500).json({ success: false, message: 'Image upload failed' });
      }
      data.image = uploadResult.secure_url;
      data.imagePublicId = uploadResult.public_id;
    }

    let course;
    try {
      course = await Course.findByIdAndUpdate(id, data, { new: true, runValidators: true });
      dbUpdated = true;
    } catch (dbError) {
      if (uploadResult?.public_id) {
        try { await deleteImageFromCloudinary(uploadResult.public_id); } catch (_) {}
      }
      throw dbError;
    }
    await clearCache('/api/courses');
    // Delete old image ONLY after DB update succeeds
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
    if (isValidationError) {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: 'Failed to update course' });
  }
};

// DELETE /api/courses/:id
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }
    const course = await Course.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    // Delete image from Cloudinary after soft-delete
    if (course.imagePublicId) {
      try { await deleteImageFromCloudinary(course.imagePublicId); } catch (_) {}
    }
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