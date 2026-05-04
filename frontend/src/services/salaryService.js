import api from './api';

export const getSalaryConfig = () => api.get('/salary/config');

export const seedSalaryConfig = () => api.post('/salary/config/seed');

export const updateSalaryConfig = (id, amount) =>
  api.put(`/salary/config/${encodeURIComponent(id)}`, { amount });

export const getSalaryLogs = (limit = 50) =>
  api.get('/salary/config/logs', { params: { limit } });

export const getSalarySettings = () => api.get('/salary/settings');

export const updateSalarySettings = (body) => api.put('/salary/settings', body);

export const getSalaryReport = (params) => api.get('/salary/report', { params, timeout: 120000 });

export const runSalaryEngine = (date) => api.post('/salary/run-engine', { date }, { timeout: 120000 });

export const getBonuses = (params) => api.get('/salary/bonus', { params });

export const createBonus = (body) => api.post('/salary/bonus', body);

export const deleteBonus = (id) =>
  api.delete(`/salary/bonus/${encodeURIComponent(id)}`);

/** @param {{ from: string, to: string, teacherId?: string }} params */
export const exportSalaryExcel = (params) =>
  api.get('/salary/export', { params, responseType: 'blob', timeout: 120000 });

export const getCourseTeachers = (courseId) =>
  api.get(`/salary/course-teachers/${encodeURIComponent(courseId)}`);

export const getSessionTeachers = (cellId) =>
  api.get(`/salary/session-teachers/${encodeURIComponent(cellId)}`);

export const upsertSessionTeachers = (cellId, teachers) =>
  api.put(`/salary/session-teachers/${encodeURIComponent(cellId)}`, { teachers });

export const deleteSessionTeachers = (cellId) =>
  api.delete(`/salary/session-teachers/${encodeURIComponent(cellId)}`);

/** GV đã checkin nhưng không khớp ô TKB — dùng cho cảnh báo admin */
export const getUnmatchedCheckins = (date) =>
  api.get('/salary/unmatched-checkins', { params: { date } });
