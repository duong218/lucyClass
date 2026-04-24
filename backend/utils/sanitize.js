const sanitizeHtml = require('sanitize-html');

const MAX_RAW_LENGTH = 60000;
const MAX_LENGTH = 15000;
const MAX_OBJECT_DEPTH = 20;
const BLOCKED_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

const toSanitizableString = (input) => {
  if (input === undefined || input === null) {
    return '';
  }

  if (typeof input === 'string') {
    return input;
  }

  if (
    typeof input === 'number' ||
    typeof input === 'boolean' ||
    typeof input === 'bigint'
  ) {
    return String(input);
  }

  if (Array.isArray(input)) {
    return input.map((item) => toSanitizableString(item)).join(',');
  }

  return String(input);
};

/**
 * Strips all HTML tags and attributes from an input string.
 * Helps prevent Stored XSS attacks.
 *
 * @param {string} input - The raw user input.
 * @returns {string} - Plain text without any HTML.
 */
const cleanInput = (input) => {
  const rawInput = toSanitizableString(input);
  const boundedInput =
    rawInput.length > MAX_RAW_LENGTH ? rawInput.slice(0, MAX_RAW_LENGTH) : rawInput;

  // Use sanitize-html to remove all tags & attributes, keeping only text.
  const sanitized = sanitizeHtml(boundedInput, {
    allowedTags: [],
    allowedAttributes: {}
  });

  // [SECURITY] Normalize unicode: chuyển về dạng chuẩn NFC để tránh bypass
  // bằng các ký tự unicode trông giống nhau nhưng encoding khác (homograph attack)
  const normalized = sanitized.normalize('NFC');

  // [SECURITY] Giới hạn độ dài đầu vào sau khi sanitize
  // Ngăn chặn ReDoS và các payload cực dài gây quá tải hệ thống
  // Đã nâng từ 5000 lên 15000 để an toàn cho description của Thông báo (7000 chars)
  return normalized.length > MAX_LENGTH ? normalized.slice(0, MAX_LENGTH) : normalized;
};

/**
 * Recursively sanitizes all string values in a plain object or array.
 * Useful for cleaning req.body trước khi xử lý.
 *
 * @param {any} data - Object, array, or primitive to sanitize.
 * @returns {any} - Sanitized version of the input.
 */
// [SECURITY] Hàm tiện ích: sanitize đệ quy toàn bộ object (ví dụ req.body)
// Tránh trường hợp quên gọi cleanInput cho từng field
const cleanObject = (data, seen = new WeakSet(), depth = 0) => {
  if (Array.isArray(data)) {
    if (depth >= MAX_OBJECT_DEPTH) {
      return [];
    }

    return data.map((item) => cleanObject(item, seen, depth + 1));
  }

  if (data !== null && typeof data === 'object') {
    if (seen.has(data)) {
      return null;
    }

    if (depth >= MAX_OBJECT_DEPTH) {
      return {};
    }

    seen.add(data);

    const cleaned = Object.fromEntries(
      Object.entries(data)
        .filter(([key]) => !BLOCKED_KEYS.has(key))
        .map(([key, value]) => [key, cleanObject(value, seen, depth + 1)])
    );

    seen.delete(data);

    return cleaned;
  }

  if (
    typeof data === 'number' ||
    typeof data === 'boolean' ||
    typeof data === 'bigint'
  ) {
    return data;
  }

  if (typeof data === 'string') {
    return cleanInput(data);
  }

  return data;
};

module.exports = { cleanInput, cleanObject };
