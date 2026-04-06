import React from 'react';
import { useTranslation } from 'react-i18next';
import { HiChevronLeft, HiChevronRight, HiCalendar } from 'react-icons/hi';

const WeekSelector = ({ selectedDate, setSelectedDate }) => {
  const { t, i18n } = useTranslation();

  const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const getEndOfWeek = (date) => {
    const start = getStartOfWeek(date);
    const end = new Date(start);
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

  const formatDate = (date) => {
    return date.toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6">
      <div className="flex items-center gap-3 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl">
        <HiCalendar className="text-xl" />
        <span className="font-bold text-sm whitespace-nowrap">
          Tuần
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handlePrevWeek}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
          title={t('common.prev')}
        >
          <HiChevronLeft className="text-2xl" />
        </button>

        <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl min-w-[240px] text-center">
          <span className="text-sm font-medium text-gray-700 font-display">
            {formatDate(currentMonday)} — {formatDate(currentSunday)}
          </span>
        </div>

        <button
          onClick={handleNextWeek}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
          title={t('common.next')}
        >
          <HiChevronRight className="text-2xl" />
        </button>
      </div>

      <button
        onClick={() => setSelectedDate(getStartOfWeek(new Date()))}
        className="ml-auto text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
      >
        {t('admin.recentRegistrations')} {/* Using an existing "Recent" key as placeholder or "Today" */}
        {i18n.language === 'vi' ? 'Tuần này' : 'Jump to this week'}
      </button>
    </div>
  );
};

export default WeekSelector;
