import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
/**
 * MilestonePopup — redesigned with spectacular animations
 * Props:
 *   streakCount  {number}  — số ngày streak hiện tại
 *   onClose      {fn}      — callback đóng popup
 */

const MILESTONE_CONFIGS = {
  1: {
    flameColors: ['#FF6B35', '#FF8C42', '#FFB347', '#FF6B35'],
    glowColor: 'rgba(255,107,53,0.7)',
    confettiColors: ['#FF6B35', '#FF8C42', '#FFB347', '#FFF3E0', '#FFCC02', '#FF4757'],
    title: 'streak.milestone_1_title',
    subtitle: 'streak.milestone_1_sub',
    badge: '🌱',
    bgGradient: 'linear-gradient(145deg, #FFF4EC 0%, #FFE5D0 50%, #FFCBA4 100%)',
    accentColor: '#FF6B35',
    particleEmoji: ['🌱', '✨', '🔥', '⭐'],
    ringGradient: ['#FF6B35', '#FFB347'],
  },
  3: {
    flameColors: ['#FF8C00', '#FFA500', '#FFD700', '#FF8C00'],
    glowColor: 'rgba(255,165,0,0.75)',
    confettiColors: ['#FF8C00', '#FFA500', '#FFD700', '#FFF8DC', '#FF6347', '#FFEC8B'],
    title: 'streak.milestone_3_title',
    subtitle: 'streak.milestone_3_sub',
    badge: '⭐',
    bgGradient: 'linear-gradient(145deg, #FFFBF0 0%, #FFF3C4 50%, #FFE57A 100%)',
    accentColor: '#F59E0B',
    particleEmoji: ['⭐', '🌟', '✨', '🔥', '🌈'],
    ringGradient: ['#FF8C00', '#FFD700'],
  },
  7: {
    flameColors: ['#2196F3', '#03A9F4', '#00BCD4', '#7C3AED'],
    glowColor: 'rgba(33,150,243,0.75)',
    confettiColors: ['#2196F3', '#03A9F4', '#00BCD4', '#E3F2FD', '#81D4FA', '#B388FF'],
    title: 'streak.milestone_7_title',
    subtitle: 'streak.milestone_7_sub',
    badge: '🥈',
    bgGradient: 'linear-gradient(145deg, #EFF6FF 0%, #DBEAFE 50%, #BFDBFE 100%)',
    accentColor: '#2563EB',
    particleEmoji: ['🥈', '💎', '✨', '🌊', '⚡'],
    ringGradient: ['#2196F3', '#00BCD4'],
  },
  30: {
    flameColors: ['#9C27B0', '#AB47BC', '#CE93D8', '#E040FB'],
    glowColor: 'rgba(156,39,176,0.75)',
    confettiColors: ['#9C27B0', '#AB47BC', '#E1BEE7', '#F3E5F5', '#FFD700', '#FF4081'],
    title: 'streak.milestone_30_title',
    subtitle: 'streak.milestone_30_sub',
    badge: '🌟',
    bgGradient: 'linear-gradient(145deg, #FAF0FF 0%, #EDD5FF 50%, #D8B4FE 100%)',
    accentColor: '#7C3AED',
    particleEmoji: ['🌟', '💜', '🦋', '✨', '🎉', '👑'],
    ringGradient: ['#9C27B0', '#E040FB'],
  },
  100: {
    flameColors: ['#FFD700', '#FF4081', '#7B1FA2', '#FFD700'],
    glowColor: 'rgba(255,215,0,0.85)',
    confettiColors: ['#FFD700', '#FF4081', '#7B1FA2', '#00BCD4', '#FF6B35', '#FFFFFF', '#FF69B4'],
    title: 'streak.milestone_100_title',
    subtitle: 'streak.milestone_100_sub',
    badge: '👑',
    bgGradient: 'linear-gradient(145deg, #FFFDE7 0%, #FFF9C4 30%, #FFE57A 60%, #FFD54F 100%)',
    accentColor: '#D97706',
    particleEmoji: ['👑', '🏆', '✨', '🎆', '🎇', '⭐', '💛', '🥳'],
    ringGradient: ['#FFD700', '#FF4081'],
  },
};

const DEFAULT_CONFIG = {
  flameColors: ['#FF6B35', '#FF8C42', '#FFB347', '#FF6B35'],
  glowColor: 'rgba(255,107,53,0.6)',
  confettiColors: ['#FF6B35', '#FFD700', '#FF8C42', '#FFF', '#FF4081'],
  title: 'streak.checkin_success_title',
  subtitle: 'streak.checkin_success_sub',
  badge: '🔥',
  bgGradient: 'linear-gradient(145deg, #FFF8F0 0%, #FFE5D0 100%)',
  accentColor: '#FF6B35',
  particleEmoji: ['🔥', '✨', '⭐'],
  ringGradient: ['#FF6B35', '#FFB347'],
};

/* ── Canvas Confetti ──────────────────────────────────────────────────────── */
const Confetti = ({ colors, count = 70 }) => {
  const particles = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: 10 + Math.random() * 80,
      y: -15 - Math.random() * 30,
      size: 4 + Math.random() * 10,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      xVel: (Math.random() - 0.5) * 8,
      yVel: 1.5 + Math.random() * 5,
      rotVel: (Math.random() - 0.5) * 15,
      shape: ['circle', 'rect', 'star'][Math.floor(Math.random() * 3)],
      opacity: 1,
      delay: Math.random() * 0.6,
    }))
  );
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const render = (ts) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = (ts - startRef.current) / 1000;
      ctx.clearRect(0, 0, W, H);
      particles.current.forEach((p) => {
        if (elapsed < p.delay) return;
        const t = elapsed - p.delay;
        const px = (p.x / 100) * W + p.xVel * t * 32;
        const py = (p.y / 100) * H + p.yVel * t * 38 + 0.5 * 9.8 * t * t * 12;
        const rot = p.rotation + p.rotVel * t * 32;
        const fade = Math.max(0, 1 - (t - 1.4) / 0.8);
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate((rot * Math.PI) / 180);
        ctx.globalAlpha = Math.min(1, fade);
        ctx.fillStyle = p.color;
        if (p.shape === 'circle') {
          ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx.fill();
        } else if (p.shape === 'star') {
          const s = p.size / 2;
          ctx.beginPath();
          for (let j = 0; j < 5; j++) {
            const a = (j * 4 * Math.PI) / 5 - Math.PI / 2;
            ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s);
            const a2 = ((j * 4 + 2) * Math.PI) / 5 - Math.PI / 2;
            ctx.lineTo(Math.cos(a2) * (s * 0.4), Math.sin(a2) * (s * 0.4));
          }
          ctx.closePath(); ctx.fill();
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        }
        ctx.restore();
      });
      if (elapsed < 3) animRef.current = requestAnimationFrame(render);
    };
    animRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <canvas ref={canvasRef} width={380} height={520}
      style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none', zIndex: 10 }}
    />
  );
};

/* ── Lottie Fire (replaces SVG Flame) ──────────────────────────────────────── */
const LottieFire = ({ glowColor, size = 110 }) => {
  return (
    <div style={{
      width: size * 1.6, height: size,
      position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
      filter: `drop-shadow(0 0 ${size * 0.22}px ${glowColor})`,
      animation: 'flameFloat 2.5s ease-in-out infinite',
    }}>
      <DotLottieReact
        src="/model-transform/Fire.lottie"
        loop
        autoplay
        speed={1.2}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
    </div>
  );
};

/* ── Floating emoji particles ─────────────────────────────────────────────── */
const FloatingEmojis = ({ emojis }) => (
  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 2 }}>
    {emojis.map((e, i) => (
      <span key={i} style={{
        position: 'absolute',
        left: `${8 + (i * 23) % 84}%`,
        top: `${10 + (i * 17) % 60}%`,
        fontSize: 18 + (i % 3) * 6,
        animation: `floatUp${i % 3} ${2.5 + i * 0.4}s ease-in-out ${i * 0.3}s infinite`,
        opacity: 0.65,
      }}>{e}</span>
    ))}
  </div>
);

/* ── Sunburst rays ────────────────────────────────────────────────────────── */
const Sunburst = ({ color }) => (
  <div style={{
    position: 'absolute', top: '18%', left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 220, height: 220, zIndex: 0,
  }}>
    {Array.from({ length: 12 }).map((_, i) => (
      <div key={i} style={{
        position: 'absolute', top: '50%', left: '50%',
        width: 2, height: 110,
        background: `linear-gradient(to top, ${color}60, transparent)`,
        transformOrigin: 'top center',
        transform: `translateX(-50%) rotate(${i * 30}deg)`,
        animation: `rayRotate 8s linear infinite`,
        animationDelay: `${i * 0.08}s`,
        borderRadius: 4,
      }} />
    ))}
  </div>
);

/* ── Main Component ───────────────────────────────────────────────────────── */
const MilestonePopup = ({ streakCount, onClose, userName }) => {
  const { t } = useTranslation();
  const [closing, setClosing] = useState(false);
  const [bounceCount, setBounceCount] = useState(0);
  const timerRef = useRef(null);

  const isMilestone = [1, 3, 7, 30, 100].includes(streakCount);
  const cfg = MILESTONE_CONFIGS[streakCount] || DEFAULT_CONFIG;

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 380);
  };

  useEffect(() => {
    timerRef.current = setTimeout(handleClose, 8000);
    return () => clearTimeout(timerRef.current);
  }, []);

  // Extra bounce animation on mount
  useEffect(() => {
    let count = 0;
    const id = setInterval(() => {
      setBounceCount(c => c + 1);
      count++;
      if (count >= 3) clearInterval(id);
    }, 600);
    return () => clearInterval(id);
  }, []);

  const titleKey = cfg.title;
  const subtitleKey = cfg.subtitle;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800;900&family=Nunito:wght@400;700;800;900&display=swap');

        @keyframes overlayIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes overlayOut { from { opacity: 1 } to { opacity: 0 } }
        @keyframes popIn {
          0% { opacity: 0; transform: translateX(-50%) translateY(-50%) scale(0.6) rotate(-4deg); }
          55% { transform: translateX(-50%) translateY(calc(-50% - 12px)) scale(1.06) rotate(1.5deg); }
          75% { transform: translateX(-50%) translateY(calc(-50% + 4px)) scale(0.98) rotate(-0.5deg); }
          100% { opacity: 1; transform: translateX(-50%) translateY(-50%) scale(1) rotate(0deg); }
        }
        @keyframes popOut {
          0% { opacity: 1; transform: translateX(-50%) translateY(-50%) scale(1); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-50%) scale(0.8); }
        }
        @keyframes flameFloat { 0%, 100% { transform: translateY(0) scaleX(1); } 50% { transform: translateY(-7px) scaleX(0.96); } }
        @keyframes flamePop {
          0% { transform: scale(0) rotate(-12deg); opacity: 0; }
          55% { transform: scale(1.25) rotate(6deg); opacity: 1; }
          80% { transform: scale(0.95) rotate(-2deg); }
          100% { transform: scale(1) rotate(0); }
        }
        @keyframes countBounce {
          0% { transform: scale(0) translateY(20px); opacity: 0; }
          50% { transform: scale(1.3) translateY(-4px); opacity: 1; }
          70% { transform: scale(0.92) translateY(2px); }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes titleSlide {
          0% { opacity: 0; transform: translateY(16px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes badgePop {
          0% { transform: scale(0) rotate(-20deg); opacity: 0; }
          60% { transform: scale(1.35) rotate(8deg); }
          100% { transform: scale(1) rotate(0); opacity: 1; }
        }
        @keyframes shimmerGold {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pulseRing {
          0% { transform: translate(-50%, -50%) scale(0.85); opacity: 0.7; }
          60% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.2; }
          100% { transform: translate(-50%, -50%) scale(0.85); opacity: 0.7; }
        }
        @keyframes rayRotate { from { opacity: 0.15 } to { opacity: 0.15 } }
        @keyframes floatUp0 { 0%, 100% { transform: translateY(0) rotate(-5deg); opacity: 0.65; } 50% { transform: translateY(-18px) rotate(5deg); opacity: 0.9; } }
        @keyframes floatUp1 { 0%, 100% { transform: translateY(0) rotate(8deg); opacity: 0.6; } 50% { transform: translateY(-22px) rotate(-8deg); opacity: 0.85; } }
        @keyframes floatUp2 { 0%, 100% { transform: translateY(0) rotate(-3deg); opacity: 0.7; } 50% { transform: translateY(-14px) rotate(4deg); opacity: 0.95; } }
        @keyframes streakNumPop {
          0% { transform: scale(0.4); opacity: 0; }
          55% { transform: scale(1.3); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(-4deg); }
          50% { transform: rotate(4deg); }
        }
        @keyframes btnPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,107,53,0.5), 0 8px 24px rgba(0,0,0,0.2); }
          50% { box-shadow: 0 0 0 10px rgba(255,107,53,0), 0 8px 24px rgba(0,0,0,0.2); }
        }
      `}</style>

      {/* Backdrop */}
      <div onClick={handleClose} style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(8, 8, 20, 0.78)',
        backdropFilter: 'blur(8px)',
        animation: closing ? 'overlayOut 0.38s ease forwards' : 'overlayIn 0.28s ease forwards',
      }} />

      {/* Card */}
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translateX(-50%) translateY(-50%)',
        zIndex: 201,
        width: 'min(360px, 94vw)',
        borderRadius: 32,
        background: cfg.bgGradient,
        border: `2.5px solid ${cfg.accentColor}35`,
        boxShadow: `0 0 0 1px ${cfg.accentColor}15, 0 12px 70px ${cfg.glowColor}, 0 4px 20px rgba(0,0,0,0.2)`,
        overflow: 'hidden',
        animation: closing ? 'popOut 0.38s cubic-bezier(.4,0,.2,1) forwards' : 'popIn 0.55s cubic-bezier(.36,1.6,.64,1) forwards',
      }}>
        {/* Confetti */}
        <Confetti colors={cfg.confettiColors} count={isMilestone ? (streakCount >= 30 ? 90 : 70) : 45} />

        {/* Sunburst for milestones */}
        {isMilestone && <Sunburst color={cfg.accentColor} />}

        {/* Pulsing ring */}
        <div style={{
          position: 'absolute', top: '28%', left: '50%',
          width: 200, height: 200, borderRadius: '50%',
          border: `3px solid ${cfg.accentColor}28`,
          animation: 'pulseRing 2.2s ease-in-out infinite',
          zIndex: 1,
        }} />

        {/* Floating emojis for big milestones */}
        {isMilestone && <FloatingEmojis emojis={cfg.particleEmoji} />}

        {/* Content */}
        <div style={{
          position: 'relative', zIndex: 5,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '30px 24px 24px',
          fontFamily: "'Baloo 2', 'Nunito', sans-serif",
        }}>

          {/* Flame */}
          <div style={{ animation: 'flamePop 0.6s cubic-bezier(.36,1.6,.64,1) both', marginBottom: 4 }}>
            <LottieFire glowColor={cfg.glowColor} size={isMilestone ? 115 : 90} />
          </div>

          {/* Streak number — right below the flame */}
          <div style={{
            animation: 'streakNumPop 0.7s cubic-bezier(.36,1.6,.64,1) 0.15s both',
            opacity: 0,
            display: 'flex', alignItems: 'center', gap: 6,
            marginBottom: 10, marginTop: -4,
          }}>
            <span style={{
              fontSize: isMilestone ? 72 : 58,
              fontWeight: 900,
              lineHeight: 1,
              fontFamily: "'Baloo 2', sans-serif",
              background: `linear-gradient(135deg, ${cfg.ringGradient[0]} 0%, ${cfg.ringGradient[1]} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              backgroundSize: '200% auto',
              animation: 'shimmerGold 2.5s linear infinite',
              textShadow: 'none',
              letterSpacing: '-1px',
            }}>
              {streakCount}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', paddingBottom: 8 }}>
              <span style={{ fontSize: 24, lineHeight: 1 }}>🔥</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: cfg.accentColor, opacity: 0.8, letterSpacing: 1 }}>NGÀY</span>
            </div>
          </div>

          {/* Title */}
          <h2 style={{
            margin: '0 0 6px',
            fontSize: isMilestone ? 22 : 18,
            fontWeight: 900,
            color: '#1a1228',
            textAlign: 'center',
            letterSpacing: '-0.3px',
            lineHeight: 1.3,
            animation: 'titleSlide 0.5s ease 0.35s both',
            opacity: 0,
            fontFamily: "'Baloo 2', sans-serif",
          }}>
            {t(titleKey, { name: userName || '', defaultValue: '🔥 Check-in thành công!' })}
          </h2>

          {/* Subtitle */}
          <p style={{
            margin: '0 0 18px',
            fontSize: 13.5,
            color: '#4a3f5c',
            textAlign: 'center',
            lineHeight: 1.55,
            padding: '0 8px',
            fontWeight: 600,
            animation: 'titleSlide 0.5s ease 0.45s both',
            opacity: 0,
          }}>
            {t(subtitleKey, { name: userName || '', defaultValue: 'Tiếp tục giữ lửa mỗi ngày nhé!' })}
          </p>

          {/* Milestone badge */}
          {isMilestone && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '8px 20px', borderRadius: 999,
              background: `linear-gradient(135deg, ${cfg.ringGradient[0]}, ${cfg.ringGradient[1]})`,
              color: '#fff', fontWeight: 900, fontSize: 14,
              letterSpacing: '0.3px', marginBottom: 18,
              boxShadow: `0 6px 24px ${cfg.glowColor}`,
              animation: 'badgePop 0.55s cubic-bezier(.36,1.6,.64,1) 0.55s both',
              opacity: 0,
              fontFamily: "'Baloo 2', sans-serif",
            }}>
              <span style={{ fontSize: 20, animation: 'wiggle 1.2s ease-in-out infinite' }}>{cfg.badge}</span>
              <span>Đạt mốc {streakCount} ngày!</span>
            </div>
          )}

          {/* CTA Button */}
          <button
            onClick={handleClose}
            style={{
              padding: isMilestone ? '14px 44px' : '12px 36px',
              borderRadius: 999,
              border: 'none',
              background: `linear-gradient(135deg, ${cfg.ringGradient[0]}, ${cfg.ringGradient[1]})`,
              color: '#fff',
              fontWeight: 900,
              fontSize: 15,
              cursor: 'pointer',
              boxShadow: `0 6px 28px ${cfg.glowColor}`,
              transition: 'transform 0.15s, box-shadow 0.15s',
              fontFamily: "'Baloo 2', sans-serif",
              letterSpacing: '0.3px',
              animation: 'btnPulse 2.5s ease-in-out infinite',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.95)'; }}
            onMouseUp={e => { e.currentTarget.style.transform = 'scale(1.06)'; }}
          >
            {/* Shimmer on button */}
            <span style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.35) 50%, transparent 60%)',
              backgroundSize: '200% auto',
              animation: 'shimmerGold 2s linear infinite',
              borderRadius: 'inherit',
              pointerEvents: 'none',
            }} />
            <span style={{ position: 'relative', zIndex: 1 }}>
              🔥 Tiếp tục giữ lửa!
            </span>
          </button>

          {/* Auto-close hint */}
          <p style={{ margin: '10px 0 0', fontSize: 11, color: '#9084a8', fontWeight: 600 }}>
            Tự đóng sau vài giây...
          </p>
        </div>
      </div>
    </>
  );
};

export default MilestonePopup;
