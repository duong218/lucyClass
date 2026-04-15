import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import flameImg from '../assets/flame.png';
import { fetchStreak, checkinStreak, recoverStreak } from '../services/streakService';

const FlameButton = () => {
  const { t } = useTranslation();
  
  const [isBouncing, setIsBouncing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [foundName, setFoundName] = useState(null);
  const [savedUser, setSavedUser] = useState(null);
  const [streakCount, setStreakCount] = useState(0);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [justCheckedIn, setJustCheckedIn] = useState(false);
  const [lostStreak, setLostStreak] = useState(false);
  const [loading, setLoading] = useState(false);
  const phoneInputRef = React.useRef(null);

  const getVietnamDateString = (offsetDays = 0) => {
    const now = new Date();
    const vn = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    vn.setHours(0, 0, 0, 0);
    vn.setDate(vn.getDate() + offsetDays);

    const yyyy = vn.getFullYear();
    const mm = String(vn.getMonth() + 1).padStart(2, '0');
    const dd = String(vn.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const loadUserSession = async (targetPhone) => {
    const savedName = localStorage.getItem(`streak_name_${targetPhone}`);
    if (!savedName) return false;

    setSavedUser({ phone: targetPhone, name: savedName });

    try {
      const res = await fetchStreak(targetPhone);

      if (res.success) {
        const data = res.data || {};
        const today = getVietnamDateString();

        setStreakCount(data.streakCount || 0);
        setHasCheckedInToday(data.lastCheckin === today);
        setLostStreak(!!data.lostStreak);
        setJustCheckedIn(false);

        return true;
      }
    } catch (err) {
      console.error('Failed to load streak:', err);
    }

    return false;
  };

  useEffect(() => {
    const savedPhone = localStorage.getItem('streak_phone');
    if (savedPhone) loadUserSession(savedPhone);
  }, []);

  const handlePhoneBlur = () => {
    const formattedPhone = phone.trim();
    if (!formattedPhone) return setFoundName(null);

    const existingName = localStorage.getItem(`streak_name_${formattedPhone}`);
    if (existingName) {
      setFoundName(existingName);
      setName(existingName);
    } else {
      setFoundName(null);
    }
  };

  const handleCheckIn = async () => {
    if (!savedUser?.phone || loading || hasCheckedInToday) return;

    setLoading(true);

    try {
      const res = await checkinStreak({
        phone: savedUser.phone,
        name: savedUser.name,
        email: email || ''
      });

      if (res.success && res.data) {
        const data = res.data;

        setStreakCount(data.streakCount);
        setHasCheckedInToday(true);
        setLostStreak(!!data.lostStreak);
        setJustCheckedIn(true);
      }

    } catch (err) {
      console.error('Check-in failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMilestoneMessage = (count) => {
    if (count === 30) return t('streak.milestone_30');
    if (count === 7) return t('streak.milestone_7');
    if (count === 3) return t('streak.milestone_3');
    return "";
  };

  const getStreakColorClass = (count) => {
    if (count >= 30) return "text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]";
    if (count >= 7) return "text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 pb-1";
    if (count >= 3) return "text-orange-600 drop-shadow-sm";
    return "text-orange-500";
  };

  const handleStart = async () => {
    const formattedPhone = phone.trim();

    if (!formattedPhone) {
      setErrorMsg(t('streak.error_phone'));
      return;
    }

    const existingName = localStorage.getItem(`streak_name_${formattedPhone}`);

    if (!existingName && !name.trim()) {
      setErrorMsg(t('streak.error_name'));
      return;
    }

    setErrorMsg('');
    localStorage.setItem('streak_phone', formattedPhone);

    if (existingName) {
      await loadUserSession(formattedPhone);
    } else {
      const formattedName = name.trim();
      localStorage.setItem(`streak_name_${formattedPhone}`, formattedName);

      setSavedUser({ phone: formattedPhone, name: formattedName });
      setStreakCount(0);
      setHasCheckedInToday(false);
      setJustCheckedIn(false);
    }
  };

  const handleRecover = async () => {
    if (!phone.trim() || !email.trim()) {
      setErrorMsg(t('streak.error_recover_required'));
      return;
    }

    try {
      const res = await recoverStreak({
        phone: phone.trim(),
        email: email.trim().toLowerCase()
      });

      if (res.success && res.data) {
        const user = res.data;

        // Cache phone & name only
        localStorage.setItem('streak_phone', user.phone);
        localStorage.setItem(`streak_name_${user.phone}`, user.name);

        // Reload state from API
        setEmail(user.email || '');
        setErrorMsg('');
        await loadUserSession(user.phone);
      } else {
        setErrorMsg(t('streak.error_recover_failed'));
      }
    } catch (_err) {
      setErrorMsg(t('streak.error_recover_failed'));
    }
  };

  const handleSwitchUser = () => {
    localStorage.removeItem('streak_phone');
    setPhone('');
    setName('');
    setFoundName(null);
    setSavedUser(null);
    setStreakCount(0);
    setHasCheckedInToday(false);
    setErrorMsg('');
    setJustCheckedIn(false);

    setTimeout(() => {
      phoneInputRef.current?.focus();
    }, 0);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setIsBouncing(true);
      setTimeout(() => setIsBouncing(false), 300);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
  if (!justCheckedIn) return;

  const timer = setTimeout(() => {
    setJustCheckedIn(false);
  }, 2500);

  return () => clearTimeout(timer);
}, [justCheckedIn]);

  return (
    <>
      <style>
        {`
          @keyframes gentleFloat {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-5px) scale(1.03); }
          }
          @keyframes attentionPulse {
            0% { transform: translateY(0) scale(1); }
            50% { transform: translateY(0) scale(1.12); }
            100% { transform: translateY(0) scale(1); }
          }
          @keyframes checkInSuccess {
            0% { transform: scale(1); }
            40% { transform: scale(1.25) rotate(5deg); }
            60% { transform: scale(1.15) rotate(-5deg); }
            80% { transform: scale(1.05) rotate(2deg); }
            100% { transform: scale(1) rotate(0deg); }
          }
          @keyframes modalPopIn {
            0% { opacity: 0; transform: scale(0.85) translateY(20px); }
            100% { opacity: 1; transform: scale(1) translateY(0); }
          }
          .animate-gentle-float {
            animation: gentleFloat 2s ease-in-out infinite;
          }
          .animate-attention-pulse {
            animation: attentionPulse 0.3s ease-in-out forwards;
          }
          .animate-checkin-success {
            animation: checkInSuccess 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          }
          .animate-modal-pop {
            animation: modalPopIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          }
        `}
      </style>

      <div 
        className="fixed bottom-[24px] right-[24px] z-[40] cursor-pointer"
        onClick={() => setIsOpen(true)}
      >
        <img 
          src={flameImg} 
          alt="Flame" 
          className={`w-[120px] h-[140px] object-contain origin-bottom hover:scale-110 transition-transform ${
            isBouncing ? 'animate-attention-pulse' : 'animate-gentle-float'
          }`}
        />
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-300">
          
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-6 md:p-8 max-w-sm w-full animate-modal-pop border-4 border-orange-100 flex flex-col items-center">
            
            <div className="text-4xl mb-2 flex justify-center gap-2">
              <span>👋</span><span>✨</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-orange-500 mb-6 text-center leading-tight">
              {t('streak.title')}
            </h2>
            
            <div className="w-full flex flex-col gap-4">
              {savedUser ? (
                <div className="flex flex-col items-center text-center w-full">
                  <p className="text-2xl font-bold text-orange-600 mb-2">
                    {t('streak.greeting_back', { name: savedUser.name || t('streak.greeting_default') })}
                  </p>
                  
                  {lostStreak && !hasCheckedInToday && (
                    <div className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm font-semibold mb-2 animate-modal-pop text-center w-full">
                      {t('streak.lost_streak_msg')}
                    </div>
                  )}

                  <div className="mb-6 flex flex-col items-center">
                    <span className="text-lg text-orange-800 font-medium">{t('streak.streak_label')}</span>
                    <span className={`text-5xl font-extrabold my-2 transition-all duration-300 ${getStreakColorClass(streakCount)} ${justCheckedIn ? 'animate-checkin-success' : ''}`}>
                      {streakCount} {t('streak.days')}
                    </span>
                    {getMilestoneMessage(streakCount) && (
                      <span className="text-sm font-bold text-orange-600 bg-orange-100 px-3 py-1 rounded-full mt-1 animate-modal-pop">
                        {getMilestoneMessage(streakCount)}
                      </span>
                    )}
                  </div>
                  
                  {hasCheckedInToday ? (
                    <div className="w-full bg-gray-100 text-green-600 font-extrabold text-xl py-4 rounded-[1.5rem] flex items-center justify-center animate-modal-pop shadow-inner">
                      {justCheckedIn ? t('streak.check_in_success') : t('streak.already_checked_in')}
                    </div>
                  ) : (
                    <button 
                      onClick={handleCheckIn}
                      disabled={loading} // ADDED
                      className={`w-full bg-gradient-to-b from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white font-extrabold text-xl py-4 rounded-[1.5rem] shadow-[0_6px_0_rgb(194,65,12)] hover:shadow-[0_4px_0_rgb(194,65,12)] hover:scale-105 active:scale-95 active:shadow-none transition-all duration-200 ${loading ? 'opacity-60 cursor-not-allowed' : ''}`} // UPDATED – dim when loading
                    >
                      {loading ? t('streak.loading') : t('streak.check_in_btn')} {/* UPDATED */}
                    </button>
                  )}
                  
                  <button 
                    onClick={handleSwitchUser}
                    className="w-full mt-3 bg-orange-100 text-orange-600 hover:bg-orange-200 font-bold text-lg py-3 rounded-[1.5rem] transition-colors"
                  >
                    {t('streak.switch_user')}
                  </button>
                </div>
              ) : (
                <>
                  {errorMsg && (
                    <div className="w-full text-center">
                      <p className="text-red-500 font-bold">{errorMsg}</p>
                    </div>
                  )}
                  <input 
                    ref={phoneInputRef}
                    type="tel" 
                    placeholder={t('streak.placeholder_phone')}
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (foundName) setFoundName(null);
                    }}
                    onBlur={handlePhoneBlur}
                    className="w-full bg-orange-50 border-2 border-orange-200 text-orange-800 placeholder-orange-400/80 rounded-2xl px-5 py-3 md:py-4 text-lg focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-200/50 transition-all font-bold"
                  />
                  {foundName ? (
                    <div className="w-full text-center py-2">
                      <p className="text-xl font-bold text-orange-600">
                        {t('streak.greeting_back', { name: foundName })}
                      </p>
                    </div>
                  ) : (
                    <input 
                      type="text" 
                      placeholder={t('streak.placeholder_name')}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-orange-50 border-2 border-orange-200 text-orange-800 placeholder-orange-400/80 rounded-2xl px-5 py-3 md:py-4 text-lg focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-200/50 transition-all font-bold"
                    />
                  )}
                  <input 
                    type="email" 
                    placeholder={t('streak.placeholder_email')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-orange-50 border-2 border-orange-200 text-orange-800 placeholder-orange-400/80 rounded-2xl px-5 py-3 md:py-4 text-lg focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-200/50 transition-all font-bold"
                  />
                  
                  <button 
                    onClick={handleStart}
                    className="mt-2 w-full bg-gradient-to-b from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white font-extrabold text-xl py-4 rounded-[1.5rem] shadow-[0_6px_0_rgb(194,65,12)] hover:shadow-[0_4px_0_rgb(194,65,12)] hover:scale-105 active:scale-95 active:shadow-none transition-all duration-200"
                  >
                    {t('streak.start_btn')}
                  </button>
                  <button 
                    onClick={handleRecover}
                    className="w-full mt-2 bg-blue-100 text-blue-600 hover:bg-blue-200 font-bold text-lg py-3 rounded-[1.5rem] transition-colors"
                  >
                    {t('streak.recover_btn')}
                  </button>
                </>
              )}
              
              <button 
                onClick={() => setIsOpen(false)}
                className="w-full mt-2 bg-transparent text-gray-400 hover:text-gray-600 font-bold text-lg py-3 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
              >
                {t('streak.close_btn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FlameButton;
