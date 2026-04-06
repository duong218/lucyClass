const Course = require('../models/Course');
const mongoose = require('mongoose');
const { logAction } = require('../utils/logger');
const logAdminAction = require('../utils/logAdminAction');

// GET /api/courses
exports.getAll = async (req, res) => {
  try {
    const Registration = require('../models/Registration');
    const courses = await Course.find({ isDeleted: { $ne: true } }).populate('teacher').sort({ createdAt: -1 });
    
    // Get active student counts for each course
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

    res.json({ success: true, data: enrichedCourses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/courses/:id
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }
    const course = await Course.findOne({ _id: id, isDeleted: { $ne: true } }).populate('teacher');
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/courses
exports.create = async (req, res) => {
  try {
    const { name, description, highlights, teacher, ageGroup, duration, classSize } = req.body;
    
    // Validation
    if (name?.length > 40) return res.status(400).json({ success: false, message: 'Course name max 40 characters' });
    const size = parseInt(classSize);
    if (isNaN(size) || size < 1 || size > 100) return res.status(400).json({ success: false, message: 'Class size must be between 1 and 100' });

    const data = { name, description, highlights, teacher, ageGroup, duration, classSize: size };

    console.log("[Create Course] data:", data);
    if (!data.teacher) data.teacher = null;
    if (data.highlights) {
      if (typeof data.highlights === 'string') {
        data.highlights = data.highlights.split(',').map(h => h.trim()).filter(h => h);
      } else if (Array.isArray(data.highlights)) {
        data.highlights = data.highlights.map(h => h.trim()).filter(h => h);
      }
      if (data.highlights.some(h => h.length > 40)) {
        return res.status(400).json({ success: false, message: 'Each highlight max 40 characters' });
      }
    }
    if (req.file) {
      data.image = req.file.filename;
    }
    const course = await Course.create(data);
    await logAdminAction({
      adminId: req.admin.id,
      adminName: req.admin.username,
      action: 'CREATE_COURSE',
      targetType: 'course',
      targetId: course._id,
      description: `Created course: ${course.name}`,
      req
    });
    res.status(201).json({ success: true, data: course, message: 'Course created successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PUT /api/courses/:id
exports.update = async (req, res) => {
  try {
    const { name, description, highlights, teacher, ageGroup, duration, classSize } = req.body;
    
    // Validation
    if (name?.length > 40) return res.status(400).json({ success: false, message: 'Course name max 40 characters' });
    const size = parseInt(classSize);
    if (isNaN(size) || size < 1 || size > 100) return res.status(400).json({ success: false, message: 'Class size must be between 1 and 100' });

    const data = { name, description, highlights, teacher, ageGroup, duration, classSize: size };
    console.log("[Update Course] data:", data);
    if (!data.teacher) data.teacher = null;
    if (data.highlights) {
      if (typeof data.highlights === 'string') {
        data.highlights = data.highlights.split(',').map(h => h.trim()).filter(h => h);
      } else if (Array.isArray(data.highlights)) {
        data.highlights = data.highlights.map(h => h.trim()).filter(h => h);
      }
      if (data.highlights.some(h => h.length > 40)) {
        return res.status(400).json({ success: false, message: 'Each highlight max 40 characters' });
      }
    }
    if (req.file) {
      data.image = req.file.filename;
    }
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }
    const course = await Course.findOneAndUpdate({ _id: id, isDeleted: { $ne: true } }, data, { new: true });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    await logAdminAction({
      adminId: req.admin.id,
      adminName: req.admin.username,
      action: 'UPDATE_COURSE',
      targetType: 'course',
      targetId: course._id,
      description: `Updated course: ${course.name}`,
      req
    });
    res.json({ success: true, data: course, message: 'Course updated successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE /api/courses/:id
exports.remove = async (req, res) => {
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
    if (!course) return res.status(404).json({ message: 'Course not found' });
    await logAdminAction({
      adminId: req.admin.id,
      adminName: req.admin.username,
      action: 'DELETE_COURSE',
      targetType: 'course',
      targetId: course._id,
      description: `Deleted course: ${course.name}`,
      req
    });
    res.json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
