const Teacher = require('../models/Teacher');
const mongoose = require('mongoose');
const { logAction } = require('../utils/logger');
const logAdminAction = require('../utils/logAdminAction');

// GET /api/teachers
exports.getAll = async (req, res) => {
  try {
    const teachers = await Teacher.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 });
    res.json({ success: true, data: teachers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/teachers/:id
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }
    const teacher = await Teacher.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
    res.status(200).json({ success: true, data: teacher });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/teachers
exports.create = async (req, res) => {
  try {
    const { name, specialization, experience, description } = req.body;
    
    // Validation
    if (name?.length > 40) return res.status(400).json({ success: false, message: 'Teacher name max 40 characters' });
    if (specialization?.length > 100) return res.status(400).json({ success: false, message: 'Specialization max 100 characters' });
    const exp = parseInt(experience);
    if (isNaN(exp) || exp < 1 || exp > 40) return res.status(400).json({ success: false, message: 'Experience must be 1-40 years' });
    if (description?.length > 50) return res.status(400).json({ success: false, message: 'Short description max 50 characters' });

    const data = { name, specialization, experience: exp, description };

    if (req.file) {
      data.avatar = req.file.filename;
    }
    const teacher = await Teacher.create(data);
    await logAdminAction({
      adminId: req.admin.id,
      adminName: req.admin.username,
      action: 'CREATE_TEACHER',
      targetType: 'teacher',
      targetId: teacher._id,
      description: `Created teacher: ${teacher.name}`,
      req
    });
    res.status(201).json({ success: true, data: teacher, message: 'Teacher created successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PUT /api/teachers/:id
exports.update = async (req, res) => {
  try {
    const { name, specialization, experience, description } = req.body;

    // Validation
    if (name?.length > 40) return res.status(400).json({ success: false, message: 'Teacher name max 40 characters' });
    if (specialization?.length > 100) return res.status(400).json({ success: false, message: 'Specialization max 100 characters' });
    const exp = parseInt(experience);
    if (isNaN(exp) || exp < 1 || exp > 40) return res.status(400).json({ success: false, message: 'Experience must be 1-40 years' });
    if (description?.length > 50) return res.status(400).json({ success: false, message: 'Short description max 50 characters' });

    const data = { name, specialization, experience: exp, description };

    if (req.file) {
      data.avatar = req.file.filename;
    }
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }
    const teacher = await Teacher.findOneAndUpdate({ _id: id, isDeleted: { $ne: true } }, data, { new: true });
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
    await logAdminAction({
      adminId: req.admin.id,
      adminName: req.admin.username,
      action: 'UPDATE_TEACHER',
      targetType: 'teacher',
      targetId: teacher._id,
      description: `Updated teacher: ${teacher.name}`,
      req
    });
    res.json({ success: true, data: teacher, message: 'Teacher updated successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE /api/teachers/:id
exports.remove = async (req, res) => {
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
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
    await logAdminAction({
      adminId: req.admin.id,
      adminName: req.admin.username,
      action: 'DELETE_TEACHER',
      targetType: 'teacher',
      targetId: teacher._id,
      description: `Deleted teacher: ${teacher.name}`,
      req
    });
    res.json({ success: true, message: 'Teacher deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
