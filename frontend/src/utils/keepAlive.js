// src/utils/keepAlive.js
// Ping BE mỗi 10 phút để Render không bị spin down (free tier ngủ sau 15 phút)
export const keepAliveBackend = () => {
  const BE_URL = import.meta.env.VITE_API_URL || 'https://lucyclass.onrender.com';

  const ping = () => {
    fetch(`${BE_URL}/api/health`, { method: 'GET' })
      .catch(() => {}); // silent — không cần handle lỗi
  };

  ping(); // ping ngay khi user mở trang
  setInterval(ping, 10 * 60 * 1000); // ping mỗi 10 phút
};
