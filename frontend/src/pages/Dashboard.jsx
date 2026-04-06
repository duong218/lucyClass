import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import api from '../services/api';
import { formatDateTime, getRelativeTime } from '../utils/dateUtils';
import { getImageUrl } from '../utils/getImageUrl';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler);

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentRegs, setRecentRegs] = useState([]);
  const [recentFeedback, setRecentFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupStatus, setBackupStatus] = useState(null);
  const [lastBackup, setLastBackup] = useState(localStorage.getItem('last_backup_time'));
  const [backups, setBackups] = useState([]);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState(0);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [googleNotConnected, setGoogleNotConnected] = useState(false);
  const backupProcessed = useRef(false);
  const [visibleBackupCount, setVisibleBackupCount] = useState(5);
  const BACKUP_PAGE_SIZE = 5;
  const MAX_BACKUPS = 20;

  // Requirements: All functions inside
  function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }

  const handleConnectGoogle = async () => {
    try {
      const res = await api.get('/auth/google/auth');
      window.location.href = res.data.url;
    } catch (err) {
      console.error('Connect Google failed:', err);
      alert('Không kết nối được Google. Vui lòng thử lại.');
    }
  };

  const fetchBackups = async () => {
    if (googleNotConnected) return;
    try {
      const res = await api.get('/auth/google/backups');
      setBackups(res.data?.data || res.data?.backups || res.data || []);
      setGoogleNotConnected(false);
    } catch (err) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message || '';
      if (status === 401 && message.toLowerCase().includes('google')) {
        setBackups([]);
        setGoogleNotConnected(true);
        return;
      }
      console.error('❌ Failed to fetch backups:', err);
    }
  };

  const handleGoogleBackup = async () => {
    setBackupLoading(true);
    setBackupStatus(null);
    try {
      const res = await api.post('/auth/google/backup');
      if (res.data.success) {
        const now = new Date().toISOString();
        setLastBackup(now);
        localStorage.setItem('last_backup_time', now);
        setBackupStatus({ type: 'success', message: 'Dữ liệu đã được an toàn trên Drive.' });
        fetchBackups();
      }
    } catch (err) {
      console.error("Backup error", err);
      if (err.response?.status === 401) {
        try {
          const res = await api.get('/auth/google/auth');
          window.location.href = res.data.url;
          return;
        } catch (e) {
          console.error("OAuth redirect failed:", e);
        }
      }
      const errorMessage = err.response?.data?.message || 'Có lỗi xảy ra khi đồng bộ.';
      setBackupStatus({ type: 'error', message: errorMessage });
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestore = async (fileId) => {
    setRestoreLoading(true);
    setRestoreProgress(0);
    setBackupStatus(null);
    const progressInterval = setInterval(async () => {
      try {
        const res = await api.get('/restore/progress');
        setRestoreProgress(res.data.progress || 0);
      } catch (err) { /* silent */ }
    }, 1000);

    try {
      const res = await api.post('/auth/google/restore', { fileId, confirm: true });
      if (res.data.success) {
        setRestoreProgress(100);
        setBackupStatus({ type: 'success', message: 'Khôi phục thành công! Trang sẽ tải lại sau 3s.' });
        setTimeout(() => window.location.reload(), 3000);
      }
    } catch (err) {
      console.error("Restore error", err);
      setBackupStatus({ type: 'error', message: err.response?.data?.message || 'Lỗi khôi phục.' });
    } finally {
      clearInterval(progressInterval);
      setRestoreLoading(false);
      setSelectedBackup(null);
    }
  };

  const handleExportExcel = async () => {
    try {
      const response = await api.post('/registrations/export-excel', {}, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `registrations_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      const message = error.response?.status === 401 ? 'Phiên làm việc hết hạn.' : 'Lỗi xuất file Excel.';
      alert(message);
    }
  };

  const handleImageError = (e) => { e.target.src = '/placeholder.jpg'; };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await api.get('/stats/dashboard');
        const data = res.data.data || res.data;
        setStats(data.stats || null);
        setRecentRegs(data.recentRegistrations || []);
        setRecentFeedback(data.recentFeedback || []);
        if (!googleNotConnected) {
          fetchBackups();
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const googleStatus = urlParams.get('google');
    if (googleStatus && !backupProcessed.current) {
      backupProcessed.current = true;
      if (googleStatus === 'success') handleGoogleBackup();
      else setBackupStatus({ type: 'error', message: 'Kết nối Google Drive thất bại.' });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><span className="text-4xl animate-bounce">⏳</span></div>;

  const widgets = [
    { label: 'Total Registrations', value: stats?.totalRegistrations || 0, icon: '👥', sub: 'This Month', bg: 'bg-blue-50 border-blue-200' },
    { label: 'Active Courses', value: stats?.activeCourses || 0, icon: '👩‍🏫', sub: 'Currently Active', bg: 'bg-green-50 border-green-200' },
    { label: 'Total Teachers', value: stats?.totalTeachers || 0, icon: '🎓', sub: 'Experts', bg: 'bg-yellow-50 border-yellow-200' },
    { label: 'Total Feedback', value: stats?.totalFeedback || 0, icon: '💬', sub: 'Parent Feedback', bg: 'bg-purple-50 border-purple-200' },
  ];

  const regByCourseData = {
    labels: stats?.regByCourse?.map(r => r.courseName) || [],
    datasets: [{
      label: 'Registrations',
      data: stats?.regByCourse?.map(r => r.total) || [],
      backgroundColor: ['#4A90D9', '#FF6B9D', '#4CAF50', '#F5C542', '#9C27B0', '#FF5722'],
      borderRadius: 8,
    }]
  };

  const dailyTrendData = {
    labels: stats?.dailyTrend?.map(d => d._id) || [],
    datasets: [{
      label: 'Registrations',
      data: stats?.dailyTrend?.map(d => d.count) || [],
      borderColor: '#4A90D9',
      backgroundColor: 'rgba(74,144,217,0.1)',
      fill: true,
      tension: 0.4,
    }]
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
      <div className="flex flex-col xl:flex-row gap-6">
        <div className="flex-1 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {widgets.map((w, i) => (
              <div key={i} className={`${w.bg} border-2 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all`}>
                <div className="text-3xl mb-2">{w.icon}</div>
                <h3 className="text-sm font-semibold text-gray-600">{w.label}</h3>
                <p className="text-3xl font-bold text-gray-800">{w.value}</p>
                <p className="text-xs text-gray-500">{w.sub}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border p-5">
            <h3 className="font-bold text-gray-800 mb-4">Recent Registrations</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-3 px-2">Parent</th>
                    <th className="pb-3 px-2">Child</th>
                    <th className="pb-3 px-2">Course</th>
                    <th className="pb-3 px-2">Phone</th>
                    <th className="pb-3 px-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRegs.map(reg => (
                    <tr key={reg._id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-3 px-2">{reg.parentName}</td>
                      <td className="py-3 px-2">{reg.childName}</td>
                      <td className="py-3 px-2">{reg.course}</td>
                      <td className="py-3 px-2">{reg.phone}</td>
                      <td className="py-3 px-2 text-xs text-gray-500">{formatDateTime(reg.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={() => navigate('/admin/registrations')} className="mt-4 text-blue-600 font-bold text-sm hover:underline">View All &raquo;</button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800">Google Drive Backups</h3>
              <button 
                onClick={fetchBackups} 
                disabled={googleNotConnected}
                className={`text-xs font-bold ${googleNotConnected ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:underline'}`}
              >
                Refresh
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Time</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.slice(0, visibleBackupCount).map(file => (
                    <tr key={file.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-3">📦 {file.name}</td>
                      <td className="py-3 text-xs text-gray-500">{new Date(file.createdTime).toLocaleString()} ({formatBytes(file.size)})</td>
                      <td className="py-3 text-right">
                        <button onClick={() => setSelectedBackup(file)} className="bg-red-50 text-red-600 px-3 py-1 rounded-lg text-xs font-bold hover:bg-red-600 hover:text-white border border-red-100 transition-all">Restore</button>
                      </td>
                    </tr>
                  ))}
                  {backups.length === 0 && <tr><td colSpan="3" className="text-center py-4 text-gray-400">No backups found.</td></tr>}
                </tbody>
              </table>
            </div>
            {googleNotConnected && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 text-sm flex items-center gap-3">
                <span>⚠️</span>
                <p>Chưa kết nối Google Drive. <button onClick={handleConnectGoogle} className="font-bold underline">Kết nối ngay</button></p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-5 shadow-sm border">
               <h3 className="font-bold text-gray-700 mb-4 text-sm">Registrations by Course</h3>
               <Bar data={regByCourseData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border">
               <h3 className="font-bold text-gray-700 mb-4 text-sm">Registration Trend</h3>
               <Line data={dailyTrendData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
            </div>
          </div>
        </div>

        <div className="w-full xl:w-80 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border p-5">
            <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider">Quick Actions</h3>
            <div className="space-y-3">
              <button onClick={handleExportExcel} className="w-full bg-indigo-500 text-white py-3 rounded-2xl font-bold hover:bg-indigo-600 transition-all shadow-sm flex items-center justify-center gap-2"><span>📥</span> Export Excel</button>
              <button onClick={handleGoogleBackup} className="w-full bg-blue-600 text-white py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-sm flex items-center justify-center gap-2"><span>☁️</span> Backup to Drive</button>
              <button onClick={handleConnectGoogle} className="w-full bg-gray-600 text-white py-3 rounded-2xl font-bold hover:bg-gray-700 transition-all shadow-sm flex items-center justify-center gap-2"><span>🔗</span> Reconnect Google</button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border p-5">
            <h3 className="font-bold text-gray-800 mb-4 text-sm">Recent Feedback</h3>
            <div className="space-y-4">
              {recentFeedback.map(fb => (
                <div key={fb._id} className="border-b last:border-0 pb-3 last:pb-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
                      {fb.photo ? <img src={getImageUrl(fb.photo)} className="w-full h-full object-cover" /> : <span className="text-xs">👤</span>}
                    </div>
                    <div>
                      <p className="font-bold text-xs text-gray-800">{fb.parentName}</p>
                      <div className="flex text-yellow-400 text-[10px]">{'★'.repeat(fb.rating)}</div>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-600 line-clamp-2 italic">"{fb.text}"</p>
                </div>
              ))}
              {recentFeedback.length === 0 && <p className="text-xs text-gray-400">No feedback yet.</p>}
            </div>
            <button onClick={() => navigate('/admin/feedback')} className="mt-4 w-full text-center text-xs font-bold text-gray-400 hover:text-gray-600">View All</button>
          </div>
        </div>
      </div>

      {backupLoading && (
        <div className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-bold text-gray-800">Đang chuẩn bị dữ liệu...</p>
          </div>
        </div>
      )}

      {selectedBackup && (
        <div className="fixed inset-0 z-[10001] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl scale-in">
             <div className="text-4xl text-center mb-4">⚠️</div>
             <h3 className="text-xl font-black text-center mb-2">Xác nhận khôi phục?</h3>
             <p className="text-center text-sm text-gray-500 mb-6">Hành động này sẽ <span className="text-red-600 font-bold underline">GHI ĐÈ TOÀN BỘ</span> dữ liệu hiện tại.</p>
             <div className="flex gap-3">
               <button onClick={() => setSelectedBackup(null)} className="flex-1 py-3 rounded-2xl bg-gray-100 font-bold hover:bg-gray-200">Hủy</button>
               <button onClick={() => handleRestore(selectedBackup.id)} className="flex-1 py-3 rounded-2xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg">Khôi phục</button>
             </div>
          </div>
        </div>
      )}

      {restoreLoading && (
        <div className="fixed inset-0 z-[10002] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-xs flex flex-col items-center gap-6">
             <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin relative">
                <span className="absolute inset-0 flex items-center justify-center text-lg">⚙️</span>
             </div>
             <div className="w-full">
                <p className="text-center font-bold text-gray-800 mb-2">Đang khôi phục... {restoreProgress}%</p>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                   <div className="bg-blue-600 h-full transition-all duration-500" style={{ width: `${restoreProgress}%` }} />
                </div>
             </div>
          </div>
        </div>
      )}

      {backupStatus && (
        <div className={`fixed top-6 right-6 z-[10003] p-4 rounded-2xl shadow-2xl border-2 flex items-center gap-3 animate-slide-in ${backupStatus.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
           <span className="text-xl">{backupStatus.type === 'success' ? '✅' : '❌'}</span>
           <div className="flex-1">
              <p className="font-bold text-sm leading-tight">{backupStatus.message}</p>
           </div>
           <button onClick={() => setBackupStatus(null)} className="opacity-50 hover:opacity-100">✕</button>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-slide-in { animation: slideIn 0.3s ease-out forwards; }
        .scale-in { animation: scaleIn 0.2s ease-out forwards; }
        @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}} />
    </div>
  );
};

export default Dashboard;
