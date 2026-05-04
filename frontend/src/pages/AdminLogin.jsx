import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useRecaptcha } from '../components/RecaptchaProvider';
import { useAuth, getDashboardPath } from '../contexts/AuthContext';
import {
  Eye,
  EyeOff,
  User,
  Lock,
  ShieldAlert,
  ArrowLeft,
  LogIn,
  Loader2,
} from 'lucide-react';

const AdminLogin = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const { executeRecaptcha } = useRecaptcha();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading, isInitialized } = useAuth();

  useEffect(() => {
    if (isInitialized && !authLoading && user) {
      window.location.href = getDashboardPath(user.role);
    }
  }, [user, authLoading, isInitialized]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const captchaToken = await executeRecaptcha('login');
      if (!captchaToken) {
        setError(t('form.captcha_required') || 'Hệ thống bảo mật chưa sẵn sàng, vui lòng thử lại');
        setLoading(false);
        return;
      }
      const loggedInUser = await login({
        username: username.trim(),
        password,
        captchaToken,
      });
      window.location.href = getDashboardPath(loggedInUser?.role);
    } catch (err) {
      setError(err.response?.data?.message || err.message || t('admin.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden" style={{ background: '#f0f7f5' }}>

      {/* ── LEFT PANEL ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[45%] relative overflow-hidden p-12"
        style={{ background: 'linear-gradient(160deg, #1C695C 0%, #1C6970 60%, #134d45 100%)' }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #3FA48F, transparent)' }} />
        <div className="absolute -bottom-32 -right-20 w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #1C6970, transparent)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #3FA48F, transparent)' }} />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />

        {/* Top: Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white/20 shadow-lg">
              <img src="/logo.jpeg" alt="Lucy Class" className="w-full h-full object-cover"
                onError={e => e.target.style.display = 'none'} />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-white font-black text-2xl tracking-widest uppercase"
                  style={{ fontFamily: "'Nunito', system-ui, sans-serif", textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                  LUCY
                </span>
                <span className="text-white/60 font-black text-sm tracking-widest uppercase"
                  style={{ fontFamily: "'Nunito', system-ui, sans-serif" }}>
                  CLASS
                </span>
              </div>
              <p className="text-white/50 text-[10px] tracking-widest uppercase font-semibold">
                Teach from the heart, learn from the joy
              </p>
            </div>
          </div>
        </div>

        {/* Center: Main visual */}
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 py-10">
          {/* Big LC monogram */}
          <div className="relative mb-8">
            <div className="w-40 h-40 rounded-[2.5rem] overflow-hidden shadow-2xl"
              style={{ border: '2px solid rgba(255,255,255,0.2)' }}>
              <img
                src="/logo.jpeg"
                alt="Lucy Class"
                className="w-full h-full object-cover"
                onError={e => {
                  e.target.style.display = 'none';
                  e.target.parentElement.style.background = 'rgba(255,255,255,0.12)';
                  e.target.parentElement.style.backdropFilter = 'blur(10px)';
                  e.target.parentElement.innerHTML += '<span style="color:white;font-size:3.75rem;font-weight:900;font-family:Nunito,system-ui">LC</span>';
                }}
              />
            </div>
            {/* Floating accent dots */}
            <div className="absolute -top-3 -right-3 w-5 h-5 rounded-full bg-amber-400 shadow-lg animate-bounce" style={{ animationDuration: '2s' }} />
            <div className="absolute -bottom-2 -left-4 w-3.5 h-3.5 rounded-full shadow-lg animate-bounce" style={{ background: '#3FA48F', animationDuration: '2.5s', animationDelay: '0.5s' }} />
          </div>

          <h2 className="text-white text-3xl font-black text-center leading-tight mb-3"
            style={{ fontFamily: "'Nunito', system-ui, sans-serif", textShadow: '0 2px 12px rgba(0,0,0,0.2)' }}>
            Hệ thống<br />quản trị nội bộ
          </h2>
          <p className="text-white/60 text-sm text-center font-medium max-w-xs leading-relaxed">
            Dành cho admin, giáo viên và nhân viên marketing của Lucy Class
          </p>
        </div>

        {/* Bottom: Stats decorative */}
        <div className="relative z-10 grid grid-cols-3 gap-3">
          {[
            { label: 'Khóa học', value: '10+' },
            { label: 'Giáo viên', value: '5+' },
            { label: 'Học viên', value: '200+' },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-2xl p-3 text-center"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <p className="text-white font-black text-xl" style={{ fontFamily: "'Nunito', system-ui" }}>{value}</p>
              <p className="text-white/50 text-[10px] font-semibold uppercase tracking-wider mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-200">
              <img src="/logo.jpeg" alt="Lucy Class" className="w-full h-full object-cover"
                onError={e => e.target.style.display = 'none'} />
            </div>
            <span className="font-black text-xl tracking-widest uppercase"
              style={{ fontFamily: "'Nunito', system-ui", color: '#1C695C' }}>
              LUCY CLASS
            </span>
          </div>

          {/* Card */}
          <div className="bg-white rounded-3xl shadow-xl p-8 lg:p-10"
            style={{ boxShadow: '0 20px 60px rgba(28, 105, 92, 0.12), 0 4px 16px rgba(0,0,0,0.06)' }}>

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-black text-gray-900 mb-1"
                style={{ fontFamily: "'Nunito', system-ui, sans-serif" }}>
                Đăng nhập
              </h1>
              <p className="text-gray-400 text-sm font-medium">Nhập thông tin tài khoản nội bộ của bạn</p>
            </div>

            {/* Warning banner */}
            <div className="flex items-start gap-3 rounded-2xl p-3.5 mb-6"
              style={{ background: 'rgba(217, 154, 65, 0.08)', border: '1px solid rgba(217, 154, 65, 0.25)' }}>
              <ShieldAlert size={16} className="shrink-0 mt-0.5" style={{ color: '#C96A3D' }} />
              <p className="text-xs font-semibold leading-relaxed" style={{ color: '#C96A3D' }}>
                Trang đăng nhập nội bộ — không dành cho học viên
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Tên đăng nhập
                </label>
                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200"
                    style={{ color: username ? '#1C695C' : '#9ca3af' }}>
                    <User size={17} strokeWidth={2} />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm font-semibold text-gray-800 outline-none transition-all duration-200"
                    style={{
                      background: '#f8fafb',
                      border: '2px solid',
                      borderColor: username ? '#1C695C' : '#e5e7eb',
                    }}
                    placeholder="Nhập tên đăng nhập"
                    onFocus={e => e.target.style.borderColor = '#1C695C'}
                    onBlur={e => e.target.style.borderColor = username ? '#1C695C' : '#e5e7eb'}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Mật khẩu
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200"
                    style={{ color: password ? '#1C695C' : '#9ca3af' }}>
                    <Lock size={17} strokeWidth={2} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="w-full pl-11 pr-12 py-3.5 rounded-2xl text-sm font-semibold text-gray-800 outline-none transition-all duration-200"
                    style={{
                      background: '#f8fafb',
                      border: '2px solid',
                      borderColor: password ? '#1C695C' : '#e5e7eb',
                    }}
                    placeholder="Mật khẩu"
                    onFocus={e => e.target.style.borderColor = '#1C695C'}
                    onBlur={e => e.target.style.borderColor = password ? '#1C695C' : '#e5e7eb'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors hover:bg-gray-100"
                    style={{ color: '#9ca3af' }}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="text-xs font-semibold transition-colors hover:underline"
                    style={{ color: '#1C695C' }}
                  >
                    Quên mật khẩu?
                  </button>
                </div>
              </div>

              {/* reCAPTCHA v3 — invisible, no UI needed */}

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 rounded-2xl px-4 py-3"
                  style={{ background: 'rgba(201, 106, 61, 0.08)', border: '1px solid rgba(201, 106, 61, 0.2)' }}>
                  <ShieldAlert size={15} style={{ color: '#C96A3D' }} className="shrink-0" />
                  <p className="text-sm font-semibold" style={{ color: '#C96A3D' }}>{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl font-black text-white text-sm flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                style={{
                  background: loading ? '#3FA48F' : 'linear-gradient(135deg, #1C695C 0%, #1C6970 100%)',
                  boxShadow: loading ? 'none' : '0 8px 24px rgba(28, 105, 92, 0.35)',
                  fontFamily: "'Nunito', system-ui",
                  fontSize: '15px',
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Đang đăng nhập...
                  </>
                ) : (
                  <>
                    <LogIn size={18} />
                    Đăng nhập
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Back to home */}
          <div className="flex justify-center mt-6">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-80"
              style={{ color: '#1C695C' }}
            >
              <ArrowLeft size={15} />
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
