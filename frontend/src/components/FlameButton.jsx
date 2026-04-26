import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import flameImg from '../assets/flame.png';
import Fireworks from './Fireworks';
import { openModal, closeModal } from '../utils/modalScrollLock';
import {
  startStreak,
  fetchStreak,
  checkinStreak,
  reviveStreak
} from '../services/streakService';
import { useDraggableStreak } from '../utils/draggableStreak';
import { useLocation } from 'react-router-dom';

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

// Progress ring SVG helper
const StreakRing = ({ count, color }) => {
  const r = 28;
  const circ = 2 * Math.PI * r;
  // next milestone thresholds
  const milestones = [3, 7, 30, 100];
  const next = milestones.find(m => m > count) || 100;
  const prev = milestones[milestones.indexOf(next) - 1] || 0;
  const progress = Math.min((count - prev) / (next - prev), 1);
  const offset = circ * (1 - progress);
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" className="absolute top-0 left-0">
      <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="3" />
      <circle
        cx="32" cy="32" r={r}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 32 32)"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  );
};

const getMilestoneConfig = (count) => {
  if (count >= 100) return {
    ringColor: '#7F77DD',
    badge: '👑',
    label: 'VUA GIỮ LỬA',
    labelColor: 'text-purple-600',
    fabColor: 'from-purple-500 to-pink-500',
    btnColor: 'bg-gradient-to-r from-purple-500 to-pink-500',
    hueRotate: 'hue-rotate(260deg) saturate(1.5)',
    hint: null,
  };
  if (count >= 30) return {
    ringColor: '#7F77DD',
    badge: '🌟',
    label: 'SIÊU SAO',
    labelColor: 'text-purple-500',
    fabColor: 'from-purple-400 to-purple-600',
    btnColor: 'bg-gradient-to-r from-purple-400 to-purple-600',
    hueRotate: 'hue-rotate(270deg)',
    hint: null,
  };
  if (count >= 7) return {
    ringColor: '#378ADD',
    badge: '🥈',
    label: 'ĐỈNH CAO',
    labelColor: 'text-blue-500',
    fabColor: 'from-blue-400 to-cyan-500',
    btnColor: 'bg-gradient-to-r from-blue-500 to-cyan-500',
    hueRotate: 'hue-rotate(200deg)',
    hint: null,
  };
  if (count >= 3) return {
    ringColor: '#EF9F27',
    badge: '⭐',
    label: 'ĐÃ VÀO NHỊP',
    labelColor: 'text-orange-500',
    fabColor: 'from-orange-400 to-yellow-400',
    btnColor: 'bg-gradient-to-r from-orange-400 to-yellow-400',
    hueRotate: 'hue-rotate(30deg)',
    hint: null,
  };
  return {
    ringColor: '#E24B4A',
    badge: '🌱',
    label: '',
    labelColor: '',
    fabColor: 'from-red-400 to-pink-400',
    btnColor: 'bg-gradient-to-r from-red-400 to-pink-400',
    hueRotate: 'hue-rotate(0deg)',
    hint: null,
  };
};

const FlameButton = () => {
  const { t } = useTranslation();
  const { elementRef, hasMoved } = useDraggableStreak();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showFireworks, setShowFireworks] = useState(false);
  const prevStreakRef = useRef(null);

  const [isExistingUser, setIsExistingUser] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);
  const lookupRequestIdRef = useRef(0);

  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const [savedPhone, setSavedPhone] = useState(localStorage.getItem('streak_phone') || '');
  const [userData, setUserData] = useState(null);

  // ── Modal helpers ────────────────────────────────────────────────────────────
  const handleOpen = () => { openModal(); setIsOpen(true); };
  const handleClose = () => { closeModal(); setIsOpen(false); };

  // ── Fireworks on milestone ───────────────────────────────────────────────────
  useEffect(() => {
    if (userData?.streakCount !== undefined) {
      const current = userData.streakCount;
      const prev = prevStreakRef.current;
      if (prev !== null && prev !== current && FIREWORK_MILESTONES.includes(current)) {
        setShowFireworks(true);
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
          setUserData(null);
          setIsExistingUser(false);
          setName('');
          setEmail('');
        }
      }
    } catch (_err) {
      if (requestId === lookupRequestIdRef.current) {
        setUserData(null);
        setIsExistingUser(false);
      }
    } finally {
      if (requestId === lookupRequestIdRef.current) setLoadingUser(false);
    }
  }, []);

  // Clear session if new day
  useEffect(() => {
    const today = getVNDate(0);
    const lastLogin = localStorage.getItem('streak_last_login_date');
    if (savedPhone && lastLogin !== today) {
      localStorage.removeItem('streak_phone');
      setSavedPhone('');
      setUserData(null);
      setPhone('');
      setName('');
      setEmail('');
    }
  }, [savedPhone]);

  useEffect(() => {
    if (savedPhone) loadUser(savedPhone);
  }, [savedPhone, loadUser]);

  useEffect(() => {
    if (!savedPhone && isValidPhone(phone)) {
      const timer = setTimeout(() => loadUser(phone), 300);
      return () => clearTimeout(timer);
    }
  }, [phone, savedPhone, loadUser]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsBouncing(true);
      setTimeout(() => setIsBouncing(false), 300);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const handleStart = async () => {
    if (loading) return;
    if (!phone || !isValidPhone(phone)) { setErrorMsg(t('streak.error_phone')); return; }
    if (!name) { setErrorMsg(t('streak.error_name')); return; }
    setLoading(true);
    setErrorMsg('');
    const res = await startStreak({ phone, name, email });
    if (res.success) {
      const today = getVNDate(0);
      localStorage.setItem('streak_phone', res.data.phone);
      localStorage.setItem('streak_last_login_date', today);
      setSavedPhone(res.data.phone);
      setUserData(res.data);
    } else {
      setErrorMsg(res.message || t('streak.unknown_error'));
    }
    setLoading(false);
  };

  const handleCheckIn = async (forceReset = false) => {
    if (loading) return;
    setLoading(true);
    setErrorMsg('');
    const res = await checkinStreak(savedPhone, forceReset);
    if (res.success) {
      if (res.needRevive) {
        // needRevive is handled inline now — no separate modal
        setUserData(res.data);
      } else {
        setUserData(res.data);
        setIsReviveConfirmOpen(false);
      }
    } else {
      setErrorMsg(res.message || t('streak.unknown_error'));
    }
    setLoading(false);
  };

  const handleRevive = async () => {
    if (loading) return;
    setLoading(true);
    setErrorMsg('');
    const res = await reviveStreak(savedPhone);
    if (res.success) {
      setUserData(res.data);
      setIsReviveConfirmOpen(false);
    } else {
      setErrorMsg(res.message || t('streak.unknown_error'));
    }
    setLoading(false);
  };

  const handleSwitchUser = () => {
    localStorage.removeItem('streak_phone');
    setSavedPhone('');
    setUserData(null);
    setPhone('');
    setName('');
    setEmail('');
    setErrorMsg('');
    setIsReviveConfirmOpen(false);
  };

  // Inline revive confirm state (replaces separate modal)
  const [isReviveConfirmOpen, setIsReviveConfirmOpen] = useState(false);

  // ── Derived state ────────────────────────────────────────────────────────────
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

  // Build timeline days for revive window
  const buildTimeline = () => {
    if (!userData?.lastCheckin) return [];
    const days = [];
    // Show last 3 days before today + today
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

  if (location.pathname !== '/') return null;

  return (
    <>
      {showFireworks && <Fireworks onComplete={() => setShowFireworks(false)} />}

      {/* ── Floating flame button ────────────────────────────────────────────── */}
      <div
        ref={elementRef}
        className="fixed bottom-[20px] right-[16px] sm:bottom-[24px] sm:right-[20px] md:bottom-[28px] md:right-[28px] lg:bottom-[36px] lg:right-[36px] z-[40] group select-none touch-none"
        style={{ touchAction: 'none' }}
        onClick={(e) => {
          if (!hasMoved) handleOpen();
          else { e.preventDefault(); e.stopPropagation(); }
        }}
      >
        <div className="absolute inset-0 bg-orange-400/20 blur-3xl rounded-full scale-150 animate-pulse" />
        <img
          src={flameImg}
          alt="Flame"
          draggable={false}
          className={`
            w-[120px] h-[140px] sm:w-[140px] sm:h-[160px]
            md:w-[160px] md:h-[180px] lg:w-[190px] lg:h-[210px]
            object-contain origin-bottom transition-transform
            group-hover:scale-110 md:group-hover:scale-125
            drop-shadow-[0_10px_10px_rgba(255,165,0,0.4)]
            animate-float ${isBouncing ? 'animate-bounce' : ''}
          `}
          style={{ filter: cfg.hueRotate }}
        />
        {userData?.streakCount > 0 && (
          <div className="absolute top-1 right-1">
            <div
              key={userData.streakCount}
              className={`
                bg-gradient-to-r ${cfg.fabColor} text-white font-black
                px-3 py-1 rounded-full text-[14px] sm:text-[16px] md:text-[18px]
                border-2 border-white/40 shadow-lg flex items-center gap-1
                animate-bounce-subtle
              `}
            >
              <span>{userData.streakCount}</span>
              <span>🔥</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Main Modal ───────────────────────────────────────────────────────── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end md:items-center justify-center max-md:p-0 p-4 animate-in fade-in duration-300"
          style={{ background: 'rgba(15,20,30,0.6)', backdropFilter: 'blur(14px)', overscrollBehavior: 'contain', touchAction: 'pan-y' }}
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <div className="
            relative bg-white w-full
            max-md:rounded-t-3xl max-md:rounded-b-none rounded-3xl
            max-w-full sm:max-w-md
            max-h-[88dvh] overflow-hidden flex flex-col
            shadow-2xl
          ">
            {/* Handle */}
            <div className="md:hidden w-8 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-0 flex-shrink-0" />

            {/* ── HERO: streak number + user info ── */}
            {savedPhone && userData ? (
              <div className="flex items-center gap-4 px-5 pt-4 pb-4 border-b border-gray-100 flex-shrink-0">
                {/* Ring */}
                <div className="relative w-16 h-16 flex-shrink-0 flex items-center justify-center flex-col">
                  <StreakRing count={userData.streakCount || 0} color={isStreakExpired ? '#D3D1C7' : cfg.ringColor} />
                  <span className={`text-2xl font-black leading-none relative z-10 ${isStreakExpired ? 'text-gray-400' : 'text-gray-800'}`}>
                    {isStreakExpired ? 0 : userData.streakCount}
                  </span>
                  <span className="text-[9px] text-gray-400 relative z-10 mt-0.5 font-semibold tracking-wide">
                    {t('streak.days')}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 text-sm truncate">
                    {userData.name}
                  </p>

                  {/* Status pill */}
                  {hasCheckedInToday && (
                    <div className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-[11px] font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                      Đã check-in hôm nay
                    </div>
                  )}
                  {!hasCheckedInToday && !isInReviveWindow && !isStreakExpired && userData.lastCheckin && (
                    <div className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-[11px] font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block animate-pulse" />
                      Chưa check-in hôm nay
                    </div>
                  )}
                  {canRevive && (
                    <div className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block animate-pulse" />
                      Có thể khôi phục
                    </div>
                  )}
                  {reviveAlreadyUsed && (
                    <div className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-600 text-[11px] font-semibold">
                      🎟️ Đã dùng lượt khôi phục
                    </div>
                  )}
                  {isStreakExpired && (
                    <div className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-600 text-[11px] font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                      Chuỗi đã mất
                    </div>
                  )}

                  {isMilestone && cfg.label && (
                    <div className={`inline-block mt-1 ml-2 px-2 py-0.5 rounded-full bg-white border text-[10px] font-black tracking-widest ${cfg.labelColor}`}>
                      {cfg.badge} {cfg.label}
                    </div>
                  )}

                  {/* Mini next-milestone progress */}
                  {!isStreakExpired && userData.streakCount < 100 && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            background: cfg.ringColor,
                            width: (() => {
                              const ms = [3, 7, 30, 100];
                              const next = ms.find(m => m > userData.streakCount) || 100;
                              const prev = ms[ms.indexOf(next) - 1] || 0;
                              return `${Math.min(((userData.streakCount - prev) / (next - prev)) * 100, 100)}%`;
                            })()
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                        Mốc {[3, 7, 30, 100].find(m => m > userData.streakCount) || 100} ngày
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : !savedPhone ? (
              /* New user header */
              <div className="px-5 pt-5 pb-4 text-center border-b border-gray-100 flex-shrink-0">
                <div className="text-3xl mb-2">🔥</div>
                <h2 className="text-base font-black text-gray-800">{t('streak.title_fun')}</h2>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">Mỗi ngày check-in để giữ chuỗi. Tích lũy càng dài, huy hiệu càng xịn.</p>
              </div>
            ) : (
              /* Loading header */
              <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex-shrink-0 flex items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-24" />
                  <div className="h-2 bg-gray-100 rounded animate-pulse w-16" />
                </div>
              </div>
            )}

            {/* ── BODY ── */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3" style={{ WebkitOverflowScrolling: 'touch' }}>

              {/* Error */}
              {errorMsg && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-red-500 text-sm font-semibold text-center leading-relaxed">
                  {errorMsg}
                </div>
              )}

              {savedPhone && userData ? (
                <>
                  {/* ── STATE: Expired (>= 6 days) ── */}
                  {isStreakExpired && (
                    <>
                      {/* What was lost */}
                      <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
                        <p className="text-red-700 font-bold text-sm">
                          Chuỗi {userData.streakCount} ngày đã kết thúc
                        </p>
                        <p className="text-red-400 text-xs mt-1 leading-relaxed">
                          Bỏ lỡ {diffDays} ngày — vượt quá giới hạn khôi phục 5 ngày. Chuỗi cũ không lấy lại được nữa.
                        </p>
                      </div>

                      {/* Positive reframe */}
                      <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3">
                        <p className="text-blue-700 font-bold text-sm">Bắt đầu lại ngay hôm nay</p>
                        <p className="text-blue-400 text-xs mt-1 leading-relaxed">
                          Thói quen bạn xây được vẫn còn đó. Check-in hôm nay để khởi động chuỗi mới.
                        </p>
                      </div>

                      {/* Record vs next goal */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-center">
                          <p className="text-2xl font-black text-gray-500">{userData.streakCount}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">Kỷ lục của bạn</p>
                        </div>
                        <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 text-center">
                          <p className="text-2xl font-black text-blue-400">
                            {[3, 7, 30, 100].find(m => m > userData.streakCount) ?? '100+'}
                          </p>
                          <p className="text-[10px] text-blue-400 mt-0.5">Mục tiêu tiếp theo</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleCheckIn(true)}
                        disabled={loading}
                        className={`w-full ${cfg.btnColor} text-white font-black py-4 rounded-2xl transition-all shadow-lg hover:scale-[1.02] active:scale-95 text-sm ${loading ? 'opacity-60' : ''}`}
                      >
                        {loading ? t('streak.loading') : '🔥 Check-in hôm nay — bắt đầu chuỗi mới'}
                      </button>
                    </>
                  )}

                  {/* ── STATE: Revive window (2–5 days missed) ── */}
                  {isInReviveWindow && !isReviveConfirmOpen && (
                    <>
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
                        <p className="text-amber-700 font-bold text-sm">Chuỗi sắp mất!</p>
                        <p className="text-amber-500 text-xs mt-1 leading-relaxed">
                          Bạn bỏ lỡ {diffDays - 1} ngày.{' '}
                          {canRevive
                            ? 'Còn 1 lượt khôi phục miễn phí cho chuỗi này.'
                            : 'Đã dùng lượt khôi phục rồi — chỉ có thể check-in và reset.'}
                        </p>
                      </div>

                      {/* Timeline */}
                      <div>
                        <p className="text-[11px] text-gray-400 font-semibold mb-2">Lịch sử gần đây</p>
                        <div className="flex items-center gap-0">
                          {buildTimeline().map((day, idx, arr) => (
                            <React.Fragment key={day.date}>
                              <div className={`
                                w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0
                                ${day.type === 'checked' ? 'bg-green-100 text-green-700 border border-green-200' : ''}
                                ${day.type === 'missed' ? 'bg-red-100 text-red-500 border border-dashed border-red-300' : ''}
                                ${day.type === 'today' ? 'bg-blue-100 text-blue-700 border border-blue-300' : ''}
                                ${day.type === 'future' ? 'bg-gray-50 text-gray-300 border border-gray-100' : ''}
                              `}>
                                {day.type === 'today' ? 'Hôm nay' : day.label}
                              </div>
                              {idx < arr.length - 1 && (
                                <div className={`flex-1 h-0.5 ${day.type === 'checked' ? 'bg-green-200' : 'bg-red-200'}`} />
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                        <div className="flex gap-3 mt-2">
                          {[['bg-green-200', 'Đã check-in'], ['bg-red-200', 'Bỏ lỡ'], ['bg-blue-200', 'Hôm nay']].map(([bg, label]) => (
                            <div key={label} className="flex items-center gap-1">
                              <div className={`w-2 h-2 rounded-full ${bg}`} />
                              <span className="text-[10px] text-gray-400">{label}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {canRevive ? (
                        <>
                          <button
                            onClick={() => setIsReviveConfirmOpen(true)}
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-amber-400 to-orange-400 text-white font-black py-4 rounded-2xl transition-all shadow-lg hover:scale-[1.02] active:scale-95 text-sm flex items-center justify-center gap-2"
                          >
                            <span>✨</span>
                            <span>Dùng lượt khôi phục — giữ chuỗi {userData.streakCount} ngày</span>
                          </button>
                          <button
                            onClick={() => handleCheckIn(true)}
                            disabled={loading}
                            className="w-full bg-gray-50 border border-gray-200 text-gray-500 font-bold py-3 rounded-2xl transition-all text-xs hover:bg-gray-100"
                          >
                            {loading ? t('streak.loading') : 'Bỏ qua — reset về 1 ngày'}
                          </button>
                        </>
                      ) : (
                        /* reviveAlreadyUsed */
                        <button
                          onClick={() => handleCheckIn(true)}
                          disabled={loading}
                          className={`w-full ${cfg.btnColor} text-white font-black py-4 rounded-2xl transition-all shadow-lg hover:scale-[1.02] active:scale-95 text-sm ${loading ? 'opacity-60' : ''}`}
                        >
                          {loading ? t('streak.loading') : '🔥 Check-in — bắt đầu chuỗi mới'}
                        </button>
                      )}
                    </>
                  )}

                  {/* ── Revive inline confirm ── */}
                  {isReviveConfirmOpen && (
                    <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 space-y-3">
                      <div className="text-center">
                        <div className="text-4xl mb-2">🍭</div>
                        <p className="font-black text-gray-800 text-sm">{t('streak.revive_title')}</p>
                        <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                          {t('streak.revive_desc', { count: diffDays - 1 })}
                        </p>
                      </div>
                      <button
                        onClick={handleRevive}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-amber-400 to-orange-400 text-white font-black py-4 rounded-2xl transition-all hover:scale-[1.02] active:scale-95 text-sm flex items-center justify-center gap-2"
                      >
                        <span>🔥</span>
                        <span>{loading ? t('streak.loading') : t('streak.revive_confirm')}</span>
                      </button>
                      <button
                        onClick={() => setIsReviveConfirmOpen(false)}
                        className="w-full bg-white border border-gray-200 text-gray-400 font-bold py-2.5 rounded-xl text-xs"
                      >
                        Quay lại
                      </button>
                    </div>
                  )}

                  {/* ── STATE: Normal / checked in today ── */}
                  {!isInReviveWindow && !isStreakExpired && !isReviveConfirmOpen && (
                    <>
                      {hasCheckedInToday ? (
                        <div className="bg-green-50 border border-green-100 rounded-2xl px-4 py-3">
                          <p className="text-green-700 font-bold text-sm">Tuyệt vời!</p>
                          <p className="text-green-500 text-xs mt-1">
                            {t('streak.already_checked_in', { name: userData.name || savedPhone })} Quay lại vào ngày mai nhé.
                          </p>
                        </div>
                      ) : (
                        <div className="bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3">
                          <p className="text-orange-700 font-bold text-sm">Đừng quên check-in hôm nay!</p>
                          <p className="text-orange-400 text-xs mt-1">Giữ lửa mỗi ngày để chuỗi không bị ngắt.</p>
                        </div>
                      )}

                      <button
                        onClick={() => handleCheckIn()}
                        disabled={loading || hasCheckedInToday}
                        className={`
                          w-full font-black py-4 rounded-2xl transition-all text-sm
                          ${hasCheckedInToday
                            ? 'bg-green-50 text-green-500 border-2 border-green-100 cursor-not-allowed'
                            : `${cfg.btnColor} text-white shadow-lg hover:scale-[1.02] active:scale-95 ${loading ? 'opacity-60' : ''}`
                          }
                        `}
                      >
                        {hasCheckedInToday
                          ? `✅ ${t('streak.already_checked_in', { name: userData.name || savedPhone })}`
                          : loading ? t('streak.loading') : t('streak.check_in_btn')}
                      </button>
                    </>
                  )}

                  {!isReviveConfirmOpen && (
                    <button
                      onClick={handleSwitchUser}
                      className="w-full bg-gray-50 border border-gray-200 text-gray-500 font-bold py-3 rounded-xl transition-all text-xs hover:bg-gray-100 flex items-center justify-center gap-1.5"
                    >
                      {t('streak.switch_user')}
                    </button>
                  )}
                </>
              ) : (
                /* ── Register / login form ── */
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                      📱 {t('streak.input_phone_label')}
                    </label>
                    <input
                      type="tel"
                      placeholder={t('streak.placeholder_phone')}
                      value={phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setPhone(val);
                        if (!isValidPhone(val)) {
                          lookupRequestIdRef.current++;
                          setIsExistingUser(false);
                          setLoadingUser(false);
                          setName('');
                          setEmail('');
                        }
                      }}
                      className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-base rounded-2xl px-4 py-3 focus:outline-none focus:border-orange-300 focus:bg-white transition-all font-semibold placeholder:text-gray-300"
                      style={{ fontSize: 16 }}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                      🍭 {t('streak.input_name_label')}
                    </label>
                    {loadingUser ? (
                      <div className="w-full bg-gray-50 text-gray-400 rounded-2xl px-4 py-3 italic text-sm animate-pulse flex items-center gap-2 border border-dashed border-gray-200">
                        <span className="w-4 h-4 border-2 border-orange-200 border-t-orange-400 rounded-full animate-spin flex-shrink-0" />
                        {t('streak.checking_user')}
                      </div>
                    ) : isExistingUser ? (
                      <div className="w-full bg-orange-50 border border-orange-100 text-gray-800 rounded-2xl px-4 py-3 flex flex-col">
                        <span className="font-black text-lg text-orange-500">{name}</span>
                        <span className="text-[10px] text-orange-300 font-bold uppercase tracking-wider mt-0.5">
                          {t('streak.name_locked_hint')}
                        </span>
                      </div>
                    ) : (
                      <input
                        type="text"
                        placeholder={t('streak.placeholder_name')}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-base rounded-2xl px-4 py-3 focus:outline-none focus:border-pink-300 focus:bg-white transition-all font-semibold placeholder:text-gray-300"
                        style={{ fontSize: 16 }}
                      />
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                      ✉️ {t('streak.input_email_label')}
                    </label>
                    <input
                      type="email"
                      placeholder={t('streak.placeholder_email')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-base rounded-2xl px-4 py-3 focus:outline-none focus:border-purple-300 focus:bg-white transition-all font-semibold placeholder:text-gray-300"
                      style={{ fontSize: 16 }}
                    />
                  </div>

                  <button
                    onClick={handleStart}
                    disabled={loading}
                    className={`w-full bg-gradient-to-r from-orange-400 to-pink-500 text-white font-black py-4 rounded-2xl transition-all shadow-xl hover:scale-[1.02] active:scale-95 text-sm uppercase tracking-widest ${loading ? 'opacity-70' : ''}`}
                  >
                    {loading ? t('streak.loading') : t('streak.start_btn')}
                  </button>
                </div>
              )}
            </div>

            {/* ── Footer close ── */}
            <div
              className="flex-shrink-0 px-5 pb-5 pt-2 bg-white border-t border-gray-50"
              style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
            >
              <button
                onClick={handleClose}
                className="w-full bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-600 font-bold py-3 rounded-xl transition-all text-xs uppercase tracking-widest border border-gray-100"
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
