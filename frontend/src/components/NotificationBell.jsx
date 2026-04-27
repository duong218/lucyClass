import React, { useRef, useEffect, useState, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import useNotifications from '../hooks/useNotifications';
import AnnouncementListModal from './AnnouncementListModal';
import { useAuth } from '../contexts/AuthContext';

// Lazy-load review modal (chỉ admin dùng)
const AnnouncementReviewModal = lazy(() => import('./AnnouncementReviewModal'));

/**
 * NotificationBell
 * Dùng chung cho Admin, Teacher, Marketing.
 *
 * Props:
 *  @param {boolean}  enabled       - truyền !!user
 *  @param {number}   [interval]    - polling ms (default 60000)
 *  @param {string}   [accentColor] - màu badge + ring (default "#1C695C")
 */
const NotificationBell = ({
  enabled = true,
  interval,
  accentColor = '#1C695C',
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const navigate = useNavigate();

  const [listOpen, setListOpen] = useState(false);
  const [pendingAnnouncement, setPendingAnnouncement] = useState(null);

  const { newCount, pendingCount, latest, isOpen, toggleBell, closeBell } = useNotifications({
    enabled,
    ...(interval ? { interval } : {}),
  });

  // Smart dropdown positioning
  const [dropdownStyle, setDropdownStyle] = useState({});

  useEffect(() => {
    if (!isOpen || !wrapRef.current) return;

    const updatePosition = () => {
      const rect = wrapRef.current.getBoundingClientRect();
      const viewportW = window.innerWidth;
      const viewportH = window.innerHeight;
      const dropdownW = viewportW < 400 ? viewportW - 16 : 320;
      const dropdownH = 420; // approximate max height

      // Horizontal: prefer right-aligned, but shift left if it overflows
      let rightOffset = 0;
      let leftOffset = 'auto';
      const rightEdge = rect.right;
      const overflowLeft = rect.right - dropdownW;

      if (overflowLeft < 8) {
        // Not enough space on the left — center on screen on mobile
        if (viewportW < 500) {
          leftOffset = -(rect.left - 8) + 'px';
          rightOffset = 'auto';
        } else {
          rightOffset = -(dropdownW - rect.width) + 'px';
        }
      } else {
        rightOffset = '0px';
      }

      // Vertical: prefer below, flip above if not enough room
      const spaceBelow = viewportH - rect.bottom - 10;
      const topOffset = spaceBelow < dropdownH && rect.top > dropdownH
        ? -(dropdownH + 8) + 'px'
        : 'calc(100% + 10px)';

      setDropdownStyle({
        width: dropdownW,
        top: topOffset,
        right: rightOffset,
        left: leftOffset,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [isOpen]);

  // Đóng dropdown khi click ngoài
  const wrapRef = useRef(null);
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) closeBell();
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, closeBell]);

  const hasBadge = newCount > 0;
  // Admin thấy badge đỏ nếu có pending chờ duyệt
  const totalBadge = isAdmin ? (newCount + pendingCount) : newCount;
  const hasAnyBadge = totalBadge > 0;

  return (
    <div ref={wrapRef} style={{ position: 'relative', display: 'inline-block' }}>

      {/* ── Bell Button ──────────────────────────────────────────────────── */}
      <button
        onClick={toggleBell}
        title="Thông báo"
        style={{
          position: 'relative',
          width: 44,
          height: 44,
          borderRadius: '50%',
          border: `2px solid ${hasAnyBadge ? accentColor : '#e5e7eb'}`,
          background: isOpen ? `${accentColor}15` : '#ffffff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          boxShadow: hasAnyBadge
            ? `0 0 0 3px ${accentColor}25, 0 2px 8px rgba(0,0,0,0.08)`
            : '0 2px 6px rgba(0,0,0,0.06)',
          outline: 'none',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'scale(1.08)';
          e.currentTarget.style.boxShadow = `0 0 0 4px ${accentColor}20, 0 4px 12px rgba(0,0,0,0.1)`;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = hasAnyBadge
            ? `0 0 0 3px ${accentColor}25, 0 2px 8px rgba(0,0,0,0.08)`
            : '0 2px 6px rgba(0,0,0,0.06)';
        }}
      >
        {/* Bell SVG */}
        <svg
          width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke={hasAnyBadge ? accentColor : '#6b7280'}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{
            transition: 'all 0.2s',
            animation: hasAnyBadge ? 'bell-ring 0.6s ease-in-out' : 'none',
          }}
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {/* Badge tổng */}
        {hasAnyBadge && (
          <span
            style={{
              position: 'absolute', top: -4, right: -4,
              minWidth: 18, height: 18, borderRadius: 9,
              background: '#ef4444', color: '#fff',
              fontSize: 10, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 4px', border: '2px solid #fff',
              boxShadow: '0 1px 4px rgba(239,68,68,0.5)',
              lineHeight: 1,
              animation: 'badge-pop 0.3s cubic-bezier(0.175,0.885,0.32,1.275)',
            }}
          >
            {totalBadge > 9 ? '9+' : totalBadge}
          </span>
        )}
      </button>

      {/* ── Dropdown ─────────────────────────────────────────────────────── */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: dropdownStyle.top || 'calc(100% + 10px)',
            right: dropdownStyle.right ?? 0,
            left: dropdownStyle.left || 'auto',
            width: dropdownStyle.width || 320,
            background: '#fff', borderRadius: 16,
            boxShadow: '0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.08)',
            border: '1px solid #f0f0f0', zIndex: 9999, overflow: 'hidden',
            animation: 'dropdown-in 0.2s cubic-bezier(0.175,0.885,0.32,1.275)',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '14px 18px 12px', borderBottom: '1px solid #f5f5f5',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#1a1a1a' }}>Thông báo</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {hasBadge && (
                <span style={{
                  fontSize: 11, fontWeight: 600,
                  background: `${accentColor}15`, color: accentColor,
                  padding: '2px 8px', borderRadius: 99,
                }}>
                  {newCount} mới
                </span>
              )}
              {/* Pending badge — chỉ admin thấy */}
              {isAdmin && pendingCount > 0 && (
                <span style={{
                  fontSize: 11, fontWeight: 600,
                  background: '#fef3c7', color: '#d97706',
                  padding: '2px 8px', borderRadius: 99,
                }}>
                  {pendingCount} chờ duyệt
                </span>
              )}
            </div>
          </div>

          {/* Admin pending section */}
          {isAdmin && pendingCount > 0 && (
            <div style={{
              margin: '10px 18px 0',
              padding: '10px 14px',
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: 10,
            }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#92400e' }}>
                📋 {pendingCount} thông báo từ MKT đang chờ bạn duyệt
              </p>
              <button
                onClick={() => {
                  closeBell();
                  navigate('/admin/announcements');
                  // Delay nhỏ để page mount xong rồi mới dispatch event chuyển tab
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('announcement:open-pending'));
                  }, 100);
                }}
                style={{
                  marginTop: 6, background: 'none', border: 'none',
                  color: '#d97706', fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', padding: 0,
                  textDecoration: 'underline',
                }}
              >
                Xem & duyệt ngay →
              </button>
            </div>
          )}

          {/* Latest published content */}
          {latest ? (
            <div style={{ padding: '14px 18px' }}>
              {latest.image && (
                <div style={{
                  width: '100%', height: 110, borderRadius: 10,
                  overflow: 'hidden', marginBottom: 12, background: '#f3f4f6',
                }}>
                  <img
                    src={latest.image} alt={latest.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                <span style={{
                  flexShrink: 0, width: 8, height: 8, borderRadius: '50%',
                  background: accentColor, marginTop: 5,
                }} />
                <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#1a1a1a', lineHeight: 1.4 }}>
                  {latest.title}
                </p>
              </div>
              <p style={{
                margin: '0 0 10px 16px', fontSize: 12, color: '#6b7280',
                lineHeight: 1.5, display: '-webkit-box',
                WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {latest.description}
              </p>
              <p style={{ margin: '0 0 0 16px', fontSize: 11, color: '#9ca3af' }}>
                {formatTime(latest.createdAt)}
              </p>
            </div>
          ) : (
            <div style={{ padding: '28px 18px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
              Chưa có thông báo nào
            </div>
          )}

          {/* Footer */}
          <div style={{ borderTop: '1px solid #f5f5f5', padding: '10px 18px', textAlign: 'center' }}>
            <button
              onClick={() => { closeBell(); setListOpen(true); }}
              style={{
                background: 'none', border: 'none', color: accentColor,
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                padding: '4px 8px', borderRadius: 6, transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = `${accentColor}10`}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              Xem tất cả thông báo →
            </button>
          </div>
        </div>
      )}

      {/* ── CSS animations ───────────────────────────────────────────────── */}
      <style>{`
        @keyframes bell-ring {
          0%,100% { transform: rotate(0deg); }
          20%      { transform: rotate(-15deg); }
          40%      { transform: rotate(15deg); }
          60%      { transform: rotate(-10deg); }
          80%      { transform: rotate(10deg); }
        }
        @keyframes badge-pop {
          0%   { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes dropdown-in {
          0%   { opacity: 0; transform: translateY(-8px) scale(0.97); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* ── List Modal ───────────────────────────────────────────────────── */}
      <AnnouncementListModal isOpen={listOpen} onClose={() => setListOpen(false)} />

      {/* ── Review Modal (admin only, triggered từ AnnouncementManagement) ─ */}
      <Suspense fallback={null}>
        <AnnouncementReviewModal
          announcement={pendingAnnouncement}
          onClose={() => setPendingAnnouncement(null)}
          onReviewed={(id, action) => {
            setPendingAnnouncement(null);
            // Phát event để AnnouncementManagement refresh list
            window.dispatchEvent(new CustomEvent('announcement:reviewed', { detail: { id, action } }));
          }}
        />
      </Suspense>
    </div>
  );
};

// ── Helper ────────────────────────────────────────────────────────────────────
function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d) / 1000);
  if (diff < 60)    return 'Vừa xong';
  if (diff < 3600)  return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default NotificationBell;
