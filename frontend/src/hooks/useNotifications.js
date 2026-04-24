import { useState, useEffect, useCallback, useRef } from 'react';
import { getLatestAnnouncement, markAnnouncementsSeen } from '../services/announcementService';

/**
 * useNotifications
 * Hook polling /announcements/latest mỗi `interval` ms.
 *
 * Trả về:
 *  newCount     — số thông báo published chưa đọc (badge đỏ)
 *  pendingCount — số thông báo đang chờ admin duyệt (badge vàng, admin thấy)
 *  latest       — thông báo published mới nhất
 *  isOpen       — trạng thái mở/đóng dropdown
 *  toggleBell   — toggle dropdown
 *  closeBell    — đóng dropdown
 */
const useNotifications = ({ enabled = true, interval = 60000 } = {}) => {
  const [newCount, setNewCount]         = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [latest, setLatest]             = useState(null);
  const [isOpen, setIsOpen]             = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const fetchLatest = useCallback(async () => {
    if (!enabled) return;
    try {
      const res = await getLatestAnnouncement();
      const { latest: l, newCount: n, pendingCount: p } = res.data?.data || {};
      if (!isMounted.current) return;
      setLatest(l || null);
      setNewCount(typeof n === 'number' ? n : 0);
      setPendingCount(typeof p === 'number' ? p : 0);
    } catch {
      // silent — không làm rỗng data cũ
    }
  }, [enabled]);

  // Polling
  useEffect(() => {
    if (!enabled) return;
    fetchLatest();
    const id = setInterval(fetchLatest, interval);
    return () => clearInterval(id);
  }, [enabled, interval, fetchLatest]);

  const toggleBell = useCallback(async () => {
    setIsOpen(prev => {
      const next = !prev;
      // Khi mở → mark seen (reset isUnread trên server)
      if (next) {
        markAnnouncementsSeen().catch(() => {});
        setNewCount(0);
      }
      return next;
    });
  }, []);

  const closeBell = useCallback(() => setIsOpen(false), []);

  return { newCount, pendingCount, latest, isOpen, toggleBell, closeBell };
};

export default useNotifications;