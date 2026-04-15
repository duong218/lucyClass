const API_BASE = import.meta.env.VITE_API_URL;

const parseJsonSafe = async (res) => {
  try {
    return await res.json();
  } catch (_err) {
    return {};
  }
};

const getHeaders = ({ withAuth = false } = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  };

  if (withAuth) {
    const token = localStorage.getItem('streak_token');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return headers;
};

const normalizeResponse = (res, payload) => ({
  success: res.ok && payload.success !== false,
  status: res.status,
  data: payload.data || null,
  token: payload.token,
  message: payload.message || ''
});

export const startStreak = async ({ name, email }) => {
  const res = await fetch(`${API_BASE}/api/streak/start`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ name, email })
  });

  const payload = await parseJsonSafe(res);
  const normalized = normalizeResponse(res, payload);

  if (normalized.success && normalized.token) {
    localStorage.setItem('streak_token', normalized.token);
  }

  return normalized;
};

export const fetchStreak = async () => {
  const res = await fetch(`${API_BASE}/api/streak/me`, {
    method: 'GET',
    headers: getHeaders({ withAuth: true })
  });

  const payload = await parseJsonSafe(res);
  return normalizeResponse(res, payload);
};

export const checkinStreak = async () => {
  const res = await fetch(`${API_BASE}/api/streak/checkin`, {
    method: 'POST',
    headers: getHeaders({ withAuth: true }),
    body: JSON.stringify({})
  });

  const payload = await parseJsonSafe(res);
  return normalizeResponse(res, payload);
};

export const clearStreakToken = () => {
  localStorage.removeItem('streak_token');
};
