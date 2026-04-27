import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { formatDateTime } from '../utils/dateUtils';
import {
  ScrollText,
  ShieldAlert,
  Download,
  CloudUpload,
  Ban,
  ShieldCheck,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  Filter,
  Globe,
  Clock,
  AlertTriangle,
  CheckCircle2,
  LogIn,
  LogOut,
  KeyRound,
  Activity,
  Loader2,
  UserX,
  Bell,
  BellRing,
  Lock,
  Unlock,
  MonitorSmartphone,
  Search,
  TriangleAlert,
  CircleCheck,
  CircleX,
  Fingerprint,
} from 'lucide-react';

// ─── Tab enum ────────────────────────────────────────────────────────────────
const TAB = { HISTORY: 'history', LOGIN: 'login', SECURITY: 'security' };

// ─── Helper badge màu action ─────────────────────────────────────────────────
const getActionBadge = (action) => {
  if (action?.includes('CREATE')) return 'bg-green-100 text-green-700 border-green-200';
  if (action?.includes('UPDATE')) return 'bg-amber-100 text-amber-700 border-amber-200';
  if (action?.includes('DELETE')) return 'bg-red-100 text-red-700 border-red-200';
  if (action?.includes('LOGIN')) return 'bg-blue-100 text-blue-700 border-blue-200';
  return 'bg-gray-100 text-gray-700 border-gray-200';
};

// ─── Badge + icon cho LoginAttemptLog action ─────────────────────────────────
const getLoginActionMeta = (action) => {
  switch (action) {
    case 'LOGIN_SUCCESS':
      return {
        cls: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        Icon: CircleCheck,
        label: 'Đăng nhập thành công',
      };
    case 'LOGIN_FAIL':
      return {
        cls: 'bg-red-100 text-red-700 border-red-200',
        Icon: CircleX,
        label: 'Đăng nhập thất bại',
      };
    case 'RESET_PASSWORD_REQUEST':
      return {
        cls: 'bg-amber-100 text-amber-700 border-amber-200',
        Icon: KeyRound,
        label: 'Yêu cầu reset mật khẩu',
      };
    case 'RESET_PASSWORD_SUCCESS':
      return {
        cls: 'bg-purple-100 text-purple-700 border-purple-200',
        Icon: Unlock,
        label: 'Reset mật khẩu thành công',
      };
    default:
      return {
        cls: 'bg-gray-100 text-gray-600 border-gray-200',
        Icon: Activity,
        label: action,
      };
  }
};

const actionVi = {
  LOGIN: 'Đăng nhập', LOGOUT: 'Đăng xuất',
  CREATE_TEACHER: 'Thêm giáo viên', UPDATE_TEACHER: 'Sửa giáo viên', DELETE_TEACHER: 'Xoá giáo viên',
  CREATE_COURSE: 'Thêm khoá học', UPDATE_COURSE: 'Sửa khoá học', DELETE_COURSE: 'Xoá khoá học',
  UPDATE_FEEDBACK: 'Sửa nhận xét', DELETE_FEEDBACK: 'Xoá nhận xét',
};

const actions = [
  'LOGIN', 'LOGOUT',
  'CREATE_TEACHER', 'UPDATE_TEACHER', 'DELETE_TEACHER',
  'CREATE_COURSE', 'UPDATE_COURSE', 'DELETE_COURSE',
  'UPDATE_FEEDBACK', 'DELETE_FEEDBACK',
];

const LOGIN_ACTIONS = [
  { value: '', label: 'Tất cả hoạt động' },
  { value: 'LOGIN_FAIL', label: 'Đăng nhập thất bại' },
  { value: 'LOGIN_SUCCESS', label: 'Đăng nhập thành công' },
  { value: 'RESET_PASSWORD_REQUEST', label: 'Yêu cầu reset mật khẩu' },
  { value: 'RESET_PASSWORD_SUCCESS', label: 'Reset mật khẩu thành công' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Component chính
// ─────────────────────────────────────────────────────────────────────────────
const AdminHistory = () => {
  const [activeTab, setActiveTab] = useState(TAB.HISTORY);

  // ── State lịch sử thao tác ─────────────────────────────────────────────────
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

  // ── State hoạt động đăng nhập (MỚI) ───────────────────────────────────────
  const [loginLogs, setLoginLogs] = useState([]);
  const [loginWarnings, setLoginWarnings] = useState([]);
  const [loginWarningCount, setLoginWarningCount] = useState(0);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginPage, setLoginPage] = useState(1);
  const [loginTotalPages, setLoginTotalPages] = useState(1);
  const [loginFilterAction, setLoginFilterAction] = useState('');
  const [loginFilterIP, setLoginFilterIP] = useState('');
  const [loginStartDate, setLoginStartDate] = useState('');
  const [loginEndDate, setLoginEndDate] = useState('');
  const [loginMsg, setLoginMsg] = useState(null);
  const [blockingIP, setBlockingIPLogin] = useState(null);
  // Trạng thái xem chi tiết warnings (expand/collapse)
  const [warningsExpanded, setWarningsExpanded] = useState(true);

  // ── State bảo mật ──────────────────────────────────────────────────────────
  const [alerts, setAlerts] = useState([]);
  const [secStats, setSecStats] = useState(null);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [alertPage, setAlertPage] = useState(1);
  const [alertTotalPages, setAlertTotalPages] = useState(1);
  const [blockingIPSec, setBlockingIPSec] = useState(null);
  const [secMsg, setSecMsg] = useState(null);

  // ── Fetch lịch sử thao tác ─────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/admin/history/stats');
      setStats(res.data.data || res.data);
    } catch (err) {
      console.error('Lỗi tải thống kê lịch sử:', err);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
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
      console.error('Lỗi tải nhật ký:', err);
    } finally {
      setLoading(false);
    }
  }, [page, filterAction, startDate, endDate]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchLogs(); }, [fetchLogs]);

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

  // ── Fetch hoạt động đăng nhập (MỚI) ───────────────────────────────────────
  const fetchLoginActivity = useCallback(async () => {
    setLoginLoading(true);
    try {
      const params = { page: loginPage, limit: 20 };
      if (loginFilterAction) params.action = loginFilterAction;
      if (loginFilterIP) params.ip = loginFilterIP;
      if (loginStartDate) params.startDate = loginStartDate;
      if (loginEndDate) params.endDate = loginEndDate;
      const res = await api.get('/admin/history/login-activity', { params });
      const data = res.data.data;
      setLoginLogs(data.logs || []);
      setLoginTotalPages(data.pages || 1);
      setLoginWarnings(data.warnings || []);
      setLoginWarningCount(data.warningCount || 0);
    } catch (err) {
      console.error('Lỗi tải hoạt động đăng nhập:', err);
    } finally {
      setLoginLoading(false);
    }
  }, [loginPage, loginFilterAction, loginFilterIP, loginStartDate, loginEndDate]);

  useEffect(() => {
    if (activeTab === TAB.LOGIN) fetchLoginActivity();
  }, [activeTab, fetchLoginActivity]);

  // Lấy warningCount khi vào trang để hiện badge trên tab
  const fetchLoginWarningCount = useCallback(async () => {
    try {
      const res = await api.get('/admin/history/login-activity', { params: { page: 1, limit: 1 } });
      setLoginWarningCount(res.data.data?.warningCount || 0);
    } catch (_) {}
  }, []);

  useEffect(() => { fetchLoginWarningCount(); }, [fetchLoginWarningCount]);

  // ── Fetch cảnh báo bảo mật ─────────────────────────────────────────────────
  const fetchSecStats = useCallback(async () => {
    try {
      const res = await api.get('/admin/history/security-stats');
      setSecStats(res.data.data);
    } catch (err) {
      console.error('Lỗi tải security stats:', err);
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    setAlertsLoading(true);
    try {
      const res = await api.get('/admin/history/security-alerts', {
        params: { page: alertPage, limit: 15 },
      });
      const data = res.data.data;
      setAlerts(data.alerts || []);
      setAlertTotalPages(data.pages || 1);
    } catch (err) {
      console.error('Lỗi tải cảnh báo bảo mật:', err);
    } finally {
      setAlertsLoading(false);
    }
  }, [alertPage]);

  useEffect(() => {
    if (activeTab === TAB.SECURITY) {
      fetchSecStats();
      fetchAlerts();
    }
  }, [activeTab, fetchSecStats, fetchAlerts]);

  // ── Block / Unblock IP — dùng cho tab Login Activity ──────────────────────
  const handleBlockIPLogin = async (ip) => {
    setBlockingIPLogin(ip);
    try {
      await api.post('/admin/history/block-ip', { ip, reason: 'Chặn thủ công từ trang hoạt động đăng nhập' });
      setLoginMsg({ type: 'success', message: `Đã chặn IP ${ip}` });
      fetchLoginActivity();
      fetchLoginWarningCount();
    } catch (err) {
      setLoginMsg({ type: 'error', message: err.response?.data?.message || 'Chặn IP thất bại' });
    } finally {
      setBlockingIPLogin(null);
    }
  };

  const handleUnblockIPLogin = async (ip) => {
    setBlockingIPLogin(ip);
    try {
      await api.delete(`/admin/history/block-ip/${encodeURIComponent(ip)}`);
      setLoginMsg({ type: 'success', message: `Đã bỏ chặn IP ${ip}` });
      fetchLoginActivity();
      fetchLoginWarningCount();
    } catch (err) {
      setLoginMsg({ type: 'error', message: err.response?.data?.message || 'Bỏ chặn IP thất bại' });
    } finally {
      setBlockingIPLogin(null);
    }
  };

  // ── Block / Unblock IP — dùng cho tab Security ────────────────────────────
  const handleBlockIP = async (ip) => {
    setBlockingIPSec(ip);
    try {
      await api.post('/admin/history/block-ip', { ip, reason: 'Chặn thủ công bởi admin' });
      setSecMsg({ type: 'success', message: `Đã chặn IP ${ip}` });
      fetchAlerts();
      fetchSecStats();
    } catch (err) {
      setSecMsg({ type: 'error', message: err.response?.data?.message || 'Chặn IP thất bại' });
    } finally {
      setBlockingIPSec(null);
    }
  };

  const handleUnblockIP = async (ip) => {
    setBlockingIPSec(ip);
    try {
      await api.delete(`/admin/history/block-ip/${encodeURIComponent(ip)}`);
      setSecMsg({ type: 'success', message: `Đã bỏ chặn IP ${ip}` });
      fetchAlerts();
      fetchSecStats();
    } catch (err) {
      setSecMsg({ type: 'error', message: err.response?.data?.message || 'Bỏ chặn IP thất bại' });
    } finally {
      setBlockingIPSec(null);
    }
  };

  // ── Backup & Export ────────────────────────────────────────────────────────
  const handleGoogleBackup = async () => {
    setBackupLoading(true);
    setBackupStatus(null);
    try {
      const res = await api.post('/auth/google/backup');
      if (res.data.success) {
        setBackupStatus({ type: 'success', message: `✅ Sao lưu thành công! Mã file: ${res.data.fileId}` });
      }
    } catch (err) {
      if (err.response?.status === 401) {
        try {
          const res = await api.get('/auth/google/auth');
          window.location.href = res.request.responseURL;
          return;
        } catch (e) { console.error(e); }
      }
      setBackupStatus({
        type: 'error',
        message: err.response?.data?.message || 'Sao lưu thất bại. Vui lòng thử lại.',
      });
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

  // ── Helper badges ──────────────────────────────────────────────────────────
  const getSeverityBadge = (failCount) => {
    if (failCount >= 20) return { cls: 'bg-red-100 text-red-700 border-red-300', label: 'Nghiêm trọng' };
    if (failCount >= 10) return { cls: 'bg-orange-100 text-orange-700 border-orange-300', label: 'Cao' };
    if (failCount >= 5)  return { cls: 'bg-yellow-100 text-yellow-700 border-yellow-300', label: 'Trung bình' };
    return { cls: 'bg-gray-100 text-gray-500 border-gray-200', label: 'Thấp' };
  };

  // Mức cảnh báo cho panel warning (3–4 = vàng, 5+ = đỏ)
  const getWarningSeverity = (failCount) => {
    if (failCount >= 5) return { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-500', badge: 'bg-red-100 text-red-700 border-red-200', label: 'Nguy hiểm' };
    return { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-500', badge: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Cảnh báo' };
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-10">

      {/* ── Tiêu đề + nút ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">
            {activeTab === TAB.HISTORY && '📜 Lịch sử hoạt động'}
            {activeTab === TAB.LOGIN && '🔐 Hoạt động đăng nhập'}
            {activeTab === TAB.SECURITY && '🛡️ Cảnh báo bảo mật'}
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {activeTab === TAB.HISTORY && 'Nhật ký thao tác của quản trị viên'}
            {activeTab === TAB.LOGIN && 'Theo dõi đăng nhập, reset mật khẩu và phát hiện truy cập bất thường'}
            {activeTab === TAB.SECURITY && 'Giám sát đăng nhập thất bại và quản lý IP bị chặn'}
          </p>
        </div>

        {activeTab === TAB.HISTORY && (
          <div className="flex gap-3">
            <button onClick={handleExport}
              className="bg-white border-2 border-blue-500 text-blue-600 hover:bg-blue-50 px-5 py-2.5 rounded-xl font-bold transition-all text-sm flex items-center gap-2 hover:-translate-y-0.5 hover:shadow-md">
              <Download size={16} /> Xuất CSV
            </button>
            <button onClick={handleGoogleBackup} disabled={backupLoading}
              className={`bg-blue-600 text-white hover:bg-blue-700 px-5 py-2.5 rounded-xl font-bold transition-all text-sm flex items-center gap-2 shadow-sm hover:-translate-y-0.5 hover:shadow-md ${backupLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {backupLoading
                ? <><Loader2 size={16} className="animate-spin" /> Đang sao lưu...</>
                : <><CloudUpload size={16} /> Sao lưu Drive</>}
            </button>
          </div>
        )}

        {(activeTab === TAB.LOGIN || activeTab === TAB.SECURITY) && (
          <button
            onClick={() => activeTab === TAB.LOGIN ? fetchLoginActivity() : (fetchAlerts(), fetchSecStats())}
            className="bg-white border-2 border-gray-200 text-gray-600 hover:bg-gray-50 px-5 py-2.5 rounded-xl font-bold transition-all text-sm flex items-center gap-2 hover:-translate-y-0.5 hover:shadow-md">
            <RefreshCw size={16} /> Làm mới
          </button>
        )}
      </div>

      {/* ── Tab switcher ── */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl w-fit flex-wrap">
        <button
          onClick={() => setActiveTab(TAB.HISTORY)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === TAB.HISTORY ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}>
          <ScrollText size={16} /> Lịch sử thao tác
        </button>

        <button
          onClick={() => setActiveTab(TAB.LOGIN)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === TAB.LOGIN ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}>
          <Fingerprint size={16} /> Hoạt động đăng nhập
          {loginWarningCount > 0 && (
            <span className="bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
              {loginWarningCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab(TAB.SECURITY)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === TAB.SECURITY ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}>
          <ShieldAlert size={16} /> Cảnh báo bảo mật
          {secStats?.todayFail > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
              {secStats.todayFail}
            </span>
          )}
        </button>
      </div>

      {/* ── Thông báo trạng thái ── */}
      {backupStatus && activeTab === TAB.HISTORY && (
        <div className={`p-4 rounded-xl border flex justify-between items-center ${backupStatus.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          <p className="text-sm font-semibold">{backupStatus.message}</p>
          <button onClick={() => setBackupStatus(null)} className="ml-3 opacity-40 hover:opacity-100"><X size={16} /></button>
        </div>
      )}
      {loginMsg && activeTab === TAB.LOGIN && (
        <div className={`p-4 rounded-xl border flex justify-between items-center ${loginMsg.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          <p className="text-sm font-semibold flex items-center gap-2">
            {loginMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            {loginMsg.message}
          </p>
          <button onClick={() => setLoginMsg(null)} className="ml-3 opacity-40 hover:opacity-100"><X size={16} /></button>
        </div>
      )}
      {secMsg && activeTab === TAB.SECURITY && (
        <div className={`p-4 rounded-xl border flex justify-between items-center ${secMsg.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          <p className="text-sm font-semibold">{secMsg.message}</p>
          <button onClick={() => setSecMsg(null)} className="ml-3 opacity-40 hover:opacity-100"><X size={16} /></button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: LỊCH SỬ THAO TÁC
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === TAB.HISTORY && (
        <>
          {/* Thẻ thống kê */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Tổng nhật ký', value: stats?.totalLogs, Icon: ScrollText, color: 'blue' },
              { label: 'Hôm nay', value: stats?.todayLogs, Icon: Clock, color: 'green' },
              { label: 'Đăng nhập', value: stats?.loginCount, Icon: LogIn, color: 'purple' },
              {
                label: 'Thao tác thay đổi',
                value: (stats?.createCount || 0) + (stats?.updateCount || 0) + (stats?.deleteCount || 0),
                Icon: Activity, color: 'orange',
              },
            ].map(({ label, value, Icon, color }, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
                <div className={`w-12 h-12 rounded-xl bg-${color}-50 flex items-center justify-center flex-shrink-0`}>
                  <Icon size={22} className={`text-${color}-500`} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{label}</p>
                  <p className="text-2xl font-black text-gray-800">{value ?? 0}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Bộ lọc */}
          <div className="bg-white p-5 rounded-2xl border shadow-sm flex flex-wrap gap-4 items-end">
            <div className="flex items-center gap-2 text-gray-400 mb-0.5">
              <Filter size={15} />
              <span className="text-xs font-bold uppercase tracking-wider">Bộ lọc</span>
            </div>
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
                className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-red-500 px-3 py-2 rounded-xl hover:bg-red-50 transition-all">
                <X size={13} /> Xoá bộ lọc
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
                    <tr>
                      <td colSpan="6" className="text-center py-10 text-gray-400">
                        <Loader2 size={20} className="animate-spin inline mr-2" /> Đang tải nhật ký...
                      </td>
                    </tr>
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
                            <span className="flex items-center gap-1 text-red-600 font-bold text-xs animate-pulse">
                              <AlertTriangle size={13} /> Khả nghi
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-emerald-500 font-bold text-xs">
                              <CheckCircle2 size={13} /> Bình thường
                            </span>
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
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: HOẠT ĐỘNG ĐĂNG NHẬP (MỚI)
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === TAB.LOGIN && (
        <>
          {/* ── Panel cảnh báo IP nghi ngờ (24h gần nhất) ────────────────────── */}
          {loginWarnings.length > 0 && (
            <div className="rounded-2xl border border-amber-200 overflow-hidden shadow-sm">
              {/* Header cảnh báo */}
              <button
                onClick={() => setWarningsExpanded(!warningsExpanded)}
                className="w-full bg-amber-50 px-5 py-4 flex items-center gap-3 hover:bg-amber-100/60 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <BellRing size={18} className="text-amber-600 animate-pulse" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-black text-amber-800 text-sm">
                    Phát hiện {loginWarnings.filter(w => !w.isBlocked).length} IP nghi ngờ trong 24h qua
                  </p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    Các IP đăng nhập sai từ 3 lần trở lên — nhấn để {warningsExpanded ? 'thu gọn' : 'xem chi tiết'}
                  </p>
                </div>
                <span className="text-amber-500">
                  <ChevronRight size={18} className={`transition-transform ${warningsExpanded ? 'rotate-90' : ''}`} />
                </span>
              </button>

              {/* Danh sách IP cảnh báo */}
              {warningsExpanded && (
                <div className="divide-y divide-amber-100 bg-white">
                  {loginWarnings.map((warn) => {
                    const sev = getWarningSeverity(warn.failCount);
                    const isProcessing = blockingIP === warn.ip;
                    return (
                      <div key={warn.ip}
                        className={`px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 ${sev.bg} border-l-4 ${sev.border}`}>
                        {/* Icon mức độ */}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${warn.failCount >= 5 ? 'bg-red-100' : 'bg-amber-100'}`}>
                          <TriangleAlert size={15} className={sev.icon} />
                        </div>

                        {/* IP + thông tin */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-black text-gray-800 flex items-center gap-1.5">
                              <Globe size={13} className="text-gray-400" />
                              {warn.ip}
                            </span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${sev.badge}`}>
                              {sev.label}
                            </span>
                            {warn.isBlocked && (
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-full border bg-red-100 text-red-700 border-red-200 flex items-center gap-1">
                                <Ban size={10} /> Đã bị chặn
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <CircleX size={12} className="text-red-400" />
                              <span className="font-bold text-red-600">{warn.failCount}</span> lần sai
                            </span>
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock size={12} />
                              Lần cuối: {formatDateTime(warn.lastAttempt)}
                            </span>
                            {warn.usernames.length > 0 && (
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <UserX size={12} />
                                Tài khoản thử: {warn.usernames.slice(0, 2).join(', ')}
                                {warn.usernames.length > 2 && ` +${warn.usernames.length - 2}`}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Nút chặn / bỏ chặn */}
                        <div className="flex-shrink-0">
                          {warn.isBlocked ? (
                            <button
                              onClick={() => handleUnblockIPLogin(warn.ip)}
                              disabled={isProcessing}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white text-green-600 hover:bg-green-50 border border-green-200 transition-all disabled:opacity-50 shadow-sm">
                              {isProcessing
                                ? <Loader2 size={12} className="animate-spin" />
                                : <Unlock size={12} />}
                              Bỏ chặn
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBlockIPLogin(warn.ip)}
                              disabled={isProcessing}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white text-red-600 hover:bg-red-50 border border-red-200 transition-all disabled:opacity-50 shadow-sm">
                              {isProcessing
                                ? <Loader2 size={12} className="animate-spin" />
                                : <Ban size={12} />}
                              Chặn IP
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Hết cảnh báo / trạng thái bình thường ────────────────────────── */}
          {!loginLoading && loginWarnings.length === 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
              <ShieldCheck size={18} className="text-emerald-500 flex-shrink-0" />
              <p className="text-sm text-emerald-800 font-semibold">
                Không phát hiện IP nghi ngờ trong 24h qua. Hệ thống đang hoạt động bình thường.
              </p>
            </div>
          )}

          {/* ── Bộ lọc ────────────────────────────────────────────────────────── */}
          <div className="bg-white p-5 rounded-2xl border shadow-sm flex flex-wrap gap-4 items-end">
            <div className="flex items-center gap-2 text-gray-400">
              <Filter size={15} />
              <span className="text-xs font-bold uppercase tracking-wider">Bộ lọc</span>
            </div>

            {/* Loại sự kiện */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Loại sự kiện</label>
              <select value={loginFilterAction} onChange={e => { setLoginFilterAction(e.target.value); setLoginPage(1); }}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:border-amber-400 outline-none transition-colors">
                {LOGIN_ACTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>

            {/* Lọc theo IP */}
            <div className="min-w-[160px]">
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Địa chỉ IP</label>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="192.168.1.1"
                  value={loginFilterIP}
                  onChange={e => { setLoginFilterIP(e.target.value); setLoginPage(1); }}
                  className="bg-gray-50 border-2 border-gray-100 rounded-xl pl-8 pr-4 py-2.5 text-sm focus:border-amber-400 outline-none transition-colors w-full"
                />
              </div>
            </div>

            {/* Từ ngày */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Từ ngày</label>
              <input type="date" value={loginStartDate} onChange={e => { setLoginStartDate(e.target.value); setLoginPage(1); }}
                className="bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:border-amber-400 outline-none transition-colors" />
            </div>

            {/* Đến ngày */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Đến ngày</label>
              <input type="date" value={loginEndDate} onChange={e => { setLoginEndDate(e.target.value); setLoginPage(1); }}
                className="bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:border-amber-400 outline-none transition-colors" />
            </div>

            {(loginFilterAction || loginFilterIP || loginStartDate || loginEndDate) && (
              <button
                onClick={() => { setLoginFilterAction(''); setLoginFilterIP(''); setLoginStartDate(''); setLoginEndDate(''); setLoginPage(1); }}
                className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-red-500 px-3 py-2 rounded-xl hover:bg-red-50 transition-all">
                <X size={13} /> Xoá bộ lọc
              </button>
            )}
          </div>

          {/* ── Bảng log đăng nhập ────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center gap-2">
              <LogIn size={16} className="text-gray-400" />
              <h3 className="font-bold text-gray-700 text-sm">Nhật ký đăng nhập & bảo mật</h3>
              <span className="ml-auto text-xs text-gray-400">Mới nhất trước</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {['Thời gian', 'Loại sự kiện', 'Tài khoản', 'Địa chỉ IP', 'Lý do / Chi tiết', 'Thiết bị', 'Trạng thái IP'].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-bold text-gray-500 text-xs uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loginLoading ? (
                    <tr>
                      <td colSpan="7" className="text-center py-12 text-gray-400">
                        <Loader2 size={20} className="animate-spin inline mr-2" /> Đang tải...
                      </td>
                    </tr>
                  ) : loginLogs.length > 0 ? (
                    loginLogs.map((log) => {
                      const meta = getLoginActionMeta(log.action);
                      const isFail = log.action === 'LOGIN_FAIL';
                      return (
                        <tr key={log._id}
                          className={`hover:bg-gray-50/50 transition-colors ${isFail ? 'bg-red-50/30' : ''}`}>

                          {/* Thời gian */}
                          <td className="px-4 py-3 text-gray-500 tabular-nums text-xs whitespace-nowrap">
                            {formatDateTime(log.createdAt)}
                          </td>

                          {/* Loại sự kiện */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border ${meta.cls}`}>
                              <meta.Icon size={11} />
                              {meta.label}
                            </span>
                          </td>

                          {/* Tài khoản */}
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs text-gray-700 font-semibold">
                              {log.username || <span className="text-gray-300 italic">Không rõ</span>}
                            </span>
                          </td>

                          {/* IP */}
                          <td className="px-4 py-3">
                            <span className="font-mono font-bold text-gray-700 text-xs flex items-center gap-1">
                              <Globe size={12} className="text-gray-400 flex-shrink-0" />
                              {log.ip}
                            </span>
                          </td>

                          {/* Lý do */}
                          <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate" title={log.reason || ''}>
                            {log.reason || <span className="text-gray-300">—</span>}
                          </td>

                          {/* Thiết bị (user-agent rút gọn) */}
                          <td className="px-4 py-3">
                            <span className="flex items-center gap-1 text-xs text-gray-400 max-w-[140px] truncate" title={log.userAgent || ''}>
                              <MonitorSmartphone size={12} className="flex-shrink-0" />
                              {log.userAgent
                                ? log.userAgent.substring(0, 40) + (log.userAgent.length > 40 ? '...' : '')
                                : <span className="italic">Không rõ</span>}
                            </span>
                          </td>

                          {/* Trạng thái IP */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            {log.isBlocked ? (
                              <div className="flex flex-col gap-1.5">
                                <span className="flex items-center gap-1 text-red-600 font-bold text-xs">
                                  <Ban size={12} /> Đang bị chặn
                                </span>
                                <button
                                  onClick={() => handleUnblockIPLogin(log.ip)}
                                  disabled={blockingIP === log.ip}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-green-50 text-green-600 hover:bg-green-100 border border-green-200 transition-all disabled:opacity-50">
                                  {blockingIP === log.ip
                                    ? <Loader2 size={10} className="animate-spin" />
                                    : <Unlock size={10} />}
                                  Bỏ chặn
                                </button>
                              </div>
                            ) : isFail ? (
                              <div className="flex flex-col gap-1.5">
                                <span className="flex items-center gap-1 text-gray-400 text-xs">
                                  <ShieldCheck size={12} /> Chưa chặn
                                </span>
                                <button
                                  onClick={() => handleBlockIPLogin(log.ip)}
                                  disabled={blockingIP === log.ip}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-all disabled:opacity-50">
                                  {blockingIP === log.ip
                                    ? <Loader2 size={10} className="animate-spin" />
                                    : <Ban size={10} />}
                                  Chặn IP
                                </button>
                              </div>
                            ) : (
                              <span className="flex items-center gap-1 text-emerald-500 text-xs font-semibold">
                                <ShieldCheck size={12} /> Bình thường
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-14">
                        <LogIn size={36} className="mx-auto text-gray-200 mb-3" />
                        <p className="text-gray-400 font-semibold">Không có dữ liệu hoạt động đăng nhập</p>
                        <p className="text-gray-300 text-xs mt-1">Thử thay đổi bộ lọc hoặc khoảng thời gian</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination page={loginPage} totalPages={loginTotalPages} onPageChange={setLoginPage} />
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: CẢNH BÁO BẢO MẬT
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === TAB.SECURITY && (
        <>
          {/* Thẻ thống kê bảo mật */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: 'Tổng lần fail', value: secStats?.totalFail, Icon: AlertTriangle, color: 'red' },
              { label: 'Fail hôm nay', value: secStats?.todayFail, Icon: Clock, color: 'orange' },
              { label: 'IP đang bị chặn', value: secStats?.totalBlocked, Icon: Ban, color: 'red' },
              { label: 'Đăng nhập thành công', value: secStats?.totalSuccess, Icon: CheckCircle2, color: 'green' },
              { label: 'Yêu cầu reset pass', value: secStats?.totalResetReq, Icon: KeyRound, color: 'purple' },
            ].map(({ label, value, Icon, color }, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-all">
                <div className={`w-11 h-11 rounded-xl bg-${color}-50 flex items-center justify-center flex-shrink-0`}>
                  <Icon size={20} className={`text-${color}-500`} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-tight">{label}</p>
                  <p className="text-2xl font-black text-gray-800">{value ?? 0}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Banner hướng dẫn */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <ShieldAlert size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              <span className="font-bold">Lưu ý:</span> Hệ thống tự động chặn IP sau <span className="font-bold">5 lần đăng nhập sai</span> trong vòng 10 phút.
              Bạn có thể chặn/bỏ chặn thủ công bên dưới. Nếu chặn nhầm thiết bị, nhấn <span className="font-bold">Bỏ chặn</span> để gỡ.
            </p>
          </div>

          {/* Bảng cảnh báo IP */}
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center gap-2">
              <Globe size={16} className="text-gray-400" />
              <h3 className="font-bold text-gray-700 text-sm">Danh sách IP đáng ngờ</h3>
              <span className="ml-auto text-xs text-gray-400">Sắp xếp theo số lần thất bại</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {['Địa chỉ IP', 'Số lần sai', 'Mức độ', 'Lần cuối', 'Tài khoản thử', 'Trạng thái', 'Hành động'].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-bold text-gray-500 text-xs uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {alertsLoading ? (
                    <tr>
                      <td colSpan="7" className="text-center py-12 text-gray-400">
                        <Loader2 size={20} className="animate-spin inline mr-2" /> Đang tải dữ liệu...
                      </td>
                    </tr>
                  ) : alerts.length > 0 ? (
                    alerts.map((alert) => {
                      const severity = getSeverityBadge(alert.failCount);
                      const isProcessing = blockingIPSec === alert.ip;
                      return (
                        <tr key={alert.ip}
                          className={`hover:bg-gray-50/50 transition-colors ${alert.isBlocked ? 'bg-red-50/40' : ''}`}>
                          <td className="px-4 py-3">
                            <span className="font-mono font-bold text-gray-800 text-sm flex items-center gap-1.5">
                              <Globe size={13} className="text-gray-400" />
                              {alert.ip}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-black text-gray-800 text-lg">{alert.failCount}</span>
                            <span className="text-gray-400 text-xs ml-1">lần</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${severity.cls}`}>
                              {severity.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 tabular-nums">
                            {formatDateTime(alert.lastAttempt)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1 max-w-[160px]">
                              {alert.usernames.slice(0, 3).map((u, i) => (
                                <span key={i} className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded-md font-mono">
                                  {u}
                                </span>
                              ))}
                              {alert.usernames.length > 3 && (
                                <span className="text-[10px] text-gray-400">+{alert.usernames.length - 3}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {alert.isBlocked ? (
                              <span className="flex items-center gap-1.5 text-red-600 font-bold text-xs">
                                <Ban size={13} /> Đang bị chặn
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 text-gray-400 font-bold text-xs">
                                <ShieldCheck size={13} /> Chưa chặn
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {alert.isBlocked ? (
                              <button
                                onClick={() => handleUnblockIP(alert.ip)}
                                disabled={isProcessing}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-green-50 text-green-600 hover:bg-green-100 border border-green-200 transition-all disabled:opacity-50">
                                {isProcessing ? <Loader2 size={12} className="animate-spin" /> : <Unlock size={12} />}
                                Bỏ chặn
                              </button>
                            ) : (
                              <button
                                onClick={() => handleBlockIP(alert.ip)}
                                disabled={isProcessing}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-all disabled:opacity-50">
                                {isProcessing ? <Loader2 size={12} className="animate-spin" /> : <Ban size={12} />}
                                Chặn IP
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-14">
                        <ShieldCheck size={40} className="mx-auto text-green-300 mb-3" />
                        <p className="text-gray-400 font-semibold">Không có IP đáng ngờ nào</p>
                        <p className="text-gray-300 text-xs mt-1">Hệ thống đang hoạt động bình thường</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination page={alertPage} totalPages={alertTotalPages} onPageChange={setAlertPage} />
          </div>
        </>
      )}
    </div>
  );
};

// ─── Pagination component tái sử dụng ────────────────────────────────────────
const Pagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="px-4 py-4 border-t bg-gray-50/50 flex justify-center items-center gap-2">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="w-8 h-8 rounded-lg flex items-center justify-center bg-white border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-all">
        <ChevronLeft size={15} />
      </button>
      {[...Array(Math.min(totalPages, 7))].map((_, i) => {
        const p = i + 1;
        return (
          <button key={p} onClick={() => onPageChange(p)}
            className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${page === p ? 'bg-blue-600 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
            {p}
          </button>
        );
      })}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="w-8 h-8 rounded-lg flex items-center justify-center bg-white border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-all">
        <ChevronRight size={15} />
      </button>
    </div>
  );
};

export default AdminHistory;