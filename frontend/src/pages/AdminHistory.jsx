import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { formatDateTime } from '../utils/dateUtils';

const AdminHistory = () => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterAction, setFilterAction] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupStatus, setBackupStatus] = useState(null);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/history/stats');
      setStats(res.data.data || res.data);
    } catch (err) {
      console.error('Lỗi tải thống kê lịch sử:', err);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (filterAction) params.action = filterAction;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await api.get('/admin/history', { params });
      const data = res.data.data || res.data;
      setLogs(Array.isArray(data.logs) ? data.logs : []);
      setTotalPages(Number(data.pages) || 1);
    } catch (err) {
      console.error('Lỗi tải nhật ký hoạt động:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => { fetchLogs(); }, [page, filterAction, startDate, endDate]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('google') === 'success') {
      setBackupStatus({ type: 'success', message: 'Kết nối Google Drive thành công!' });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('google') === 'error') {
      setBackupStatus({ type: 'error', message: 'Kết nối Google Drive thất bại. Vui lòng thử lại.' });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleGoogleBackup = async () => {
    setBackupLoading(true);
    setBackupStatus(null);
    try {
      const res = await api.post('/auth/google/backup');
      if (res.data.success) {
        setBackupStatus({ type: 'success', message: `✅ Sao lưu thành công! Mã file: ${res.data.fileId}` });
      }
    } catch (err) {
      console.error('Sao lưu thất bại:', err);
      if (err.response?.status === 401) {
        try {
          const res = await api.get('/auth/google/auth');
          window.location.href = res.request.responseURL;
          return;
        } catch (e) {
          console.error('Chuyển hướng Google thất bại:', e);
        }
      }
      const errorMessage = err.response?.status === 401
        ? 'Vui lòng kết nối lại Google Drive'
        : (err.response?.data?.message || 'Sao lưu thất bại. Vui lòng thử lại.');
      setBackupStatus({ type: 'error', message: errorMessage });
    } finally {
      setBackupLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.post('/admin/history/export', {}, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'lich_su_hoat_dong.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Xuất file thất bại:', err);
      setBackupStatus({ type: 'error', message: 'Xuất file thất bại. Vui lòng thử lại.' });
    }
  };

  const getActionBadge = (action) => {
    if (action.includes('CREATE')) return 'bg-green-100 text-green-700 border-green-200';
    if (action.includes('UPDATE')) return 'bg-amber-100 text-amber-700 border-amber-200';
    if (action.includes('DELETE')) return 'bg-red-100 text-red-700 border-red-200';
    if (action.includes('LOGIN'))  return 'bg-blue-100 text-blue-700 border-blue-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const actionLabels = {
    CREATE: 'Tạo mới', UPDATE: 'Cập nhật', DELETE: 'Xoá', LOGIN: 'Đăng nhập'
  };

  const actions = [
    'LOGIN', 'LOGOUT',
    'CREATE_TEACHER', 'UPDATE_TEACHER', 'DELETE_TEACHER',
    'CREATE_COURSE', 'UPDATE_COURSE', 'DELETE_COURSE',
    'UPDATE_FEEDBACK', 'DELETE_FEEDBACK'
  ];

  const actionVi = {
    LOGIN: 'Đăng nhập', LOGOUT: 'Đăng xuất',
    CREATE_TEACHER: 'Thêm giáo viên', UPDATE_TEACHER: 'Sửa giáo viên', DELETE_TEACHER: 'Xoá giáo viên',
    CREATE_COURSE: 'Thêm khoá học', UPDATE_COURSE: 'Sửa khoá học', DELETE_COURSE: 'Xoá khoá học',
    UPDATE_FEEDBACK: 'Sửa nhận xét', DELETE_FEEDBACK: 'Xoá nhận xét',
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Tiêu đề */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">📜 Lịch sử hoạt động</h2>
          <p className="text-sm text-gray-400 mt-0.5">Nhật ký thao tác của quản trị viên</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExport}
            className="bg-white border-2 border-blue-500 text-blue-600 hover:bg-blue-50 px-5 py-2.5 rounded-xl font-bold transition-all text-sm flex items-center gap-2 hover:-translate-y-0.5 hover:shadow-md">
            📥 Xuất CSV
          </button>
          <button onClick={handleGoogleBackup} disabled={backupLoading}
            className={`bg-blue-600 text-white hover:bg-blue-700 px-5 py-2.5 rounded-xl font-bold transition-all text-sm flex items-center gap-2 shadow-sm hover:-translate-y-0.5 hover:shadow-md ${backupLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {backupLoading ? '⏳ Đang sao lưu...' : '☁️ Sao lưu Drive'}
          </button>
        </div>
      </div>

      {/* Thông báo trạng thái */}
      {backupStatus && (
        <div className={`p-4 rounded-xl border flex justify-between items-center ${backupStatus.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          <p className="text-sm font-semibold">{backupStatus.message}</p>
          <button onClick={() => setBackupStatus(null)} className="text-lg opacity-40 hover:opacity-100 ml-3">✕</button>
        </div>
      )}

      {/* Thẻ thống kê */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tổng nhật ký', value: stats?.totalLogs, icon: '📜', color: 'blue' },
          { label: 'Hôm nay', value: stats?.todayLogs, icon: '📅', color: 'green' },
          { label: 'Đăng nhập', value: stats?.loginCount, icon: '🔑', color: 'purple' },
          { label: 'Thao tác thay đổi', value: (stats?.createCount || 0) + (stats?.updateCount || 0) + (stats?.deleteCount || 0), icon: '⚙️', color: 'orange' }
        ].map((item, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
            <div className={`w-12 h-12 rounded-xl bg-${item.color}-50 flex items-center justify-center text-2xl flex-shrink-0`}>{item.icon}</div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{item.label}</p>
              <p className="text-2xl font-black text-gray-800">{item.value || 0}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bộ lọc */}
      <div className="bg-white p-5 rounded-2xl border shadow-sm flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Loại thao tác</label>
          <select value={filterAction} onChange={e => { setFilterAction(e.target.value); setPage(1); }}
            className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:border-blue-400 outline-none transition-colors">
            <option value="">Tất cả thao tác</option>
            {actions.map(act => <option key={act} value={act}>{actionVi[act] || act}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Từ ngày</label>
          <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1); }}
            className="bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:border-blue-400 outline-none transition-colors" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Đến ngày</label>
          <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1); }}
            className="bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:border-blue-400 outline-none transition-colors" />
        </div>
        {(filterAction || startDate || endDate) && (
          <button onClick={() => { setFilterAction(''); setStartDate(''); setEndDate(''); setPage(1); }}
            className="text-xs font-bold text-gray-500 hover:text-red-500 px-3 py-2 rounded-xl hover:bg-red-50 transition-all">
            ✕ Xoá bộ lọc
          </button>
        )}
      </div>

      {/* Bảng nhật ký */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Thời gian', 'Quản trị viên', 'Thao tác', 'Mô tả', 'Địa chỉ IP', 'Trạng thái'].map(h => (
                  <th key={h} className="text-left px-4 py-4 font-bold text-gray-500 text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="6" className="text-center py-10 text-gray-400">⌛ Đang tải nhật ký...</td></tr>
              ) : logs.length > 0 ? (
                logs.map(log => (
                  <tr key={log._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-4 text-gray-500 tabular-nums text-xs">{formatDateTime(log.createdAt)}</td>
                    <td className="px-4 py-4 font-semibold text-gray-900">{log.adminName}</td>
                    <td className="px-4 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black border ${getActionBadge(log.action)}`}>
                        {actionVi[log.action] || log.action}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-600 text-xs">{log.description}</td>
                    <td className="px-4 py-4 font-mono text-xs text-gray-400">{log.ipAddress || 'Không rõ'}</td>
                    <td className="px-4 py-4">
                      {log.suspicious ? (
                        <span className="flex items-center gap-1 text-red-600 font-bold text-xs animate-pulse">⚠️ Khả nghi</span>
                      ) : (
                        <span className="text-emerald-500 font-bold text-xs">✓ Bình thường</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" className="text-center py-10 text-gray-400 italic">Không tìm thấy nhật ký nào phù hợp</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        {totalPages > 1 && (
          <div className="px-4 py-4 border-t bg-gray-50/50 flex justify-center gap-2">
            {[...Array(totalPages)].map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)}
                className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${page === i + 1 ? 'bg-blue-600 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminHistory;
