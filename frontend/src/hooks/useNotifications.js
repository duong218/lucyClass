import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

/**
 * useNotifications
 * Hook dùng chung cho Admin, Teacher, Marketing.
 * Polling /api/announcements/latest mỗi `interval` ms để cập nhật badge.
 *
 * @param {object} options
 * @param {number} [options.interval=60000]  - polling interval (ms), default 1 phút
 * @param {boolean} [options.enabled=true]   - tắt polling khi user chưa login
 */
const useNotifications = ({ interval = 60_000, enabled = true } = {}) => {
  const [newCount, setNewCount] = useState(0);
  const [latest, setLatest] = useState(null);   // thông báo mới nhất để preview
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const timerRef = useRef(null);

  // ─── Fetch ──────────────────────────────────────────────────────────────
  const fetchLatest = useCallback(async () => {
    if (!enabled) return;
    try {
      const res = await api.get('/announcements/latest');
      if (res.data?.success) {
        setNewCount(res.data.data.newCount ?? 0);
        setLatest(res.data.data.latest ?? null);
      }
    } catch {
      // silent — không spam console khi user logout
    }
  }, [enabled]);

  // ─── Polling ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    fetchLatest();                               // fetch ngay khi mount
    timerRef.current = setInterval(fetchLatest, interval);

    return () => clearInterval(timerRef.current);
  }, [fetchLatest, interval, enabled]);

  // ─── Mở bell → mark seen ────────────────────────────────────────────────
  const openBell = useCallback(async () => {
    setIsOpen(true);
    if (newCount > 0) {
      setNewCount(0);                            // optimistic update UI ngay
      try {
        await api.patch('/announcements/mark-seen');
      } catch {
        // nếu lỗi, lần poll tiếp sẽ tự đồng bộ lại
      }
    }
  }, [newCount]);

  const closeBell = useCallback(() => setIsOpen(false), []);

  const toggleBell = useCallback(() => {
    if (isOpen) closeBell();
    else openBell();
  }, [isOpen, openBell, closeBell]);

  return {
    newCount,   // số hiện trên badge
    latest,     // object announcement mới nhất (title, description, image, createdAt)
    loading,
    isOpen,
    toggleBell,
    openBell,
    closeBell,
    refresh: fetchLatest,
  };
};

export default useNotifications;
