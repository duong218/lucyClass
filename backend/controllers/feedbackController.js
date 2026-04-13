const Feedback = require('../models/Feedback');
const mongoose = require('mongoose');
const { logAction } = require('../utils/logger');
const logAdminAction = require('../utils/logAdminAction');
const { uploadImageBuffer, deleteImageFromCloudinary } = require('../utils/cloudinary');
const { cleanInput } = require('../utils/sanitize');

// GET /api/feedback
exports.getAll = async (req, res, next) => {
  try {
    const feedbacks = await Feedback.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 });
    return res.json({ success: true, data: feedbacks });
  } catch (error) {
    next(error);
  }
};

// GET /api/feedback/:id
exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }
    const fb = await Feedback.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!fb) return res.status(404).json({ success: false, message: 'Feedback not found' });
    return res.json({ success: true, data: fb });
  } catch (error) {
    next(error);
  }
};

// POST /api/feedback
exports.create = async (req, res) => {
  let uploadResult = null;
  try {
    const { parentName, childName, childAge, rating, text } = req.body;

    // Validation
    if (parentName?.length > 32) return res.status(400).json({ success: false, message: 'Parent name max 32 characters' });
    if (childName?.length > 32) return res.status(400).json({ success: false, message: 'Child name max 32 characters' });
    if (childAge !== undefined && (childAge < 4 || childAge > 16)) return res.status(400).json({ success: false, message: 'Child age must be between 4 and 16' });
    if (text?.length > 200) return res.status(400).json({ success: false, message: 'Feedback text max 200 characters' });

    const data = { 
      parentName: cleanInput(parentName), 
      childName: cleanInput(childName), 
      childAge, 
      rating, 
      text: cleanInput(text) 
    };

    if (req.file && req.file.buffer) {
      try {
        uploadResult = await uploadImageBuffer(req.file.buffer);
      } catch (err) {
        return res.status(500).json({ success: false, message: 'Image upload failed' });
      }
      data.photo = uploadResult.secure_url;
      data.photoPublicId = uploadResult.public_id;
    }

    const fb = await Feedback.create(data);
    await logAction(req, 'CREATE_FEEDBACK', { feedbackId: fb._id, parentName: fb.parentName });
    return res.status(201).json({ success: true, data: fb, message: 'Feedback created successfully' });
  } catch (error) {
    if (uploadResult?.public_id) {
      try { await deleteImageFromCloudinary(uploadResult.public_id); } catch (_) {}
    }
    const isValidationError = error?.name === 'ValidationError' || error?.name === 'CastError';
    if (isValidationError) {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: 'Failed to create feedback' });
  }
};

// PUT /api/feedback/:id
exports.update = async (req, res) => {
  let uploadResult = null;
  let dbUpdated = false;
  try {
    const { parentName, childName, childAge, rating, text } = req.body;

    // Validation
    if (parentName !== undefined && typeof parentName === 'string' && parentName.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Parent name cannot be empty' });
    }
    if (childName !== undefined && typeof childName === 'string' && childName.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Child name cannot be empty' });
    }
    if (text !== undefined && typeof text === 'string' && text.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Feedback text cannot be empty' });
    }
    if (parentName !== undefined && parentName?.length > 32) return res.status(400).json({ success: false, message: 'Parent name max 32 characters' });
    if (childName !== undefined && childName?.length > 32) return res.status(400).json({ success: false, message: 'Child name max 32 characters' });
    if (childAge !== undefined && (childAge < 4 || childAge > 16)) return res.status(400).json({ success: false, message: 'Child age must be between 4 and 16' });
    if (text !== undefined && text?.length > 200) return res.status(400).json({ success: false, message: 'Feedback text max 200 characters' });

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }

    const existing = await Feedback.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!existing) return res.status(404).json({ success: false, message: 'Feedback not found' });

    const data = {};
    if (parentName !== undefined) data.parentName = cleanInput(parentName);
    if (childName !== undefined) data.childName = cleanInput(childName);
    if (childAge !== undefined) data.childAge = childAge;
    if (rating !== undefined) data.rating = rating;
    if (text !== undefined) data.text = cleanInput(text);

    if (req.file && req.file.buffer) {
      try {
        uploadResult = await uploadImageBuffer(req.file.buffer);
      } catch (err) {
        return res.status(500).json({ success: false, message: 'Image upload failed' });
      }
      data.photo = uploadResult.secure_url;
      data.photoPublicId = uploadResult.public_id;
    }

    let fb;
    try {
      fb = await Feedback.findByIdAndUpdate(id, data, { new: true, runValidators: true });
      dbUpdated = true;
    } catch (dbError) {
      if (uploadResult?.public_id) {
        try { await deleteImageFromCloudinary(uploadResult.public_id); } catch (_) {}
      }
      throw dbError;
    }

    // Delete old image ONLY after DB update succeeds
    if (uploadResult && existing.photoPublicId) {
      try { await deleteImageFromCloudinary(existing.photoPublicId); } catch (_) {}
    }

    try {
      await logAdminAction({
        adminId: req.admin?.id || null,
        adminName: req.admin?.username || 'system',
        action: 'UPDATE_FEEDBACK',
        targetType: 'feedback',
        targetId: fb._id,
        description: `Updated feedback for: ${fb.parentName}`,
        req
      });
    } catch (_) {}
    return res.json({ success: true, data: fb, message: 'Feedback updated successfully' });
  } catch (error) {
    if (!dbUpdated && uploadResult?.public_id) {
      try { await deleteImageFromCloudinary(uploadResult.public_id); } catch (_) {}
    }
    const isValidationError = error?.name === 'ValidationError' || error?.name === 'CastError';
    if (isValidationError) {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: 'Failed to update feedback' });
  }
};

// DELETE /api/feedback/:id
exports.remove = async (req, res, next) => {
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
    if (!fb) return res.status(404).json({ success: false, message: 'Feedback not found' });

    // Delete image from Cloudinary after soft-delete
    if (fb.photoPublicId) {
      try { await deleteImageFromCloudinary(fb.photoPublicId); } catch (_) {}
    }

    await logAdminAction({
      adminId: req.admin?.id || null,
      adminName: req.admin?.username || 'system',
      action: 'DELETE_FEEDBACK',
      targetType: 'feedback',
      targetId: fb._id,
      description: `Deleted feedback for: ${fb.parentName}`,
      req
    });
    return res.json({ success: true, message: 'Feedback deleted successfully' });
  } catch (error) {
    next(error);
  }
};