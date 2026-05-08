/**
 * 🔒 Nguồn sự thật duy nhất cho origin whitelist.
 * Cả CORS (server.js) lẫn CSRF (securityMiddleware.js) đều import từ đây.
 *
 * Thứ tự ưu tiên: CORS_ORIGINS > CLIENT_URL > FRONTEND_URL
 * - CORS_ORIGINS  : biến chính thức từ giờ trở đi
 * - CLIENT_URL    : fallback để staging/production cũ không chết khi chưa update env
 * - FRONTEND_URL  : deprecated — giữ fallback để tương thích, xóa sau khi toàn bộ env đã dùng CORS_ORIGINS
 *
 * Format: một hoặc nhiều origin cách nhau bởi dấu phẩy, không có trailing slash.
 * Ví dụ CORS_ORIGINS=https://lucyclass.vn,https://admin.lucyclass.vn
 */
function getAllowedOrigins() {
  const raw =
    process.env.CORS_ORIGINS ||
    process.env.CLIENT_URL ||
    process.env.FRONTEND_URL ||
    '';

  return raw
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

module.exports = { getAllowedOrigins };