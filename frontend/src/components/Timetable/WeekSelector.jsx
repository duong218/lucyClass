import React from 'react';
import { useTranslation } from 'react-i18next';
import { HiChevronLeft, HiChevronRight, HiCalendar } from 'react-icons/hi';

const BRAND      = '#1C695C';
const BRAND_BG   = '#E8F5F3';
const BRAND_TEXT = '#1C695C';

const WeekSelector = ({ selectedDate, setSelectedDate }) => {
  const { t, i18n } = useTranslation();

  const getStartOfWeek = (date) => {
    const d   = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const getEndOfWeek = (date) => {
    const start = getStartOfWeek(date);
    const end   = new Date(start);
    end.setDate(start.getDate() + 6);
    return end;
  };

  const handlePrevWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() - 7);
    setSelectedDate(getStartOfWeek(newDate));
  };

  const handleNextWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + 7);
    setSelectedDate(getStartOfWeek(newDate));
  };

  const currentMonday = getStartOfWeek(selectedDate);
  const currentSunday = getEndOfWeek(selectedDate);

  // Compact format for mobile, fuller for desktop
  const formatDateShort = (date) =>
    date.toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
      day: 'numeric',
      month: 'short',
    });

  const formatDateFull = (date) =>
    date.toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  return (
    <div className="flex items-center gap-2 sm:gap-4 bg-white px-3 sm:px-4 py-3 rounded-2xl shadow-sm border border-gray-100 mb-4 sm:mb-6">

      {/* Calendar badge — hidden on very small screens to save space */}
      <div
        className="hidden xs:flex items-center gap-1.5 px-3 py-1.5 rounded-xl shrink-0 text-sm font-bold"
        style={{ background: BRAND_BG, color: BRAND_TEXT }}
      >
        <HiCalendar className="text-base" />
        <span className="hidden sm:inline">Tuần</span>
      </div>

      {/* Prev button */}
      <button
        onClick={handlePrevWeek}
        className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 shrink-0"
        title={t('common.prev') || 'Tuần trước'}
      >
        <HiChevronLeft className="text-xl" />
      </button>

      {/* Date range display — grows to fill space */}
      <div className="flex-1 text-center">
        {/* Mobile: compact two dates */}
        <span className="sm:hidden text-xs font-bold text-gray-700">
          {formatDateShort(currentMonday)} — {formatDateShort(currentSunday)}
        </span>
        {/* Desktop: full dates */}
        <span className="hidden sm:inline text-sm font-medium text-gray-700 font-display">
          {formatDateFull(currentMonday)} — {formatDateFull(currentSunday)}
        </span>
      </div>

      {/* Next button */}
      <button
        onClick={handleNextWeek}
        className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 shrink-0"
        title={t('common.next') || 'Tuần sau'}
      >
        <HiChevronRight className="text-xl" />
      </button>

      {/* Jump to this week */}
      <button
        onClick={() => setSelectedDate(getStartOfWeek(new Date()))}
        className="text-[10px] sm:text-xs font-bold hover:underline shrink-0"
        style={{ color: BRAND }}
      >
        <span className="hidden sm:inline">
          {i18n.language === 'vi' ? 'Tuần này' : 'This week'}
        </span>
        {/* Mobile: icon only */}
        <span className="sm:hidden">
          <HiCalendar className="text-base" style={{ color: BRAND }} />
        </span>
      </button>
    </div>
  );
};

export default WeekSelector;
