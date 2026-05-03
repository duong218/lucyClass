import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { showToast } from '../../utils/toastUtils';
import api from '../../services/api';
import {
  createBonus,
  deleteBonus,
  exportSalaryExcel,
  getSalaryReport,
  getSalarySettings,
  runSalaryEngine
} from '../../services/salaryService';
import {
  CalendarRange,
  Download,
  FileSpreadsheet,
  Play,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { LUCY_BRAND } from '../../theme/lucyBrand';

const COLORS = {
  primary: LUCY_BRAND.primary,
  primaryAccent: LUCY_BRAND.primaryLight,
  surfaceMint: LUCY_BRAND.surfaceMint
};

const getMonthRangeVN = () => {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = fmt.formatToParts(new Date());
  const y = parts.find((p) => p.type === 'year')?.value;
  const m = parts.find((p) => p.type === 'month')?.value;
  const from = `${y}-${m}-01`;
  const last = new Date(Number(y), Number(m), 0).getDate();
  const to = `${y}-${m}-${String(last).padStart(2, '0')}`;
  return { from, to };
};

const getTodayVN = () => {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return fmt.format(new Date());
};

const formatVnd = (n) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(Number(n) || 0);

const ROLE_LABEL = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  thu_viec: 'Thử việc',
  teacher_assistant: 'Trợ giảng',
  observe: 'Dự giờ'
};

const BONUS_LABEL = {
  tuyen_sinh: 'Tuyển sinh thành công',
  test_dau_vao: 'Test đầu vào',
  khac: 'Khác'
};

/* ── Loading Overlay với thanh tiến trình ──────────────────────────────── */
const LoadingOverlay = ({ visible, progress, label }) => {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 space-y-4">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 border-[3px] border-t-transparent rounded-full animate-spin"
            style={{ borderColor: COLORS.primary, borderTopColor: 'transparent' }}
          />
          <div>
            <p className="font-bold text-gray-800 text-sm">{label || 'Đang xử lý...'}</p>
            <p className="text-xs text-gray-400">Vui lòng chờ, không tắt trang</p>
          </div>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${Math.min(progress, 100)}%`,
              background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.primaryAccent})`
            }}
          />
        </div>
        <p className="text-center text-xs font-bold tabular-nums" style={{ color: COLORS.primary }}>
          {Math.round(progress)}%
        </p>
      </div>
    </div>
  );
};

export default function SalaryReport() {
  const defaultRange = useMemo(() => getMonthRangeVN(), []);
  const [from, setFrom] = useState(defaultRange.from);
  const [to, setTo] = useState(defaultRange.to);
  const [teacherId, setTeacherId] = useState('');
  const [staff, setStaff] = useState([]);
  const [report, setReport] = useState([]);
  const [meta, setMeta] = useState({ from: '', to: '' });
  const [loading, setLoading] = useState(false);
  const [engineDate, setEngineDate] = useState(getTodayVN);
  const [engineBusy, setEngineBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [settings, setSettings] = useState(null);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const progressTimer = useRef(null);

  const [bonusTeacher, setBonusTeacher] = useState('');
  const [bonusType, setBonusType] = useState('tuyen_sinh');
  const [bonusAmount, setBonusAmount] = useState('');
  const [bonusDate, setBonusDate] = useState(getTodayVN);
  const [bonusNote, setBonusNote] = useState('');

  // Cleanup timer khi unmount
  useEffect(() => {
    return () => {
      if (progressTimer.current) clearInterval(progressTimer.current);
    };
  }, []);

  const loadStaff = useCallback(async () => {
    try {
      const res = await api.get('/staff', { params: { role: 'teacher' } });
      setStaff(res.data?.data || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const res = await getSalarySettings();
      setSettings(res.data?.data || null);
    } catch {
      /* optional */
    }
  }, []);

  const startProgress = (label, estimatedMs = 10000) => {
    setProgress(0);
    setProgressLabel(label);
    const startTime = Date.now();
    if (progressTimer.current) clearInterval(progressTimer.current);
    progressTimer.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      // Asymptotic curve: approaches 95% but never reaches it
      const pct = 95 * (1 - Math.exp(-2.5 * elapsed / estimatedMs));
      setProgress(Math.min(pct, 95));
    }, 200);
  };

  const stopProgress = () => {
    if (progressTimer.current) clearInterval(progressTimer.current);
    progressTimer.current = null;
    setProgress(100);
    setTimeout(() => setProgress(0), 600);
  };

  const getDayCount = (f, t) => {
    const d1 = new Date(`${f}T00:00:00Z`);
    const d2 = new Date(`${t}T00:00:00Z`);
    return Math.max(1, Math.round((d2 - d1) / 86400000) + 1);
  };

  const loadReport = useCallback(async () => {
    if (!from || !to) {
      toast.error('Chọn khoảng ngày');
      return;
    }
    const days = getDayCount(from, to);
    setLoading(true);
    startProgress(`Đang tính lương ${days} ngày...`, Math.max(3000, days * 200));
    try {
      const res = await getSalaryReport({
        from,
        to,
        ...(teacherId ? { teacherId } : {})
      });
      setReport(res.data?.data || []);
      setMeta({ from: res.data?.from, to: res.data?.to });
    } catch (e) {
      toast.error(e.response?.data?.message || 'Không tải báo cáo');
    } finally {
      stopProgress();
      setLoading(false);
    }
  }, [from, to, teacherId]);

  useEffect(() => {
    loadStaff();
    loadSettings();
  }, [loadStaff, loadSettings]);

  useEffect(() => {
    if (!settings) return;
    if (bonusType === 'tuyen_sinh') {
      setBonusAmount(String(settings.defaultBonusTuyenSinh ?? 100000));
    } else if (bonusType === 'test_dau_vao') {
      setBonusAmount(String(settings.defaultBonusTestDauVao ?? 50000));
    } else {
      setBonusAmount('');
    }
  }, [settings, bonusType]);

  const runEngine = async () => {
    setEngineBusy(true);
    try {
      const res = await runSalaryEngine(engineDate);
      const total = res.data?.total ?? 0;
      toast.success(`Ghép ca ${engineDate}: ${total} buổi hợp lệ (xem chi tiết trong response nếu cần)`);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Engine lỗi');
    } finally {
      setEngineBusy(false);
    }
  };

  const handleExport = async () => {
    const days = getDayCount(from, to);
    setExporting(true);
    startProgress(`Đang xuất Excel ${days} ngày...`, Math.max(5000, days * 250));
    try {
      const res = await exportSalaryExcel({
        from,
        to,
        ...(teacherId ? { teacherId } : {})
      });
      const blob = new Blob([res.data], {
        type: res.headers['content-type'] || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bang_luong_${from.replace(/-/g, '')}_${to.replace(/-/g, '')}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Đã tải Excel');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Xuất file lỗi');
    } finally {
      stopProgress();
      setExporting(false);
    }
  };

  const submitBonus = async (e) => {
    e.preventDefault();
    if (!bonusTeacher || !bonusAmount || !bonusDate) {
      toast.error('Chọn giáo viên, số tiền và ngày');
      return;
    }
    const amount = Number(String(bonusAmount).replace(/\s/g, '').replace(/\./g, ''));
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Số tiền thưởng không hợp lệ');
      return;
    }
    try {
      await createBonus({
        teacherId: bonusTeacher,
        bonusType,
        amount,
        date: bonusDate,
        note: bonusNote.trim()
      });
      toast.success('Đã thêm thưởng');
      setBonusNote('');
      await loadReport();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thêm thưởng lỗi');
    }
  };

  const removeBonus = async (id) => {
    const confirmed = await showToast.confirm('Xoá thưởng này?');
    if (!confirmed) return;
    try {
      await deleteBonus(id);
      showToast.success('Đã xoá thưởng');
      await loadReport();
    } catch (e) {
      showToast.error(e.response?.data?.message || 'Xoá lỗi');
    }
  };

  const rowNoteClass = (source) => {
    if (source === 'manual_by_admin') return 'bg-red-50';
    if (source === 'auto_by_admin') return 'bg-amber-50';
    return '';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
      <LoadingOverlay visible={progress > 0 && progress < 100} progress={progress} label={progressLabel} />
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileSpreadsheet className="w-7 h-7" style={{ color: COLORS.primaryAccent }} />
          Báo cáo lương
        </h1>
        <p className="text-gray-600 mt-1 text-sm">
          Tổng hợp buổi dạy theo chấm công + TKB trong khoảng ngày (giờ Việt Nam).
        </p>
      </div>

      <section
        className="rounded-xl border border-gray-200 p-4 space-y-4"
        style={{ background: COLORS.surfaceMint }}
      >
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <Play className="w-4 h-4" style={{ color: COLORS.primaryAccent }} />
          Chạy thử engine ghép ca (1 ngày)
        </h2>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="block text-gray-600 mb-1">Ngày</span>
            <input
              type="date"
              className="border rounded-lg px-3 py-2"
              value={engineDate}
              onChange={(e) => setEngineDate(e.target.value)}
            />
          </label>
          <button
            type="button"
            onClick={runEngine}
            disabled={engineBusy}
            className="px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
            style={{ background: COLORS.primary }}
          >
            {engineBusy ? 'Đang chạy…' : 'Chạy engine'}
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <CalendarRange className="w-4 h-4" style={{ color: COLORS.primaryAccent }} />
          Lọc báo cáo
        </h2>
        <div className="flex flex-wrap gap-4 items-end">
          <label className="text-sm">
            <span className="block text-gray-600 mb-1">Từ</span>
            <input
              type="date"
              className="border rounded-lg px-3 py-2"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label className="text-sm">
            <span className="block text-gray-600 mb-1">Đến</span>
            <input
              type="date"
              className="border rounded-lg px-3 py-2"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
          <label className="text-sm">
            <span className="block text-gray-600 mb-1">Giáo viên</span>
            <select
              className="border rounded-lg px-3 py-2 min-w-[200px]"
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
            >
              <option value="">Tất cả</option>
              {staff.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.displayName || s.username}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={loadReport}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
            style={{ background: COLORS.primary }}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Tải báo cáo
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting || !from || !to}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Đang xuất…' : 'Excel'}
          </button>
        </div>
        {meta.from && (
          <p className="text-xs text-gray-500">
            Dữ liệu: {meta.from} — {meta.to}
          </p>
        )}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-3">Thêm thưởng thủ công</h2>
        <form onSubmit={submitBonus} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
          <label>
            <span className="block text-gray-600 mb-1">Giáo viên</span>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={bonusTeacher}
              onChange={(e) => setBonusTeacher(e.target.value)}
              required
            >
              <option value="">— Chọn —</option>
              {staff.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.displayName || s.username}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="block text-gray-600 mb-1">Loại</span>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={bonusType}
              onChange={(e) => setBonusType(e.target.value)}
            >
              <option value="tuyen_sinh">Tuyển sinh thành công</option>
              <option value="test_dau_vao">Test đầu vào</option>
              <option value="khac">Khác</option>
            </select>
          </label>
          <label>
            <span className="block text-gray-600 mb-1">Số tiền (VNĐ)</span>
            <input
              className="w-full border rounded-lg px-3 py-2"
              value={bonusAmount}
              onChange={(e) => setBonusAmount(e.target.value)}
              required
            />
          </label>
          <label>
            <span className="block text-gray-600 mb-1">Ngày ghi nhận</span>
            <input
              type="date"
              className="w-full border rounded-lg px-3 py-2"
              value={bonusDate}
              onChange={(e) => setBonusDate(e.target.value)}
              required
            />
          </label>
          <label className="md:col-span-2">
            <span className="block text-gray-600 mb-1">Ghi chú</span>
            <input
              className="w-full border rounded-lg px-3 py-2"
              value={bonusNote}
              onChange={(e) => setBonusNote(e.target.value)}
            />
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-white text-sm font-medium w-full md:w-auto"
              style={{ background: COLORS.primary }}
            >
              Lưu thưởng
            </button>
          </div>
        </form>
      </section>

      {report.map((entry) => {
        const name = entry.teacher?.displayName || entry.teacher?.username || '—';
        return (
          <section
            key={entry.teacher?._id || name}
            className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
          >
            <div
              className="px-4 py-3 flex flex-wrap justify-between gap-2"
              style={{ background: COLORS.surfaceMint }}
            >
              <div>
                <h3 className="font-semibold text-gray-900">{name}</h3>
                <p className="text-xs text-gray-600">Role: {entry.teacher?.role || '—'}</p>
              </div>
              <div className="text-right text-sm">
                <div>
                  Lương buổi: <strong className="tabular-nums">{formatVnd(entry.totalSalary)}</strong>
                </div>
                <div>
                  Thưởng: <strong className="tabular-nums">{formatVnd(entry.totalBonus)}</strong>
                </div>
                <div>
                  Tổng:{' '}
                  <strong className="tabular-nums text-base" style={{ color: COLORS.primary }}>
                    {formatVnd(entry.grandTotal)}
                  </strong>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left p-2">Ngày</th>
                    <th className="text-left p-2">Cơ sở / Phòng</th>
                    <th className="text-left p-2">Khóa</th>
                    <th className="text-right p-2">HS</th>
                    <th className="text-left p-2">Vai trò</th>
                    <th className="text-right p-2">Tiền</th>
                    <th className="text-left p-2">Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {entry.sessions?.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-4 text-gray-500 text-center">
                        Không có buổi khớp trong khoảng này
                      </td>
                    </tr>
                  )}
                  {entry.sessions?.map((s, idx) => (
                    <tr key={`${s.date}-${idx}`} className={`border-t border-gray-100 ${rowNoteClass(s.source)}`}>
                      <td className="p-2 whitespace-nowrap">{s.date}</td>
                      <td className="p-2">
                        {s.branch || '—'} / {s.roomName || '—'}
                      </td>
                      <td className="p-2 max-w-[10rem] truncate" title={s.courseName}>
                        {s.courseName}
                      </td>
                      <td className="p-2 text-right tabular-nums">{s.studentCount ?? '—'}</td>
                      <td className="p-2">
                        {ROLE_LABEL[s.sessionRole] || s.sessionRole}
                        {s.payTier ? (
                          <span className="text-xs text-gray-500 block">Mức: {ROLE_LABEL[s.payTier] || s.payTier}</span>
                        ) : null}
                      </td>
                      <td className="p-2 text-right tabular-nums font-medium">{formatVnd(s.amount)}</td>
                      <td className="p-2 text-xs max-w-[14rem]">{s.note || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {entry.bonuses?.length > 0 && (
              <div className="border-t border-gray-200 px-4 py-3">
                <h4 className="text-sm font-semibold text-gray-800 mb-2">Thưởng</h4>
                <ul className="space-y-2 text-sm">
                  {entry.bonuses.map((b) => (
                    <li
                      key={b._id}
                      className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 rounded-lg px-3 py-2"
                    >
                      <span>
                        {b.date} — {BONUS_LABEL[b.bonusType] || b.bonusType} —{' '}
                        <strong className="tabular-nums">{formatVnd(b.amount)}</strong>
                        {b.note ? <span className="text-gray-600"> — {b.note}</span> : null}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeBonus(b._id)}
                        className="text-red-600 p-1 hover:bg-red-50 rounded"
                        title="Xoá"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        );
      })}

      {!loading && report.length === 0 && meta.from && (
        <p className="text-center text-gray-500 text-sm">Không có dòng báo cáo.</p>
      )}
    </div>
  );
}
