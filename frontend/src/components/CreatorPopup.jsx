import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaFacebookF, FaInstagram, FaTiktok } from 'react-icons/fa';
import { SiZalo } from 'react-icons/si';

const SOCIAL_LINKS = [
  { href: 'https://www.facebook.com/d.dua04', icon: FaFacebookF, title: 'Facebook', hoverBg: '#1877f2' },
  { href: 'https://www.instagram.com/_d.dua04', icon: FaInstagram, title: 'Instagram', hoverBg: '#E1306C' },
  { href: 'https://zalo.me/0337315080', icon: SiZalo, title: 'Zalo', hoverBg: '#0068ff' },
  { href: 'https://www.tiktok.com/@_d.dua04', icon: FaTiktok, title: 'TikTok', hoverBg: '#000000' },
];

const CreatorPopup = ({ onClose, onHeartClick }) => {
  const { t } = useTranslation();
  const [heartBtnShake, setHeartBtnShake] = useState(false);

  const handleHeartClick = () => {
    setHeartBtnShake(true);
    onHeartClick();
    setTimeout(() => setHeartBtnShake(false), 600);
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
        onClick={onClose}
        style={{ background: 'linear-gradient(135deg, rgba(102,126,234,0.85) 0%, rgba(118,75,162,0.85) 100%)' }}
      >
        {/* Popup Card */}
        <div
          className="creator-popup-card relative bg-white w-full max-w-xl p-8 md:p-10 flex flex-col md:flex-row gap-8 items-center md:items-start"
          onClick={(e) => e.stopPropagation()}
          style={{ borderRadius: 30, boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}
        >
          {/* Decorative Floating Shapes (Background) */}
          <div className="creator-shape creator-shape-1" />
          <div className="creator-shape creator-shape-2" />
          <div className="creator-shape creator-shape-3" />

          {/* Close Button */}
          <button
            className="creator-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>

          {/* LEFT: Avatar */}
          <div className="flex-shrink-0 flex flex-col items-center gap-3">
            <div className="creator-avatar-wrapper">
              <img
                src="/images/avatarCreator/PhamNgocDuong.jpg"
                alt="Phạm Ngọc Dương"
                className="creator-avatar"
                onError={(e) => { e.target.src = '/placeholder.jpg'; }}
              />
            </div>
          </div>

          {/* RIGHT: Info */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left gap-3 flex-1 relative z-10">
            {/* Title */}
            <p className="creator-label">
              {t('creator.title')}
            </p>

            {/* Name */}
            <h3 className="creator-name">
              Phạm Ngọc Dương
            </h3>

            {/* Decorative Gradient Line */}
            <div className="creator-gradient-line" />

            {/* University Info */}
            <div className="flex flex-col items-center md:items-start gap-1 mt-1">
              <span className="text-2xl">🎓</span>
              <span className="text-sm font-semibold text-gray-600 leading-snug">{t('creator.info')}</span>
            </div>

            {/* Badge */}
            <span className="creator-badge">
              🌱 {t('creator.badge')}
            </span>

            {/* Note */}
            <p className="text-xs text-gray-400 italic mt-1 leading-relaxed max-w-[280px]">
              {t('creator.note')}
            </p>

            {/* Heart Button */}
            <button
              onClick={handleHeartClick}
              className={`creator-heart-btn ${heartBtnShake ? 'creator-heart-shake' : ''}`}
            >
              {t('creator.heartBtn')}
            </button>

            {/* Contact Section */}
            <p className="creator-contact-title">
              {t('creator.contact')}
            </p>

            {/* Social Icons */}
            <div className="creator-social-row">
              {SOCIAL_LINKS.map(({ href, icon: Icon, title, hoverBg }) => (
                <a
                  key={title}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={title}
                  className="creator-social-icon"
                  style={{ '--hover-bg': hoverBg }}
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scoped Styles */}
      <style>{`
        /* Entry animation */
        .creator-popup-card {
          animation: creatorBounceIn 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          overflow: hidden;
        }
        @keyframes creatorBounceIn {
          from { opacity: 0; transform: scale(0.85) translateY(30px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }

        /* Decorative shapes */
        .creator-shape {
          position: absolute;
          border-radius: 50%;
          opacity: 0.08;
          pointer-events: none;
          z-index: 0;
        }
        .creator-shape-1 {
          width: 180px; height: 180px;
          background: #FF6B6B;
          top: -40px; right: -40px;
        }
        .creator-shape-2 {
          width: 120px; height: 120px;
          background: #4ECDC4;
          bottom: -30px; left: -20px;
        }
        .creator-shape-3 {
          width: 80px; height: 80px;
          background: #FFE66D;
          top: 50%; left: 40%;
        }

        /* Close button */
        .creator-close-btn {
          position: absolute;
          top: 16px; right: 20px;
          width: 36px; height: 36px;
          border-radius: 50%;
          background: #f5f5f5;
          border: none;
          font-size: 16px;
          color: #999;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.25s;
          z-index: 20;
        }
        .creator-close-btn:hover {
          background: #FF6B6B;
          color: white;
          transform: rotate(90deg);
        }

        /* Avatar */
        .creator-avatar-wrapper {
          position: relative;
          z-index: 10;
        }
        .creator-avatar {
          width: 150px; height: 150px;
          border-radius: 50%;
          object-fit: cover;
          border: 4px solid #4ECDC4;
          box-shadow: 0 10px 30px rgba(78, 205, 196, 0.3);
          transition: transform 0.5s ease;
        }
        .creator-avatar:hover {
          transform: rotate(8deg) scale(1.05);
        }

        /* Title label */
        .creator-label {
          font-size: 0.8rem;
          font-weight: 800;
          letter-spacing: 2px;
          color: #4ECDC4;
          text-transform: uppercase;
        }

        /* Name */
        .creator-name {
          font-size: 28px;
          font-weight: 900;
          color: #FF6B6B;
          line-height: 1.2;
        }

        /* Gradient line */
        .creator-gradient-line {
          width: 80px; height: 4px;
          border-radius: 2px;
          background: linear-gradient(90deg, #FF6B6B, #4ECDC4, #FFE66D);
        }

        /* Info row */
        .creator-info-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.9rem;
          color: #555;
          font-weight: 600;
        }

        /* Badge */
        .creator-badge {
          display: inline-block;
          padding: 4px 14px;
          border-radius: 20px;
          background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
          color: #2e7d32;
          font-size: 0.78rem;
          font-weight: 700;
        }

        /* Heart button */
        .creator-heart-btn {
          margin-top: 6px;
          padding: 10px 28px;
          border: none;
          border-radius: 30px;
          background: linear-gradient(135deg, #FF6B6B 0%, #ff8a65 100%);
          color: white;
          font-weight: 800;
          font-size: 0.9rem;
          cursor: pointer;
          box-shadow: 0 6px 20px rgba(255, 107, 107, 0.35);
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          animation: heartBeat 1.5s infinite;
        }
        .creator-heart-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 8px 28px rgba(255, 107, 107, 0.5);
        }
        .creator-heart-btn:active {
          transform: scale(0.95);
        }
        @keyframes heartBeat {
          0%, 100% { transform: scale(1); }
          14% { transform: scale(1.05); }
          28% { transform: scale(1); }
          42% { transform: scale(1.05); }
          70% { transform: scale(1); }
        }
        .creator-heart-shake {
          animation: heartShake 0.5s ease-in-out !important;
        }
        @keyframes heartShake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          20% { transform: translateX(-4px) rotate(-4deg); }
          40% { transform: translateX(4px) rotate(4deg); }
          60% { transform: translateX(-3px) rotate(-3deg); }
          80% { transform: translateX(3px) rotate(3deg); }
        }

        /* Contact title */
        .creator-contact-title {
          font-size: 0.8rem;
          font-weight: 800;
          letter-spacing: 1.5px;
          color: #666;
          margin-top: 4px;
        }

        /* Social row */
        .creator-social-row {
          display: flex;
          gap: 12px;
        }
        .creator-social-icon {
          width: 45px; height: 45px;
          border-radius: 50%;
          background: #f0f0f0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          color: #555;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          text-decoration: none;
        }
        .creator-social-icon:hover {
          background: var(--hover-bg, #333);
          color: white;
          transform: translateY(-5px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.15);
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
          .creator-popup-card {
            max-width: 360px;
            padding: 28px 20px;
          }
          .creator-name {
            font-size: 22px;
          }
          .creator-gradient-line {
            margin: 0 auto;
          }
          .creator-social-row {
            justify-content: center;
          }
        }
      `}</style>
    </>
  );
};

export default CreatorPopup;
