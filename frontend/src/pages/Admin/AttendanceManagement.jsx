import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getByDate,
  updateAttendance,
  upsertAttendanceByDate,
  exportAttendanceByDate,
  exportAttendanceByMonth
} from '../../services/attendanceService';
import { toast } from 'react-toastify';
import {
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Clock,
  Calendar,
  Search,
  Edit3,
  Save,
  X,
  LogIn,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Trash2,
  Download
} from 'lucide-react';
import api from '../../services/api';

// ── Color palette from sample UI ───────────────────────────────────────────
const COLORS = {
  primary: '#1C695C',
  primaryLight: '#3FA48F',
  accentOrange: '#C96A3D',
  accentYellow: '#D9A441',
  neutralInk: '#141414',
  statusSuccess: '#2D8A78',
  statusWarning: '#D9863D',
};

/**
 * Helper: lấy ngày hôm nay theo VN timezone → string YYYY-MM-DD
 */
const getTodayVN = () => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(new Date());
};

const buildTimelineState = (logs = [], selectedDate = '') => {
  const issues = [];
  const invalidRows = new Set();

  if (!Array.isArray(logs) || logs.length === 0) {
    issues.push('Vui lòng thêm log chấm công.');
    return { isValid: false, issues, invalidRows: [], payload: null, autoAddedCheckout: false };
  }

  const parsed = logs.map((log, idx) => {
    const parsedTime = new Date(`${log?.time || ''}:00+07:00`);
    const isTimeValid = !Number.isNaN(parsedTime.getTime());
    const expectedType = idx % 2 === 0 ? 'checkin' : 'checkout';
    const isTypeValid = log?.type === expectedType;
    if (!isTimeValid) invalidRows.add(idx);
    if (!isTypeValid) invalidRows.add(idx);
    return {
      idx,
      type: log?.type,
      expectedType,
      parsedTime,
      isTimeValid,
      isTypeValid
    };
  });

  if (parsed[0]?.type !== 'checkin') {
    issues.push('Checkin phải luôn đứng trước checkout trong từng cặp');
    invalidRows.add(0);
  }

  parsed.forEach((row) => {
    if (!row.isTimeValid) {
      issues.push(`Bước ${row.idx + 1}: thời gian không hợp lệ.`);
    }
    if (!row.isTypeValid) {
      issues.push(`Bước ${row.idx + 1}: sai thứ tự loại log (kỳ vọng ${row.expectedType}).`);
    }
  });

  for (let i = 1; i < parsed.length; i += 1) {
    if (parsed[i - 1].isTimeValid && parsed[i].isTimeValid && parsed[i].parsedTime < parsed[i - 1].parsedTime) {
      issues.push('Thời gian đang phá vỡ cấu trúc checkin/checkout');
      invalidRows.add(i - 1);
      invalidRows.add(i);
    }
  }

  let normalized = parsed.map((row) => ({
    type: row.type,
    time: row.parsedTime
  }));

  let autoAddedCheckout = false;
  if (normalized.length % 2 !== 0 && normalized[normalized.length - 1]?.type === 'checkin') {
    const endOfDay = new Date(`${selectedDate}T23:59:59+07:00`);
    if (!Number.isNaN(endOfDay.getTime()) && normalized[normalized.length - 1].time <= endOfDay) {
      normalized.push({ type: 'checkout', time: endOfDay });
      autoAddedCheckout = true;
    } else {
      issues.push('Thời gian đang phá vỡ cấu trúc checkin/checkout');
      invalidRows.add(normalized.length - 1);
    }
  }

  if (normalized.length % 2 !== 0) {
    issues.push('Checkin phải luôn đứng trước checkout trong từng cặp');
  }

  for (let i = 1; i < normalized.length; i += 1) {
    if (normalized[i].type === normalized[i - 1].type) {
      issues.push('Checkin phải luôn đứng trước checkout trong từng cặp');
      invalidRows.add(Math.min(i, logs.length - 1));
      invalidRows.add(Math.min(i - 1, logs.length - 1));
    }
  }

  const uniqueIssues = [...new Set(issues)];
  const isValid = uniqueIssues.length === 0;

  return {
    isValid,
    issues: uniqueIssues,
    invalidRows: [...invalidRows],
    payload: isValid
      ? normalized.map((item) => ({ type: item.type, time: item.time.toISOString() }))
      : null,
    autoAddedCheckout
  };
};

// ── Edit Modal ─────────────────────────────────────────────────────────────
const EditModal = ({ isOpen, onClose, staffName, record, selectedDate, onSave }) => {
  const [logs, setLogs] = useState([]);
  const [saving, setSaving] = useState(false);
  const timelineState = buildTimelineState(logs, selectedDate);

  useEffect(() => {
    if (record?.attendance?.logs) {
      setLogs(record.attendance.logs.map(l => ({
        type: l.type,
        time: new Date(l.time).toLocaleString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).replace(' ', 'T').slice(0, 16)
      })));
    } else {
      setLogs([]);
    }
  }, [record]);

  if (!isOpen) return null;

  const addLog = () => {
    const now = new Date();
    const vnTime = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit', minute: '2-digit', hour12: false
    }).format(now);
    setLogs([...logs, {
      type: logs.length % 2 === 0 ? 'checkin' : 'checkout',
      time: `${selectedDate}T${vnTime}`
    }]);
  };

  const removeLog = (idx) => {
    setLogs(logs.filter((_, i) => i !== idx));
  };

  const updateLog = (idx, field, value) => {
    const updated = [...logs];
    updated[idx] = { ...updated[idx], [field]: value };
    setLogs(updated);
  };

  const handleSave = async () => {
    if (!timelineState.isValid || !timelineState.payload) {
      toast.error('Thời gian đang phá vỡ cấu trúc checkin/checkout');
      return;
    }
    setSaving(true);
    try {
      if (record?.attendance?._id) {
        await updateAttendance(record.attendance._id, timelineState.payload);
      } else {
        await upsertAttendanceByDate({
          staffId: record?.staff?._id,
          date: selectedDate,
          logs: timelineState.payload
        });
      }
      if (timelineState.autoAddedCheckout) {
        toast.info('Hệ thống đã tự động thêm check-out lúc 23:59 do thiếu dữ liệu');
      }
      toast.success('Cập nhật thành công');
      onSave();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Lỗi khi cập nhật');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fadeInUp">
      <div
        className="bg-white rounded-3xl shadow-heavy w-full max-w-md p-6 relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-gray-800 text-lg">Chỉnh sửa chấm công</h3>
            <p className="text-xs text-gray-400 font-medium mt-0.5">{staffName}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-500"
          >
            <X size={16} />
          </button>
        </div>

        {/* Logs Editor */}
        <div className="mb-3 rounded-xl bg-blue-50 border border-blue-100 px-3 py-2">
          <p className="text-[11px] font-semibold text-blue-700">
            Đây là dòng thời gian liên tục trong ngày. Mỗi bước phải đúng thứ tự thời gian và luân phiên checkin - checkout.
          </p>
        </div>
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {logs.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-6">Chưa có log nào</p>
          )}
          {logs.map((log, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-2 rounded-xl p-3 ${
                timelineState.invalidRows.includes(idx)
                  ? 'bg-red-50 border border-red-200'
                  : 'bg-gray-50'
              }`}
            >
              <span className="w-7 h-7 shrink-0 rounded-full bg-gray-200 text-gray-700 text-[11px] font-bold flex items-center justify-center">
                {idx + 1}
              </span>
              <select
                value={log.type}
                onChange={e => updateLog(idx, 'type', e.target.value)}
                className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-200"
              >
                <option value="checkin">Check-in</option>
                <option value="checkout">Check-out</option>
              </select>
              <input
                type="time"
                value={log.time.includes('T') ? log.time.split('T')[1] : log.time}
                onChange={e => {
                  const newTime = e.target.value;
                  const newDateTime = `${selectedDate}T${newTime}`;
                  updateLog(idx, 'time', newDateTime);
                }}
                className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
              <button
                onClick={() => removeLog(idx)}
                className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-400 hover:text-red-600"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        {timelineState.autoAddedCheckout && (
          <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-3">
            <p className="text-xs text-blue-700 font-semibold">
              Hệ thống sẽ tự động thêm check-out lúc 23:59 do thiếu dữ liệu.
            </p>
          </div>
        )}
        {timelineState.issues.length > 0 && (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs text-amber-700 font-bold mb-1">Cảnh báo timeline:</p>
            <ul className="space-y-1">
              {timelineState.issues.map((issue) => (
                <li key={issue} className="text-xs text-amber-700">- {issue}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Add + Save */}
        <div className="flex gap-3 mt-5">
          <button
            onClick={addLog}
            className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-700 font-bold text-sm hover:bg-gray-200 transition-colors"
          >
            + Thêm log
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !timelineState.isValid}
            className={`flex-1 py-3 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              saving || !timelineState.isValid ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[0.98]'
            }`}
            style={{ backgroundColor: COLORS.primary }}
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════
const AttendanceManagement = () => {
  const [selectedDate, setSelectedDate] = useState(getTodayVN());
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [editStaffName, setEditStaffName] = useState('');
  const [unmatchedCheckins, setUnmatchedCheckins] = useState([]);
  const [unmatchedDismissed, setUnmatchedDismissed] = useState(false);

  // Export panel
  const [exportPanelOpen, setExportPanelOpen] = useState(false);
  const [exportTab, setExportTab] = useState('date'); // 'date' | 'month'
  const exportBtnRef = useRef(null);
  const [exportPanelPos, setExportPanelPos] = useState({ top: 0, left: 0 });
  const nowVN = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  const [exportMonth, setExportMonth] = useState(nowVN.getMonth() + 1);
  const [exportYear, setExportYear] = useState(nowVN.getFullYear());

  // ── Fetch ────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getByDate(selectedDate);
      setData(res.data.data || []);
    } catch (err) {
      setError('Không thể tải dữ liệu chấm công');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch unmatched checkins khi xem ngày hôm nay
  useEffect(() => {
    if (selectedDate !== getTodayVN()) {
      setUnmatchedCheckins([]);
      setUnmatchedDismissed(false);
      return;
    }
    const fetchUnmatched = async () => {
      try {
        const res = await api.get('/salary/unmatched-checkins', { params: { date: selectedDate } });
        setUnmatchedCheckins(res.data?.data || []);
      } catch (err) { /* non-critical */ }
    };
    fetchUnmatched();
    setUnmatchedDismissed(false);
  }, [selectedDate]);

  // ── Stats ────────────────────────────────────────────────────────────
  const totalStaff = data.length;
  const checkedIn = data.filter(d => d.attendance?.logs?.some(l => l.type === 'checkin')).length;
  const notCheckedIn = totalStaff - checkedIn;
  const working = data.filter(d => {
    if (!d.attendance?.logs?.length) return false;
    const last = d.attendance.logs[d.attendance.logs.length - 1];
    return last.type === 'checkin'; // checked in but not checked out yet
  }).length;

  // ── Filter ───────────────────────────────────────────────────────────
  const filtered = data.filter(d => {
    const name = (d.staff?.displayName || d.staff?.username || '').toLowerCase();
    return name.includes(searchTerm.toLowerCase());
  });

  // ── Date navigation ──────────────────────────────────────────────────
  const changeDate = (offset) => {
    const d = new Date(selectedDate + 'T00:00:00+07:00');
    d.setDate(d.getDate() + offset);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const isToday = selectedDate === getTodayVN();

  // ── Get status for a staff member ────────────────────────────────────
  const getStaffStatus = (item) => {
    if (!item.attendance?.logs?.length) {
      return { label: 'Chưa chấm công', color: 'bg-gray-100 text-gray-400', dotColor: 'bg-gray-300' };
    }
    const lastLog = item.attendance.logs[item.attendance.logs.length - 1];
    if (lastLog.type === 'checkin') {
      return { label: 'Đang làm việc', color: 'bg-emerald-50 text-emerald-600', dotColor: 'bg-emerald-400' };
    }
    return { label: 'Đã check-out', color: 'bg-blue-50 text-blue-600', dotColor: 'bg-blue-400' };
  };

  const getLastActionTime = (item) => {
    if (!item.attendance?.logs?.length) return '—';
    const lastLog = item.attendance.logs[item.attendance.logs.length - 1];
    return new Date(lastLog.time).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Ho_Chi_Minh'
    });
  };

  // ── Edit handler ─────────────────────────────────────────────────────
  const handleEdit = (item) => {
    setEditRecord(item);
    setEditStaffName(item.staff?.displayName || item.staff?.username || '');
    setEditOpen(true);
  };

  const handleExportByDate = async () => {
    if (!selectedDate || exporting) return;
    setExporting(true);
    setExportPanelOpen(false);
    try {
      await exportAttendanceByDate(selectedDate);
      toast.success('Xuất file Excel thành công');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không thể xuất file Excel');
    } finally {
      setExporting(false);
    }
  };

  const handleExportByMonth = async () => {
    if (exporting) return;
    setExporting(true);
    setExportPanelOpen(false);
    try {
      await exportAttendanceByMonth(exportYear, exportMonth);
      toast.success('Xuất file Excel thành công');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không thể xuất file Excel');
    } finally {
      setExporting(false);
    }
  };

  // ── Role label ───────────────────────────────────────────────────────
  const getRoleBadge = (role) => {
    switch (role) {
      case 'teacher':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 uppercase">GV</span>;
      case 'marketing':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-600 uppercase">MKT</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <h1 className="text-2xl font-bold text-gray-800">Quản lý chấm công</h1>

      {/* ─── Stats Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-gray-400" />
            <p className="text-xs font-semibold text-gray-400">Tổng nhân viên</p>
          </div>
          <p className="text-3xl font-black text-gray-800">{totalStaff}</p>
        </div>

        <div className="rounded-2xl shadow-sm p-5 text-white" style={{ backgroundColor: COLORS.statusSuccess }}>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={16} className="opacity-80" />
            <p className="text-xs font-semibold opacity-80">Đã check-in</p>
          </div>
          <p className="text-3xl font-black">{checkedIn}</p>
        </div>

        <div className="rounded-2xl shadow-sm p-5 text-white" style={{ backgroundColor: COLORS.accentOrange }}>
          <div className="flex items-center gap-2 mb-2">
            <XCircle size={16} className="opacity-80" />
            <p className="text-xs font-semibold opacity-80">Chưa check-in</p>
          </div>
          <p className="text-3xl font-black">{notCheckedIn}</p>
        </div>

        <div className="rounded-2xl shadow-sm p-5 text-white" style={{ backgroundColor: COLORS.accentYellow }}>
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="opacity-80" />
            <p className="text-xs font-semibold opacity-80">Đang làm việc</p>
          </div>
          <p className="text-3xl font-black">{working}</p>
        </div>
      </div>

      {/* ⚠️ Cảnh báo GV checkin không khớp TKB */}
      {unmatchedCheckins.length > 0 && !unmatchedDismissed && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle size={18} className="text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-amber-800 text-sm">
              {unmatchedCheckins.length} GV đã checkin nhưng không khớp ô TKB nào
            </p>
            <p className="text-[11px] text-amber-600 mt-0.5">
              Có thể do dạy bù ngoài TKB hoặc admin chưa tạo ô TKB. Kiểm tra và tạo ô TKB nếu cần.
            </p>
            <ul className="mt-1.5 space-y-0.5">
              {unmatchedCheckins.map(item => (
                <li key={item.teacher._id} className="text-xs text-amber-700 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  <span className="font-semibold">{item.teacher.displayName || item.teacher.username}</span>
                  <span className="text-amber-500">(checkin lúc {item.checkinTime})</span>
                </li>
              ))}
            </ul>
          </div>
          <button
            onClick={() => setUnmatchedDismissed(true)}
            className="opacity-40 hover:opacity-100 transition-opacity shrink-0 mt-0.5"
          >
            <X size={14} className="text-amber-700" />
          </button>
        </div>
      )}

      {/* ─── Date Picker + Search ───────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => changeDate(-1)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ChevronLeft size={18} className="text-gray-500" />
          </button>

          <div className="relative">
            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 shadow-sm"
              style={{ focusRingColor: COLORS.primary }}
            />
          </div>

          <button
            onClick={() => changeDate(1)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ChevronRight size={18} className="text-gray-500" />
          </button>

          {!isToday && (
            <button
              onClick={() => setSelectedDate(getTodayVN())}
              className="ml-2 text-xs font-bold px-3 py-2 rounded-xl transition-all hover:scale-[0.98]"
              style={{ backgroundColor: COLORS.primary, color: '#fff' }}
            >
              Hôm nay
            </button>
          )}
        </div>

        <div className="relative w-full md:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm nhân viên..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 shadow-sm"
          />
        </div>
        <div className="relative">
          <button
            ref={exportBtnRef}
            onClick={() => {
              if (!exportPanelOpen && exportBtnRef.current) {
                const rect = exportBtnRef.current.getBoundingClientRect();
                const panelWidth = 288; // w-72
                const margin = 8;
                let left = rect.right - panelWidth;
                if (left < margin) left = margin;
                if (left + panelWidth > window.innerWidth - margin) left = window.innerWidth - panelWidth - margin;
                setExportPanelPos({ top: rect.bottom + margin, left });
              }
              setExportPanelOpen(prev => !prev);
            }}
            disabled={exporting || loading}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              exporting || loading
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'text-white hover:scale-[0.98]'
            }`}
            style={exporting || loading ? {} : { backgroundColor: COLORS.primary }}
          >
            <Download size={16} />
            {exporting ? 'Đang xuất...' : 'Xuất Excel'}
            <ChevronDown size={14} className={`transition-transform ${exportPanelOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Export dropdown panel — dùng fixed để không bị clip bởi overflow của parent */}
          {exportPanelOpen && (
            <div
              className="fixed z-[9999] bg-white border border-gray-200 rounded-2xl shadow-lg p-4 w-72"
              style={{ top: exportPanelPos.top, left: exportPanelPos.left }}
              onClick={e => e.stopPropagation()}
            >
              {/* Overlay để đóng khi click ngoài */}
              <div
                className="fixed inset-0 z-[-1]"
                onClick={() => setExportPanelOpen(false)}
              />

              <p className="text-xs font-semibold text-gray-500 mb-3">Chọn kiểu xuất</p>

              {/* Tab */}
              <div className="flex rounded-lg overflow-hidden border border-gray-200 mb-4 text-xs">
                <button
                  onClick={() => setExportTab('date')}
                  className={`flex-1 py-2 px-3 font-semibold transition-colors ${
                    exportTab === 'date' ? 'text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                  style={exportTab === 'date' ? { backgroundColor: COLORS.primary } : {}}
                >
                  📅 Theo ngày
                </button>
                <button
                  onClick={() => setExportTab('month')}
                  className={`flex-1 py-2 px-3 font-semibold transition-colors ${
                    exportTab === 'month' ? 'text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                  style={exportTab === 'month' ? { backgroundColor: COLORS.primary } : {}}
                >
                  🗓 Theo tháng
                </button>
              </div>

              {exportTab === 'date' ? (
                <div className="space-y-3">
                  <p className="text-xs text-gray-400">Xuất chấm công ngày đang xem. File có 2 sheet: theo nhân viên &amp; theo ngày.</p>
                  <div className="bg-gray-50 rounded-xl px-3 py-2 text-xs font-bold text-gray-700">
                    📅 {selectedDate}
                  </div>
                  <button
                    onClick={handleExportByDate}
                    className="w-full py-2.5 rounded-xl text-white text-xs font-bold transition-all hover:scale-[0.98]"
                    style={{ backgroundColor: COLORS.primary }}
                  >
                    ⬇ Tải xuống
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-gray-400">Xuất toàn bộ tháng. File có 2 sheet: theo nhân viên &amp; theo ngày.</p>

                  {/* Chọn năm */}
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 mb-1.5">Năm</p>
                    <div className="flex gap-1.5">
                      {[nowVN.getFullYear(), nowVN.getFullYear() - 1, nowVN.getFullYear() - 2].map(y => (
                        <button
                          key={y}
                          onClick={() => setExportYear(y)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                            exportYear === y
                              ? 'text-white border-transparent'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-400'
                          }`}
                          style={exportYear === y ? { backgroundColor: COLORS.primary } : {}}
                        >
                          {y}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Chọn tháng — lưới 4×3 */}
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 mb-1.5">Tháng</p>
                    <div className="grid grid-cols-4 gap-1">
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
                        const isFuture = exportYear === nowVN.getFullYear() && m > nowVN.getMonth() + 1;
                        return (
                          <button
                            key={m}
                            disabled={isFuture}
                            onClick={() => !isFuture && setExportMonth(m)}
                            className={`py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                              exportMonth === m && !isFuture
                                ? 'text-white border-transparent'
                                : isFuture
                                ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-400'
                            }`}
                            style={exportMonth === m && !isFuture ? { backgroundColor: COLORS.primary } : {}}
                          >
                            T{m}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={handleExportByMonth}
                    className="w-full py-2.5 rounded-xl text-white text-xs font-bold transition-all hover:scale-[0.98]"
                    style={{ backgroundColor: COLORS.primary }}
                  >
                    ⬇ Tải xuống T{exportMonth}/{exportYear}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── Table ────────────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={20} className="text-red-500 shrink-0" />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: COLORS.primary, borderTopColor: 'transparent' }}
          />
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead>
                <tr className="text-gray-400 uppercase text-[10px] tracking-widest font-bold border-b border-gray-50">
                  <th className="px-6 py-4">Nhân viên</th>
                  <th className="px-6 py-4">Vai trò</th>
                  <th className="px-6 py-4">Lần cuối</th>
                  <th className="px-6 py-4 text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-center">Logs</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="text-3xl opacity-20 mb-2">🔍</div>
                      <p className="text-gray-400 text-sm font-semibold">Không tìm thấy nhân viên</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => {
                    const status = getStaffStatus(item);
                    const logCount = item.attendance?.logs?.length || 0;
                    const wasEdited = item.attendance?.adminEdited === true;

                    return (
                      <tr key={item.staff._id} className={`transition-colors ${wasEdited ? 'bg-red-50 hover:bg-red-100/60' : 'hover:bg-gray-50/50'}`}>
                        {/* Name */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                              style={{ backgroundColor: item.staff.role === 'teacher' ? '#059669' : '#7c3aed' }}
                            >
                              {(item.staff.displayName || item.staff.username || 'S').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-gray-800 text-sm">
                                {item.staff.displayName || item.staff.username}
                              </span>
                              {wasEdited && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <span className="text-[10px] font-bold text-red-500 bg-red-100 px-2 py-0.5 rounded-full">
                                    ✏️ Admin đã chỉnh sửa
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-6 py-4">
                          {getRoleBadge(item.staff.role)}
                        </td>

                        {/* Last action */}
                        <td className="px-6 py-4">
                          <span className="text-sm font-mono font-bold text-gray-600">
                            {getLastActionTime(item)}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1 rounded-full uppercase ${status.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${status.dotColor}`} />
                            {status.label}
                          </span>
                        </td>

                        {/* Log count */}
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-bold text-gray-500">
                            {logCount}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleEdit(item)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-all hover:bg-blue-50 text-blue-600 hover:scale-105"
                            title={!item.attendance ? 'Tạo chấm công thủ công cho ngày này' : 'Chỉnh sửa chấm công'}
                          >
                            <Edit3 size={13} />
                            {!item.attendance ? 'Tạo' : 'Sửa'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <EditModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        staffName={editStaffName}
        record={editRecord}
        selectedDate={selectedDate}
        onSave={fetchData}
      />
    </div>
  );
};

export default AttendanceManagement;
