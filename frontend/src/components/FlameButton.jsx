import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import Fireworks from './Fireworks';
import MilestonePopup from './MilestonePopup';
import { openModal, closeModal } from '../utils/modalScrollLock';
import {
  startStreak,
  fetchStreak,
  checkinStreak,
  reviveStreak
} from '../services/streakService';
import { useDraggableStreak } from '../utils/draggableStreak';
import { useLocation } from 'react-router-dom';

/* ─────────────────────────────────────────────────────────────────────────────
   Lottie Fire Component
   Loads Fire.lottie from /model-transform/ in public folder
   Supports speed & filter overrides for milestone theming
───────────────────────────────────────────────────────────────────────────── */
const LottieFire = ({ style = {}, speed = 1, hueRotate = 'hue-rotate(0deg)', size = 'default' }) => {
  const sizes = {
    default: { width: 'clamp(70px, 12vw, 120px)', height: 'clamp(82px, 14vw, 140px)' },
    mini: { width: 48, height: 56 },
    tiny: { width: 32, height: 38 },
  };
  const s = sizes[size] || sizes.default;

  return (
    <div style={{
      width: s.width,
      height: s.height,
      filter: hueRotate !== 'hue-rotate(0deg)' ? hueRotate : undefined,
      ...style,
    }}>
      <DotLottieReact
        src="/model-transform/Fire.lottie"
        loop
        autoplay
        speed={speed}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const getVNDate = (offset = 0) => {
  const date = new Date();
  const vnDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  vnDate.setDate(vnDate.getDate() + offset);
  const y = vnDate.getFullYear();
  const m = String(vnDate.getMonth() + 1).padStart(2, '0');
  const d = String(vnDate.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const FIREWORK_MILESTONES = [1, 3, 7, 30, 100];

/* ── Milestone config ────────────────────────────────────────────────────── */
const getMilestoneConfig = (count) => {
  if (count >= 100) return {
    ringColor: '#FFD700',
    badge: '👑', label: 'VUA GIỮ LỬA', labelColor: 'text-yellow-600',
    fabColor: 'from-yellow-400 to-orange-500',
    btnGradient: 'linear-gradient(135deg, #F59E0B, #EF4444)',
    hueRotate: 'hue-rotate(260deg) saturate(1.5)',
    glowColor: 'rgba(255,215,0,0.6)',
    progressFrom: '#FFD700', progressTo: '#FF4081',
    lottieSpeed: 2.2,
  };
  if (count >= 30) return {
    ringColor: '#A855F7',
    badge: '🌟', label: 'SIÊU SAO', labelColor: 'text-purple-500',
    fabColor: 'from-purple-400 to-violet-600',
    btnGradient: 'linear-gradient(135deg, #9C27B0, #E040FB)',
    hueRotate: 'hue-rotate(270deg)',
    glowColor: 'rgba(168,85,247,0.6)',
    progressFrom: '#9C27B0', progressTo: '#E040FB',
    lottieSpeed: 1.8,
  };
  if (count >= 7) return {
    ringColor: '#3B82F6',
    badge: '🥈', label: 'ĐỈNH CAO', labelColor: 'text-blue-500',
    fabColor: 'from-blue-400 to-cyan-400',
    btnGradient: 'linear-gradient(135deg, #2196F3, #00BCD4)',
    hueRotate: 'hue-rotate(200deg)',
    glowColor: 'rgba(59,130,246,0.55)',
    progressFrom: '#2196F3', progressTo: '#00BCD4',
    lottieSpeed: 1.5,
  };
  if (count >= 3) return {
    ringColor: '#F59E0B',
    badge: '⭐', label: 'ĐÃ VÀO NHỊP', labelColor: 'text-amber-500',
    fabColor: 'from-amber-400 to-orange-400',
    btnGradient: 'linear-gradient(135deg, #F59E0B, #EF9F27)',
    hueRotate: 'hue-rotate(30deg)',
    glowColor: 'rgba(245,158,11,0.55)',
    progressFrom: '#F59E0B', progressTo: '#FFD700',
    lottieSpeed: 1.2,
  };
  return {
    ringColor: '#EF4444',
    badge: '🌱', label: '', labelColor: '',
    fabColor: 'from-red-400 to-orange-400',
    btnGradient: 'linear-gradient(135deg, #EF4444, #FF6B35)',
    hueRotate: 'hue-rotate(0deg)',
    glowColor: 'rgba(239,68,68,0.5)',
    progressFrom: '#EF4444', progressTo: '#FF6B35',
    lottieSpeed: 1,
  };
};

/* ── Progress ring ───────────────────────────────────────────────────────── */
const StreakRing = ({ count, color, progressFrom, progressTo }) => {
  const r = 30;
  const circ = 2 * Math.PI * r;
  const milestones = [3, 7, 30, 100];
  const next = milestones.find(m => m > count) || 100;
  const prev = milestones[milestones.indexOf(next) - 1] || 0;
  const progress = Math.min((count - prev) / (next - prev), 1);
  const offset = circ * (1 - progress);
  const uid = `ring_${count}_${progressFrom.replace('#','')}`;
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" style={{ position: 'absolute', top: 0, left: 0 }}>
      <defs>
        <linearGradient id={uid} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={progressFrom} />
          <stop offset="100%" stopColor={progressTo} />
        </linearGradient>
      </defs>
      <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="4" />
      <circle cx="36" cy="36" r={r} fill="none"
        stroke={`url(#${uid})`}
        strokeWidth="4"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 36 36)"
        style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(.36,1.6,.64,1)' }}
      />
    </svg>
  );
};

/* ── Checkin button ──────────────────────────────────────────────────────── */
const CheckinButton = ({ onClick, disabled, loading, hasCheckedInToday, cfg, t, userName }) => {
  const [pressing, setPressing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleClick = async () => {
    if (disabled || loading || hasCheckedInToday) return;
    setPressing(true);
    setTimeout(() => setPressing(false), 320);
    await onClick();
    setSuccess(true);
    setTimeout(() => setSuccess(false), 1800);
  };

  if (hasCheckedInToday) {
    return (
      <button disabled style={{
        width: '100%',
        background: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
        color: '#059669',
        border: '2px solid #6EE7B7',
        cursor: 'not-allowed',
        fontWeight: 900,
        padding: '16px 0',
        borderRadius: 18,
        fontSize: 14,
        fontFamily: "'Baloo 2', sans-serif",
        letterSpacing: 0.3,
      }}>
        ✅ {t('streak.already_checked_in', { name: userName || '' })}
      </button>
    );
  }

  return (
    <>
      <style>{`
        @keyframes btnWobble {
          0%, 100% { transform: scale(1) rotate(0deg); }
          20% { transform: scale(0.93) rotate(-1.5deg); }
          40% { transform: scale(1.07) rotate(1.5deg); }
          60% { transform: scale(0.97) rotate(-0.5deg); }
          80% { transform: scale(1.02) rotate(0.5deg); }
        }
        @keyframes btnShimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes btnGlow {
          0%, 100% { box-shadow: 0 6px 30px rgba(255,107,53,0.45), 0 2px 8px rgba(0,0,0,0.12); }
          50% { box-shadow: 0 6px 45px rgba(255,107,53,0.7), 0 2px 8px rgba(0,0,0,0.12); }
        }
        @keyframes successBounce {
          0% { transform: scale(1); }
          35% { transform: scale(1.1); }
          65% { transform: scale(0.96); }
          100% { transform: scale(1); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes rippleOut {
          0% { transform: translate(-50%,-50%) scale(0); opacity: 0.5; }
          100% { transform: translate(-50%,-50%) scale(5); opacity: 0; }
        }
      `}</style>
      <button
        onClick={handleClick}
        disabled={disabled || loading}
        style={{
          width: '100%',
          background: success
            ? 'linear-gradient(135deg, #10B981, #34D399)'
            : cfg.btnGradient,
          color: '#fff',
          border: 'none',
          fontWeight: 900,
          padding: '16px 0',
          borderRadius: 18,
          fontSize: 14.5,
          cursor: 'pointer',
          fontFamily: "'Baloo 2', 'Nunito', sans-serif",
          letterSpacing: 0.5,
          position: 'relative',
          overflow: 'hidden',
          transition: 'background 0.3s, opacity 0.2s',
          opacity: loading ? 0.65 : 1,
          animation: pressing
            ? 'btnWobble 0.35s ease'
            : success
            ? 'successBounce 0.45s ease'
            : 'btnGlow 2.5s ease-in-out infinite',
        }}
      >
        {!loading && !success && (
          <span style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%)',
            backgroundSize: '200% auto',
            animation: 'btnShimmer 2.5s linear infinite',
            borderRadius: 'inherit',
            pointerEvents: 'none',
          }} />
        )}
        <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {loading ? (
            <>
              <span style={{ width: 17, height: 17, border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
              {t('streak.loading')}
            </>
          ) : success ? (
            <>✨ Check-in thành công!</>
          ) : (
            t('streak.check_in_btn')
          )}
        </span>
      </button>
    </>
  );
};

/* ── Start button ────────────────────────────────────────────────────────── */
const StartButton = ({ onClick, loading, t }) => {
  const [ripple, setRipple] = useState(null);
  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setRipple({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setTimeout(() => setRipple(null), 700);
    onClick();
  };
  return (
    <button onClick={handleClick} disabled={loading} style={{
      width: '100%',
      background: 'linear-gradient(135deg, #F97316, #EC4899)',
      color: '#fff', border: 'none',
      fontWeight: 900, padding: '16px 0', borderRadius: 18, fontSize: 14.5,
      cursor: 'pointer', position: 'relative', overflow: 'hidden',
      fontFamily: "'Baloo 2', 'Nunito', sans-serif",
      letterSpacing: 0.5,
      boxShadow: '0 6px 28px rgba(249,115,22,0.45)',
      opacity: loading ? 0.7 : 1,
      transition: 'opacity 0.2s, transform 0.1s',
    }}>
      {ripple && (
        <span style={{
          position: 'absolute', left: ripple.x, top: ripple.y,
          width: 20, height: 20, borderRadius: '50%',
          background: 'rgba(255,255,255,0.45)',
          animation: 'rippleOut 0.7s ease-out forwards',
          pointerEvents: 'none',
        }} />
      )}
      <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        {loading ? (
          <><span style={{ width: 17, height: 17, border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />{t('streak.loading')}</>
        ) : t('streak.start_btn')}
      </span>
    </button>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN FlameButton Component
───────────────────────────────────────────────────────────────────────────── */
const FlameButton = () => {
  const { t } = useTranslation();
  const { elementRef, hasMoved } = useDraggableStreak();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showFireworks, setShowFireworks] = useState(false);
  const [milestonePopup, setMilestonePopup] = useState(null);
  const [checkInAnim, setCheckInAnim] = useState(false);

  const prevStreakRef = useRef(null);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);
  const lookupRequestIdRef = useRef(0);

  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [savedPhone, setSavedPhone] = useState(localStorage.getItem('streak_phone') || '');
  const [userData, setUserData] = useState(null);
  const [isReviveConfirmOpen, setIsReviveConfirmOpen] = useState(false);

  const handleOpen = () => { openModal(); setIsOpen(true); };
  const handleClose = () => { closeModal(); setIsOpen(false); };

  useEffect(() => {
    if (userData?.streakCount !== undefined) {
      const current = userData.streakCount;
      const prev = prevStreakRef.current;
      if (prev !== null && prev !== current) {
        setCheckInAnim(true);
        setTimeout(() => setCheckInAnim(false), 1200);
        if (FIREWORK_MILESTONES.includes(current)) {
          setShowFireworks(true);
          setTimeout(() => setMilestonePopup(current), 350);
        } else {
          setTimeout(() => setMilestonePopup(current), 350);
        }
      }
      prevStreakRef.current = current;
    }
  }, [userData?.streakCount]);

  const isValidPhone = (p) => /^0(3|5|7|8|9)[0-9]{8}$/.test(p);

  const loadUser = useCallback(async (p) => {
    if (!p || !isValidPhone(p)) return;
    const requestId = ++lookupRequestIdRef.current;
    setLoadingUser(true);
    setErrorMsg('');
    try {
      const res = await fetchStreak(p);
      if (requestId === lookupRequestIdRef.current) {
        if (res.success && res.data) {
          setUserData(res.data);
          setName(res.data.name);
          setEmail(res.data.email || '');
          setIsExistingUser(true);
        } else {
          setUserData(null); setIsExistingUser(false); setName(''); setEmail('');
        }
      }
    } catch (_err) {
      if (requestId === lookupRequestIdRef.current) { setUserData(null); setIsExistingUser(false); }
    } finally {
      if (requestId === lookupRequestIdRef.current) setLoadingUser(false);
    }
  }, []);

  useEffect(() => {
    const today = getVNDate(0);
    const lastLogin = localStorage.getItem('streak_last_login_date');
    if (savedPhone && lastLogin !== today) {
      localStorage.removeItem('streak_phone');
      setSavedPhone(''); setUserData(null); setPhone(''); setName(''); setEmail('');
    }
  }, [savedPhone]);

  useEffect(() => { if (savedPhone) loadUser(savedPhone); }, [savedPhone, loadUser]);

  useEffect(() => {
    if (!savedPhone && isValidPhone(phone)) {
      const timer = setTimeout(() => loadUser(phone), 300);
      return () => clearTimeout(timer);
    }
  }, [phone, savedPhone, loadUser]);

  const handleStart = async () => {
    if (loading) return;
    if (!phone || !isValidPhone(phone)) { setErrorMsg(t('streak.error_phone')); return; }
    if (!name) { setErrorMsg(t('streak.error_name')); return; }
    setLoading(true); setErrorMsg('');
    const res = await startStreak({ phone, name, email });
    if (res.success) {
      const today = getVNDate(0);
      localStorage.setItem('streak_phone', res.data.phone);
      localStorage.setItem('streak_last_login_date', today);
      setSavedPhone(res.data.phone); setUserData(res.data);
    } else { setErrorMsg(res.message || t('streak.unknown_error')); }
    setLoading(false);
  };

  const handleCheckIn = async (forceReset = false) => {
    if (loading) return;
    setLoading(true); setErrorMsg('');
    const res = await checkinStreak(savedPhone, forceReset);
    if (res.success) {
      if (res.needRevive) { setUserData(res.data); }
      else { setUserData(res.data); setIsReviveConfirmOpen(false); }
    } else { setErrorMsg(res.message || t('streak.unknown_error')); }
    setLoading(false);
  };

  const handleRevive = async () => {
    if (loading) return;
    setLoading(true); setErrorMsg('');
    const res = await reviveStreak(savedPhone);
    if (res.success) { setUserData(res.data); setIsReviveConfirmOpen(false); }
    else { setErrorMsg(res.message || t('streak.unknown_error')); }
    setLoading(false);
  };

  const handleSwitchUser = () => {
    localStorage.removeItem('streak_phone');
    setSavedPhone(''); setUserData(null); setPhone(''); setName(''); setEmail('');
    setErrorMsg(''); setIsReviveConfirmOpen(false);
  };

  const today = getVNDate(0);
  const hasCheckedInToday = userData?.lastCheckin === today;

  const calcDiffDays = (lastCheckin) => {
    if (!lastCheckin) return 999;
    const last = new Date(lastCheckin + 'T00:00:00Z');
    const curr = new Date(today + 'T00:00:00Z');
    return Math.round((curr - last) / (1000 * 60 * 60 * 24));
  };

  const diffDays = calcDiffDays(userData?.lastCheckin);
  const isInReviveWindow = diffDays >= 2 && diffDays <= 5;
  const isStreakExpired = diffDays >= 6 && !!userData?.lastCheckin;
  const canRevive = isInReviveWindow && !userData?.reviveUsed;
  const reviveAlreadyUsed = isInReviveWindow && userData?.reviveUsed;

  const cfg = getMilestoneConfig(userData?.streakCount || 0);
  const isMilestone = FIREWORK_MILESTONES.includes(userData?.streakCount);

  const buildTimeline = () => {
    if (!userData?.lastCheckin) return [];
    const days = [];
    for (let i = 3; i >= 0; i--) {
      const d = getVNDate(-i);
      const diff = calcDiffDays(d);
      let type = 'future';
      if (d === today) type = 'today';
      else if (d === userData.lastCheckin) type = 'checked';
      else if (diff > 0 && d > userData.lastCheckin) type = 'missed';
      else if (d < userData.lastCheckin) type = 'checked';
      const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      const dayObj = new Date(d + 'T00:00:00Z');
      days.push({ date: d, type, label: dayNames[dayObj.getUTCDay()] });
    }
    return days;
  };

  const getProgressPct = () => {
    const ms = [3, 7, 30, 100];
    const next = ms.find(m => m > (userData?.streakCount || 0)) || 100;
    const prev = ms[ms.indexOf(next) - 1] || 0;
    return Math.min(((( userData?.streakCount || 0) - prev) / (next - prev)) * 100, 100);
  };

  if (location.pathname !== '/') return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;700;800;900&family=Nunito:wght@700;800;900&display=swap');

        /* ── FAB animations ── */
        @keyframes fabFloat {
          0%, 100% { transform: translateY(0) rotate(-1deg); }
          50% { transform: translateY(-10px) rotate(1deg); }
        }
        @keyframes fabGlowPulse {
          0%, 100% { opacity: 0.4; transform: scale(1.2); filter: blur(22px); }
          50% { opacity: 0.75; transform: scale(1.65); filter: blur(30px); }
        }
        @keyframes badgePop {
          0%, 100% { transform: translateX(-50%) scale(1) translateY(0); }
          50% { transform: translateX(-50%) scale(1.13) translateY(-2px); }
        }
        @keyframes checkInBurst {
          0% { transform: scale(1); }
          30% { transform: scale(1.3); }
          55% { transform: scale(0.88); }
          75% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }

        /* ── Modal animations ── */
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(48px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes modalFadeCenter {
          from { opacity: 0; transform: scale(0.94) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes streakNumUpdate {
          0% { transform: scale(1); }
          40% { transform: scale(1.45); color: #FF6B35; }
          100% { transform: scale(1); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes rippleOut {
          0% { transform: translate(-50%,-50%) scale(0); opacity: 0.5; }
          100% { transform: translate(-50%,-50%) scale(5); opacity: 0; }
        }
        @keyframes shimmerBtn {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes btnGlow {
          0%, 100% { box-shadow: 0 6px 30px rgba(255,107,53,0.45), 0 2px 8px rgba(0,0,0,0.12); }
          50% { box-shadow: 0 6px 45px rgba(255,107,53,0.7), 0 2px 8px rgba(0,0,0,0.12); }
        }
        @keyframes fabCountIn {
          0% { transform: translateX(-50%) scale(0) rotate(-20deg); opacity: 0; }
          65% { transform: translateX(-50%) scale(1.3) rotate(6deg); }
          100% { transform: translateX(-50%) scale(1) rotate(0); opacity: 1; }
        }
        @keyframes heroFireFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        /* ── Desktop center modal ── */
        @media (min-width: 768px) {
          .streak-modal-inner {
            border-radius: 28px !important;
            margin-bottom: 0 !important;
            animation: modalFadeCenter 0.32s cubic-bezier(.25,1.4,.5,1) !important;
            box-shadow: 0 32px 80px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.08) !important;
          }
        }

        /* ── FAB lottie container animation ── */
        .fab-lottie-wrap {
          animation: fabFloat 3.4s ease-in-out infinite;
          transform-origin: bottom center;
          will-change: transform;
        }
        .fab-lottie-wrap.burst {
          animation: checkInBurst 0.75s cubic-bezier(.36,1.6,.64,1) !important;
        }

        /* ── Scrollbar thin ── */
        .streak-body::-webkit-scrollbar { width: 4px; }
        .streak-body::-webkit-scrollbar-track { background: transparent; }
        .streak-body::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 99px; }
      `}</style>

      {showFireworks && <Fireworks onComplete={() => setShowFireworks(false)} />}
      {milestonePopup !== null && (
        <MilestonePopup streakCount={milestonePopup} onClose={() => setMilestonePopup(null)} userName={userData?.name} />
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          FAB — Floating Action Button with Lottie Fire
      ═════════════════════════════════════════════════════════════════════ */}
      <div
        ref={elementRef}
        className="fixed bottom-[14px] right-[12px] sm:bottom-[22px] sm:right-[18px] md:bottom-[28px] md:right-[28px] lg:bottom-[36px] lg:right-[36px] z-[40] select-none touch-none"
        style={{ touchAction: 'none', cursor: 'pointer' }}
        onClick={(e) => {
          if (!hasMoved) handleOpen();
          else { e.preventDefault(); e.stopPropagation(); }
        }}
      >
        {/* Glow halo — dynamic color per milestone */}
        <div style={{
          position: 'absolute',
          inset: '10px',
          background: cfg.glowColor,
          borderRadius: '50%',
          animation: 'fabGlowPulse 3s ease-in-out infinite',
          pointerEvents: 'none',
          zIndex: 0,
        }} />

        {/* Lottie fire — replaces flame.png */}
        <div className={`fab-lottie-wrap${checkInAnim ? ' burst' : ''}`} style={{ position: 'relative', zIndex: 1 }}>
          <LottieFire
            hueRotate={cfg.hueRotate}
            speed={cfg.lottieSpeed}
            size="default"
          />
        </div>

        {/* Streak count badge */}
        {userData?.streakCount > 0 && (
          <div style={{
            position: 'absolute',
            bottom: -4,
            left: '50%',
            transform: 'translateX(-50%)',
            animation: 'badgePop 2.4s ease-in-out infinite',
            zIndex: 2,
          }}>
            <div style={{
              background: cfg.btnGradient,
              color: '#fff',
              fontWeight: 900,
              fontSize: 'clamp(10px, 2.4vw, 14px)',
              padding: '2px 9px',
              borderRadius: 999,
              border: '2px solid rgba(255,255,255,0.55)',
              boxShadow: `0 3px 14px ${cfg.glowColor}, 0 1px 4px rgba(0,0,0,0.15)`,
              display: 'flex', alignItems: 'center', gap: 3,
              fontFamily: "'Baloo 2', 'Nunito', sans-serif",
              whiteSpace: 'nowrap',
              backdropFilter: 'blur(4px)',
            }}>
              <span>{userData.streakCount}</span>
              <span style={{ fontSize: '0.78em' }}>🔥</span>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL
      ═════════════════════════════════════════════════════════════════════ */}
      {isOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 60,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            background: 'rgba(8,12,24,0.7)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            overscrollBehavior: 'contain', touchAction: 'pan-y',
          }}
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          {/* Desktop: vertically centered */}
          <style>{`
            @media (min-width: 768px) {
              .streak-overlay-inner {
                align-items: center !important;
              }
            }
          `}</style>

          <div className="streak-modal-inner" style={{
            position: 'relative',
            background: '#FEFCFA',
            width: '100%', maxWidth: 440,
            borderRadius: '28px 28px 0 0',
            maxHeight: '92dvh',
            overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 -8px 60px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.06)',
            animation: 'modalSlideUp 0.38s cubic-bezier(.36,1.6,.64,1)',
            fontFamily: "'Baloo 2', 'Nunito', sans-serif",
          }}>
            {/* Drag handle */}
            <div style={{
              width: 36, height: 4, background: '#D1D5DB', borderRadius: 99,
              margin: '10px auto 0', flexShrink: 0,
              transition: 'background 0.2s',
            }} />

            {/* ── HERO ─────────────────────────────────────────────────── */}
            {savedPhone && userData ? (
              /* Logged in hero */
              <div style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 20px 14px',
                borderBottom: '1px solid #F3F4F6',
                flexShrink: 0,
                background: 'linear-gradient(135deg, #FFFBF5 0%, #FFF6EC 100%)',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {/* Subtle bg decoration */}
                <div style={{
                  position: 'absolute', right: -20, top: -20,
                  width: 120, height: 120,
                  background: cfg.glowColor,
                  filter: 'blur(40px)',
                  opacity: 0.25,
                  pointerEvents: 'none',
                  borderRadius: '50%',
                }} />

                {/* Mini Lottie + ring */}
                <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
                  <StreakRing
                    count={userData.streakCount || 0}
                    color={isStreakExpired ? '#D1D5DB' : cfg.ringColor}
                    progressFrom={isStreakExpired ? '#D1D5DB' : cfg.progressFrom}
                    progressTo={isStreakExpired ? '#9CA3AF' : cfg.progressTo}
                  />
                  {/* Center: small lottie instead of plain count */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: 0,
                  }}>
                    <span style={{
                      fontSize: 21, fontWeight: 900, lineHeight: 1.1,
                      color: isStreakExpired ? '#9CA3AF' : '#1F1F2E',
                      fontFamily: "'Baloo 2', sans-serif",
                      animation: checkInAnim ? 'streakNumUpdate 0.5s ease' : 'none',
                    }}>
                      {isStreakExpired ? 0 : userData.streakCount}
                    </span>
                    <span style={{ fontSize: 8.5, color: '#9CA3AF', fontWeight: 700, letterSpacing: 0.4 }}>
                      {t('streak.days')}
                    </span>
                  </div>
                </div>

                {/* User info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    {/* Tiny lottie accent next to name */}
                    <div style={{ flexShrink: 0, animation: 'heroFireFloat 3s ease-in-out infinite' }}>
                      <LottieFire hueRotate={cfg.hueRotate} speed={cfg.lottieSpeed} size="tiny" />
                    </div>
                    <p style={{
                      fontWeight: 800, color: '#1F1F2E', fontSize: 14.5,
                      margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {t('streak.greeting_back', { name: userData.name })}
                    </p>
                  </div>

                  {/* Status badge */}
                  {hasCheckedInToday && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#D1FAE5', color: '#065F46', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, border: '1.5px solid #A7F3D0' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                      Đã check-in hôm nay
                    </span>
                  )}
                  {!hasCheckedInToday && !isInReviveWindow && !isStreakExpired && userData.lastCheckin && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#FFF7ED', color: '#92400E', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, border: '1.5px solid #FED7AA' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#F97316', display: 'inline-block', animation: 'btnGlow 1.5s ease-in-out infinite' }} />
                      Chưa check-in hôm nay
                    </span>
                  )}
                  {canRevive && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#FFFBEB', color: '#92400E', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, border: '1.5px solid #FDE68A' }}>
                      ✨ Có thể khôi phục
                    </span>
                  )}
                  {reviveAlreadyUsed && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#FFFBEB', color: '#B45309', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, border: '1.5px solid #FDE68A' }}>
                      🎟️ Đã dùng lượt khôi phục
                    </span>
                  )}
                  {isStreakExpired && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#FEF2F2', color: '#991B1B', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, border: '1.5px solid #FECACA' }}>
                      💔 Chuỗi đã mất
                    </span>
                  )}

                  {/* Milestone label */}
                  {isMilestone && cfg.label && (
                    <div style={{ marginTop: 5 }}>
                      <span style={{
                        display: 'inline-block', padding: '2px 10px', borderRadius: 99,
                        background: cfg.btnGradient, color: '#fff',
                        fontSize: 10, fontWeight: 900, letterSpacing: 0.8,
                      }}>
                        {cfg.badge} {cfg.label}
                      </span>
                    </div>
                  )}

                  {/* Progress bar */}
                  {!isStreakExpired && (userData?.streakCount || 0) < 100 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 7 }}>
                      <div style={{ flex: 1, height: 5, borderRadius: 99, background: '#F3F4F6', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 99,
                          background: `linear-gradient(90deg, ${cfg.progressFrom}, ${cfg.progressTo})`,
                          width: `${getProgressPct()}%`,
                          transition: 'width 0.8s cubic-bezier(.36,1.6,.64,1)',
                        }} />
                      </div>
                      <span style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        Mốc {[3, 7, 30, 100].find(m => m > (userData?.streakCount || 0)) || 100} ngày
                      </span>
                    </div>
                  )}
                </div>
              </div>

            ) : !savedPhone ? (
              /* Not logged in hero — centered Lottie fire + title */
              <div style={{
                padding: '24px 20px 18px',
                textAlign: 'center',
                borderBottom: '1px solid #F3F4F6',
                flexShrink: 0,
                background: 'linear-gradient(160deg, #FFF7F0 0%, #FFF2E6 100%)',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {/* bg glow */}
                <div style={{
                  position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)',
                  width: 200, height: 200,
                  background: 'radial-gradient(circle, rgba(249,115,22,0.18) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }} />

                {/* Centered Lottie */}
                <div style={{
                  display: 'flex', justifyContent: 'center', marginBottom: 6,
                  animation: 'heroFireFloat 3.5s ease-in-out infinite',
                }}>
                  <LottieFire size="mini" speed={1} />
                </div>

                <h2 style={{
                  fontSize: 18, fontWeight: 900, color: '#1F1F2E',
                  margin: '0 0 5px', fontFamily: "'Baloo 2', sans-serif",
                  letterSpacing: -0.3,
                }}>
                  {t('streak.title_fun')}
                </h2>
                <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0, lineHeight: 1.6 }}>
                  Mỗi ngày check-in để giữ chuỗi. Tích lũy càng dài, huy hiệu càng xịn!
                </p>
              </div>

            ) : (
              /* Loading skeleton */
              <div style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '18px 20px', borderBottom: '1px solid #F3F4F6', flexShrink: 0,
              }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#F3F4F6', animation: 'btnGlow 1.2s ease-in-out infinite', flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ height: 12, background: '#F3F4F6', borderRadius: 6, width: '60%' }} />
                  <div style={{ height: 8, background: '#F3F4F6', borderRadius: 6, width: '40%' }} />
                </div>
              </div>
            )}

            {/* ── BODY ─────────────────────────────────────────────────── */}
            <div className="streak-body" style={{
              flex: 1, overflowY: 'auto', padding: '16px 20px',
              display: 'flex', flexDirection: 'column', gap: 12,
              WebkitOverflowScrolling: 'touch',
            }}>

              {errorMsg && (
                <div style={{
                  background: '#FEF2F2', border: '1.5px solid #FECACA',
                  borderRadius: 14, padding: '12px 16px',
                  color: '#DC2626', fontSize: 13, fontWeight: 700, textAlign: 'center',
                }}>
                  {errorMsg}
                </div>
              )}

              {savedPhone && userData ? (
                <>
                  {/* STATE: Expired */}
                  {isStreakExpired && (
                    <>
                      <div style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: 16, padding: '14px 16px' }}>
                        <p style={{ fontWeight: 800, color: '#DC2626', fontSize: 14, margin: '0 0 4px' }}>Chuỗi {userData.streakCount} ngày đã kết thúc</p>
                        <p style={{ color: '#F87171', fontSize: 12, margin: 0, lineHeight: 1.5 }}>Bỏ lỡ {diffDays} ngày — vượt quá giới hạn khôi phục. Chuỗi cũ không lấy lại được nữa.</p>
                      </div>
                      <div style={{ background: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: 16, padding: '14px 16px' }}>
                        <p style={{ fontWeight: 800, color: '#1D4ED8', fontSize: 14, margin: '0 0 4px' }}>Bắt đầu lại ngay hôm nay</p>
                        <p style={{ color: '#60A5FA', fontSize: 12, margin: 0, lineHeight: 1.5 }}>Thói quen bạn xây được vẫn còn đó. Check-in hôm nay để khởi động chuỗi mới!</p>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div style={{ background: '#F9FAFB', border: '1.5px solid #F3F4F6', borderRadius: 14, padding: '12px', textAlign: 'center' }}>
                          <p style={{ fontSize: 28, fontWeight: 900, color: '#6B7280', margin: '0 0 2px', fontFamily: "'Baloo 2', sans-serif" }}>{userData.streakCount}</p>
                          <p style={{ fontSize: 10, color: '#9CA3AF', margin: 0, fontWeight: 600 }}>Kỷ lục của bạn</p>
                        </div>
                        <div style={{ background: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: 14, padding: '12px', textAlign: 'center' }}>
                          <p style={{ fontSize: 28, fontWeight: 900, color: '#3B82F6', margin: '0 0 2px', fontFamily: "'Baloo 2', sans-serif" }}>{[3, 7, 30, 100].find(m => m > userData.streakCount) ?? '100+'}</p>
                          <p style={{ fontSize: 10, color: '#60A5FA', margin: 0, fontWeight: 600 }}>Mục tiêu tiếp theo</p>
                        </div>
                      </div>
                      <button onClick={() => handleCheckIn(true)} disabled={loading} style={{
                        width: '100%', background: cfg.btnGradient, color: '#fff',
                        border: 'none', fontWeight: 900, padding: '16px 0', borderRadius: 18,
                        fontSize: 14.5, cursor: 'pointer', fontFamily: "'Baloo 2', sans-serif",
                        opacity: loading ? 0.6 : 1,
                      }}>
                        {loading ? t('streak.loading') : '🔥 Check-in hôm nay — bắt đầu chuỗi mới'}
                      </button>
                    </>
                  )}

                  {/* STATE: Revive window */}
                  {isInReviveWindow && !isReviveConfirmOpen && (
                    <>
                      <div style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: 16, padding: '14px 16px' }}>
                        <p style={{ fontWeight: 800, color: '#B45309', fontSize: 14, margin: '0 0 4px' }}>Chuỗi sắp mất! ⚠️</p>
                        <p style={{ color: '#D97706', fontSize: 12, margin: 0, lineHeight: 1.5 }}>
                          Bạn bỏ lỡ {diffDays - 1} ngày.{' '}
                          {canRevive ? 'Còn 1 lượt khôi phục miễn phí cho chuỗi này.' : 'Đã dùng lượt khôi phục rồi.'}
                        </p>
                      </div>
                      {/* Timeline */}
                      <div>
                        <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 700, marginBottom: 8 }}>Lịch sử gần đây</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                          {buildTimeline().map((day, idx, arr) => {
                            const colors = {
                              checked: ['#D1FAE5', '#065F46', '#A7F3D0'],
                              missed: ['#FEE2E2', '#DC2626', '#FECACA'],
                              today: ['#DBEAFE', '#1D4ED8', '#BFDBFE'],
                              future: ['#F3F4F6', '#D1D5DB', '#E5E7EB']
                            };
                            const [bg, text, border] = colors[day.type] || colors.future;
                            return (
                              <React.Fragment key={day.date}>
                                <div style={{
                                  width: 44, height: 44, borderRadius: '50%',
                                  background: bg, color: text,
                                  border: `1.5px solid ${border}`,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 10, fontWeight: 800, flexShrink: 0,
                                }}>
                                  {day.type === 'today' ? 'Hôm nay' : day.label}
                                </div>
                                {idx < arr.length - 1 && (
                                  <div style={{ flex: 1, height: 2.5, background: day.type === 'checked' ? '#A7F3D0' : '#FECACA', borderRadius: 99 }} />
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </div>
                      {canRevive ? (
                        <>
                          <button onClick={() => setIsReviveConfirmOpen(true)} disabled={loading} style={{
                            width: '100%', background: 'linear-gradient(135deg, #F59E0B, #F97316)',
                            color: '#fff', border: 'none', fontWeight: 900, padding: '16px 0',
                            borderRadius: 18, fontSize: 14.5, cursor: 'pointer', fontFamily: "'Baloo 2', sans-serif",
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          }}>
                            <span>✨</span>
                            <span>Dùng lượt khôi phục — giữ chuỗi {userData.streakCount} ngày</span>
                          </button>
                          <button onClick={() => handleCheckIn(true)} disabled={loading} style={{
                            width: '100%', background: '#F9FAFB', border: '1.5px solid #E5E7EB',
                            color: '#6B7280', fontWeight: 700, padding: '12px 0', borderRadius: 16,
                            fontSize: 12, cursor: 'pointer', fontFamily: "'Baloo 2', sans-serif",
                          }}>
                            {loading ? t('streak.loading') : 'Bỏ qua — reset về 1 ngày'}
                          </button>
                        </>
                      ) : (
                        <button onClick={() => handleCheckIn(true)} disabled={loading} style={{
                          width: '100%', background: cfg.btnGradient, color: '#fff',
                          border: 'none', fontWeight: 900, padding: '16px 0', borderRadius: 18,
                          fontSize: 14.5, cursor: 'pointer', fontFamily: "'Baloo 2', sans-serif",
                          opacity: loading ? 0.6 : 1,
                        }}>
                          {loading ? t('streak.loading') : '🔥 Check-in — bắt đầu chuỗi mới'}
                        </button>
                      )}
                    </>
                  )}

                  {/* Revive confirm */}
                  {isReviveConfirmOpen && (
                    <div style={{ background: '#FFFBEB', border: '2px solid #FDE68A', borderRadius: 20, padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 44, marginBottom: 8 }}>🍭</div>
                        <p style={{ fontWeight: 900, color: '#1F1F2E', fontSize: 15, margin: '0 0 6px' }}>{t('streak.revive_title')}</p>
                        <p style={{ color: '#6B7280', fontSize: 12, margin: 0, lineHeight: 1.55 }}>
                          {t('streak.revive_desc', { count: diffDays - 1, name: userData?.name || '' })}
                        </p>
                      </div>
                      <button onClick={handleRevive} disabled={loading} style={{
                        width: '100%', background: 'linear-gradient(135deg, #F59E0B, #F97316)',
                        color: '#fff', border: 'none', fontWeight: 900, padding: '16px 0',
                        borderRadius: 18, fontSize: 14.5, cursor: 'pointer', fontFamily: "'Baloo 2', sans-serif",
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      }}>
                        <span>🔥</span>
                        <span>{loading ? t('streak.loading') : t('streak.revive_confirm')}</span>
                      </button>
                      <button onClick={() => setIsReviveConfirmOpen(false)} style={{
                        width: '100%', background: '#fff', border: '1.5px solid #E5E7EB',
                        color: '#9CA3AF', fontWeight: 700, padding: '10px 0', borderRadius: 14,
                        fontSize: 12, cursor: 'pointer', fontFamily: "'Baloo 2', sans-serif",
                      }}>
                        Quay lại
                      </button>
                    </div>
                  )}

                  {/* STATE: Normal */}
                  {!isInReviveWindow && !isStreakExpired && !isReviveConfirmOpen && (
                    <>
                      {hasCheckedInToday ? (
                        <div style={{ background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)', border: '1.5px solid #A7F3D0', borderRadius: 16, padding: '14px 16px' }}>
                          <p style={{ fontWeight: 800, color: '#065F46', fontSize: 14, margin: '0 0 4px' }}>Tuyệt vời! 🎉</p>
                          <p style={{ color: '#10B981', fontSize: 12, margin: 0, lineHeight: 1.5 }}>
                            {t('streak.already_checked_in', { name: userData.name || savedPhone })} Quay lại vào ngày mai nhé!
                          </p>
                        </div>
                      ) : (
                        <div style={{ background: 'linear-gradient(135deg, #FFF7ED, #FFEDD5)', border: '1.5px solid #FED7AA', borderRadius: 16, padding: '14px 16px' }}>
                          <p style={{ fontWeight: 800, color: '#C2410C', fontSize: 14, margin: '0 0 4px' }}>Đừng quên check-in hôm nay! 🔥</p>
                          <p style={{ color: '#F97316', fontSize: 12, margin: 0, lineHeight: 1.5 }}>Giữ lửa mỗi ngày để chuỗi không bị ngắt.</p>
                        </div>
                      )}
                      <CheckinButton
                        onClick={handleCheckIn}
                        disabled={loading || hasCheckedInToday}
                        loading={loading}
                        hasCheckedInToday={hasCheckedInToday}
                        cfg={cfg}
                        t={t}
                        userName={userData?.name}
                      />
                    </>
                  )}

                  {!isReviveConfirmOpen && (
                    <button onClick={handleSwitchUser} style={{
                      width: '100%', background: '#F9FAFB', border: '1.5px solid #E5E7EB',
                      color: '#6B7280', fontWeight: 700, padding: '12px 0', borderRadius: 14,
                      fontSize: 12, cursor: 'pointer', fontFamily: "'Baloo 2', sans-serif",
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}>
                      {t('streak.switch_user')}
                    </button>
                  )}
                </>
              ) : (
                /* Register form */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    {
                      label: `📱 ${t('streak.input_phone_label')}`, type: 'tel',
                      placeholder: t('streak.placeholder_phone'), value: phone,
                      onChange: (e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setPhone(val);
                        if (!isValidPhone(val)) {
                          lookupRequestIdRef.current++;
                          setIsExistingUser(false); setLoadingUser(false); setName(''); setEmail('');
                        }
                      }
                    },
                  ].map((field, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1 }}>{field.label}</label>
                      <input
                        type={field.type} placeholder={field.placeholder} value={field.value} onChange={field.onChange}
                        style={{ width: '100%', background: '#F9FAFB', border: '1.5px solid #E5E7EB', color: '#1F1F2E', fontSize: 16, borderRadius: 14, padding: '12px 16px', outline: 'none', fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                        onFocus={e => e.target.style.borderColor = '#F97316'}
                        onBlur={e => e.target.style.borderColor = '#E5E7EB'}
                      />
                    </div>
                  ))}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1 }}>🍭 {t('streak.input_name_label')}</label>
                    {loadingUser ? (
                      <div style={{ background: '#F9FAFB', border: '1.5px dashed #E5E7EB', borderRadius: 14, padding: '12px 16px', color: '#9CA3AF', fontSize: 13, fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 16, height: 16, border: '2px solid #FED7AA', borderTopColor: '#F97316', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                        {t('streak.checking_user')}
                      </div>
                    ) : isExistingUser ? (
                      <div style={{ background: '#FFF7ED', border: '1.5px solid #FED7AA', borderRadius: 14, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontWeight: 900, fontSize: 18, color: '#F97316' }}>{name}</span>
                        <span style={{ fontSize: 10, color: '#FDBA74', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>{t('streak.name_locked_hint')}</span>
                      </div>
                    ) : (
                      <input
                        type="text" placeholder={t('streak.placeholder_name')} value={name} onChange={(e) => setName(e.target.value)}
                        style={{ width: '100%', background: '#F9FAFB', border: '1.5px solid #E5E7EB', color: '#1F1F2E', fontSize: 16, borderRadius: 14, padding: '12px 16px', outline: 'none', fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, boxSizing: 'border-box' }}
                        onFocus={e => e.target.style.borderColor = '#EC4899'}
                        onBlur={e => e.target.style.borderColor = '#E5E7EB'}
                      />
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1 }}>✉️ {t('streak.input_email_label')}</label>
                    <input
                      type="email" placeholder={t('streak.placeholder_email')} value={email} onChange={(e) => setEmail(e.target.value)}
                      style={{ width: '100%', background: '#F9FAFB', border: '1.5px solid #E5E7EB', color: '#1F1F2E', fontSize: 16, borderRadius: 14, padding: '12px 16px', outline: 'none', fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, boxSizing: 'border-box' }}
                      onFocus={e => e.target.style.borderColor = '#A855F7'}
                      onBlur={e => e.target.style.borderColor = '#E5E7EB'}
                    />
                  </div>

                  <StartButton onClick={handleStart} loading={loading} t={t} />
                </div>
              )}
            </div>

            {/* ── FOOTER ───────────────────────────────────────────────── */}
            <div style={{
              flexShrink: 0,
              padding: '12px 20px',
              paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
              background: '#FAFAFA',
              borderTop: '1px solid #F3F4F6',
            }}>
              <button
                onClick={handleClose}
                style={{
                  width: '100%', background: '#F3F4F6', color: '#9CA3AF',
                  border: 'none', fontWeight: 800, padding: '12px 0', borderRadius: 14,
                  fontSize: 11, cursor: 'pointer', letterSpacing: 1.5, textTransform: 'uppercase',
                  fontFamily: "'Baloo 2', sans-serif",
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#E5E7EB'}
                onMouseLeave={e => e.currentTarget.style.background = '#F3F4F6'}
              >
                {t('streak.close_hint')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FlameButton;
