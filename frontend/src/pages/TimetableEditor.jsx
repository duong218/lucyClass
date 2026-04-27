import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { HiCog, HiCalendar, HiRefresh, HiPrinter, HiPlus, HiEmojiSad, HiCloudDownload } from 'react-icons/hi';
import timetableService from '../services/timetableService';
import WeekSelector from '../components/Timetable/WeekSelector';
import RowManager from '../components/Timetable/RowManager';
import CellPopover from '../components/Timetable/CellPopover';
import { useAuth } from '../contexts/AuthContext';
import { showToast } from '../utils/toastUtils';

const DAYS_VI_SHORT = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const DAYS_VI_FULL  = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
const DAYS_EN_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAYS_EN_FULL  = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const BRAND = '#1C695C';
const BRAND_BG = '#E8F5F3';
const BRAND_BORDER = '#B2DFDB';

const getContrastColor = (hex) => {
  if (!hex || hex === 'transparent' || !hex.startsWith('#')) return 'text-gray-800';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? 'text-gray-800' : 'text-white';
};

const TimetableEditor = () => {
  const { t, i18n } = useTranslation();
  const { isInitialized, isAuthenticated } = useAuth();
  const isFetchingRef = useRef(false);

  // 📦 STATE
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [timetable, setTimetable]         = useState({ rows: [], cells: [] });
  const [isLoading, setIsLoading]         = useState(false);
  const [isExporting, setIsExporting]     = useState(false);
  const [isRowManagerOpen, setIsRowManagerOpen] = useState(false);
  const [activeCell, setActiveCell]       = useState(null);

  useEffect(() => {
    if (activeCell) console.log('[TimetableEditor] Active cell changed:', activeCell);
  }, [activeCell]);

  const fetchTimetable = useCallback(async () => {
    if (isFetchingRef.current || !isAuthenticated) return;
    isFetchingRef.current = true;
    setIsLoading(true);
    try {
      const data = await timetableService.getTimetable(selectedDate.toISOString());
      setTimetable({
        rows:  Array.isArray(data?.rows)  ? data.rows  : [],
        cells: Array.isArray(data?.cells) ? data.cells : [],
      });
    } catch (err) {
      console.error('[TimetableEditor] Fetch failed:', err);
      showToast.error('Thông báo này bị lỗi chút đỉnh nha 😢');
      setTimetable({ rows: [], cells: [] });
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [selectedDate, isAuthenticated]);

  useEffect(() => {
    if (isInitialized && isAuthenticated) fetchTimetable();
  }, [isInitialized, isAuthenticated, fetchTimetable]);

  const handleCellSave = async (cellData) => {
    try {
      await timetableService.upsertCell(cellData);
      showToast.success('Lưu hoàn tất nhé! 🎉');
      setActiveCell(null);
      fetchTimetable();
    } catch (err) {
      showToast.error(err.message || 'Error saving cell 😢');
      throw err;
    }
  };

  const handleExportExcel = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const blob = await timetableService.exportTimetable(selectedDate.toISOString());
      const url  = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', `Timetable_Report_${selectedDate.toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast.success('Xuất file thành công! 🚀');
    } catch (err) {
      console.error('[Timetable] Export failed:', err);
      showToast.error('Lỗi khi xuất file Excel 😢');
    } finally {
      setIsExporting(false);
    }
  };

  const getCellData = (rowId, dayIndex) =>
    (timetable?.cells || []).find(
      (c) => c?.rowId === rowId && c?.dayOfWeek === dayIndex + 1
    );

  const isVi      = i18n.language === 'vi';
  const daysShort = isVi ? DAYS_VI_SHORT : DAYS_EN_SHORT;
  const daysFull  = isVi ? DAYS_VI_FULL  : DAYS_EN_FULL;

  // ── Loading/auth gates ────────────────────────────────────────
  if (!isInitialized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div
          className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: BRAND, borderTopColor: 'transparent' }}
        />
        <p className="text-gray-500 font-bold animate-pulse">Initializing access...</p>
      </div>
    );
  }
  if (!isAuthenticated) return null;

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-4xl font-black text-gray-800 tracking-tight uppercase leading-none">
            {t('admin.timetable') || 'Timetable'}
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 font-medium mt-0.5">
            {t('admin.adminAccess') || 'Chỉ dành cho quản trị viên'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Manage rows */}
          <button
            onClick={() => setIsRowManagerOpen(true)}
            className="flex items-center gap-1.5 px-3 sm:px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-xs sm:text-sm hover:shadow-md transition-all active:scale-95"
          >
            <HiCog className="text-base sm:text-lg text-gray-400 shrink-0" />
            <span className="hidden sm:inline">Quản lý dòng</span>
          </button>

          {/* Refresh */}
          <button
            onClick={fetchTimetable}
            disabled={isLoading}
            className="p-2.5 rounded-xl transition-colors disabled:opacity-50"
            style={{ background: BRAND_BG, color: BRAND }}
          >
            <HiRefresh className={`text-base sm:text-lg ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── Week Selector ───────────────────────────────────────── */}
      <WeekSelector selectedDate={selectedDate} setSelectedDate={setSelectedDate} />

      {/* ── Grid ────────────────────────────────────────────────── */}
      <div
        className="relative bg-white rounded-2xl sm:rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden"
        style={{ minHeight: 260 }}
      >
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-[60] bg-white/70 backdrop-blur-[2px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-9 h-9 border-4 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: BRAND, borderTopColor: 'transparent' }}
              />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] animate-pulse" style={{ color: BRAND }}>
                Syncing...
              </span>
            </div>
          </div>
        )}

        <div className="overflow-x-auto custom-scrollbar">
          {/*
            Col widths:
              - Sticky label col: 88px mobile / 140px desktop
              - Each day col: 72px mobile → expands on desktop
            Total on mobile: 88 + 7×72 = 592px  (fits 390px+ screens with scroll)
          */}
          <table className="border-collapse" style={{ width: '100%', minWidth: 592 }}>
            <thead>
              <tr className="border-b border-gray-200" style={{ background: BRAND_BG }}>

                {/* Corner cell */}
                <th
                  className="sticky left-0 z-[10] border-r border-gray-200 text-left"
                  style={{ background: BRAND_BG, width: 88, minWidth: 88, padding: '10px 8px' }}
                >
                  <span
                    className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest leading-relaxed"
                    style={{ color: BRAND }}
                  >
                    Phòng /<br />Khung giờ
                  </span>
                </th>

                {daysShort.map((dayShort, idx) => {
                  const dateAtIdx = new Date(selectedDate.getTime() + idx * 86400000);
                  const isToday   = new Date().toDateString() === dateAtIdx.toDateString();
                  return (
                    <th
                      key={idx}
                      className="border-l border-gray-200 text-center"
                      style={{
                        padding: '8px 2px',
                        background: isToday ? '#C8E6C9' : 'transparent',
                        minWidth: 72,
                      }}
                    >
                      {/* Short label on mobile, full on sm+ */}
                      <span
                        className="text-[10px] sm:text-[11px] font-black uppercase tracking-wide block leading-none mb-0.5"
                        style={{ color: isToday ? BRAND : '#2D4A46' }}
                      >
                        <span className="sm:hidden">{dayShort}</span>
                        <span className="hidden sm:inline">{daysFull[idx]}</span>
                      </span>
                      <span
                        className="text-[11px] sm:text-sm font-black"
                        style={{ color: isToday ? BRAND : '#2D4A46' }}
                      >
                        {dateAtIdx.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {/* Empty state */}
              {(timetable?.rows?.length || 0) === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 sm:py-32 text-center">
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex flex-col items-center gap-4 sm:gap-6 px-4"
                    >
                      <div
                        className="w-16 h-16 sm:w-24 sm:h-24 rounded-full flex items-center justify-center"
                        style={{ background: BRAND_BG, color: BRAND }}
                      >
                        <HiCalendar className="text-3xl sm:text-5xl" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm sm:text-xl font-black text-gray-800 uppercase tracking-tight">
                          No rooms configured yet
                        </p>
                        <p className="text-xs sm:text-sm text-gray-400 font-medium">
                          Add rooms and slots to begin building your schedule.
                        </p>
                      </div>
                      <button
                        onClick={() => setIsRowManagerOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:shadow-xl transition-all hover:-translate-y-1"
                        style={{ background: BRAND }}
                      >
                        <HiPlus className="text-lg" />
                        {t('admin.rowManager.add_row') || 'Add Row'}
                      </button>
                    </motion.div>
                  </td>
                </tr>
              ) : (
                timetable?.rows?.map((row) => (
                  <tr
                    key={row?._id}
                    className="group border-b border-gray-100 last:border-0 transition-colors"
                    style={{ height: 80 }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F0FAF8')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}
                  >
                    {/* Sticky row label */}
                    <td
                      className="sticky left-0 z-[10] border-r border-gray-100"
                      style={{
                        background: '#F7FAFC',
                        width: 88, minWidth: 88,
                        padding: '6px 8px',
                        boxShadow: '4px 0 8px -4px rgba(0,0,0,0.07)',
                      }}
                    >
                      <div className="text-[11px] sm:text-sm font-black text-gray-800 leading-tight mb-1 line-clamp-2">
                        {row?.roomName || 'Unnamed'}
                      </div>
                      <div
                        className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md w-fit border"
                        style={{ background: BRAND_BG, color: BRAND, borderColor: BRAND_BORDER }}
                      >
                        {row?.timeSlot || '--:--'}
                      </div>
                    </td>

                    {/* Day cells */}
                    {[...Array(7)].map((_, idx) => {
                      const cell = getCellData(row?._id, idx);
                      return (
                        <td
                          key={idx}
                          onClick={() => setActiveCell({ cell, row, dayIndex: idx })}
                          className="border-l border-gray-100 cursor-pointer relative"
                          style={{ padding: 3 }}
                        >
                          {cell ? (
                            <motion.div
                              layoutId={`cell-${cell?._id}`}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="rounded-xl sm:rounded-[1.25rem] shadow-sm border border-black/5 flex flex-col justify-center overflow-hidden transition-all duration-300 hover:shadow-md hover:scale-[1.02] hover:z-30"
                              style={{
                                backgroundColor: cell?.color || '#F8FAFC',
                                minHeight: 68,
                                height: '100%',
                                padding: '5px 7px',
                              }}
                            >
                              <p className={`text-[9px] sm:text-xs font-black leading-snug break-words line-clamp-4 ${getContrastColor(cell?.color)}`}>
                                {cell?.note || ''}
                              </p>
                            </motion.div>
                          ) : (
                            <div
                              className="rounded-xl sm:rounded-[1.25rem] border-2 border-dashed opacity-50 group-hover:opacity-100 transition-all flex items-center justify-center"
                              style={{
                                borderColor: BRAND_BORDER,
                                background: '#FAFFFE',
                                minHeight: 68,
                                height: '100%',
                              }}
                            >
                              <div
                                className="p-1 sm:p-2.5 bg-white rounded-full shadow-md group-hover:scale-110 transition-transform"
                                style={{ color: BRAND }}
                              >
                                <HiPlus className="text-xs sm:text-xl" />
                              </div>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: BRAND }} />
            <span>Hôm nay</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full border-2 border-dashed border-gray-200" />
            <span>Trống</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="flex items-center gap-1.5 hover:text-green-700 transition-colors disabled:opacity-50"
          >
            {isExporting ? (
              <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin" />
            ) : (
              <HiCloudDownload className="text-base text-green-600" />
            )}
            <span>Excel</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 hover:text-blue-600 transition-colors"
          >
            <HiPrinter className="text-base" />
            <span>In</span>
          </button>
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {isRowManagerOpen && (
          <RowManager
            rows={timetable?.rows || []}
            onRowsUpdated={fetchTimetable}
            onClose={() => setIsRowManagerOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeCell && (
          <CellPopover
            cell={activeCell?.cell}
            row={activeCell?.row}
            dayIndex={activeCell?.dayIndex}
            weekDate={selectedDate}
            onSave={handleCellSave}
            onClose={() => setActiveCell(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TimetableEditor;
