import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import {
  getSalaryConfig,
  getSalaryLogs,
  getSalarySettings,
  seedSalaryConfig,
  updateSalaryConfig,
  updateSalarySettings
} from '../../services/salaryService';
import { Banknote, ChevronDown, History, RefreshCw, Save, SlidersHorizontal, Sprout } from 'lucide-react';
import { LUCY_BRAND } from '../../theme/lucyBrand';

const COLORS = {
  primary: LUCY_BRAND.primary,
  primaryAccent: LUCY_BRAND.primaryLight,
  surfaceMint: LUCY_BRAND.surfaceMint,
  border: '#D1D5DB'
};

const ROLE_ROWS = [
  { sessionRole: 'full_time', label: 'Full-time (100%)' },
  { sessionRole: 'part_time', label: 'Part-time' },
  { sessionRole: 'thu_viec', label: 'Thử việc' }
];

const HS_COLS = [
  { studentCount: 1, label: '1 HS' },
  { studentCount: 2, label: '2 HS' },
  { studentCount: 3, label: '3 HS' },
  { studentCount: 4, label: '4–6 HS' }
];

const TIER_COLS = [
  { salaryLevel: 'full_time', label: 'Full-time' },
  { salaryLevel: 'part_time', label: 'Part-time' },
  { salaryLevel: 'thu_viec', label: 'Thử việc' }
];

const FIXED_ROWS = [
  { sessionRole: 'teacher_assistant', label: 'Trợ giảng' },
  { sessionRole: 'observe', label: 'Dự giờ' }
];

const formatVnd = (n) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(Number(n) || 0);

const findCell = (configs, sessionRole, studentCount, salaryLevel) =>
  configs.find(
    (c) =>
      c.sessionRole === sessionRole &&
      c.studentCount === studentCount &&
      (c.salaryLevel ?? null) === (salaryLevel ?? null)
  );

/* focus ring = LUCY_BRAND.primary (Tailwind cần literal để JIT) */
const inputCls =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1C695C]/30 focus:border-[#1C695C]';

export default function SalaryConfig() {
  const [configs, setConfigs] = useState([]);
  const [logs, setLogs] = useState([]);
  const [settings, setSettings] = useState(null);
  const [sysForm, setSysForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [savingSys, setSavingSys] = useState(false);
  const [seedOpen, setSeedOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cfgRes, logRes, setRes] = await Promise.all([
        getSalaryConfig(),
        getSalaryLogs(50),
        getSalarySettings()
      ]);
      setConfigs(cfgRes.data?.data || []);
      setLogs(logRes.data?.data || []);
      const s = setRes.data?.data || null;
      setSettings(s);
      if (s) {
        setSysForm({
          matchThresholdMinutes: s.matchThresholdMinutes,
          sessionMinutes: s.sessionMinutes,
          partTimeMultiplier: s.partTimeMultiplier,
          probationMultiplier: s.probationMultiplier,
          defaultBonusTuyenSinh: s.defaultBonusTuyenSinh,
          defaultBonusTestDauVao: s.defaultBonusTestDauVao,
          seedFt1Hs: s.seedFt1Hs,
          seedFt2Hs: s.seedFt2Hs,
          seedFt3Hs: s.seedFt3Hs,
          seedFt46Hs: s.seedFt46Hs,
          seedTaFt: s.seedTaFt,
          seedObserveFt: s.seedObserveFt
        });
      }
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || 'Không tải được cấu hình lương');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const startEdit = (doc) => {
    if (!doc?._id) return;
    setEditing(doc._id);
    setDraft(String(doc.amount ?? ''));
  };

  const cancelEdit = () => {
    setEditing(null);
    setDraft('');
  };

  const commitEdit = async (doc) => {
    if (!doc?._id || editing !== doc._id) return;
    const n = Number(String(draft).replace(/\s/g, '').replace(/\./g, ''));
    if (!Number.isFinite(n) || n <= 0) {
      toast.error('Số tiền phải là số dương');
      return;
    }
    if (n === doc.amount) {
      cancelEdit();
      return;
    }
    try {
      await updateSalaryConfig(doc._id, n);
      toast.success('Đã lưu');
      cancelEdit();
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lưu thất bại');
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await seedSalaryConfig();
      if (res.data?.seeded) toast.success(res.data?.message || 'Seed thành công');
      else toast.info(res.data?.message || 'Đã có dữ liệu');
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Seed lỗi');
    } finally {
      setSeeding(false);
    }
  };

  const saveSystemSettings = async (e) => {
    e.preventDefault();
    if (!sysForm) return;
    setSavingSys(true);
    try {
      const res = await updateSalarySettings(sysForm);
      const next = res.data?.data;
      if (next) {
        setSettings(next);
        setSysForm({
          matchThresholdMinutes: next.matchThresholdMinutes,
          sessionMinutes: next.sessionMinutes,
          partTimeMultiplier: next.partTimeMultiplier,
          probationMultiplier: next.probationMultiplier,
          defaultBonusTuyenSinh: next.defaultBonusTuyenSinh,
          defaultBonusTestDauVao: next.defaultBonusTestDauVao,
          seedFt1Hs: next.seedFt1Hs,
          seedFt2Hs: next.seedFt2Hs,
          seedFt3Hs: next.seedFt3Hs,
          seedFt46Hs: next.seedFt46Hs,
          seedTaFt: next.seedTaFt,
          seedObserveFt: next.seedObserveFt
        });
      }
      toast.success(res.data?.message || 'Đã lưu');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không lưu được cấu hình hệ thống');
    } finally {
      setSavingSys(false);
    }
  };

  const setField = (key, value) => {
    setSysForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const logLabel = useMemo(() => {
    const f = (log) => {
      const sc = log.studentCount;
      const sl = log.salaryLevel;
      if (sc != null) return `${log.sessionRole} × ${sc === 4 ? '4–6' : sc} HS`;
      if (sl) return `${log.sessionRole} × ${sl}`;
      return log.sessionRole;
    };
    return f;
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-gray-500">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        Đang tải…
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Banknote className="w-7 h-7" style={{ color: COLORS.primaryAccent }} />
            Cấu hình lương theo buổi
          </h1>
          <p className="text-gray-600 mt-1 text-sm">
            Đơn vị: VNĐ / buổi. Chỉnh tham số hệ thống bên dưới; bảng ô lương chỉnh trực tiếp (Enter / blur để
            lưu).
          </p>
        </div>
        {configs.length === 0 && (
          <button
            type="button"
            onClick={handleSeed}
            disabled={seeding}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
            style={{ background: COLORS.primary }}
          >
            <Sprout className="w-4 h-4" />
            {seeding ? 'Đang khởi tạo…' : 'Khởi tạo bảng mặc định'}
          </button>
        )}
      </div>

      {/* Cài đặt hệ thống — lưu DB */}
      {sysForm && (
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div
            className="px-4 py-3 flex flex-wrap items-center justify-between gap-2 border-b border-gray-100"
            style={{ background: COLORS.surfaceMint }}
          >
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5" style={{ color: COLORS.primaryAccent }} />
              Cài đặt hệ thống tính lương
            </h2>
            {settings?.updatedAt && (
              <span className="text-xs text-gray-500">
                Cập nhật lần cuối:{' '}
                {new Date(settings.updatedAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
              </span>
            )}
          </div>

          <form onSubmit={saveSystemSettings} className="p-4 space-y-6">
            <p className="text-sm text-gray-600">
              Toàn bộ giá trị lưu trên máy chủ. <strong>Ngưỡng ghép ca</strong> và <strong>phút buổi chuẩn</strong>{' '}
              áp dụng ngay khi chạy engine / báo cáo. <strong>Hệ số</strong> và <strong>mức seed</strong> dùng khi
              bấm &quot;Khởi tạo bảng mặc định&quot; (chỉ khi chưa có ô lương); các ô đã có trong DB không tự đổi
              khi bạn sửa hệ số.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <label className="text-sm">
                <span className="block text-gray-700 font-medium mb-1">Ngưỡng ghép ca (phút)</span>
                <input
                  type="number"
                  min={1}
                  max={180}
                  className={inputCls}
                  value={sysForm.matchThresholdMinutes}
                  onChange={(e) => setField('matchThresholdMinutes', Number(e.target.value))}
                />
                <span className="text-xs text-gray-500 mt-0.5 block">± phút so với giờ bắt đầu TKB</span>
              </label>
              <label className="text-sm">
                <span className="block text-gray-700 font-medium mb-1">Độ dài buổi chuẩn (phút)</span>
                <input
                  type="number"
                  min={30}
                  max={300}
                  className={inputCls}
                  value={sysForm.sessionMinutes}
                  onChange={(e) => setField('sessionMinutes', Number(e.target.value))}
                />
                <span className="text-xs text-gray-500 mt-0.5 block">Tham chiếu nghiệp vụ / mở rộng sau</span>
              </label>
              <label className="text-sm">
                <span className="block text-gray-700 font-medium mb-1">Hệ số part-time</span>
                <input
                  type="number"
                  step="0.01"
                  min={0.01}
                  max={1}
                  className={inputCls}
                  value={sysForm.partTimeMultiplier}
                  onChange={(e) => setField('partTimeMultiplier', Number(e.target.value))}
                />
              </label>
              <label className="text-sm">
                <span className="block text-gray-700 font-medium mb-1">Hệ số thử việc</span>
                <input
                  type="number"
                  step="0.01"
                  min={0.01}
                  max={1}
                  className={inputCls}
                  value={sysForm.probationMultiplier}
                  onChange={(e) => setField('probationMultiplier', Number(e.target.value))}
                />
              </label>
              <label className="text-sm">
                <span className="block text-gray-700 font-medium mb-1">Thưởng gợi ý — tuyển sinh (VNĐ)</span>
                <input
                  type="number"
                  min={0}
                  className={inputCls}
                  value={sysForm.defaultBonusTuyenSinh}
                  onChange={(e) => setField('defaultBonusTuyenSinh', Number(e.target.value))}
                />
                <span className="text-xs text-gray-500 mt-0.5 block">Điền sẵn ở trang báo cáo lương</span>
              </label>
              <label className="text-sm">
                <span className="block text-gray-700 font-medium mb-1">Thưởng gợi ý — test đầu vào (VNĐ)</span>
                <input
                  type="number"
                  min={0}
                  className={inputCls}
                  value={sysForm.defaultBonusTestDauVao}
                  onChange={(e) => setField('defaultBonusTestDauVao', Number(e.target.value))}
                />
              </label>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setSeedOpen((o) => !o)}
                className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium text-gray-800 bg-gray-50 hover:bg-gray-100"
              >
                <span>Mức full-time khi khởi tạo bảng (seed) — VNĐ / buổi</span>
                <ChevronDown className={`w-5 h-5 transition-transform ${seedOpen ? 'rotate-180' : ''}`} />
              </button>
              {seedOpen && (
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 border-t border-gray-100">
                  <label className="text-sm">
                    <span className="block text-gray-600 mb-1">1 HS</span>
                    <input
                      type="number"
                      min={1}
                      className={inputCls}
                      value={sysForm.seedFt1Hs}
                      onChange={(e) => setField('seedFt1Hs', Number(e.target.value))}
                    />
                  </label>
                  <label className="text-sm">
                    <span className="block text-gray-600 mb-1">2 HS</span>
                    <input
                      type="number"
                      min={1}
                      className={inputCls}
                      value={sysForm.seedFt2Hs}
                      onChange={(e) => setField('seedFt2Hs', Number(e.target.value))}
                    />
                  </label>
                  <label className="text-sm">
                    <span className="block text-gray-600 mb-1">3 HS</span>
                    <input
                      type="number"
                      min={1}
                      className={inputCls}
                      value={sysForm.seedFt3Hs}
                      onChange={(e) => setField('seedFt3Hs', Number(e.target.value))}
                    />
                  </label>
                  <label className="text-sm">
                    <span className="block text-gray-600 mb-1">4–6 HS</span>
                    <input
                      type="number"
                      min={1}
                      className={inputCls}
                      value={sysForm.seedFt46Hs}
                      onChange={(e) => setField('seedFt46Hs', Number(e.target.value))}
                    />
                  </label>
                  <label className="text-sm">
                    <span className="block text-gray-600 mb-1">Trợ giảng (mức FT)</span>
                    <input
                      type="number"
                      min={1}
                      className={inputCls}
                      value={sysForm.seedTaFt}
                      onChange={(e) => setField('seedTaFt', Number(e.target.value))}
                    />
                  </label>
                  <label className="text-sm">
                    <span className="block text-gray-600 mb-1">Dự giờ (mức FT)</span>
                    <input
                      type="number"
                      min={1}
                      className={inputCls}
                      value={sysForm.seedObserveFt}
                      onChange={(e) => setField('seedObserveFt', Number(e.target.value))}
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={savingSys}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-medium disabled:opacity-50"
                style={{ background: COLORS.primary }}
              >
                <Save className="w-4 h-4" />
                {savingSys ? 'Đang lưu…' : 'Lưu cài đặt hệ thống'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Bảng 1 */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Lương đứng lớp theo số học sinh</h2>
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead>
              <tr style={{ background: COLORS.surfaceMint }}>
                <th className="text-left p-3 font-semibold text-gray-800 w-40">Vai trò buổi</th>
                {HS_COLS.map((c) => (
                  <th key={c.studentCount} className="p-3 text-right font-semibold text-gray-800">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROLE_ROWS.map((row) => (
                <tr key={row.sessionRole} className="border-t border-gray-100">
                  <td className="p-3 font-medium text-gray-800">{row.label}</td>
                  {HS_COLS.map((col) => {
                    const doc = findCell(configs, row.sessionRole, col.studentCount, null);
                    const isEd = editing === doc?._id;
                    return (
                      <td key={col.studentCount} className="p-2 text-right align-middle">
                        {doc ? (
                          isEd ? (
                            <input
                              autoFocus
                              className="w-full max-w-[7rem] ml-auto block border rounded px-2 py-1 text-right"
                              value={draft}
                              onChange={(e) => setDraft(e.target.value)}
                              onBlur={() => commitEdit(doc)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.target.blur();
                                }
                                if (e.key === 'Escape') cancelEdit();
                              }}
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => startEdit(doc)}
                              className="w-full max-w-[7rem] ml-auto block text-right px-2 py-1 rounded hover:bg-gray-50 text-gray-900 tabular-nums"
                            >
                              {formatVnd(doc.amount)}
                            </button>
                          )
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Bảng 2 */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Trợ giảng &amp; dự giờ (theo mức PT/FT/TV)</h2>
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead>
              <tr style={{ background: COLORS.surfaceMint }}>
                <th className="text-left p-3 font-semibold text-gray-800 w-40">Vai trò</th>
                {TIER_COLS.map((c) => (
                  <th key={c.salaryLevel} className="p-3 text-right font-semibold text-gray-800">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FIXED_ROWS.map((row) => (
                <tr key={row.sessionRole} className="border-t border-gray-100">
                  <td className="p-3 font-medium text-gray-800">{row.label}</td>
                  {TIER_COLS.map((col) => {
                    const doc = findCell(configs, row.sessionRole, null, col.salaryLevel);
                    const isEd = editing === doc?._id;
                    return (
                      <td key={col.salaryLevel} className="p-2 text-right align-middle">
                        {doc ? (
                          isEd ? (
                            <input
                              autoFocus
                              className="w-full max-w-[7rem] ml-auto block border rounded px-2 py-1 text-right"
                              value={draft}
                              onChange={(e) => setDraft(e.target.value)}
                              onBlur={() => commitEdit(doc)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') e.target.blur();
                                if (e.key === 'Escape') cancelEdit();
                              }}
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => startEdit(doc)}
                              className="w-full max-w-[7rem] ml-auto block text-right px-2 py-1 rounded hover:bg-gray-50 tabular-nums"
                            >
                              {formatVnd(doc.amount)}
                            </button>
                          )
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Lịch sử */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <History className="w-5 h-5" />
          Lịch sử chỉnh sửa bảng ô lương (50 dòng gần nhất)
        </h2>
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm max-h-80 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">Chưa có lịch sử.</p>
          ) : (
            <ul className="divide-y divide-gray-100 text-sm">
              {logs.map((log) => (
                <li key={log._id} className="px-4 py-3 flex flex-wrap gap-x-2 gap-y-1">
                  <span className="text-gray-500">
                    {new Date(log.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                  </span>
                  <span className="font-medium">{log.updatedByName || 'Admin'}</span>
                  <span className="text-gray-600">{logLabel(log)}:</span>
                  <span className="tabular-nums">{formatVnd(log.oldAmount)}</span>
                  <span>→</span>
                  <span className="tabular-nums font-medium">{formatVnd(log.newAmount)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
