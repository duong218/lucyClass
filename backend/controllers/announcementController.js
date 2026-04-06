const Announcement = require('../models/Announcement');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

/**
 * Standard Success Response
 */
const sendSuccess = (res, data, message = 'Success', status = 200) => {
  res.status(status).json({
    success: true,
    message,
    data
  });
};

/**
 * Standard Error Response
 */
const sendError = (res, message = 'Internal Server Error', error = null, status = 500) => {
  res.status(status).json({
    success: false,
    message,
    error: error?.message || error || null
  });
};

// Helper to delete image file safely
const deleteImage = (imagePath) => {
  if (!imagePath) return;
  // Prevent path traversal by only taking the filename
  const filename = path.basename(imagePath);
  if (filename && !imagePath.startsWith('http')) {
    const U_PATH = process.env.UPLOAD_PATH;
    if (!U_PATH) {
      console.error('[AnnouncementController] UPLOAD_PATH not defined');
      return;
    }
    const uploadDir = path.resolve(U_PATH);
    const fullPath = path.join(uploadDir, filename);

    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
      } catch (err) {
        console.error('[AnnouncementController] Failed to delete image:', err.message);
      }
    }
  }
};

// GET /api/announcements
exports.getAll = async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 }).lean();
    sendSuccess(res, announcements);
  } catch (error) {
    sendError(res, 'Failed to fetch announcements', error);
  }
};

// POST /api/announcements
exports.create = async (req, res) => {
  try {
    const { title, description } = req.body;

    // Modern Moderate Validation
    if (!title || title.trim().length > 100) {
      if (req.file) deleteImage(req.file.filename);
      return sendError(res, 'Tiêu đề không được để trống và tối đa 100 ký tự', null, 400);
    }

    if (!description || description.trim().length > 700) {
      if (req.file) deleteImage(req.file.filename);
      return sendError(res, 'Description is required and must be under 700 characters', null, 400);
    }

    // Standardize image path: Store ONLY filename
    const announcementData = {
      title: title.trim(),
      description: description.trim(),
      image: req.file ? req.file.filename : req.body.image
    };

    if (!announcementData.image) {
      return sendError(res, 'Image is required', null, 400);
    }

    const announcement = await Announcement.create(announcementData);
    sendSuccess(res, announcement, 'Announcement created successfully', 201);
  } catch (error) {
    if (req.file) deleteImage(req.file.filename);
    sendError(res, 'Failed to create announcement', error);
  }
};

// PUT /api/announcements/:id
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      if (req.file) deleteImage(req.file.filename);
      return sendError(res, 'Invalid ID format', null, 400);
    }
    const announcement = await Announcement.findById(id);
    if (!announcement) {
      if (req.file) deleteImage(req.file.filename);
      return sendError(res, 'Announcement not found', null, 404);
    }

    const { title, description } = req.body;
    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();

    // Modern Moderate Validation
    if (title && title.trim().length > 100) {
      if (req.file) deleteImage(req.file.filename);
      return sendError(res, 'Tiêu đề tối đa 100 ký tự', null, 400);
    }

    if (description && description.trim().length > 700) {
      if (req.file) deleteImage(req.file.filename);
      return sendError(res, 'Description must be under 700 characters', null, 400);
    }

    // Only update provided fields
    if (title) updateData.title = title.trim();
    if (description) updateData.description = description.trim();

    if (req.file) {
      // Clean up old local image
      deleteImage(announcement.image);
      updateData.image = req.file.filename;
    }

    const updatedAnnouncement = await Announcement.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    sendSuccess(res, updatedAnnouncement, 'Announcement updated successfully');
  } catch (error) {
    if (req.file) deleteImage(req.file.filename);
    sendError(res, 'Failed to update announcement', error);
  }
};

// DELETE /api/announcements/:id
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid ID format', null, 400);
    }
    const announcement = await Announcement.findById(id);
    if (!announcement) return sendError(res, 'Announcement not found', null, 404);

    deleteImage(announcement.image);
    await Announcement.findByIdAndDelete(id);

    sendSuccess(res, null, 'Announcement deleted successfully');
  } catch (error) {
    sendError(res, 'Failed to delete announcement', error);
  }
};
