import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import flameImg from '../assets/flame.png';
import {
  startStreak,
  fetchStreak,
  checkinStreak,
  reviveStreak
} from '../services/streakService';

/**
 * Gets date in YYYY-MM-DD format (Vietnam timezone)
 */
const getVNDate = (offset = 0) => {
  const date = new Date();
  const vnDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  vnDate.setDate(vnDate.getDate() + offset);
  
  const y = vnDate.getFullYear();
  const m = String(vnDate.getMonth() + 1).padStart(2, '0');
  const d = String(vnDate.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const FlameButton = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // User Lookup Stability
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);
  const lookupRequestIdRef = useRef(0);
  
  // Revive Modal
  const [isReviveModalOpen, setIsReviveModalOpen] = useState(false);
  const [reviveMissedDays, setReviveMissedDays] = useState(0);

  // Form states
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // User state
  const [savedPhone, setSavedPhone] = useState(localStorage.getItem('streak_phone') || '');
  const [userData, setUserData] = useState(null);

  /**
   * UI Milestone logic for Kids' Theme
   */
  const getMilestoneStyles = (count) => {
    if (count >= 100) return { 
      color: 'text-purple-600', 
      bg: 'bg-purple-50', 
      border: 'border-purple-200', 
      btn: 'bg-gradient-to-r from-purple-400 to-pink-500', 
      shadow: 'shadow-purple-200', 
      sparkle: true,
      hint: t('streak.milestone_100'),
      icon: '👑'
    };
    if (count >= 30) return { 
      color: 'text-red-500', 
      bg: 'bg-red-50', 
      border: 'border-red-200', 
      btn: 'bg-gradient-to-r from-red-400 to-orange-500', 
      shadow: 'shadow-red-200',
      hint: t('streak.milestone_30'),
      glow: true,
      icon: '🏆'
    };
    if (count >= 7) return { 
      color: 'text-blue-500', 
      bg: 'bg-blue-50', 
      border: 'border-blue-200', 
      btn: 'bg-gradient-to-r from-blue-400 to-cyan-500', 
      shadow: 'shadow-blue-200',
      sparkle: true,
      hint: t('streak.milestone_7'),
      icon: '🔥'
    };
    if (count >= 3) return { 
      color: 'text-yellow-500', 
      bg: 'bg-yellow-50', 
      border: 'border-yellow-200', 
      btn: 'bg-gradient-to-r from-yellow-400 to-orange-400', 
      shadow: 'shadow-yellow-200',
      hint: t('streak.milestone_3'),
      icon: '⭐'
    };
    return { 
      color: 'text-orange-500', 
      bg: 'bg-orange-50', 
      border: 'border-orange-200', 
      btn: 'bg-gradient-to-r from-orange-400 to-pink-400', 
      shadow: 'shadow-orange-200',
      hint: '',
      icon: '✨'
    };
  };

  const styles = getMilestoneStyles(userData?.streakCount || 0);
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
          if (res.streakExpired) {
            setErrorMsg(t('streak.error_expired_soft'));
          }
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
      if (requestId === lookupRequestIdRef.current) {
        setLoadingUser(false);
      }
    }
  }, [t]);

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
    if (savedPhone) {
      loadUser(savedPhone);
    }
  }, [savedPhone, loadUser]);

  useEffect(() => {
    if (!savedPhone && isValidPhone(phone)) {
      const timer = setTimeout(() => {
        loadUser(phone);
      }, 300);
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

  const handleStart = async () => {
    if (loading) return;
    if (!phone || !isValidPhone(phone)) {
      setErrorMsg(t('streak.error_phone'));
      return;
    }
    if (!name) {
      setErrorMsg(t('streak.error_name'));
      return;
    }
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
        setReviveMissedDays(res.missedDays);
        setIsReviveModalOpen(true);
      } else {
        setUserData(res.data);
        setIsReviveModalOpen(false);
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
      setIsReviveModalOpen(false);
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
  };

  const today = getVNDate(0);
  const twoDaysAgo = getVNDate(-2);
  
  const hasCheckedInToday = userData?.lastCheckin === today;
  const missedYesterday = userData?.lastCheckin === twoDaysAgo;
  const canRevive = missedYesterday && !userData?.reviveUsed;
  const hasMultipleMissed = userData?.lastCheckin && userData.lastCheckin !== today && userData.lastCheckin !== getVNDate(-1) && userData.lastCheckin !== twoDaysAgo;

  return (
    <>
      <div
        className="fixed bottom-[24px] right-[24px] z-[40] cursor-pointer group"
        onClick={() => setIsOpen(true)}
      >
        {/* Glow behind flame */}
        <div className="absolute inset-0 bg-orange-400/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
        
        <img
          src={flameImg}
          alt="Flame"
          className={`w-[130px] h-[150px] 
            sm:w-[140px] sm:h-[160px] 
            md:w-[160px] md:h-[180px] 
            lg:w-[190px] lg:h-[210px]
            object-contain origin-bottom transition-transform group-hover:scale-110 drop-shadow-[0_10px_10px_rgba(255,165,0,0.4)] animate-float ${
            isBouncing ? 'animate-bounce' : ''
          }`}
        />
        
        {/* Random sparkles around flame */}
        <div className="absolute inset-0 pointer-events-none overflow-visible">
          {[...Array(5)].map((_, i) => (
            <div 
              key={i}
              className="absolute w-1.5 h-1.5 bg-yellow-300 rounded-full animate-sparkle"
              style={{
                top: `${Math.random() * 80}%`,
                left: `${Math.random() * 80}%`,
                animationDelay: `${i * 0.4}s`
              }}
            />
          ))}
        </div>

        {userData?.streakCount > 0 && (
          <div className="absolute top-1 right-1">
             <div className="relative animate-bounce-subtle" key={userData.streakCount}>
                <div className={`absolute inset-0 ${styles.bg} blur-sm rounded-full scale-110`}></div>
                <div className={`relative ${styles.bg} ${styles.color} font-black px-3 py-1 rounded-full text-[14px] border-2 ${styles.border} shadow-lg flex items-center gap-1`}>
                  <span>{userData.streakCount}</span>
                  <span className="text-[10px]">{styles.icon}</span>
                </div>
             </div>
          </div>
        )}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}>
          <div className={`relative bg-white rounded-[3rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] p-8 max-w-sm w-full border-4 ${styles.border} animate-scaleIn overflow-hidden`}>
            
            {/* Background clouds/blobs */}
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-pink-100/40 blur-3xl rounded-full pointer-events-none"></div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-100/40 blur-3xl rounded-full pointer-events-none"></div>
            
            {/* Sparkles for high streaks */}
            {(styles.sparkle || styles.glow) && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className={`absolute inset-0 ${styles.glow ? 'bg-gradient-radial from-yellow-100/20 to-transparent' : ''}`}></div>
                {[...Array(8)].map((_, i) => (
                  <div 
                    key={i}
                    className="absolute w-2 h-2 bg-yellow-400/60 rounded-full animate-ping"
                    style={{
                      top: `${Math.random() * 100}%`,
                      left: `${Math.random() * 100}%`,
                      animationDelay: `${i * 0.5}s`,
                      animationDuration: '3s'
                    }}
                  />
                ))}
              </div>
            )}

            <h2 className="text-2xl font-black text-center mb-6 text-gray-800 tracking-tight">
              <span className="bg-gradient-to-r from-orange-400 via-pink-400 to-purple-500 bg-clip-text text-transparent">
                {t('streak.title_fun')}
              </span>
            </h2>

            {errorMsg && (
              <div className="bg-red-50 border-2 border-red-100 rounded-[1.5rem] p-4 mb-6 animate-bounce-subtle">
                <p className="text-red-500 text-sm font-bold text-center leading-relaxed">
                  {errorMsg}
                </p>
              </div>
            )}

            {savedPhone && userData ? (
              <div className="relative z-10 flex flex-col gap-5">
                <div className="text-center group">
                  <p className="text-lg font-bold text-gray-700">
                    {t('streak.greeting_back', { name: userData.name || t('streak.greeting_default') })}
                  </p>
                  {styles.hint && (
                    <p className="text-[11px] font-black italic text-orange-400 mt-1 animate-pulse">
                      {styles.hint}
                    </p>
                  )}
                </div>

                <div className={`${styles.bg} rounded-[3rem] p-10 text-center border-4 border-dashed ${styles.border} relative overflow-hidden group/card transition-all hover:scale-[1.02]`}>
                  <p className="text-gray-400 font-black text-[11px] uppercase tracking-[0.2em] mb-2">{t('streak.streak_label')}</p>
                  <div className="relative inline-block" key={userData.streakCount}>
                    <p className={`text-7xl font-black bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 bg-clip-text text-transparent drop-shadow-sm animate-bounce-subtle`}>
                      {userData.streakCount}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 uppercase tracking-[0.15em] font-extrabold">{t('streak.days')}</p>
                </div>

                {canRevive && (
                  <div className="bg-red-50/80 backdrop-blur-sm border-2 border-red-100 rounded-[2rem] p-4 text-center animate-pulse">
                    <p className="text-red-600 text-[13px] font-black flex items-center justify-center gap-1">
                      <span>{t('streak.revive_warning')}</span>
                    </p>
                    <p className="text-red-400 text-[11px] font-bold mt-0.5">
                      {t('streak.revive_warning_desc')}
                    </p>
                  </div>
                )}

                {hasMultipleMissed && (
                  <div className="bg-orange-50 border-2 border-orange-100 rounded-[2rem] p-4 text-center">
                    <p className="text-orange-600 text-[13px] font-black">
                      {t('streak.lost_streak_hint')}
                    </p>
                    <p className="text-orange-400 text-[11px] font-bold mt-0.5">
                      {t('streak.lost_streak_desc')}
                    </p>
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  {canRevive && (
                    <button
                      onClick={handleRevive}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-red-400 to-orange-400 hover:from-red-500 hover:to-orange-500 text-white font-black py-5 rounded-[2rem] transition-all shadow-xl shadow-red-100 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 group"
                    >
                      {loading ? t('streak.loading') : (
                        <>
                          <span className="group-hover:animate-bounce">✨</span>
                          <span>{t('streak.revive_confirm')}</span>
                          <span className="bg-white/30 px-2 py-0.5 rounded-lg text-xs">🆘</span>
                        </>
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => handleCheckIn()}
                    disabled={loading || hasCheckedInToday}
                    className={`w-full text-white font-black py-5 rounded-[2rem] transition-all shadow-xl hover:scale-105 active:scale-95 ${
                      hasCheckedInToday
                        ? 'bg-gray-100 text-gray-300 shadow-none cursor-not-allowed'
                        : `${styles.btn} ${styles.shadow}`
                    } ${loading ? 'opacity-70' : ''}`}
                  >
                    {hasCheckedInToday ? (
                      <span className="flex items-center justify-center gap-2">
                        <span>{t('streak.already_checked_in')}</span>
                        <span className="text-xl">🍬</span>
                      </span>
                    ) : (
                      loading ? t('streak.loading') : (canRevive ? t('streak.revive_skip') : t('streak.check_in_btn'))
                    )}
                  </button>

                  <button
                    onClick={handleSwitchUser}
                    className="w-full bg-white border-2 border-gray-200 text-gray-600 
                  hover:bg-gray-50 hover:border-gray-300 
                  font-bold py-4 rounded-[1.5rem] 
                  transition-all shadow-sm hover:shadow-md 
                  active:scale-95"
                  >
                    <span className="flex items-center justify-center gap-2">
                      🔄 {t('streak.switch_user')}
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative z-10 flex flex-col gap-5">
                {/* Phone Input */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-400 ml-4 uppercase tracking-[0.1em] flex items-center gap-1">
                    <span>📱</span> {t('streak.input_phone_label')}
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
                    className="w-full bg-blue-50/50 border-3 border-transparent text-gray-800 rounded-[1.5rem] px-6 py-5 focus:outline-none focus:border-blue-200 focus:bg-white transition-all shadow-inner font-bold placeholder:text-gray-300"
                  />
                </div>

                {/* Name Input / Locked Name */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-400 ml-4 uppercase tracking-[0.1em] flex items-center gap-1">
                    <span>🍭</span> {t('streak.input_name_label')}
                  </label>
                  {loadingUser ? (
                    <div className="w-full bg-gray-50/50 text-gray-400 rounded-[1.5rem] px-6 py-5 italic text-sm animate-pulse flex items-center gap-3 border-3 border-dashed border-gray-100">
                       <span className="w-5 h-5 border-3 border-orange-200 border-t-orange-500 rounded-full animate-spin"></span>
                       {t('streak.checking_user')}
                    </div>
                  ) : isExistingUser ? (
                    <div className="w-full bg-orange-50 border-3 border-orange-100 text-gray-800 rounded-[1.5rem] px-6 py-5 flex flex-col animate-scaleIn">
                      <span className="font-black text-xl text-orange-500">{name}</span>
                      <span className="text-[10px] text-orange-300 font-black uppercase tracking-wider mt-1">
                        {t('streak.name_locked_hint')}
                      </span>
                    </div>
                  ) : (
                    <input
                      type="text"
                      placeholder={t('streak.placeholder_name')}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-pink-50/50 border-3 border-transparent text-gray-800 rounded-[1.5rem] px-6 py-5 focus:outline-none focus:border-pink-200 focus:bg-white transition-all shadow-inner font-bold placeholder:text-gray-300"
                    />
                  )}
                </div>

                {/* Email Input */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-400 ml-4 uppercase tracking-[0.1em] flex items-center gap-1">
                    <span>✉️</span> {t('streak.input_email_label')}
                  </label>
                  <input
                    type="email"
                    placeholder={t('streak.placeholder_email')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-purple-50/50 border-3 border-transparent text-gray-800 rounded-[1.5rem] px-6 py-5 focus:outline-none focus:border-purple-200 focus:bg-white transition-all shadow-inner font-bold placeholder:text-gray-300"
                  />
                </div>

                <button
                  onClick={handleStart}
                  disabled={loading}
                  className={`w-full bg-gradient-to-r from-orange-400 to-pink-500 hover:from-orange-500 hover:to-pink-600 text-white font-black py-6 rounded-[2rem] transition-all shadow-2xl hover:scale-105 active:scale-95 mt-4 uppercase tracking-[0.2em] relative overflow-hidden group ${
                    loading ? 'opacity-70' : ''
                  }`}
                >
                  <span className="relative z-10">{loading ? t('streak.loading') : t('streak.start_btn')}</span>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                </button>
              </div>
            )}

            <button
              onClick={() => setIsOpen(false)}
              className="w-full mt-6 bg-gray-50 hover:bg-gray-100 
              text-gray-500 hover:text-pink-500 
              font-bold py-3 rounded-xl 
              transition-all text-xs uppercase tracking-[0.25em] 
              flex items-center justify-center gap-2 
              border border-gray-200"
            >
              <span>{t('streak.close_hint')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Revive Modal (Friendlier for kids) */}
      {isReviveModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[4rem] p-10 max-w-xs w-full shadow-2xl animate-scaleIn border-8 border-orange-50 relative overflow-hidden">
            {/* Background Blob */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-orange-100/30 blur-3xl rounded-full"></div>
            
            <div className="text-center relative z-10">
              <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                <span className="text-6xl">🍭</span>
              </div>
              <h3 className="text-2xl font-black text-gray-800 mb-4">{t('streak.revive_title')}</h3>
              <p className="text-gray-500 font-bold text-sm leading-relaxed mb-10 px-2">
                {t('streak.revive_desc', { count: reviveMissedDays })}
              </p>
              
              <div className="flex flex-col gap-4">
                <button
                  onClick={handleRevive}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500 text-white font-black py-5 rounded-[2rem] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 group"
                >
                  <span className="text-2xl group-hover:rotate-12 transition-transform">🔥</span>
                  <span>{t('streak.revive_confirm')}</span>
                </button>
                <button
                  onClick={() => handleCheckIn(true)}
                  disabled={loading}
                  className="w-full bg-gray-50 hover:bg-gray-100 text-gray-400 font-black py-4 rounded-[2rem] active:scale-95 transition-all text-xs uppercase tracking-widest"
                >
                  {t('streak.revive_skip')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FlameButton;
