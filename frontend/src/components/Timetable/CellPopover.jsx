import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { HiCheck, HiX, HiTrash } from 'react-icons/hi';
import { HiPaintBrush } from 'react-icons/hi2';

const PRESET_COLORS = [
  '#3B82F6', // Blue
  '#F97316', // Orange
  '#22C55E', // Green
  '#EF4444', // Red
  '#A855F7', // Purple
  '#06B6D4', // Cyan
  '#EAB308', // Yellow
  '#EC4899', // Pink
  '#78350F', // Brown
  '#64748B', // Gray
];

const DAYS_EN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAYS_VI = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];

/**
 * Calculates whether black or white text has better contrast with a hex color.
 */
const getContrastColor = (hex) => {
  if (!hex || hex === 'transparent' || !hex.startsWith('#')) return 'text-gray-800';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? 'text-gray-800' : 'text-white';
};

const CellPopover = ({ cell, row, dayIndex, weekDate, onSave, onClose }) => {
  console.log('[CellPopover] Rendering with:', { cell, row, dayIndex });
  const { t, i18n } = useTranslation();
  const textareaRef = useRef(null);

  const [note, setNote] = useState(cell?.note || '');
  const [color, setColor] = useState(cell?.color || '#E3F2FD');
  const [isSaving, setIsSaving] = useState(false);
  const MAX_LENGTH = 1000;

  // Sync state and handle accessibility
  useEffect(() => {
    setNote(cell?.note || '');
    setColor(cell?.color || '#E3F2FD');

    // Auto-focus textarea
    const timer = setTimeout(() => textareaRef.current?.focus(), 100);

    // ESC key listener
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [cell, onClose]);

  const handleSave = async () => {
    if (typeof onSave !== 'function') return;
    setIsSaving(true);
    try {
      await onSave({
        rowId: row?._id,
        dayOfWeek: dayIndex + 1,
        weekDate: weekDate instanceof Date ? weekDate.toISOString() : new Date().toISOString(),
        note: note.trim(),
        color,
      });
    } catch (err) {
      console.error('[CellPopover] Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const dayName = (i18n.language === 'vi' ? DAYS_VI : DAYS_EN)[dayIndex] || '';
  const textColorClass = getContrastColor(color);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-xl flex flex-col overflow-hidden max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">
                {dayName}
              </span>
              <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">
                Sửa buổi học
              </h3>
            </div>
            <p className="text-xs font-bold text-gray-400">
              {row?.roomName} • {row?.timeSlot}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-600"
          >
            <HiX className="text-2xl" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
          {/* Note Input */}
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Ghi chú
              </label>
              <span className={`text-[10px] font-bold ${note.length >= MAX_LENGTH ? 'text-red-500' : 'text-gray-300'}`}>
                {note.length} / {MAX_LENGTH}
              </span>
            </div>
            <textarea
              ref={textareaRef}
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, MAX_LENGTH))}
              className="w-full h-32 px-4 py-3 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-blue-100 outline-none resize-none text-sm font-medium text-gray-700 placeholder:text-gray-300 transition-all shadow-inner"
              placeholder="Nhập nội dung bài học..."
            />
          </div>

          {/* Color Selection */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
              Màu nền
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-12 h-12 rounded-xl transition-all border-2 shadow-sm flex items-center justify-center ${color === c ? 'border-blue-600 scale-110' : 'border-gray-200 hover:scale-105'
                    }`}
                  style={{ backgroundColor: c }}
                >
                  {color === c && <HiCheck className={`${getContrastColor(c)} text-xl shadow-sm`} />}
                </button>
              ))}
              {/* Custom Color Input */}
              <div className="relative group">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div
                  className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center shadow-sm ${!PRESET_COLORS.includes(color) ? 'border-blue-600 scale-110' : 'border-gray-100'
                    }`}
                  style={{ backgroundColor: !PRESET_COLORS.includes(color) ? color : '#fff' }}
                >
                  <HiPaintBrush className={`text-xl ${!PRESET_COLORS.includes(color) ? getContrastColor(color) : 'text-gray-300'}`} />
                </div>
              </div>
            </div>
          </div>

          {/* Preview Section */}
          <div className="pt-4 border-t border-dashed border-gray-100">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">
              Xem trước
            </label>
            <div
              className={`w-full min-h-[80px] rounded-2xl p-4 border border-black/5 shadow-sm transition-colors duration-300 flex items-center justify-center text-center`}
              style={{ backgroundColor: color }}
            >
              <p className={`text-sm font-black whitespace-pre-wrap ${textColorClass}`}>
                {note || "Xem trước ô sẽ hiển thị..."}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex gap-3">
          <button
            onClick={() => {
              setNote('');
              setColor(null);
              // Handle clear logic in parent if needed
            }}
            className="p-3 text-red-500 hover:bg-red-50 rounded-2xl transition-colors"
            title="Clear"
          >
            <HiTrash className="text-xl" />
          </button>

          <div className="flex-1 flex gap-3">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 px-6 py-3 bg-white border border-gray-200 text-gray-600 rounded-2xl font-bold text-sm hover:bg-gray-100 transition-all disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-[2] px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang lưu...
                </div>
              ) : (
                <><HiCheck className="text-xl" /> Lưu</>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CellPopover;
