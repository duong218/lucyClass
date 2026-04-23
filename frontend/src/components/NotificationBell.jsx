import React, { useRef, useEffect, useState } from 'react';
import useNotifications from '../hooks/useNotifications';
import AnnouncementListModal from './AnnouncementListModal';

/**
 * NotificationBell
 * Component bell icon dùng chung cho Admin, Teacher, Marketing.
 *
 * Props:
 *  @param {boolean}  enabled       - truyền !!user để tắt khi chưa login
 *  @param {number}   [interval]    - polling interval ms (default 60000)
 *  @param {string}   [accentColor] - màu badge + ring (default "#1C695C")
 *
 * Dùng:
 *  <NotificationBell enabled={!!user} accentColor="#2563eb" />
 */
const NotificationBell = ({
  enabled = true,
  interval,
  accentColor = '#1C695C',
}) => {
  const [listOpen, setListOpen] = useState(false);
  const { newCount, latest, isOpen, toggleBell, closeBell } = useNotifications({
    enabled,
    ...(interval ? { interval } : {}),
  });

  // Đóng dropdown khi click ra ngoài
  const wrapRef = useRef(null);
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) closeBell();
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, closeBell]);

  const hasBadge = newCount > 0;

  return (
    <div ref={wrapRef} style={{ position: 'relative', display: 'inline-block' }}>

      {/* ── Bell Button ─────────────────────────────────────────────── */}
      <button
        onClick={toggleBell}
        title="Thông báo"
        style={{
          position: 'relative',
          width: 44,
          height: 44,
          borderRadius: '50%',
          border: `2px solid ${hasBadge ? accentColor : '#e5e7eb'}`,
          background: isOpen ? `${accentColor}15` : '#ffffff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          boxShadow: hasBadge
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
          e.currentTarget.style.boxShadow = hasBadge
            ? `0 0 0 3px ${accentColor}25, 0 2px 8px rgba(0,0,0,0.08)`
            : '0 2px 6px rgba(0,0,0,0.06)';
        }}
      >
        {/* Bell SVG */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke={hasBadge ? accentColor : '#6b7280'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transition: 'all 0.2s',
            // rung nhẹ khi có badge
            animation: hasBadge ? 'bell-ring 0.6s ease-in-out' : 'none',
          }}
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {/* Badge */}
        {hasBadge && (
          <span
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              minWidth: 18,
              height: 18,
              borderRadius: 9,
              background: '#ef4444',
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              border: '2px solid #fff',
              boxShadow: '0 1px 4px rgba(239,68,68,0.5)',
              lineHeight: 1,
              animation: 'badge-pop 0.3s cubic-bezier(0.175,0.885,0.32,1.275)',
            }}
          >
            {newCount > 9 ? '9+' : newCount}
          </span>
        )}
      </button>

      {/* ── Dropdown ────────────────────────────────────────────────── */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            width: 320,
            background: '#fff',
            borderRadius: 16,
            boxShadow: '0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.08)',
            border: '1px solid #f0f0f0',
            zIndex: 9999,
            overflow: 'hidden',
            animation: 'dropdown-in 0.2s cubic-bezier(0.175,0.885,0.32,1.275)',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 18px 12px',
              borderBottom: '1px solid #f5f5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 14, color: '#1a1a1a' }}>
              Thông báo
            </span>
            {hasBadge && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  background: `${accentColor}15`,
                  color: accentColor,
                  padding: '2px 8px',
                  borderRadius: 99,
                }}
              >
                {newCount} mới
              </span>
            )}
          </div>

          {/* Content */}
          {latest ? (
            <div style={{ padding: '14px 18px' }}>
              {/* Ảnh preview nhỏ */}
              {latest.image && (
                <div
                  style={{
                    width: '100%',
                    height: 120,
                    borderRadius: 10,
                    overflow: 'hidden',
                    marginBottom: 12,
                    background: '#f3f4f6',
                  }}
                >
                  <img
                    src={latest.image}
                    alt={latest.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                </div>
              )}

              {/* Tiêu đề */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  marginBottom: 6,
                }}
              >
                {/* Dot "new" */}
                <span
                  style={{
                    flexShrink: 0,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: accentColor,
                    marginTop: 5,
                  }}
                />
                <p
                  style={{
                    margin: 0,
                    fontWeight: 700,
                    fontSize: 13,
                    color: '#1a1a1a',
                    lineHeight: 1.4,
                  }}
                >
                  {latest.title}
                </p>
              </div>

              {/* Mô tả rút gọn */}
              <p
                style={{
                  margin: '0 0 10px 16px',
                  fontSize: 12,
                  color: '#6b7280',
                  lineHeight: 1.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {latest.description}
              </p>

              {/* Timestamp */}
              <p
                style={{
                  margin: '0 0 0 16px',
                  fontSize: 11,
                  color: '#9ca3af',
                }}
              >
                {formatTime(latest.createdAt)}
              </p>
            </div>
          ) : (
            <div
              style={{
                padding: '32px 18px',
                textAlign: 'center',
                color: '#9ca3af',
                fontSize: 13,
              }}
            >
              Chưa có thông báo nào
            </div>
          )}

          {/* Footer */}
          <div
            style={{
              borderTop: '1px solid #f5f5f5',
              padding: '10px 18px',
              textAlign: 'center',
            }}
          >
            <button
              onClick={() => {
                closeBell();
                setListOpen(true);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: accentColor,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: 6,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = `${accentColor}10`}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              Xem tất cả thông báo →
            </button>
          </div>
        </div>
      )}

      {/* ── CSS animations (inject 1 lần) ──────────────────────────── */}
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

      {/* ── List Modal ──────────────────────────────────────────────── */}
      <AnnouncementListModal
        isOpen={listOpen}
        onClose={() => setListOpen(false)}
      />
    </div>
  );
};

// ── Helper ──────────────────────────────────────────────────────────────────
function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000); // seconds

  if (diff < 60)  return 'Vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;

  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default NotificationBell;
