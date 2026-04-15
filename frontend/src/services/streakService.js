const API_BASE = import.meta.env.VITE_API_URL;

export const fetchStreak = async (phone) => {
  const res = await fetch(`${API_BASE}/api/streak/${phone}`);
  return res.json();
};

export const checkinStreak = async (data) => {
  const res = await fetch(`${API_BASE}/api/streak/checkin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
};

export const recoverStreak = async (data) => {
  const res = await fetch(`${API_BASE}/api/streak/recover`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
};
