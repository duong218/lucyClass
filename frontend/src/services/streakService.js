const API_BASE = import.meta.env.VITE_API_URL;

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

const normalizeResponse = (res, payload) => ({
  success: res.ok && payload.success !== false,
  status: res.status,
  data: payload.data || null,
  message: payload.message || ''
});

export const startStreak = async ({ phone, name, email }) => {
  const res = await fetch(`${API_BASE}/api/streak/start`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ phone, name, email })
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
};

export const checkinStreak = async (phone, forceReset = false) => {
  const res = await fetch(`${API_BASE}/api/streak/checkin`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ phone, forceReset })
  });

  const payload = await parseJsonSafe(res);
  return normalizeResponse(res, payload);
};

export const reviveStreak = async (phone) => {
  const res = await fetch(`${API_BASE}/api/streak/revive`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ phone })
  });

  const payload = await parseJsonSafe(res);
  return normalizeResponse(res, payload);
};
