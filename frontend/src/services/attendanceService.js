import api from './api';

/**
 * Staff Attendance Service
 * Sử dụng Axios instance đã cấu hình sẵn JWT interceptors
 */

// Toggle checkin ↔ checkout
export const toggleAttendance = () => {
  return api.post('/attendance/toggle');
};

// Lấy chấm công hôm nay
export const getTodayAttendance = () => {
  return api.get('/attendance/today');
};

// Lịch sử 30 ngày
export const getHistory = () => {
  return api.get('/attendance/history');
};

// Admin: xem theo ngày
export const getByDate = (date) => {
  return api.get(`/attendance/date/${date}`);
};

// Admin: chỉnh sửa thủ công
export const updateAttendance = (id, logs) => {
  const normalizedId =
    typeof id === 'string'
      ? id
      : id?._id || id?.$oid || String(id || '');

  return api.put(`/attendance/${encodeURIComponent(normalizedId)}`, { logs });
};

// Admin: tạo mới/chỉnh sửa theo staff + date
export const upsertAttendanceByDate = (payload) => {
  return api.post('/attendance/admin/upsert', payload);
};
