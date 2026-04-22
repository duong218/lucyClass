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
  const [restorePassword, setRestorePassword] = useState('');
  const backupProcessed = useRef(false);
  const [visibleBackupCount, setVisibleBackupCount] = useState(5);
  const BACKUP_PAGE_SIZE = 5;

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
      console.error('Kết nối Google thất bại:', err);
      setBackupStatus({ type: 'error', message: 'Không thể kết nối Google Drive. Vui lòng thử lại.' });
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
      console.error('Lỗi tải danh sách bản sao lưu:', err);
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
        setBackupStatus({ type: 'success', message: '✅ Dữ liệu đã được sao lưu an toàn lên Google Drive.' });
        fetchBackups();
      }
    } catch (err) {
      console.error('Lỗi sao lưu:', err);
      if (err.response?.status === 401) {
        try {
          const res = await api.get('/auth/google/auth');
          window.location.href = res.data.url;
          return;
        } catch (e) {
          console.error('Chuyển hướng OAuth thất bại:', e);
        }
      }
      const errorMessage = err.response?.data?.message || 'Có lỗi xảy ra khi sao lưu. Vui lòng thử lại.';
      setBackupStatus({ type: 'error', message: errorMessage });
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestore = async (fileId) => {
    if (!restorePassword) {
      setBackupStatus({ type: 'error', message: 'Vui lòng nhập mật khẩu để xác nhận khôi phục.' });
      return;
    }
    setRestoreLoading(true);
    setRestoreProgress(0);
    setBackupStatus(null);

    try {
      const res = await api.post('/auth/google/restore', { fileId, confirm: 'CONFIRM', password: restorePassword });
      if (res.data.success) {
        // Restore runs in the background — poll progress until it hits 100
        // (which means mongorestore + Redis cache flush are both done)
        await new Promise((resolve, reject) => {
          const pollInterval = setInterval(async () => {
            try {
              const progressRes = await api.get('/restore/progress');
              const progress = progressRes.data.progress || 0;
              setRestoreProgress(progress);
              if (progress >= 100) {
                clearInterval(pollInterval);
                resolve();
              }
            } catch (err) {
              // Keep polling even if one request fails
            }
          }, 1500);

          // Safety timeout: stop polling after 10 minutes
          setTimeout(() => {
            clearInterval(pollInterval);
            reject(new Error('Restore timeout'));
          }, 600000);
        });

        setRestoreProgress(100);
        setBackupStatus({ type: 'success', message: '✅ Khôi phục dữ liệu thành công! Trang sẽ tải lại sau 3 giây.' });
        setTimeout(() => window.location.reload(), 3000);
      }
    } catch (err) {
      console.error('Lỗi khôi phục:', err);
      const msg = err.response?.data?.message || 'Khôi phục thất bại. Vui lòng kiểm tra mật khẩu và thử lại.';
      setBackupStatus({ type: 'error', message: msg });
    } finally {
      setRestoreLoading(false);
      setSelectedBackup(null);
      setRestorePassword('');
    }
  };

  const handleExportExcel = async () => {
    try {
      const response = await api.post('/registrations/export-excel', {}, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `danh_sach_dang_ky_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      const message = error.response?.status === 401
        ? 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.'
        : 'Xuất file Excel thất bại. Vui lòng thử lại.';
      setBackupStatus({ type: 'error', message });
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
        if (!googleNotConnected) fetchBackups();
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
      else setBackupStatus({ type: 'error', message: 'Kết nối Google Drive thất bại. Vui lòng thử lại.' });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-400 font-medium animate-pulse">Đang tải dữ liệu...</p>
    </div>
  );

  const widgets = [
    { label: 'Tổng đăng ký', value: stats?.totalRegistrations || 0, icon: '👥', sub: 'Tháng này', bg: 'from-blue-50 to-blue-100/60 border-blue-200', num: 'text-blue-700' },
    { label: 'Khoá học đang mở', value: stats?.activeCourses || 0, icon: '📚', sub: 'Đang hoạt động', bg: 'from-emerald-50 to-emerald-100/60 border-emerald-200', num: 'text-emerald-700' },
    { label: 'Tổng giáo viên', value: stats?.totalTeachers || 0, icon: '👩‍🏫', sub: 'Đội ngũ', bg: 'from-amber-50 to-amber-100/60 border-amber-200', num: 'text-amber-700' },
    { label: 'Nhận xét phụ huynh', value: stats?.totalFeedback || 0, icon: '💬', sub: 'Đánh giá', bg: 'from-purple-50 to-purple-100/60 border-purple-200', num: 'text-purple-700' },
  ];

  const regByCourseData = {
    labels: stats?.regByCourse?.map(r => r.courseName) || [],
    datasets: [{
      label: 'Đăng ký',
      data: stats?.regByCourse?.map(r => r.total) || [],
      backgroundColor: ['#4A90D9', '#FF6B9D', '#4CAF50', '#F5C542', '#9C27B0', '#FF5722'],
      borderRadius: 8,
    }]
  };

  const dailyTrendData = {
    labels: stats?.dailyTrend?.map(d => d._id) || [],
    datasets: [{
      label: 'Đăng ký',
      data: stats?.dailyTrend?.map(d => d.count) || [],
      borderColor: '#4A90D9',
      backgroundColor: 'rgba(74,144,217,0.1)',
      fill: true,
      tension: 0.4,
    }]
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">📊 Tổng quan</h1>
          <p className="text-sm text-gray-400 mt-0.5">Xin chào! Đây là tình hình hôm nay của trung tâm.</p>
        </div>
        {lastBackup && (
          <div className="text-[11px] text-gray-400 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl font-medium">
            🕐 Sao lưu lần cuối: {new Date(lastBackup).toLocaleString('vi-VN')}
          </div>
        )}
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        <div className="flex-1 space-y-6">
          {/* Stat widgets */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {widgets.map((w, i) => (
              <div key={i} className={`bg-gradient-to-br ${w.bg} border-2 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5`}>
                <div className="text-3xl mb-3">{w.icon}</div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{w.label}</p>
                <p className={`text-3xl font-black ${w.num}`}>{w.value}</p>
                <p className="text-[11px] text-gray-400 mt-1">{w.sub}</p>
              </div>
            ))}
          </div>

          {/* Bảng đăng ký gần đây */}
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b bg-gray-50/60">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">📋 Đăng ký gần đây</h3>
              <button onClick={() => navigate('/admin/registrations')} className="text-xs font-bold text-blue-600 hover:underline">Xem tất cả »</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {['Phụ huynh', 'Học sinh', 'Khoá học', 'Số điện thoại', 'Thời gian'].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentRegs.map(reg => (
                    <tr key={reg._id} className="border-b last:border-0 hover:bg-blue-50/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-800">{reg.parentName}</td>
                      <td className="px-4 py-3 text-gray-600">{reg.childName}</td>
                      <td className="px-4 py-3">
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold">{reg.course}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{reg.phone}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{formatDateTime(reg.createdAt)}</td>
                    </tr>
                  ))}
                  {recentRegs.length === 0 && (
                    <tr><td colSpan="5" className="text-center py-10 text-gray-400">Chưa có đăng ký nào</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bản sao lưu */}
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b bg-gray-50/60">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">☁️ Bản sao lưu Google Drive</h3>
              <button
                onClick={fetchBackups}
                disabled={googleNotConnected}
                className={`text-xs font-bold ${googleNotConnected ? 'text-gray-300 cursor-not-allowed' : 'text-blue-600 hover:underline'}`}
              >
                🔄 Tải lại
              </button>
            </div>
            {googleNotConnected ? (
              <div className="m-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="text-sm font-bold text-amber-800">Chưa kết nối Google Drive</p>
                  <button onClick={handleConnectGoogle} className="text-xs font-bold text-amber-700 underline mt-0.5">Kết nối ngay →</button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      {['Tên file', 'Thời gian tạo', 'Hành động'].map((h, i) => (
                        <th key={h} className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ${i === 2 ? 'text-right' : 'text-left'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {backups.slice(0, visibleBackupCount).map(file => (
                      <tr key={file.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">📦 {file.displayName || file.name}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {new Date(file.createdTime).toLocaleString('vi-VN')} · {formatBytes(file.size)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => setSelectedBackup(file)} className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 border border-red-100 transition-all">
                            Khôi phục
                          </button>
                        </td>
                      </tr>
                    ))}
                    {backups.length === 0 && (
                      <tr><td colSpan="3" className="text-center py-8 text-gray-400">Chưa có bản sao lưu nào</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
            {backups.length > visibleBackupCount && (
              <div className="px-5 py-3 border-t bg-gray-50/60 text-center">
                <button onClick={() => setVisibleBackupCount(v => v + BACKUP_PAGE_SIZE)} className="text-xs font-bold text-blue-600 hover:underline">
                  Xem thêm ({backups.length - visibleBackupCount} bản còn lại)
                </button>
              </div>
            )}
          </div>

          {/* Biểu đồ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-5 shadow-sm border">
              <h3 className="font-bold text-gray-700 mb-4 text-sm flex items-center gap-2">
                <span className="w-1.5 h-5 bg-blue-500 rounded-full"></span> Đăng ký theo khoá học
              </h3>
              <Bar data={regByCourseData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border">
              <h3 className="font-bold text-gray-700 mb-4 text-sm flex items-center gap-2">
                <span className="w-1.5 h-5 bg-emerald-500 rounded-full"></span> Xu hướng đăng ký
              </h3>
              <Line data={dailyTrendData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full xl:w-80 space-y-5">
          {/* Thao tác nhanh */}
          <div className="bg-white rounded-2xl shadow-sm border p-5">
            <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider">⚡ Thao tác nhanh</h3>
            <div className="space-y-3">
              <button onClick={handleExportExcel} className="w-full bg-indigo-500 text-white py-3 rounded-xl font-bold hover:bg-indigo-600 transition-all shadow-sm flex items-center justify-center gap-2 text-sm hover:-translate-y-0.5 hover:shadow-md">
                <span>📥</span> Xuất Excel
              </button>
              <button onClick={handleGoogleBackup} disabled={backupLoading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-sm flex items-center justify-center gap-2 text-sm hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                <span>☁️</span> {backupLoading ? 'Đang sao lưu...' : 'Sao lưu lên Drive'}
              </button>
              <button onClick={handleConnectGoogle} className="w-full bg-gray-600 text-white py-3 rounded-xl font-bold hover:bg-gray-700 transition-all shadow-sm flex items-center justify-center gap-2 text-sm hover:-translate-y-0.5 hover:shadow-md">
                <span>🔗</span> Kết nối lại Google
              </button>
            </div>
          </div>

          {/* Nhận xét gần đây */}
          <div className="bg-white rounded-2xl shadow-sm border p-5">
            <h3 className="font-bold text-gray-800 mb-4 text-sm flex items-center gap-2">💬 Nhận xét gần đây</h3>
            <div className="space-y-4">
              {recentFeedback.map(fb => (
                <div key={fb._id} className="border-b last:border-0 pb-3 last:pb-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                      {fb.photo ? <img src={getImageUrl(fb.photo)} className="w-full h-full object-cover" onError={handleImageError} /> : <span className="text-xs">👤</span>}
                    </div>
                    <div>
                      <p className="font-bold text-xs text-gray-800">{fb.parentName}</p>
                      <div className="flex text-yellow-400 text-[10px]">{'★'.repeat(fb.rating)}{'☆'.repeat(5 - fb.rating)}</div>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-500 line-clamp-2 italic">"{fb.text}"</p>
                </div>
              ))}
              {recentFeedback.length === 0 && <p className="text-xs text-gray-400 italic text-center py-4">Chưa có nhận xét nào.</p>}
            </div>
            <button onClick={() => navigate('/admin/feedback')} className="mt-4 w-full text-center text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors">
              Xem tất cả nhận xét →
            </button>
          </div>
        </div>
      </div>

      {/* Overlay: đang sao lưu */}
      {backupLoading && (
        <div className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-bold text-gray-800">Đang chuẩn bị dữ liệu sao lưu...</p>
            <p className="text-sm text-gray-400">Vui lòng không đóng trang</p>
          </div>
        </div>
      )}

      {/* Modal xác nhận khôi phục */}
      {selectedBackup && (
        <div className="fixed inset-0 z-[10001] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
            <div className="text-4xl text-center mb-3">⚠️</div>
            <h3 className="text-xl font-black text-center mb-2 text-gray-800">Xác nhận khôi phục?</h3>
            <p className="text-center text-sm text-gray-500 mb-5">
              Hành động này sẽ <span className="text-red-600 font-bold underline">GHI ĐÈ TOÀN BỘ</span> dữ liệu hiện tại và không thể hoàn tác.
            </p>
            <div className="bg-gray-50 rounded-2xl p-3 mb-5 text-xs text-gray-600 border border-gray-100">
              <span className="font-bold">File:</span> {selectedBackup.displayName || selectedBackup.name}
            </div>
            <div className="mb-5">
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Nhập mật khẩu quản trị viên để xác nhận</label>
              <input
                type="password"
                value={restorePassword}
                onChange={e => setRestorePassword(e.target.value)}
                placeholder="Mật khẩu của bạn"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-400 transition-colors"
                onKeyDown={e => e.key === 'Enter' && handleRestore(selectedBackup.id)}
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setSelectedBackup(null); setRestorePassword(''); }} className="flex-1 py-3 rounded-2xl bg-gray-100 font-bold hover:bg-gray-200 transition-all text-sm">Huỷ</button>
              <button onClick={() => handleRestore(selectedBackup.id)} className="flex-1 py-3 rounded-2xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg transition-all text-sm">⚠️ Khôi phục</button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay: đang khôi phục */}
      {restoreLoading && (
        <div className="fixed inset-0 z-[10002] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-xs flex flex-col items-center gap-6">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <div className="w-full text-center">
              <p className="font-bold text-gray-800 mb-1">Đang khôi phục dữ liệu...</p>
              <p className="text-sm text-gray-400 mb-3">{restoreProgress}% hoàn tất</p>
              <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full transition-all duration-500 rounded-full" style={{ width: `${restoreProgress}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Thông báo trạng thái */}
      {backupStatus && (
        <div className={`fixed top-6 right-6 z-[10003] max-w-sm p-4 rounded-2xl shadow-2xl border-2 flex items-start gap-3 animate-slide-in ${backupStatus.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          <div className="flex-1">
            <p className="font-bold text-sm leading-snug">{backupStatus.message}</p>
          </div>
          <button onClick={() => setBackupStatus(null)} className="text-lg opacity-40 hover:opacity-100 leading-none mt-0.5">✕</button>
        </div>
      )}

      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-slide-in { animation: slideIn 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default Dashboard;
