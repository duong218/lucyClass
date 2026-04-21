import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import RecaptchaBox from '../components/RecaptchaBox';
import { useAuth, getDashboardPath } from '../contexts/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

const AdminLogin = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const recaptchaRef = useRef(null);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const { user, loading: authLoading, isInitialized } = useAuth();

  // Redirect nếu đã đăng nhập → đúng dashboard theo role
  useEffect(() => {
    if (isInitialized && !authLoading && user) {
      window.location.href = getDashboardPath(user.role);
    }
  }, [user, authLoading, isInitialized]);

  useEffect(() => {
    let animationFrameId;
    const handleMouseMove = (e) => {
      if (window.innerWidth < 768) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      animationFrameId = requestAnimationFrame(() => {
        setOffset({ x: x * -15, y: y * -15 });
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!captchaToken) {
      setError(t('form.captcha_required') || 'Please complete the reCAPTCHA');
      return;
    }
    setLoading(true);
    try {
      const loggedInUser = await login({
        username: username.trim(),
        password,
        captchaToken
      });
      // Redirect theo role
      window.location.href = getDashboardPath(loggedInUser?.role);
    } catch (err) {
      setError(err.response?.data?.message || err.message || t('admin.invalidCredentials'));
      if (recaptchaRef.current) {
        try { recaptchaRef.current.reset(); } catch (e) {}
      }
      setCaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 relative overflow-hidden">
      <div className="login-bg-wrapper" style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}>
        <img src="/bg-login.png" alt="Login Background" className="w-full h-full object-cover"
          onError={(e) => { e.target.style.display = 'none'; }} />
        <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px]"></div>
        <div className="absolute top-[20%] left-[10%] w-2 h-2 rounded-full bg-white animate-pulse-glow opacity-80"></div>
        <div className="absolute top-[40%] right-[15%] w-3 h-3 rounded-full bg-blue-100 animate-pulse-glow opacity-60"></div>
        <div className="absolute bottom-[25%] left-[30%] w-2.5 h-2.5 rounded-full bg-pink-100 animate-pulse-glow opacity-70"></div>
      </div>

      <div className="absolute top-10 left-10 text-5xl opacity-20 float-slow z-0">📚</div>
      <div className="absolute top-20 right-20 text-5xl opacity-20 float-medium z-0" style={{ animationDelay: '1s' }}>🎨</div>
      <div className="absolute bottom-20 left-20 text-5xl opacity-20 float-fast z-0" style={{ animationDelay: '0.5s' }}>🎵</div>
      <div className="absolute bottom-10 right-10 text-5xl opacity-20 float-slow z-0" style={{ animationDelay: '1.5s' }}>👩‍🏫</div>

      <div className="w-full max-w-md animate-fadeInUp flex flex-col items-center relative z-10">
        <div className="bg-white rounded-3xl shadow-2xl p-10 w-full">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-display text-gray-800 mb-1">Lucy's Class</h1>
            <p className="text-gray-500 text-sm">Đăng nhập hệ thống</p>
          </div>

          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              LC
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 px-4 py-3 rounded-xl mb-6">
            <p className="text-xs text-amber-700 font-medium leading-relaxed">
              ⚠️ Trang đăng nhập nội bộ — không dành cho học viên
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tên đăng nhập</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400">👤</span>
                <input
                  type="text" value={username} onChange={e => setUsername(e.target.value)} required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  placeholder="Nhập tên đăng nhập"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Mật khẩu</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400">🔒</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password} onChange={e => setPassword(e.target.value)} required
                  className="w-full pl-10 pr-10 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  placeholder="Mật khẩu"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <div className="relative w-5 h-5">
                    <EyeOff className={`w-5 h-5 absolute inset-0 transition-all duration-200 ${showPassword ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}/>
                    <Eye className={`w-5 h-5 absolute inset-0 transition-all duration-200 ${!showPassword ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}/>
                  </div>
                </button>
              </div>
              <div className="flex justify-end mt-1">
                <button type="button" onClick={() => navigate('/forgot-password')}
                  className="text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors">
                  Quên mật khẩu?
                </button>
              </div>
            </div>

            <RecaptchaBox ref={recaptchaRef} onVerify={setCaptchaToken} />

            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50 active:scale-95 shadow-md">
              {loading ? '⏳ Đang đăng nhập...' : 'Đăng nhập'}
            </button>

            {error && (
              <p className="text-red-500 text-center text-sm font-semibold">{error}</p>
            )}
          </form>

          <div className="mt-6 flex justify-center">
            <button onClick={() => navigate('/')}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors flex items-center gap-1 font-medium">
              ← Về trang chủ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;