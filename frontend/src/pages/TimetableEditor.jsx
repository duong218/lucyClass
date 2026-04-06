import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { HiCog, HiCalendar, HiRefresh, HiPrinter, HiPlus, HiEmojiSad, HiCloudDownload } from 'react-icons/hi';
import timetableService from '../services/timetableService';
import WeekSelector from '../components/Timetable/WeekSelector';
import RowManager from '../components/Timetable/RowManager';
import CellPopover from '../components/Timetable/CellPopover';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

const DAYS_VI = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
const DAYS_EN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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

  // 📦 SAFE STATE INITIALIZATION
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [timetable, setTimetable] = useState({ rows: [], cells: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isRowManagerOpen, setIsRowManagerOpen] = useState(false);
  const [activeCell, setActiveCell] = useState(null);

  // 🛠️ DEBUG LOG
  useEffect(() => {
    if (activeCell) {
      console.log('[TimetableEditor] Active cell changed:', activeCell);
    }
  }, [activeCell]);

  const fetchTimetable = useCallback(async () => {
    // 🛡️ Guard against double calls and unauthenticated states
    if (isFetchingRef.current || !isAuthenticated) return;
    
    isFetchingRef.current = true;
    setIsLoading(true);
    
    try {
      const data = await timetableService.getTimetable(selectedDate.toISOString());
      // 🛡️ DEFENSIVE DATA HANDLING
      setTimetable({
        rows: Array.isArray(data?.rows) ? data.rows : [],
        cells: Array.isArray(data?.cells) ? data.cells : []
      });
    } catch (err) {
      console.error('[TimetableEditor] Fetch failed:', err);
      toast.error('Failed to load timetable data');
      setTimetable({ rows: [], cells: [] });
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [selectedDate, isAuthenticated]);

  // 🔐 AUTH GATING & INITIAL CALL
  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      fetchTimetable();
    }
  }, [isInitialized, isAuthenticated, fetchTimetable]);

  const handleCellSave = async (cellData) => {
    try {
      await timetableService.upsertCell(cellData);
      toast.success(t('success') || 'Success');
      setActiveCell(null);
      fetchTimetable();
    } catch (err) {
      toast.error(err.message || 'Error saving cell');
      throw err;
    }
  };

  const handleExportExcel = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const blob = await timetableService.exportTimetable(selectedDate.toISOString());
      
      // Create personal download link
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      
      // Filename construction
      const dateStr = selectedDate.toISOString().split('T')[0];
      link.setAttribute('download', `Timetable_Report_${dateStr}.xlsx`);
      
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Excel file generated successfully');
    } catch (err) {
      console.error('[Timetable] Export failed:', err);
      toast.error('Failed to export Excel file');
    } finally {
      setIsExporting(false);
    }
  };

  const getCellData = (rowId, dayIndex) => {
    return (timetable?.cells || []).find(
      (c) => c?.rowId === rowId && c?.dayOfWeek === dayIndex + 1
    );
  };

  const days = i18n.language === 'vi' ? DAYS_VI : DAYS_EN;

  // ⏳ LOADING UX IMPROVEMENT: AUTH LOADING
  if (!isInitialized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 font-bold animate-pulse">Initializing access...</p>
      </div>
    );
  }

  // ⏳ LOADING UX IMPROVEMENT: AUTH CHECK (Safety)
  if (!isAuthenticated) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 🚀 Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-800 tracking-tight uppercase">
            {t('admin.timetable') || 'Timetable'}
          </h1>
          <p className="text-gray-500 font-medium">
            {t('admin.adminAccess') || 'Management Portal'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRowManagerOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-2xl font-bold hover:shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            <HiCog className="text-xl text-gray-400" />
            Quản lý dòng
          </button>
          <button
            onClick={fetchTimetable}
            disabled={isLoading}
            className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-100 transition-colors disabled:opacity-50"
          >
            <HiRefresh className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <WeekSelector
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
      />

      {/* 🚀 Grid Container */}
      <div className="relative bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden min-h-[500px]">
        {/* ⏳ DATA LOADING OVERLAY */}
        {isLoading && (
          <div className="absolute inset-0 z-[60] bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] animate-pulse">Syncing...</span>
            </div>
          </div>
        )}

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-[#E8F0FE] border-b border-[#CBD5E0]">
                {/* 📌 Sticky Header Corner */}
                <th className="p-6 text-left sticky left-0 bg-[#E8F0FE] z-[50] w-56 border-r border-[#CBD5E0]">
                  <span className="text-[10px] font-black text-[#1A365D] uppercase tracking-widest leading-relaxed">
                    {t('admin.rowManager.room') || 'Room'} /<br/> {t('admin.rowManager.slot') || 'Slot'}
                  </span>
                </th>
                {days.map((day, idx) => {
                  const dateAtIdx = new Date(selectedDate.getTime() + idx * 86400000);
                  const isToday = new Date().toDateString() === dateAtIdx.toDateString();
                  
                  return (
                    <th key={idx} className={`p-6 text-center border-l border-[#CBD5E0] ${isToday ? 'bg-blue-100/50' : ''}`}>
                      <span className={`text-[11px] font-black uppercase tracking-[0.1em] block mb-0.5 ${isToday ? 'text-blue-700' : 'text-[#1A365D]'}`}>
                        {day}
                      </span>
                      <span className={`text-sm font-black ${isToday ? 'text-blue-700' : 'text-[#1A365D]'}`}>
                        {dateAtIdx.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {/* 🛡️ EMPTY STATE */}
              {(timetable?.rows?.length || 0) === 0 ? (
                <tr>
                  <td colSpan={8} className="p-32 text-center">
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex flex-col items-center gap-6"
                    >
                      <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                        <HiCalendar className="text-5xl" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-xl font-black text-gray-800 uppercase tracking-tight">No rooms configured yet</p>
                        <p className="text-gray-400 font-medium">Add rooms and slots to begin building your weekly schedule.</p>
                      </div>
                      <button
                        onClick={() => setIsRowManagerOpen(true)}
                        className="flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:shadow-xl hover:shadow-blue-200 transition-all hover:-translate-y-1"
                      >
                        <HiPlus className="text-lg" />
                        {t('admin.rowManager.add_row')}
                      </button>
                    </motion.div>
                  </td>
                </tr>
              ) : (
                timetable?.rows?.map((row) => (
                  <tr key={row?._id} className="group even:bg-[#F9FAFB] hover:bg-blue-50/50 transition-colors border-b border-[#E2E8F0] last:border-0 h-32">
                    {/* 📌 Sticky Row Info */}
                    <td className="p-6 sticky left-0 bg-[#F7FAFC] group-hover:bg-[#EDF2F7] font-bold border-r-2 border-[#CBD5E0] z-[40] shadow-[10px_0_15px_-15px_rgba(0,0,0,0.1)]">
                      <div className="text-lg text-[#2D3748] font-black tracking-tight leading-tight mb-1 truncate">{row?.roomName || 'Unnamed'}</div>
                      <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest bg-white/50 px-2 py-0.5 rounded-lg w-fit border border-[#E2E8F0]">
                        {row?.timeSlot || '--:--'}
                      </div>
                    </td>
                    {[...Array(7)].map((_, idx) => {
                      const cell = getCellData(row?._id, idx);
                      return (
                        <td
                          key={idx}
                          onClick={() => setActiveCell({ cell, row, dayIndex: idx })}
                          className="p-2 border-l border-[#E2E8F0] cursor-pointer relative"
                        >
                          {cell ? (
                            <motion.div
                              layoutId={`cell-${cell?._id}`}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className={`h-full w-full rounded-[1.25rem] p-4 shadow-sm border border-black/5 flex flex-col justify-center overflow-hidden transition-all duration-300 hover:shadow-md hover:scale-[1.02] hover:z-30`}
                              style={{ backgroundColor: cell?.color || '#F8FAFC' }}
                            >
                              <p className={`text-xs font-black leading-snug break-words ${getContrastColor(cell?.color)}`}>
                                {cell?.note || ''}
                              </p>
                              {(cell?.note?.length || 0) > 40 && (
                                <div className={`mt-2 h-1 w-6 rounded-full opacity-30 ${getContrastColor(cell?.color).includes('white') ? 'bg-white' : 'bg-black'}`} />
                              )}
                            </motion.div>
                          ) : (
                            /* 🚀 HOVER PLUS OVERLAY */
                            <div className="h-full w-full rounded-[1.25rem] border-2 border-dashed border-blue-200/50 bg-[#FFFDF5] opacity-80 group-hover:opacity-100 hover:border-blue-400 hover:bg-blue-50 hover:scale-[1.02] transition-all flex items-center justify-center text-blue-500">
                              <div className="p-3 bg-white rounded-full shadow-lg group-hover:scale-110 transition-transform">
                                <HiPlus className="text-xl font-bold" />
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

      {/* 🚀 Footer Legend */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
            <span>Today's Sessions</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border-2 border-dashed border-gray-200" />
            <span>Available Slots</span>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="flex items-center gap-2 hover:text-green-600 transition-colors disabled:opacity-50"
          >
            {isExporting ? (
              <div className="w-4 h-4 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin" />
            ) : (
              <HiCloudDownload className="text-lg text-green-600" />
            )}
            Export to Excel
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 hover:text-blue-600 transition-colors"
          >
            <HiPrinter className="text-lg" />
            Export Schedule
          </button>
        </div>
      </div>

      {/* 🚀 Modals */}
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
