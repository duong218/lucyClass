import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  toggleAttendance,
  getTodayAttendance,
  getHistory
} from '../../services/attendanceService';
import { toast } from 'react-toastify';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  LogIn,
  LogOut,
  Calendar,
  History
} from 'lucide-react';

// ── Color palette from sample UI ───────────────────────────────────────────
const COLORS = {
  primary: '#1C695C',
  primaryLight: '#3FA48F',
  accentOrange: '#C96A3D',
  accentYellow: '#D9A441',
  neutralWhite: '#F5F5F0',
  neutralBeige: '#E6DCCF',
  neutralGray: '#4A4A4A',
  neutralInk: '#141414',
  statusSuccess: '#2D8A78',
  statusWarning: '#D9863D',
};

const getTodayVN = () => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(new Date());
};

// ── Live Clock Component ───────────────────────────────────────────────────
const LiveClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Ho_Chi_Minh'
  });

  const seconds = time.toLocaleTimeString('vi-VN', {
    second: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh'
  }).split(':').pop();

  return (
    <div className="text-center">
      <span
        className="text-6xl font-black tracking-tight"
        style={{ color: COLORS.primary }}
      >
        {hours}
      </span>
      <span className="text-2xl font-bold text-gray-300 ml-1">:{seconds}</span>
      <p className="text-sm text-gray-400 mt-1 font-semibold">
        {time.toLocaleDateString('vi-VN', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          timeZone: 'Asia/Ho_Chi_Minh'
        })}
      </p>
    </div>
  );
};

// ── Calendar Component ─────────────────────────────────────────────────────
const AttendanceCalendar = ({ historyMap, onDateClick }) => {
  const [viewDate, setViewDate] = useState(new Date());

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const monthLabel = viewDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });

  const todayStr = getTodayVN();

  // Build calendar grid
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const getDateStr = (day) => {
    const m = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${m}-${dd}`;
  };

  const getDayStatus = (day) => {
    if (!day) return null;
    const dateStr = getDateStr(day);
    const dayOfWeek = new Date(`${dateStr}T00:00:00+07:00`).getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return 'off';
    const record = historyMap[dateStr];
    if (!record) return 'none'; // đỏ
    const hasCheckin = record.logs.some(l => l.type === 'checkin');
    const hasCheckout = record.logs.some(l => l.type === 'checkout');
    if (hasCheckin && hasCheckout) return 'complete'; // xanh
    if (hasCheckin) return 'incomplete'; // vàng
    return 'none';
  };

  const statusColors = {
    complete: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    incomplete: 'bg-amber-100 text-amber-700 border-amber-200',
    none: 'bg-red-50 text-red-400 border-red-100',
    off: 'bg-gray-50 text-gray-300 border-gray-100',
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <ChevronLeft size={18} className="text-gray-500" />
        </button>
        <h3 className="font-bold text-gray-800 capitalize">{monthLabel}</h3>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <ChevronRight size={18} className="text-gray-500" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 px-3 pt-3">
        {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 px-3 pb-4 gap-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />;

          const dateStr = getDateStr(day);
          const isToday = dateStr === todayStr;
          const isFuture = dateStr > todayStr;
          const status = isFuture ? null : getDayStatus(day);

          return (
            <button
              key={day}
              onClick={() => !isFuture && onDateClick(dateStr, historyMap[dateStr])}
              disabled={isFuture}
              className={`
                relative w-full aspect-square flex items-center justify-center rounded-xl text-sm font-bold
                transition-all duration-200
                ${isFuture ? 'text-gray-200 cursor-default' : 'cursor-pointer hover:scale-110'}
                ${isToday ? 'ring-2 ring-offset-1' : ''}
                ${status ? statusColors[status] : ''}
                ${!status && !isFuture ? 'text-gray-300' : ''}
              `}
              style={isToday ? { ringColor: COLORS.primary } : {}}
            >
              {day}
              {isToday && (
                <span
                  className="absolute -bottom-0.5 w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: COLORS.primary }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="px-5 pb-4 flex items-center gap-4 justify-center border-t border-gray-50 pt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-emerald-400" />
          <span className="text-[10px] text-gray-500 font-semibold">Đủ công</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-amber-400" />
          <span className="text-[10px] text-gray-500 font-semibold">Thiếu checkout</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-300" />
          <span className="text-[10px] text-gray-500 font-semibold">Không có dữ liệu</span>
        </div>
      </div>
    </div>
  );
};

// ── Day Detail Modal ───────────────────────────────────────────────────────
const DayDetailModal = ({ isOpen, onClose, dateStr, record }) => {
  if (!isOpen) return null;

  const displayDate = dateStr
    ? new Date(dateStr + 'T00:00:00+07:00').toLocaleDateString('vi-VN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : '';

  const logs = record?.logs || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fadeInUp">
      <div
        className="bg-white rounded-3xl shadow-heavy w-full max-w-sm p-6 transform transition-all relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-gray-800 text-lg">Chi tiết chấm công</h3>
            <p className="text-xs text-gray-400 font-medium capitalize mt-0.5">{displayDate}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-500"
          >
            ✕
          </button>
        </div>

        {/* Logs */}
        {logs.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2 opacity-30">📭</div>
            <p className="text-gray-400 font-semibold text-sm">Không có dữ liệu chấm công</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 p-3 rounded-2xl border ${
                  log.type === 'checkin'
                    ? 'bg-emerald-50 border-emerald-100'
                    : 'bg-orange-50 border-orange-100'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  log.type === 'checkin'
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-orange-100 text-orange-600'
                }`}>
                  {log.type === 'checkin' ? <LogIn size={16} /> : <LogOut size={16} />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-800">
                    {log.type === 'checkin' ? 'Check-in' : 'Check-out'}
                  </p>
                  <p className="text-xs text-gray-400 font-medium">
                    {new Date(log.time).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      timeZone: 'Asia/Ho_Chi_Minh'
                    })}
                  </p>
                </div>
                <span className="text-[10px] font-bold text-gray-300 uppercase">
                  #{idx + 1}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="w-full mt-5 py-3 rounded-2xl font-bold text-sm transition-all"
          style={{ backgroundColor: COLORS.primary, color: '#fff' }}
        >
          Đóng
        </button>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════
const StaffAttendance = () => {
  const { user } = useAuth();

  const [todayRecord, setTodayRecord] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState(null);
  const [modalRecord, setModalRecord] = useState(null);

  // ── Fetch data ───────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const [todayRes, historyRes] = await Promise.all([
        getTodayAttendance(),
        getHistory()
      ]);
      setTodayRecord(todayRes.data.data);
      setHistory(historyRes.data.data || []);
    } catch (err) {
      setError('Không thể tải dữ liệu chấm công');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Toggle action ────────────────────────────────────────────────────
  const handleToggle = async () => {
    if (toggling) return;
    setToggling(true);
    try {
      const res = await toggleAttendance();
      toast.success(res.data.message);
      setTodayRecord(res.data.data);
      // Refresh history
      const historyRes = await getHistory();
      setHistory(historyRes.data.data || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Lỗi chấm công');
    } finally {
      setToggling(false);
    }
  };

  // ── Derived state ────────────────────────────────────────────────────
  const logs = todayRecord?.logs || [];
  const lastLog = logs.length > 0 ? logs[logs.length - 1] : null;
  const nextAction = !lastLog ? 'checkin' : (lastLog.type === 'checkin' ? 'checkout' : 'checkin');

  // Build historyMap for calendar: { 'YYYY-MM-DD': record }
  const historyMap = {};
  history.forEach(r => {
    historyMap[r.date] = r;
  });

  // Stats
  const totalDays = history.length;
  const completeDays = history.filter(r => {
    const hasIn = r.logs.some(l => l.type === 'checkin');
    const hasOut = r.logs.some(l => l.type === 'checkout');
    return hasIn && hasOut;
  }).length;
  const incompleteDays = history.filter(r => {
    const hasIn = r.logs.some(l => l.type === 'checkin');
    const hasOut = r.logs.some(l => l.type === 'checkout');
    return hasIn && !hasOut;
  }).length;

  // ── Calendar date click ──────────────────────────────────────────────
  const handleDateClick = (dateStr, record) => {
    setModalDate(dateStr);
    setModalRecord(record || null);
    setModalOpen(true);
  };

  // ── Loading / Error ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: COLORS.primary, borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={20} className="text-red-500 shrink-0" />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-800">Chấm công</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ─── Left: Clock + Action + Stats ──────────────────────── */}
        <div className="lg:col-span-7 space-y-6">

          {/* Clock & Action Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center">
            <LiveClock />

            <div className="w-full flex gap-4 mt-8">
              <button
                onClick={() => nextAction === 'checkin' && handleToggle()}
                disabled={nextAction !== 'checkin' || toggling}
                className={`flex-1 py-4 rounded-2xl font-bold text-base transition-all duration-200 flex items-center justify-center gap-2 ${
                  nextAction === 'checkin'
                    ? 'text-white shadow-lg hover:scale-[0.98] active:scale-95'
                    : 'border-2 border-gray-200 text-gray-300 cursor-not-allowed'
                }`}
                style={nextAction === 'checkin' ? { backgroundColor: COLORS.primary } : {}}
              >
                <LogIn size={18} />
                Check-in
              </button>
              <button
                onClick={() => nextAction === 'checkout' && handleToggle()}
                disabled={nextAction !== 'checkout' || toggling}
                className={`flex-1 py-4 rounded-2xl font-bold text-base transition-all duration-200 flex items-center justify-center gap-2 ${
                  nextAction === 'checkout'
                    ? 'text-white shadow-lg hover:scale-[0.98] active:scale-95'
                    : 'border-2 border-gray-200 text-gray-300 cursor-not-allowed'
                }`}
                style={nextAction === 'checkout' ? { backgroundColor: COLORS.accentOrange } : {}}
              >
                <LogOut size={18} />
                Check-out
              </button>
            </div>

            {/* Last action indicator */}
            {lastLog && (
              <div className="mt-5 flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${
                  lastLog.type === 'checkin' ? 'bg-emerald-400 animate-pulse' : 'bg-orange-400'
                }`} />
                <span className="text-gray-400 font-medium">
                  {lastLog.type === 'checkin' ? 'Đã check-in' : 'Đã check-out'} lúc{' '}
                  <span className="font-bold text-gray-600">
                    {new Date(lastLog.time).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'Asia/Ho_Chi_Minh'
                    })}
                  </span>
                </span>
              </div>
            )}

            {toggling && (
              <div className="mt-4 flex items-center gap-2 text-gray-400 text-sm">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                Đang xử lý...
              </div>
            )}
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs font-semibold text-gray-400 mb-1">Tổng ngày</p>
              <p className="text-2xl font-black text-gray-800">{totalDays}</p>
            </div>
            <div className="rounded-2xl shadow-sm p-5 text-white" style={{ backgroundColor: COLORS.statusSuccess }}>
              <p className="text-xs font-semibold opacity-80 mb-1">Đủ công</p>
              <p className="text-2xl font-black">{completeDays}</p>
            </div>
            <div className="rounded-2xl shadow-sm p-5 text-white" style={{ backgroundColor: COLORS.accentYellow }}>
              <p className="text-xs font-semibold opacity-80 mb-1">Thiếu checkout</p>
              <p className="text-2xl font-black">{incompleteDays}</p>
            </div>
          </div>

          {/* Today's Logs */}
          {logs.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Clock size={16} style={{ color: COLORS.primary }} />
                Hoạt động hôm nay
              </h3>
              <div className="space-y-2">
                {logs.map((log, idx) => (
                  <div key={idx} className="flex items-center gap-3 py-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      log.type === 'checkin'
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-orange-100 text-orange-600'
                    }`}>
                      {log.type === 'checkin' ? <LogIn size={14} /> : <LogOut size={14} />}
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-bold text-gray-700">
                        {log.type === 'checkin' ? 'Check-in' : 'Check-out'}
                      </span>
                    </div>
                    <span className="text-sm font-mono font-bold" style={{ color: COLORS.primary }}>
                      {new Date(log.time).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        timeZone: 'Asia/Ho_Chi_Minh'
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ─── Right: Calendar + Recent History ──────────────────── */}
        <div className="lg:col-span-5 space-y-6">
          <AttendanceCalendar historyMap={historyMap} onDateClick={handleDateClick} />

          {/* Recent history list */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <History size={16} style={{ color: COLORS.primary }} />
                Lịch sử gần đây
              </h3>
              <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold">
                30 ngày
              </span>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {history.length === 0 ? (
                <div className="py-10 text-center">
                  <div className="text-3xl opacity-20 mb-2">📋</div>
                  <p className="text-gray-400 text-sm font-semibold">Chưa có lịch sử</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {history.slice(0, 15).map((record) => {
                    const hasIn = record.logs.some(l => l.type === 'checkin');
                    const hasOut = record.logs.some(l => l.type === 'checkout');
                    const firstIn = record.logs.find(l => l.type === 'checkin');
                    const lastOut = [...record.logs].reverse().find(l => l.type === 'checkout');

                    const statusLabel = hasIn && hasOut ? 'Đủ công' : hasIn ? 'Thiếu checkout' : 'Không rõ';
                    const statusColor = hasIn && hasOut
                      ? 'bg-emerald-50 text-emerald-600'
                      : hasIn
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-red-50 text-red-400';

                    const dateObj = new Date(record.date + 'T00:00:00+07:00');

                    return (
                      <button
                        key={record._id || record.date}
                        onClick={() => handleDateClick(record.date, record)}
                        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-center min-w-[36px]">
                            <p className="text-lg font-black" style={{ color: COLORS.primary }}>
                              {dateObj.getDate()}
                            </p>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                              {dateObj.toLocaleDateString('vi-VN', { month: 'short' })}
                            </p>
                          </div>
                          <div className="w-px h-8 bg-gray-100" />
                          <div>
                            <p className="text-sm font-bold text-gray-700 capitalize">
                              {dateObj.toLocaleDateString('vi-VN', { weekday: 'long' })}
                            </p>
                            <div className="flex gap-3 mt-0.5">
                              {firstIn && (
                                <span className="text-[11px] text-gray-400">
                                  <span className="font-bold" style={{ color: COLORS.primary }}>In: </span>
                                  {new Date(firstIn.time).toLocaleTimeString('vi-VN', {
                                    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh'
                                  })}
                                </span>
                              )}
                              {lastOut && (
                                <span className="text-[11px] text-gray-400">
                                  <span className="font-bold" style={{ color: COLORS.accentOrange }}>Out: </span>
                                  {new Date(lastOut.time).toLocaleTimeString('vi-VN', {
                                    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh'
                                  })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${statusColor}`}>
                          {statusLabel}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Day Detail Modal */}
      <DayDetailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        dateStr={modalDate}
        record={modalRecord}
      />
    </div>
  );
};

export default StaffAttendance;
