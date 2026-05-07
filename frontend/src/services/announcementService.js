import api from './api';

/**
 * Announcement Service
 * Sử dụng Axios instance đã cấu hình sẵn JWT interceptors (giống attendanceService.js)
 */

// ─── Public / shared ─────────────────────────────────────────────────────────

// Lấy tất cả thông báo đã published (public, dùng cho homepage)
export const getAllAnnouncements = () => {
  return api.get('/announcements');
};

// Admin: lấy tất cả thông báo mọi trạng thái (published + pending + rejected)
export const getAdminAllAnnouncements = () => {
  return api.get('/announcements/admin-all');
};

// Bell icon polling: latest published + newCount + pendingCount
export const getLatestAnnouncement = () => {
  return api.get('/announcements/latest');
};

// Reset isUnread khi admin/staff mở dropdown bell
export const markAnnouncementsSeen = () => {
  return api.patch('/announcements/mark-seen');
};

// ─── Marketing ───────────────────────────────────────────────────────────────

/**
 * MKT gửi thông báo chờ admin duyệt.
 * @param {FormData} formData — phải chứa: title, description, image (File)
 */
export const submitAnnouncement = (formData) => {
  return api.post('/announcements/submit', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

// Lịch sử submission của MKT (pending, published, rejected)
export const getMySubmissions = () => {
  return api.get('/announcements/my');
};

// ─── Admin ────────────────────────────────────────────────────────────────────

// Danh sách thông báo đang chờ duyệt
export const getPendingAnnouncements = () => {
  return api.get('/announcements/pending');
};

/**
 * Admin duyệt hoặc từ chối.
 * @param {string} id          — _id của Announcement
 * @param {'approve'|'reject'} action
 * @param {string} [reviewNote] — bắt buộc khi reject, tuỳ chọn khi approve
 */
export const reviewAnnouncement = (id, action, reviewNote = '') => {
  return api.patch(`/announcements/${id}/review`, { action, reviewNote });
};

// Admin tạo thông báo trực tiếp (published ngay)
export const createAnnouncement = (formData) => {
  return api.post('/announcements', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

// Admin cập nhật thông báo
export const updateAnnouncement = (id, formData) => {
  return api.put(`/announcements/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

// Admin xoá thông báo
export const deleteAnnouncement = (id) => {
  return api.delete(`/announcements/${id}`);
};