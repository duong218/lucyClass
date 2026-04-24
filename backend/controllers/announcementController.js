const Announcement = require('../models/Announcement');
const mongoose = require('mongoose');
const { uploadImageBuffer, deleteImageFromCloudinary } = require('../utils/cloudinary');
const { cleanInput } = require('../utils/sanitize');
const { clearCache } = require('../middlewares/cacheMiddleware');

/**
 * Standard Success Response
 */
const sendSuccess = (res, data, message = 'Success', status = 200) => {
  return res.status(status).json({
    success: true,
    message,
    data
  });
};

/**
 * Standard Error Response
 */
const sendError = (res, message = 'Internal Server Error', error = null, status = 500) => {
  return res.status(status).json({
    success: false,
    message
  });
};

// GET /api/announcements
exports.getAll = async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 }).lean();
    return sendSuccess(res, announcements);
  } catch (error) {
    return sendError(res, 'Failed to fetch announcements', error);
  }
};

// ✅ NEW: GET /api/announcements/latest
// Trả về thông báo mới nhất + số lượng chưa xem — dùng cho bell icon polling
// Không cache để luôn fresh
exports.getLatest = async (req, res) => {
  try {
    const latest = await Announcement.findOne()
      .sort({ createdAt: -1 })
      .lean();

    const newCount = await Announcement.countDocuments({ isUnread: true });

    return sendSuccess(res, {
      latest,      // thông báo mới nhất để preview trong bell dropdown
      newCount     // số badge hiển thị trên icon
    });
  } catch (error) {
    return sendError(res, 'Failed to fetch latest announcement', error);
  }
};

// ✅ NEW: PATCH /api/announcements/mark-seen
// Gọi khi admin mở bell dropdown → reset isUnread về false
// Chỉ admin/staff mới được gọi (auth middleware ở route)
exports.markSeen = async (req, res) => {
  try {
    await Announcement.updateMany({ isUnread: true }, { $set: { isUnread: false } });
    return sendSuccess(res, null, 'Marked all as seen');
  } catch (error) {
    return sendError(res, 'Failed to mark as seen', error);
  }
};

// POST /api/announcements
exports.create = async (req, res) => {
  let uploadResult = null;
  try {
    const { title, description } = req.body;

    if (!title || title.trim().length > 1000) {
      return sendError(res, 'Tiêu đề không được để trống và tối đa 1000 ký tự', null, 400);
    }

    if (!description || description.trim().length > 7000) {
      return sendError(res, 'Description is required and must be under 7000 characters', null, 400);
    }

    if (req.file && req.file.buffer) {
      try {
        uploadResult = await uploadImageBuffer(req.file.buffer);
      } catch (err) {
        return sendError(res, 'Image upload failed', err, 500);
      }
    }

    const announcementData = {
      title: cleanInput(title),
      description: cleanInput(description),
      isUnread: true  // ✅ mỗi announcement mới luôn bật isUnread
    };

    if (uploadResult) {
      announcementData.image = uploadResult.secure_url;
      announcementData.imagePublicId = uploadResult.public_id;
    } else {
      return sendError(res, 'Image is required', null, 400);
    }

    const announcement = await Announcement.create(announcementData);
    await clearCache('/api/announcements');
    return sendSuccess(res, announcement, 'Announcement created successfully', 201);
  } catch (error) {
    if (uploadResult && uploadResult.public_id) {
      try { await deleteImageFromCloudinary(uploadResult.public_id); } catch (_) {}
    }
    return sendError(res, 'Failed to create announcement', error);
  }
};

// PUT /api/announcements/:id
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid ID format', null, 400);
    }
    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return sendError(res, 'Announcement not found', null, 404);
    }

    const { title, description } = req.body;
    const updateData = {};

    if (title !== undefined && title.trim().length === 0) {
      return sendError(res, 'Title cannot be empty', null, 400);
    }
    if (description !== undefined && description.trim().length === 0) {
      return sendError(res, 'Description cannot be empty', null, 400);
    }
    if (title !== undefined && title.trim().length > 1000) {
      return sendError(res, 'Tiêu đề tối đa 1000 ký tự', null, 400);
    }
    if (description !== undefined && description.trim().length > 7000) {
      return sendError(res, 'Description must be under 7000 characters', null, 400);
    }

    if (title !== undefined) updateData.title = cleanInput(title);
    if (description !== undefined) updateData.description = cleanInput(description);

    let uploadResult = null;
    if (req.file && req.file.buffer) {
      try {
        uploadResult = await uploadImageBuffer(req.file.buffer);
      } catch (err) {
        return sendError(res, 'Image upload failed', err, 500);
      }
      updateData.image = uploadResult.secure_url;
      updateData.imagePublicId = uploadResult.public_id;
    }

    try {
      const updatedAnnouncement = await Announcement.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (uploadResult && announcement.imagePublicId) {
        try { await deleteImageFromCloudinary(announcement.imagePublicId); } catch (_) {}
      }
      await clearCache('/api/announcements');
      return sendSuccess(res, updatedAnnouncement, 'Announcement updated successfully');
    } catch (dbError) {
      if (uploadResult && uploadResult.public_id) {
        try { await deleteImageFromCloudinary(uploadResult.public_id); } catch (_) {}
      }
      return sendError(res, 'Failed to update announcement', dbError);
    }
  } catch (error) {
    return sendError(res, 'Failed to update announcement', error);
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

    if (announcement.imagePublicId) {
      try { await deleteImageFromCloudinary(announcement.imagePublicId); } catch (_) {}
    }
    await Announcement.findByIdAndDelete(id);
    await clearCache('/api/announcements');
    return sendSuccess(res, null, 'Announcement deleted successfully');
  } catch (error) {
    return sendError(res, 'Failed to delete announcement', error);
  }
};
