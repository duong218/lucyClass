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

// Admin: xuất Excel chấm công theo khoảng ngày (giữ lại để backward compat)
export const exportAttendanceExcel = (from, to) => {
  return api.get('/attendance/export', {
    params: { from, to },
    responseType: 'blob'
  });
};

// Helper: tạo link tải blob và kích hoạt download
const _downloadBlob = (res, fallbackName) => {
  const blob = new Blob([res.data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const cd = res.headers?.['content-disposition'] || '';
  const match = cd.match(/filename\*?=(?:UTF-8'')?(.+)/i);
  link.download = match ? decodeURIComponent(match[1].replace(/"/g, '')) : fallbackName;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

// Admin: xuất Excel chấm công theo ngày đơn (2 sheet: theo nhân viên + theo ngày)
export const exportAttendanceByDate = async (date) => {
  const res = await api.get('/attendance/export', {
    params: { from: date, to: date },
    responseType: 'blob'
  });
  _downloadBlob(res, `cham_cong_${date}.xlsx`);
};

// Admin: xuất Excel chấm công theo tháng (2 sheet: theo nhân viên + theo ngày)
export const exportAttendanceByMonth = async (year, month) => {
  const res = await api.get('/attendance/export-month', {
    params: { year, month },
    responseType: 'blob'
  });
  const m = String(month).padStart(2, '0');
  _downloadBlob(res, `cham_cong_thang_${m}_${year}.xlsx`);
};