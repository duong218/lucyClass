import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import RecaptchaBox from '../components/RecaptchaBox';
import { useAuth } from '../contexts/AuthContext';
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

  // Redirect if already authenticated
  useEffect(() => {
    if (isInitialized && !authLoading && user) {
      console.log('[AdminLogin] User confirmed authenticated, redirecting to /admin');
      navigate('/admin');
    }
  }, [user, authLoading, isInitialized, navigate]);

  useEffect(() => {
    let animationFrameId;

    const handleMouseMove = (e) => {
      // Disable parallax on mobile screens
      if (window.innerWidth < 768) return;

      // Calculate relative mouse position (normalized from -1 to 1)
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;

      // Max movement of 15px
      animationFrameId = requestAnimationFrame(() => {
        setOffset({
          x: x * -15,
          y: y * -15
        });
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
    await login({
      username: username.trim(),
      password,
      captchaToken
    });


    // ✅ Redirect chuẩn
    window.location.href = '/admin';
  } catch (err) {
    console.error('Login failed:', err);
    setError(err.response?.data?.message || t('admin.invalidCredentials'));

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
      {/* Parallax Background Wrapper */}
      <div 
        className="login-bg-wrapper"
        style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
      >
        <img 
          src="/bg-login.png" 
          alt="Login Background" 
          className="w-full h-full object-cover"
          onError={(e) => { e.target.style.display = 'none'; }} 
        />
        {/* Subtle overlay to ensure UI contrast without washing out the colorful background */}
        <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px]"></div>
        
        {/* Bonus: Subtle Glowing Particles */}
        <div className="absolute top-[20%] left-[10%] w-2 h-2 rounded-full bg-white animate-pulse-glow opacity-80"></div>
        <div className="absolute top-[40%] right-[15%] w-3 h-3 rounded-full bg-blue-100 animate-pulse-glow opacity-60"></div>
        <div className="absolute bottom-[25%] left-[30%] w-2.5 h-2.5 rounded-full bg-pink-100 animate-pulse-glow opacity-70"></div>
        <div className="absolute bottom-[35%] right-[20%] w-1.5 h-1.5 rounded-full bg-white animate-pulse-glow opacity-90"></div>
        <div className="absolute top-[60%] left-[5%] w-2 h-2 rounded-full bg-white animate-pulse-glow opacity-75"></div>
        <div className="absolute top-[10%] right-[40%] w-2.5 h-2.5 rounded-full bg-purple-100 animate-pulse-glow opacity-60"></div>
      </div>

      {/* Decorative Floating Elements */}
      <div className="absolute top-10 left-10 text-5xl opacity-20 float-slow z-0">📚</div>
      <div className="absolute top-20 right-20 text-5xl opacity-20 float-medium z-0" style={{ animationDelay: '1s' }}>🎨</div>
      <div className="absolute bottom-20 left-20 text-5xl opacity-20 float-fast z-0" style={{ animationDelay: '0.5s' }}>🎵</div>
      <div className="absolute bottom-10 right-10 text-5xl opacity-20 float-slow z-0" style={{ animationDelay: '1.5s' }}>👩‍🏫</div>

      <div className="w-full max-w-md animate-fadeInUp flex flex-col items-center relative z-10">

        <div className="bg-white rounded-3xl shadow-2xl p-10 w-full relative z-10">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-display text-gray-800 mb-1">Lucy's Class Admin</h1>
            <p className="text-gray-500 text-sm lowercase">{t("admin_panel")}</p>
          </div>

          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              A
            </div>
          </div>

          {/* Security Warning */}
          <div className="bg-red-50 border border-red-200 px-4 py-3 rounded-xl mb-6 shadow-sm">
            <p className="text-xs text-red-600 font-medium leading-relaxed">
              ⚠️ {t("admin_warning")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{t("admin.username")}</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400">👤</span>
                <input
                  type="text" value={username} onChange={e => setUsername(e.target.value)} required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  placeholder={t("admin.username")}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{t("admin.password")}</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400">🔒</span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-10 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  placeholder={t("admin.password") || "Mật khẩu"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none transition-all duration-200 ease-in-out"
                >
                  <div className="relative w-5 h-5">
                    <EyeOff 
                      className={`w-5 h-5 absolute inset-0 transition-all duration-200 ease-in-out transform ${showPassword ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
                    />
                    <Eye 
                      className={`w-5 h-5 absolute inset-0 transition-all duration-200 ease-in-out transform ${!showPassword ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
                    />
                  </div>
                </button>
              </div>
              <div className="flex justify-end mt-1">
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors"
                >
                  Quên mật khẩu?
                </button>
              </div>
            </div>

            {/* Google reCAPTCHA */}
            <RecaptchaBox ref={recaptchaRef} onVerify={setCaptchaToken} />

            <button
              type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50 active:scale-95 shadow-md"
            >
              {loading ? '⏳...' : t("admin.login")}
            </button>

            {error && (
              <p className="text-red-500 text-center text-sm font-semibold animate-fadeInUp">{error}</p>
            )}
          </form>

          {/* Back to Home Button */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => navigate('/')}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors flex items-center gap-1 font-medium"
            >
              ← {t("back_home")}
            </button>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">{t("admin.adminAccess")}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
