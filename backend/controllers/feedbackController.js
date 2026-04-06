const Feedback = require('../models/Feedback');
const mongoose = require('mongoose');
const { logAction } = require('../utils/logger');
const logAdminAction = require('../utils/logAdminAction');

// GET /api/feedback
exports.getAll = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 });
    res.json({ success: true, data: feedbacks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/feedback/:id
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }
    const fb = await Feedback.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!fb) return res.status(404).json({ success: false, message: 'Feedback not found' });
    res.json({ success: true, data: fb });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/feedback
exports.create = async (req, res) => {
  try {
    const { parentName, childName, childAge, rating, text } = req.body;

    // Manual validation
    if (parentName?.length > 32) return res.status(400).json({ success: false, message: 'Parent name max 32 characters' });
    if (childName?.length > 32) return res.status(400).json({ success: false, message: 'Child name max 32 characters' });
    if (childAge < 4 || childAge > 16) return res.status(400).json({ success: false, message: 'Child age must be between 4 and 16' });
    if (text?.length > 200) return res.status(400).json({ success: false, message: 'Feedback text max 200 characters' });

    const data = { parentName, childName, childAge, rating, text };

    if (req.file) {
      data.photo = req.file.filename;
    }
    const fb = await Feedback.create(data);
    await logAction(req, 'CREATE_FEEDBACK', { feedbackId: fb._id, parentName: fb.parentName });
    res.status(201).json({ success: true, data: fb, message: 'Feedback created successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PUT /api/feedback/:id
exports.update = async (req, res) => {
  try {
    const { parentName, childName, childAge, rating, text } = req.body;

    // Manual validation
    if (parentName?.length > 32) return res.status(400).json({ success: false, message: 'Parent name max 32 characters' });
    if (childName?.length > 32) return res.status(400).json({ success: false, message: 'Child name max 32 characters' });
    if (childAge < 4 || childAge > 16) return res.status(400).json({ success: false, message: 'Child age must be between 4 and 16' });
    if (text?.length > 200) return res.status(400).json({ success: false, message: 'Feedback text max 200 characters' });

    const data = { parentName, childName, childAge, rating, text };
    if (req.file) {
      data.photo = req.file.filename;
    }
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }
    const fb = await Feedback.findOneAndUpdate({ _id: id, isDeleted: { $ne: true } }, data, { new: true });
    if (!fb) return res.status(404).json({ message: 'Feedback not found' });
    await logAdminAction({
      adminId: req.admin.id,
      adminName: req.admin.username,
      action: 'UPDATE_FEEDBACK',
      targetType: 'feedback',
      targetId: fb._id,
      description: `Updated feedback for: ${fb.parentName}`,
      req
    });
    res.json({ success: true, data: fb, message: 'Feedback updated successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE /api/feedback/:id
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }
    const fb = await Feedback.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );
    if (!fb) return res.status(404).json({ message: 'Feedback not found' });
    await logAdminAction({
      adminId: req.admin.id,
      adminName: req.admin.username,
      action: 'DELETE_FEEDBACK',
      targetType: 'feedback',
      targetId: fb._id,
      description: `Deleted feedback for: ${fb.parentName}`,
      req
    });
    res.json({ success: true, message: 'Feedback deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
