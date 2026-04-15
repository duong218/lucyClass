import React, { useState, useEffect } from 'react';
import flameImg from '../assets/flame.png';

const FlameButton = () => {
  const [isBouncing, setIsBouncing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [foundName, setFoundName] = useState(null);
  const [savedUser, setSavedUser] = useState(null);
  const [streakCount, setStreakCount] = useState(0);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const phoneInputRef = React.useRef(null);

  const getVietnamDateString = (offsetDays = 0) => {
    const now = new Date();
    const vn = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    vn.setHours(0, 0, 0, 0);
    if (offsetDays) vn.setDate(vn.getDate() + offsetDays);

    const yyyy = vn.getFullYear();
    const mm = String(vn.getMonth() + 1).padStart(2, '0');
    const dd = String(vn.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const loadUserSession = (targetPhone) => {
    const savedName = localStorage.getItem(`streak_name_${targetPhone}`);
    if (!savedName) return false;

    setSavedUser({ phone: targetPhone, name: savedName });

    const today = getVietnamDateString();
    const yesterday = getVietnamDateString(-1);

    let count = parseInt(localStorage.getItem(`streak_count_${targetPhone}`) || '0', 10);
    const lastDate = localStorage.getItem(`last_checkin_${targetPhone}`);

    if (lastDate === today) {
      setStreakCount(count);
      setHasCheckedInToday(true);
    } else if (lastDate === yesterday) {
      setStreakCount(count);
      setHasCheckedInToday(false);
    } else {
      // reset sạch
      count = 0;
      setStreakCount(0);
      setHasCheckedInToday(false);
      localStorage.setItem(`streak_count_${targetPhone}`, '0');
      localStorage.removeItem(`last_checkin_${targetPhone}`);
    }

    return true;
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

  const handleCheckIn = () => {
    if (!savedUser?.phone) return;

    const phoneToUse = savedUser.phone;
    const today = getVietnamDateString();
    const yesterday = getVietnamDateString(-1);

    const lastDate = localStorage.getItem(`last_checkin_${phoneToUse}`);

    // chặn check-in 2 lần
    if (lastDate === today) {
      setHasCheckedInToday(true);
      return;
    }

    let currentCount = parseInt(localStorage.getItem(`streak_count_${phoneToUse}`) || '0', 10);

    // mất streak → reset
    if (lastDate !== yesterday) {
      currentCount = 0;
    }

    const newCount = currentCount + 1;

    // sync tuyệt đối
    localStorage.setItem(`streak_count_${phoneToUse}`, newCount.toString());
    localStorage.setItem(`last_checkin_${phoneToUse}`, today);

    setStreakCount(newCount);
    setHasCheckedInToday(true);
  };

  const handleStart = () => {
    const formattedPhone = phone.trim();

    if (!formattedPhone) {
      setErrorMsg('Vui lòng nhập số điện thoại nhé! ✨');
      return;
    }

    const existingName = localStorage.getItem(`streak_name_${formattedPhone}`);

    if (!existingName && !name.trim()) {
      setErrorMsg('Vui lòng nhập tên của bạn nhé! ✨');
      return;
    }

    setErrorMsg('');
    localStorage.setItem('streak_phone', formattedPhone);

    if (existingName) {
      loadUserSession(formattedPhone);
    } else {
      const formattedName = name.trim();
      localStorage.setItem(`streak_name_${formattedPhone}`, formattedName);
      localStorage.setItem(`streak_count_${formattedPhone}`, '0');
      localStorage.removeItem(`last_checkin_${formattedPhone}`);

      setSavedUser({ phone: formattedPhone, name: formattedName });
      setStreakCount(0);
      setHasCheckedInToday(false);
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
          .animate-modal-pop {
            animation: modalPopIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          }
        `}
      </style>

      {/* Floating Flame Button */}
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

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-300">
          
          {/* Modal Content */}
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-6 md:p-8 max-w-sm w-full animate-modal-pop border-4 border-orange-100 flex flex-col items-center">
            
            {/* Header */}
            <div className="text-4xl mb-2 flex justify-center gap-2">
              <span>👋</span><span>✨</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-orange-500 mb-6 text-center leading-tight">
              🔥 Giữ chuỗi học tập
            </h2>
            
            {/* Conditional Form Inputs or Retuning User Greeting */}
            <div className="w-full flex flex-col gap-4">
              {savedUser ? (
                <div className="flex flex-col items-center text-center w-full">
                  <p className="text-2xl font-bold text-orange-600 mb-2">
                    👋 Chào {savedUser.name || 'bạn'}, bạn quay lại rồi!
                  </p>
                  <div className="mb-6 flex flex-col items-center">
                    <span className="text-lg text-orange-800 font-medium">🔥 Chuỗi của bạn:</span>
                    <span className="text-5xl font-extrabold text-orange-500 my-2 drop-shadow-md">
                      {streakCount} ngày
                    </span>
                  </div>
                  
                  {hasCheckedInToday ? (
                    <button 
                      disabled
                      className="w-full bg-gray-300 text-gray-500 font-extrabold text-xl py-4 rounded-[1.5rem] cursor-not-allowed"
                    >
                      ✅ Đã check-in hôm nay
                    </button>
                  ) : (
                    <button 
                      onClick={handleCheckIn}
                      className="w-full bg-gradient-to-b from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white font-extrabold text-xl py-4 rounded-[1.5rem] shadow-[0_6px_0_rgb(194,65,12)] hover:shadow-[0_4px_0_rgb(194,65,12)] hover:translate-y-[2px] active:translate-y-[6px] active:shadow-none transition-all"
                    >
                      🔥 Check-in hôm nay
                    </button>
                  )}
                  
                  <button 
                    onClick={handleSwitchUser}
                    className="w-full mt-3 bg-orange-100 text-orange-600 hover:bg-orange-200 font-bold text-lg py-3 rounded-[1.5rem] transition-colors"
                  >
                    🔄 Dùng số khác
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
                    placeholder="Nhập số điện thoại" 
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
                        👋 Chào {foundName}, bạn quay lại rồi!
                      </p>
                    </div>
                  ) : (
                    <input 
                      type="text" 
                      placeholder="Tên của bạn" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-orange-50 border-2 border-orange-200 text-orange-800 placeholder-orange-400/80 rounded-2xl px-5 py-3 md:py-4 text-lg focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-200/50 transition-all font-bold"
                    />
                  )}
                  <input 
                    type="email" 
                    placeholder="Email (không bắt buộc)" 
                    className="w-full bg-orange-50 border-2 border-orange-200 text-orange-800 placeholder-orange-400/80 rounded-2xl px-5 py-3 md:py-4 text-lg focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-200/50 transition-all font-bold"
                  />
                  
                  {/* Primary Action */}
                  <button 
                    onClick={handleStart}
                    className="mt-2 w-full bg-gradient-to-b from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white font-extrabold text-xl py-4 rounded-[1.5rem] shadow-[0_6px_0_rgb(194,65,12)] hover:shadow-[0_4px_0_rgb(194,65,12)] hover:translate-y-[2px] active:translate-y-[6px] active:shadow-none transition-all"
                  >
                    🔥 Bắt đầu giữ lửa
                  </button>
                </>
              )}
              
              {/* Close Button */}
              <button 
                onClick={() => setIsOpen(false)}
                className="w-full mt-2 bg-transparent text-gray-400 hover:text-gray-600 font-bold text-lg py-3 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FlameButton;
