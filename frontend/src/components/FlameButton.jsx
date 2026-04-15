import React, { useEffect, useState, useCallback, useRef } from 'react';
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
   * UI Milestone logic
   */
  const getMilestoneStyles = (count) => {
    if (count >= 100) return { color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', btn: 'bg-purple-500 hover:bg-purple-600', shadow: 'shadow-purple-200', sparkle: true };
    if (count >= 30) return { color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', btn: 'bg-red-500 hover:bg-red-600', shadow: 'shadow-red-200' };
    if (count >= 7) return { color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200', btn: 'bg-blue-500 hover:bg-blue-600', shadow: 'shadow-blue-200' };
    if (count >= 3) return { color: 'text-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-200', btn: 'bg-yellow-500 hover:bg-yellow-600', shadow: 'shadow-yellow-200' };
    return { color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200', btn: 'bg-orange-500 hover:bg-orange-600', shadow: 'shadow-orange-200' };
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
      
      // Only update if this is still the latest request
      if (requestId === lookupRequestIdRef.current) {
        if (res.success && res.data) {
          setUserData(res.data);
          setName(res.data.name);
          setEmail(res.data.email || '');
          setIsExistingUser(true);
          if (res.streakExpired) {
            setErrorMsg('Chuỗi của bạn đã bị mất do không hoạt động quá lâu 😢 Nhấn "Bắt đầu lại" để tiếp tục');
          }
        } else {
          // New user or error
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
  }, []);

  // Daily Reset Check
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

  // Initial load
  useEffect(() => {
    if (savedPhone) {
      loadUser(savedPhone);
    }
  }, [savedPhone, loadUser]);

  // Debounced auto-fill
  useEffect(() => {
    if (!savedPhone && isValidPhone(phone)) {
      const timer = setTimeout(() => {
        loadUser(phone);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [phone, savedPhone, loadUser]);

  // Bounce animation
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
      setErrorMsg('Số điện thoại không hợp lệ (10 chữ số, bắt đầu bằng 03, 05, 07, 08 hoặc 09)');
      return;
    }
    if (!name) {
      setErrorMsg('Vui lòng nhập Tên');
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
      setErrorMsg(res.message || 'Lỗi khi bắt đầu streak');
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
      setErrorMsg(res.message || 'Check-in thất bại');
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
      setErrorMsg(res.message || 'Cứu streak thất bại');
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
  const yesterday = getVNDate(-1);
  const twoDaysAgo = getVNDate(-2);
  
  const hasCheckedInToday = userData?.lastCheckin === today;
  const missedYesterday = userData?.lastCheckin === twoDaysAgo;
  const canRevive = missedYesterday && !userData?.reviveUsed;
  const hasMultipleMissed = userData?.lastCheckin && userData.lastCheckin !== today && userData.lastCheckin !== yesterday && userData.lastCheckin !== twoDaysAgo;

  return (
    <>
      <div
        className="fixed bottom-[24px] right-[24px] z-[40] cursor-pointer group"
        onClick={() => setIsOpen(true)}
      >
        <img
          src={flameImg}
          alt="Flame"
          className={`w-[110px] h-[130px] object-contain origin-bottom transition-transform group-hover:scale-110 ${
            isBouncing ? 'animate-bounce' : 'animate-pulse'
          }`}
        />
        {userData?.streakCount > 0 && (
          <div className={`absolute top-1 right-1 ${styles.bg} ${styles.color} font-bold px-2 py-0.5 rounded-full text-xs border ${styles.border} shadow-sm`}>
            {userData.streakCount}
          </div>
        )}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}>
          <div className={`relative bg-white rounded-[2rem] shadow-2xl p-6 max-w-sm w-full border-4 ${styles.border} transition-all duration-500 overflow-hidden`}>
            
            {/* Sparkle effects for 100+ days */}
            {styles.sparkle && (
              <div className="absolute inset-0 pointer-events-none opacity-50">
                <div className="animate-ping absolute top-4 left-4 w-2 h-2 bg-purple-400 rounded-full"></div>
                <div className="animate-ping absolute top-10 right-10 w-3 h-3 bg-purple-300 rounded-full delay-75"></div>
                <div className="animate-ping absolute bottom-10 left-1/3 w-2 h-2 bg-purple-500 rounded-full delay-150"></div>
              </div>
            )}

            <h2 className={`text-2xl font-extrabold ${styles.color} text-center mb-4 uppercase tracking-tight`}>
              Học đều mỗi ngày
            </h2>

            {errorMsg && (
              <p className="text-red-500 text-sm font-semibold text-center mb-4 bg-red-50 p-2.5 rounded-xl border border-red-100">{errorMsg}</p>
            )}

            {savedPhone && userData ? (
              <div className="flex flex-col gap-4">
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-700">
                    Chào <span className={styles.color}>{userData.name}</span>!
                  </p>
                </div>

                <div className={`${styles.bg} rounded-[2.5rem] p-8 text-center border-2 border-dashed ${styles.border} relative overflow-hidden group/card`}>
                  <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-1">Chuỗi hiện tại</p>
                  <div className="relative inline-block">
                    <p className={`text-6xl font-black ${styles.color} transition-transform group-hover/card:scale-110 duration-300`}>
                      {userData.streakCount}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 uppercase tracking-widest font-bold">Ngày học tập</p>
                </div>

                {canRevive && (
                  <div className="bg-red-50 border border-red-100 rounded-2xl p-3 text-center">
                    <p className="text-red-600 text-[13px] font-bold">
                      ⚠️ Bạn đã bỏ lỡ ngày hôm qua!
                    </p>
                    <p className="text-red-400 text-[11px] font-medium mt-0.5">
                      Check-in thường sẽ làm mất chuỗi hiện tại.
                    </p>
                  </div>
                )}

                {hasMultipleMissed && (
                  <div className="bg-orange-50 border border-orange-100 rounded-2xl p-3 text-center">
                    <p className="text-orange-600 text-[13px] font-bold">
                      💔 Chuỗi của bạn đã bị ngắt...
                    </p>
                    <p className="text-orange-400 text-[11px] font-medium mt-0.5">
                      Bắt đầu lại từ hôm nay nhé!
                    </p>
                  </div>
                )}

                <div className="flex flex-col gap-2.5">
                  {canRevive ? (
                    <button
                      onClick={handleRevive}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-red-100 active:scale-95 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        'ĐANG CỨU...'
                      ) : (
                        <>
                          <span>CỨU STREAK NGAY</span>
                          <span className="bg-white/20 px-2 py-0.5 rounded-lg text-xs">🆘</span>
                        </>
                      )}
                    </button>
                  ) : null}

                  <button
                    onClick={() => handleCheckIn()}
                    disabled={loading || hasCheckedInToday}
                    className={`w-full text-white font-black py-4 rounded-2xl transition-all shadow-lg active:scale-95 ${
                      hasCheckedInToday
                        ? 'bg-gray-100 text-gray-300 shadow-none cursor-not-allowed border-2 border-gray-50'
                        : `${styles.btn} ${styles.shadow}`
                    } ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {hasCheckedInToday ? (
                      <span className="flex items-center justify-center gap-2">
                        <span>ĐÃ GIỮ LỬA HÔM NAY</span>
                        <span className="text-lg">✓</span>
                      </span>
                    ) : (
                      loading ? 'ĐANG XỬ LÝ...' : (canRevive ? 'BỎ QUA & CHECK-IN (RESET)' : 'GIỮ LỬA NGAY 🔥')
                    )}
                  </button>

                  <button
                    onClick={handleSwitchUser}
                    className="w-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-500 font-bold py-3 rounded-2xl transition-all text-xs uppercase tracking-widest mt-2"
                  >
                    Đổi số điện thoại
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 ml-3 uppercase tracking-widest">Số điện thoại</label>
                  <input
                    type="tel"
                    placeholder="0xxxxxxxxx"
                    value={phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setPhone(val);
                      // Reactive Reset: If phone becomes invalid, immediately clear lookup state
                      if (!isValidPhone(val)) {
                        lookupRequestIdRef.current++; // Cancel any pending lookups
                        setIsExistingUser(false);
                        setLoadingUser(false);
                        setName('');
                        setEmail('');
                      }
                    }}
                    className="w-full bg-gray-50 border-2 border-transparent text-gray-800 rounded-2xl px-5 py-4 focus:outline-none focus:border-orange-200 focus:bg-white transition-all shadow-inner"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 ml-3 uppercase tracking-widest">Họ và Tên</label>
                  {loadingUser ? (
                    <div className="w-full bg-gray-50 text-gray-400 rounded-2xl px-5 py-4 italic text-sm animate-pulse flex items-center gap-2">
                       <span className="w-4 h-4 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin"></span>
                       Đang kiểm tra...
                    </div>
                  ) : isExistingUser ? (
                    <div className="w-full bg-orange-50/50 border-2 border-orange-100 text-gray-800 rounded-2xl px-5 py-4 flex flex-col">
                      <span className="font-bold text-lg">{name}</span>
                      <span className="text-[9px] text-orange-400 font-bold uppercase tracking-wider mt-0.5">
                        Tên đã được đăng ký, không thể thay đổi 🔒
                      </span>
                    </div>
                  ) : (
                    <input
                      type="text"
                      placeholder="Tên của bạn"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-gray-50 border-2 border-transparent text-gray-800 rounded-2xl px-5 py-4 focus:outline-none focus:border-orange-200 focus:bg-white transition-all shadow-inner"
                    />
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 ml-3 uppercase tracking-widest">Email (Không bắt buộc)</label>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-50 border-2 border-transparent text-gray-800 rounded-2xl px-5 py-4 focus:outline-none focus:border-orange-200 focus:bg-white transition-all shadow-inner"
                  />
                </div>
                <button
                  onClick={handleStart}
                  disabled={loading}
                  className={`w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-5 rounded-[1.5rem] transition-all shadow-xl shadow-orange-100 active:scale-95 mt-2 uppercase tracking-widest ${
                    loading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? 'ĐANG KHỞI TẠO...' : 'BẮT ĐẦU GIỮ LỬA'}
                </button>
              </div>
            )}

            <button
              onClick={() => setIsOpen(false)}
              className="w-full mt-6 text-gray-300 hover:text-gray-500 font-bold py-2 transition-colors text-[10px] uppercase tracking-[0.2em]"
            >
              Thu nhỏ
            </button>
          </div>
        </div>
      )}

      {/* Revive Modal */}
      {isReviveModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-xs w-full shadow-2xl animate-in zoom-in duration-300 border-4 border-orange-100">
            <div className="text-center">
              <span className="text-5xl mb-4 block">😢</span>
              <h3 className="text-xl font-black text-gray-800 mb-2">Bỏ lỡ mất rồi!</h3>
              <p className="text-gray-500 font-medium text-sm leading-relaxed mb-8">
                Bạn đã bỏ lỡ <span className="text-orange-500 font-bold text-lg">{reviveMissedDays}</span> ngày học tập. 
                Bạn có muốn khôi phục chuỗi không?
              </p>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleRevive}
                  disabled={loading}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-orange-100 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? 'ĐANG XỬ LÝ...' : (
                    <>
                      <span>🔥 KHÔI PHỤC</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleCheckIn(true)}
                  disabled={loading}
                  className="w-full bg-gray-50 hover:bg-gray-100 text-gray-400 font-bold py-4 rounded-2xl active:scale-95 transition-all text-xs uppercase"
                >
                  Bỏ qua & bắt đầu lại
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
