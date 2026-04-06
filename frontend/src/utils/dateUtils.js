/**
 * Formats a date string or object to DD/MM/YYYY HH:mm:ss
 * @param {string|Date} date 
 * @returns {string}
 */
export const formatDateTime = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';

  const pad = (num) => String(num).padStart(2, '0');

  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

/**
 * Returns a relative time string (e.g., "Just now", "2 minutes ago")
 * @param {string|Date} date 
 * @param {Function} t - translation function
 * @returns {string}
 */
export const getRelativeTime = (date, t) => {
  if (!date || !t) return '';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    const now = new Date();
    const diffInSeconds = Math.floor((now - d) / 1000);

    if (diffInSeconds < 60) {
      return t('common.time_now');
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return t('common.minutes_ago', { count: diffInMinutes });
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return t('common.hours_ago', { count: diffInHours });
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return t('common.days_ago', { count: diffInDays });
    }

    return formatDateTime(date);
  } catch (error) {
    return '';
  }
};
