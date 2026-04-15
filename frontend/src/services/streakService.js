const API_BASE = import.meta.env.VITE_API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem('streak_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

export const fetchStreak = async () => {
  const res = await fetch(`${API_BASE}/api/streak/me`, {
    headers: getAuthHeaders()
  });
  return res.json();
};

export const checkinStreak = async (data) => {
  const res = await fetch(`${API_BASE}/api/streak/checkin`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  return res.json();
};

export const recoverStreak = async (data) => {
  const res = await fetch(`${API_BASE}/api/streak/recover`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  return res.json();
};

export const reviveStreak = async (data) => {
  const res = await fetch(`${API_BASE}/api/streak/revive`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  return res.json();
};

export const loginStreak = async (phone) => {
  const res = await fetch(`${API_BASE}/api/streak/login`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ phone })
  });
  const data = await res.json();
  if (data.success) {
    localStorage.setItem('streak_token', data.token);
  }
  return data;
};
