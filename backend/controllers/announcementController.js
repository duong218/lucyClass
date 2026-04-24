const Announcement = require('../models/Announcement');
const mongoose = require('mongoose');
const { uploadImageBuffer, deleteImageFromCloudinary } = require('../utils/cloudinary');
const { cleanInput } = require('../utils/sanitize');
const { clearCache } = require('../middlewares/cacheMiddleware');

// ─── Helpers ────────────────────────────────────────────────────────────────
const sendSuccess = (res, data, message = 'Success', status = 200) =>
  res.status(status).json({ success: true, message, data });

const sendError = (res, message = 'Internal Server Error', error = null, status = 500) =>
  res.status(status).json({ success: false, message });

// ─── Giới hạn MKT: tối đa 5 bài / ngày ─────────────────────────────────────
const MKT_DAILY_LIMIT = 5;

// ============================================================================
// GET /api/announcements  — public (chỉ trả về status: published)
// ============================================================================
exports.getAll = async (req, res) => {
  try {
    const announcements = await Announcement.find({ status: 'published' })
      .sort({ createdAt: -1 })
      .lean();
    return sendSuccess(res, announcements);
  } catch (error) {
    return sendError(res, 'Failed to fetch announcements', error);
  }
};

// ============================================================================
// GET /api/announcements/latest  — bell icon polling (admin/staff)
// Trả về thông báo published mới nhất + số unread
// ============================================================================
exports.getLatest = async (req, res) => {
  try {
    const latest = await Announcement.findOne({ status: 'published' })
      .sort({ createdAt: -1 })
      .lean();

    const newCount = await Announcement.countDocuments({
      status: 'published',
      isUnread: true
    });

    // Đếm pending để admin biết cần duyệt
    const pendingCount = await Announcement.countDocuments({ status: 'pending' });

    return sendSuccess(res, { latest, newCount, pendingCount });
  } catch (error) {
    return sendError(res, 'Failed to fetch latest announcement', error);
  }
};

// ============================================================================
// PATCH /api/announcements/mark-seen  — reset isUnread khi admin/staff mở bell
// ============================================================================
exports.markSeen = async (req, res) => {
  try {
    await Announcement.updateMany(
      { status: 'published', isUnread: true },
      { $set: { isUnread: false } }
    );
    return sendSuccess(res, null, 'Marked all as seen');
  } catch (error) {
    return sendError(res, 'Failed to mark as seen', error);
  }
};

// ============================================================================
// GET /api/announcements/pending  — Admin: danh sách chờ duyệt
// ============================================================================
exports.getPending = async (req, res) => {
  try {
    const pending = await Announcement.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .populate('submittedBy', 'username displayName role')
      .lean();
    return sendSuccess(res, pending);
  } catch (error) {
    return sendError(res, 'Failed to fetch pending announcements', error);
  }
};

// ============================================================================
// GET /api/announcements/my  — MKT: xem lịch sử submission của mình
// ============================================================================
exports.getMySubmissions = async (req, res) => {
  try {
    const staffId = req.user?._id || req.user?.id;
    const submissions = await Announcement.find({ submittedBy: staffId })
      .sort({ createdAt: -1 })
      .populate('reviewedBy', 'username displayName')
      .lean();
    return sendSuccess(res, submissions);
  } catch (error) {
    return sendError(res, 'Failed to fetch your submissions', error);
  }
};

// ============================================================================
// POST /api/announcements/submit  — MKT gửi bài chờ admin duyệt
// ============================================================================
exports.submitByMkt = async (req, res) => {
  let uploadResult = null;
  try {
    const { title, description } = req.body;
    const staffId = req.user?._id || req.user?.id;

    // ── Validate input ──────────────────────────────────────────────────────
    if (!title || title.trim().length === 0) {
      return sendError(res, 'Tiêu đề không được để trống', null, 400);
    }
    if (title.trim().length > 1000) {
      return sendError(res, 'Tiêu đề tối đa 1000 ký tự', null, 400);
    }
    if (!description || description.trim().length === 0) {
      return sendError(res, 'Nội dung không được để trống', null, 400);
    }
    if (description.trim().length > 7000) {
      return sendError(res, 'Nội dung tối đa 7000 ký tự', null, 400);
    }
    if (!req.file || !req.file.buffer) {
      return sendError(res, 'Ảnh là bắt buộc khi đăng thông báo', null, 400);
    }

    // ── Kiểm tra giới hạn 5 bài/ngày ────────────────────────────────────────
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayCount = await Announcement.countDocuments({
      submittedBy: staffId,
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    if (todayCount >= MKT_DAILY_LIMIT) {
      return sendError(
        res,
        `Bạn đã gửi ${MKT_DAILY_LIMIT} thông báo hôm nay. Vui lòng thử lại vào ngày mai.`,
        null,
        429
      );
    }

    // ── Upload ảnh ───────────────────────────────────────────────────────────
    try {
      uploadResult = await uploadImageBuffer(req.file.buffer);
    } catch (err) {
      return sendError(res, 'Upload ảnh thất bại', err, 500);
    }

    const announcement = await Announcement.create({
      title: cleanInput(title),
      description: cleanInput(description),
      image: uploadResult.secure_url,
      imagePublicId: uploadResult.public_id,
      status: 'pending',       // chờ admin duyệt
      isUnread: false,          // chưa publish → không tính badge
      submittedBy: staffId
    });

    return sendSuccess(res, announcement, 'Thông báo đã được gửi, chờ admin duyệt', 201);
  } catch (error) {
    if (uploadResult?.public_id) {
      try { await deleteImageFromCloudinary(uploadResult.public_id); } catch (_) {}
    }
    return sendError(res, 'Gửi thông báo thất bại', error);
  }
};

// ============================================================================
// PATCH /api/announcements/:id/review  — Admin duyệt hoặc từ chối
// Body: { action: 'approve' | 'reject', reviewNote?: string }
// ============================================================================
exports.reviewAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 'ID không hợp lệ', null, 400);
    }

    const { action, reviewNote = '' } = req.body;
    if (!['approve', 'reject'].includes(action)) {
      return sendError(res, 'action phải là "approve" hoặc "reject"', null, 400);
    }

    const announcement = await Announcement.findById(id);
    if (!announcement) return sendError(res, 'Không tìm thấy thông báo', null, 404);
    if (announcement.status !== 'pending') {
      return sendError(res, 'Thông báo này không ở trạng thái chờ duyệt', null, 400);
    }

    const adminId = req.user?._id || req.user?.id;

    if (action === 'approve') {
      announcement.status = 'published';
      announcement.isUnread = true;   // hiện badge bell sau khi publish
    } else {
      announcement.status = 'rejected';
      announcement.isUnread = false;
    }

    announcement.reviewNote = cleanInput(reviewNote);
    announcement.reviewedBy = adminId;
    announcement.reviewedAt = new Date();

    await announcement.save();
    await clearCache('/api/announcements');

    const message = action === 'approve'
      ? 'Thông báo đã được duyệt và công khai'
      : 'Thông báo đã bị từ chối';

    return sendSuccess(res, announcement, message);
  } catch (error) {
    return sendError(res, 'Xử lý duyệt thông báo thất bại', error);
  }
};

// ============================================================================
// POST /api/announcements  — Admin tạo trực tiếp (vẫn giữ nguyên)
// ============================================================================
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
      isUnread: true,
      status: 'published'
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
    if (uploadResult?.public_id) {
      try { await deleteImageFromCloudinary(uploadResult.public_id); } catch (_) {}
    }
    return sendError(res, 'Failed to create announcement', error);
  }
};

// ============================================================================
// PUT /api/announcements/:id  — Admin cập nhật
// ============================================================================
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid ID format', null, 400);
    }
    const announcement = await Announcement.findById(id);
    if (!announcement) return sendError(res, 'Announcement not found', null, 404);

    const { title, description } = req.body;
    const updateData = {};

    if (title !== undefined && title.trim().length === 0)
      return sendError(res, 'Title cannot be empty', null, 400);
    if (description !== undefined && description.trim().length === 0)
      return sendError(res, 'Description cannot be empty', null, 400);
    if (title !== undefined && title.trim().length > 1000)
      return sendError(res, 'Tiêu đề tối đa 1000 ký tự', null, 400);
    if (description !== undefined && description.trim().length > 7000)
      return sendError(res, 'Description must be under 7000 characters', null, 400);

    if (title !== undefined) updateData.title = cleanInput(title);
    if (description !== undefined) updateData.description = cleanInput(description);

    let uploadResult = null;
    if (req.file && req.file.buffer) {
      try { uploadResult = await uploadImageBuffer(req.file.buffer); }
      catch (err) { return sendError(res, 'Image upload failed', err, 500); }
      updateData.image = uploadResult.secure_url;
      updateData.imagePublicId = uploadResult.public_id;
    }

    try {
      const updated = await Announcement.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );
      if (uploadResult && announcement.imagePublicId) {
        try { await deleteImageFromCloudinary(announcement.imagePublicId); } catch (_) {}
      }
      await clearCache('/api/announcements');
      return sendSuccess(res, updated, 'Announcement updated successfully');
    } catch (dbError) {
      if (uploadResult?.public_id) {
        try { await deleteImageFromCloudinary(uploadResult.public_id); } catch (_) {}
      }
      return sendError(res, 'Failed to update announcement', dbError);
    }
  } catch (error) {
    return sendError(res, 'Failed to update announcement', error);
  }
};

// ============================================================================
// DELETE /api/announcements/:id
// ============================================================================
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