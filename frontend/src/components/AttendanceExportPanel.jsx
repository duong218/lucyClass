// frontend/src/components/AttendanceExportPanel.jsx
// Panel xuất Excel chấm công — dùng trong AttendanceManagement.jsx
// Props:
//   onExport(type, params) — type: 'date' | 'month', params: { date } hoặc { year, month }

import { useState } from 'react';

const MONTHS = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
  'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
  'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

const nowVN = () => {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  return d;
};

const todayStr = () => {
  const d = nowVN();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function AttendanceExportPanel({ onExport, loading = false }) {
  const now = nowVN();
  const [tab, setTab] = useState('date'); // 'date' | 'month'

  // ── Tab: Theo ngày ──────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState(todayStr());

  // ── Tab: Theo tháng ─────────────────────────────────────────
  const [selectedYear,  setSelectedYear]  = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  const currentYear = now.getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => currentYear - i); // năm nay và 2 năm trước

  const handleExport = () => {
    if (tab === 'date') {
      if (!selectedDate) return;
      onExport('date', { date: selectedDate });
    } else {
      onExport('month', { year: selectedYear, month: selectedMonth });
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 w-full max-w-md">
      {/* Tiêu đề */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">📊</span>
        <h3 className="font-semibold text-gray-800 text-sm">Xuất báo cáo chấm công</h3>
      </div>

      {/* Tab chọn kiểu xuất */}
      <div className="flex rounded-lg overflow-hidden border border-gray-200 mb-4 text-sm">
        <button
          onClick={() => setTab('date')}
          className={`flex-1 py-2 px-3 font-medium transition-colors ${
            tab === 'date'
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          }`}
        >
          📅 Theo ngày
        </button>
        <button
          onClick={() => setTab('month')}
          className={`flex-1 py-2 px-3 font-medium transition-colors ${
            tab === 'month'
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          }`}
        >
          🗓 Theo tháng
        </button>
      </div>

      {/* Nội dung tab */}
      {tab === 'date' ? (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">
            Chọn một ngày để xuất toàn bộ chấm công của ngày đó.
            File Excel sẽ có 2 sheet: <strong>Theo nhân viên</strong> và <strong>Theo ngày</strong>.
          </p>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Ngày xuất</label>
            <input
              type="date"
              value={selectedDate}
              max={todayStr()}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
            💡 Để xuất nhiều ngày liên tiếp (tối đa 31 ngày), hãy dùng tab <strong>Theo tháng</strong>.
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">
            Chọn tháng để xuất toàn bộ chấm công trong tháng đó.
            File Excel sẽ có 2 sheet: <strong>Theo nhân viên</strong> và <strong>Theo ngày</strong>.
          </p>

          {/* Chọn năm */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Năm</label>
            <div className="flex gap-2">
              {years.map((y) => (
                <button
                  key={y}
                  onClick={() => setSelectedYear(y)}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    selectedYear === y
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-400'
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>

          {/* Chọn tháng — lưới 4×3 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tháng</label>
            <div className="grid grid-cols-4 gap-1.5">
              {MONTHS.map((label, idx) => {
                const m = idx + 1;
                // Chặn tháng tương lai
                const isFuture = selectedYear === currentYear && m > now.getMonth() + 1;
                return (
                  <button
                    key={m}
                    disabled={isFuture}
                    onClick={() => !isFuture && setSelectedMonth(m)}
                    className={`py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      selectedMonth === m && !isFuture
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : isFuture
                        ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-400 hover:text-emerald-700'
                    }`}
                  >
                    T{m}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
            Sẽ xuất: <strong>Tháng {selectedMonth}/{selectedYear}</strong>
          </div>
        </div>
      )}

      {/* Nút xuất */}
      <button
        onClick={handleExport}
        disabled={loading || (tab === 'date' && !selectedDate)}
        className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="animate-spin">⏳</span> Đang xuất...
          </>
        ) : (
          <>⬇ Tải xuống Excel</>
        )}
      </button>

      {/* Ghi chú về 2 sheet */}
      <p className="mt-2 text-center text-xs text-gray-400">
        File Excel gồm 2 sheet: nhóm theo nhân viên &amp; nhóm theo ngày
      </p>
    </div>
  );
}
