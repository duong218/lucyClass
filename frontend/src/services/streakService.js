const API_BASE = import.meta.env.VITE_API_URL;
import { getDeviceId } from '../utils/deviceId';

const parseJsonSafe = async (res) => {
  try {
    return await res.json();
  } catch (_err) {
    return {};
  }
};

const getHeaders = () => {
  return {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  };
};

/**
 * FIX #1: Spread toàn bộ payload trước, sau đó override các field chuẩn hóa.
 * Trước đây chỉ map cứng 4 field → nuốt mất needRevive, missedDays, streakExpired, diffDays, today
 */
const normalizeResponse = (res, payload) => ({
  ...payload,                                      // ← giữ LẠI toàn bộ field từ backend
  success: res.ok && payload.success !== false,    // ← override success theo HTTP status
  status: res.status,
  data: payload.data || null,
  message: payload.message || ''
});

export const startStreak = async ({ phone, name, email }) => {
  const res = await fetch(`${API_BASE}/api/streak/start`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ phone, name, email, deviceId: getDeviceId() })
  });

  const payload = await parseJsonSafe(res);
  return normalizeResponse(res, payload);
};

export const fetchStreak = async (phone) => {
  if (!phone) return { success: false, message: 'Thiếu số điện thoại' };

  const res = await fetch(`${API_BASE}/api/streak/me?phone=${encodeURIComponent(phone)}`, {
    method: 'GET',
    headers: getHeaders()
  });

  const payload = await parseJsonSafe(res);
  return normalizeResponse(res, payload);
  // Sau fix: res.streakExpired, res.diffDays, res.today đều có giá trị đúng
};

export const checkinStreak = async (phone, forceReset = false) => {
  const res = await fetch(`${API_BASE}/api/streak/checkin`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ phone, forceReset, deviceId: getDeviceId() })
  });

  const payload = await parseJsonSafe(res);
  return normalizeResponse(res, payload);
  // Sau fix: res.needRevive, res.missedDays đều có giá trị đúng
};

export const reviveStreak = async (phone) => {
  const res = await fetch(`${API_BASE}/api/streak/revive`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ phone, deviceId: getDeviceId() })
  });

  const payload = await parseJsonSafe(res);
  return normalizeResponse(res, payload);
};
