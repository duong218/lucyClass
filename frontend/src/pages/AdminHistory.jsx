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
      console.error('Failed to fetch audit stats:', err);
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
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [page, filterAction, startDate, endDate]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('google') === 'success') {
      setBackupStatus({ type: 'success', message: 'Google Drive connected successfully!' });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('google') === 'error') {
      setBackupStatus({ type: 'error', message: 'Failed to connect Google Drive.' });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleGoogleBackup = async () => {
    setBackupLoading(true);
    setBackupStatus(null);
    try {
      const res = await api.post('/auth/google/backup');
      if (res.data.success) {
        setBackupStatus({ type: 'success', message: `Backup successful! File ID: ${res.data.fileId}` });
      }
    } catch (err) {
      console.error('Backup failed:', err);
     /* if (err.response?.status === 401) {
        // Redirect to auth if not connected
        window.location.href = `${api.defaults.baseURL.replace('/api', '')}/api/auth/google/auth`;
      } */

      //chatgpt sửa lúc 4:33 24/
      if (err.response?.status === 401) {
  try {
    const res = await api.get('/auth/google/auth');
    window.location.href = res.request.responseURL;
    return; // 🔥 tránh chạy tiếp
  } catch (e) {
    console.error('Redirect to Google failed:', e);
  }
}
      else {
      const errorMessage = err.response?.status === 401 
        ? 'Vui lòng kết nối lại Google Drive' 
        : (err.response?.data?.message || 'Backup failed. Please try again.');
      setBackupStatus({ type: 'error', message: errorMessage });
      }
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
      link.setAttribute('download', 'admin_activity_history.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const getActionBadge = (action) => {
    if (action.includes('CREATE')) return 'bg-green-100 text-green-700 border-green-200';
    if (action.includes('UPDATE')) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    if (action.includes('DELETE')) return 'bg-red-100 text-red-700 border-red-200';
    if (action.includes('LOGIN')) return 'bg-blue-100 text-blue-700 border-blue-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const actions = [
    'LOGIN', 'LOGOUT', 
    'CREATE_TEACHER', 'UPDATE_TEACHER', 'DELETE_TEACHER', 
    'CREATE_COURSE', 'UPDATE_COURSE', 'DELETE_COURSE', 
    'UPDATE_FEEDBACK', 'DELETE_FEEDBACK'
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">{t('history.title')}</h2>
        <div className="flex gap-3">
          <button 
            onClick={handleExport}
            className="bg-white border-2 border-primary-500 text-primary-500 hover:bg-primary-50 px-5 py-2.5 rounded-xl font-semibold transition-all text-sm flex items-center gap-2"
          >
            📥 {t('history.export')}
          </button>
          <button 
            onClick={handleGoogleBackup}
            disabled={backupLoading}
            className={`${backupLoading ? 'opacity-50 cursor-not-allowed' : ''} bg-blue-600 text-white hover:bg-blue-700 px-5 py-2.5 rounded-xl font-semibold transition-all text-sm flex items-center gap-2 shadow-sm`}
          >
            {backupLoading ? '⏳...' : '☁️ Backup to Google Drive'}
          </button>
        </div>
      </div>

      {backupStatus && (
        <div className={`p-4 rounded-xl border ${backupStatus.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'} animate-fadeInUp flex justify-between items-center`}>
          <p className="text-sm font-semibold flex items-center gap-2">
            {backupStatus.type === 'success' ? '✅' : '❌'} {backupStatus.message}
          </p>
          <button onClick={() => setBackupStatus(null)} className="text-lg opacity-50 hover:opacity-100">&times;</button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Logs', value: stats?.totalLogs, icon: '📜', color: 'blue' },
          { label: 'Today', value: stats?.todayLogs, icon: '📅', color: 'green' },
          { label: 'Logins', value: stats?.loginCount, icon: '🔑', color: 'purple' },
          { label: 'Modifications', value: (stats?.createCount || 0) + (stats?.updateCount || 0) + (stats?.deleteCount || 0), icon: '⚙️', color: 'orange' }
        ].map((item, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 shadow-sm">
            <div className={`w-12 h-12 rounded-xl bg-${item.color}-50 flex items-center justify-center text-2xl`}>
              {item.icon}
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{item.label}</p>
              <p className="text-2xl font-black text-gray-800">{item.value || 0}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border shadow-sm flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-bold text-gray-500 mb-1">ACTION</label>
          <select 
            value={filterAction} 
            onChange={e => { setFilterAction(e.target.value); setPage(1); }}
            className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-2 text-sm focus:border-primary-400 outline-none"
          >
            <option value="">{t('history.allActions')}</option>
            {actions.map(act => <option key={act} value={act}>{act}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1">FROM</label>
          <input 
            type="date" 
            value={startDate} 
            onChange={e => { setStartDate(e.target.value); setPage(1); }}
            className="bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-2 text-sm focus:border-primary-400 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1">TO</label>
          <input 
            type="date" 
            value={endDate} 
            onChange={e => { setEndDate(e.target.value); setPage(1); }}
            className="bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-2 text-sm focus:border-primary-400 outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-4 font-bold text-gray-600 uppercase tracking-wider">{t('history.time')}</th>
                <th className="text-left px-4 py-4 font-bold text-gray-600 uppercase tracking-wider">{t('history.admin')}</th>
                <th className="text-left px-4 py-4 font-bold text-gray-600 uppercase tracking-wider">Action</th>
                <th className="text-left px-4 py-4 font-bold text-gray-600 uppercase tracking-wider">{t('history.description')}</th>
                <th className="text-left px-4 py-4 font-bold text-gray-600 uppercase tracking-wider">{t('history.ip')}</th>
                <th className="text-left px-4 py-4 font-bold text-gray-600 uppercase tracking-wider">{t('history.status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="6" className="text-center py-10">⌛ Loading logs...</td></tr>
              ) : logs.length > 0 ? (
                logs.map(log => (
                  <tr key={log._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-4 text-gray-500 tabular-nums">{formatDateTime(log.createdAt)}</td>
                    <td className="px-4 py-4 font-semibold text-gray-900">{log.adminName}</td>
                    <td className="px-4 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black border ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-600">{log.description}</td>
                    <td className="px-4 py-4 font-mono text-xs text-gray-400">{log.ipAddress || 'Unknown'}</td>
                    <td className="px-4 py-4">
                      {log.suspicious ? (
                        <span className="flex items-center gap-1 text-red-600 font-bold text-xs animate-pulse">
                          ⚠️ {t('history.suspicious')}
                        </span>
                      ) : (
                        <span className="text-green-500 font-medium text-xs">✓ Normal</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" className="text-center py-10 text-gray-400">No logs found matching filters</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-4 border-t flex justify-center gap-2">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${
                  page === i + 1 ? 'bg-primary-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
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
