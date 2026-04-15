import React, { useEffect, useState } from 'react';
import flameImg from '../assets/flame.png';
import {
  startStreak,
  fetchStreak,
  checkinStreak,
  clearStreakToken
} from '../services/streakService';

const getVietnamDateString = () => new Date().toLocaleDateString('en-CA', {
  timeZone: 'Asia/Ho_Chi_Minh'
});

const FlameButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');

  const [savedUser, setSavedUser] = useState(null);
  const [streakCount, setStreakCount] = useState(0);
  const [lastCheckin, setLastCheckin] = useState(null);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);

  const resetSessionState = () => {
    setSavedUser(null);
    setStreakCount(0);
    setLastCheckin(null);
    setHasCheckedInToday(false);
  };

  const applySessionData = (data) => {
    if (!data) {
      resetSessionState();
      return;
    }

    const normalizedName = (data.name || '').trim();
    const normalizedEmail = (data.email || '').trim();
    const normalizedCount = Number.isFinite(data.streakCount) ? data.streakCount : 0;
    const normalizedLastCheckin = data.lastCheckin || null;

    setSavedUser({
      name: normalizedName,
      email: normalizedEmail
    });
    setStreakCount(normalizedCount);
    setLastCheckin(normalizedLastCheckin);
    setHasCheckedInToday(normalizedLastCheckin === getVietnamDateString());
  };

  const loadSession = async () => {
    const token = localStorage.getItem('streak_token');
    if (!token) {
      resetSessionState();
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetchStreak();

      if (res.success && res.data) {
        applySessionData(res.data);
        return;
      }

      if (res.status === 401) {
        clearStreakToken();
        resetSessionState();
        return;
      }

      setErrorMsg(res.message || 'Không tải được phiên điểm danh.');
    } catch (_err) {
      setErrorMsg('Không tải được phiên điểm danh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsBouncing(true);
      setTimeout(() => setIsBouncing(false), 300);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleStart = async () => {
    const name = formName.trim();
    const email = formEmail.trim();

    if (!name) {
      setErrorMsg('Vui lòng nhập tên.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await startStreak({ name, email });

      if (res.success && res.data) {
        applySessionData(res.data);
        setFormName('');
        setFormEmail('');
        return;
      }

      setErrorMsg(res.message || 'Không thể bắt đầu streak.');
    } catch (_err) {
      setErrorMsg('Không thể bắt đầu streak.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!savedUser || loading) return;

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await checkinStreak();

      if (res.success && res.data) {
        // Update UI directly from API response without reloading.
        applySessionData(res.data);
        return;
      }

      if (res.status === 401) {
        clearStreakToken();
        resetSessionState();
        return;
      }

      setErrorMsg(res.message || 'Check-in thất bại.');
    } catch (_err) {
      setErrorMsg('Check-in thất bại.');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchUser = () => {
    clearStreakToken();
    resetSessionState();
    setFormName('');
    setFormEmail('');
    setErrorMsg('');
  };

  return (
    <>
      <div
        className="fixed bottom-[24px] right-[24px] z-[40] cursor-pointer"
        onClick={() => setIsOpen(true)}
      >
        <img
          src={flameImg}
          alt="Flame"
          className={`w-[120px] h-[140px] object-contain origin-bottom hover:scale-110 transition-transform ${
            isBouncing ? 'animate-bounce' : 'animate-pulse'
          }`}
        />
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative bg-white rounded-[2rem] shadow-2xl p-6 max-w-sm w-full border-4 border-orange-100">
            <h2 className="text-2xl font-extrabold text-orange-500 text-center mb-4">
              Học đều mỗi ngày
            </h2>

            {errorMsg && (
              <p className="text-red-500 text-sm font-semibold text-center mb-3">{errorMsg}</p>
            )}

            {savedUser ? (
              <div className="flex flex-col gap-3">
                <p className="text-lg font-bold text-orange-700 text-center">
                  {`Chào ${savedUser.name}, bạn quay lại rồi!`}
                </p>

                <div className="bg-orange-50 rounded-xl p-4 text-center">
                  <p className="text-orange-800 font-medium">Chuỗi hiện tại</p>
                  <p className="text-4xl font-extrabold text-orange-500 mt-1">{streakCount} ngày</p>
                  {lastCheckin && (
                    <p className="text-xs text-orange-600 mt-1">{`Lần check-in gần nhất: ${lastCheckin}`}</p>
                  )}
                </div>

                <button
                  onClick={handleCheckIn}
                  disabled={loading || hasCheckedInToday}
                  className={`w-full text-white font-bold py-3 rounded-xl transition ${
                    hasCheckedInToday
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-orange-500 hover:bg-orange-600'
                  } ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {hasCheckedInToday ? 'Bạn đã check-in hôm nay' : (loading ? 'Đang xử lý...' : 'Check-in hôm nay')}
                </button>

                <button
                  onClick={handleSwitchUser}
                  className="w-full bg-orange-100 text-orange-700 hover:bg-orange-200 font-bold py-3 rounded-xl transition"
                >
                  Dùng số khác
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="Tên của bạn"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-orange-50 border-2 border-orange-200 text-orange-800 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-400"
                />
                <input
                  type="email"
                  placeholder="Email (không bắt buộc)"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full bg-orange-50 border-2 border-orange-200 text-orange-800 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-400"
                />
                <button
                  onClick={handleStart}
                  disabled={loading}
                  className={`w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition ${
                    loading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? 'Đang xử lý...' : 'Bắt đầu streak'}
                </button>
              </div>
            )}

            <button
              onClick={() => setIsOpen(false)}
              className="w-full mt-4 bg-transparent text-gray-500 hover:text-gray-700 font-semibold py-2"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default FlameButton;
