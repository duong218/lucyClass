import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { fetchCsrfToken } from '../services/api';
import RecaptchaBox from '../components/RecaptchaBox';

const ForgotPassword = () => {
  const navigate = useNavigate();

  // 'admin' hoặc 'staff'
  const [accountType, setAccountType] = useState('admin');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const recaptchaRef = useRef(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const emailRef = useRef(null);

  // Auto-clear messages after 5 seconds
  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => { setMessage(''); setError(''); }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, error]);

  const handleTabChange = (type) => {
    setAccountType(type);
    setError('');
    setMessage('');
    setUsername('');
    setEmail('');
    if (recaptchaRef.current) { try { recaptchaRef.current.reset(); } catch (_) {} }
    setCaptchaToken(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!captchaToken) {
      setError('Hệ thống bảo mật chưa sẵn sàng hoặc bạn chưa xác minh captcha');
      return;
    }
    if (accountType === 'staff' && !username.trim()) {
      setError('Vui lòng nhập tên đăng nhập');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      await fetchCsrfToken();

      const payload = { email, recaptchaToken: captchaToken };
      if (accountType === 'staff') payload.username = username.trim();

      const res = await api.post('/auth/forgot-password', payload);
      if (res.data.success) {
        setMessage('Kiểm tra email của bạn để lấy liên kết khôi phục! (Có thể mất vài phút)');
      }
    } catch (err) {
      const serverMsg = err.response?.data?.message || err.message;
      if (serverMsg?.includes('chưa có email')) {
        setError('❌ ' + serverMsg);
      } else {
        setError(serverMsg || 'Có lỗi xảy ra, vui lòng thử lại sau');
      }
      emailRef.current?.focus();
    } finally {
      setLoading(false);
      if (recaptchaRef.current) { try { recaptchaRef.current.reset(); } catch (_) {} }
      setCaptchaToken(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 relative overflow-hidden font-display">
      {/* Decorative — giữ nguyên style gốc */}
      <div className="absolute top-10 left-10 text-5xl opacity-20 animate-float">📚</div>
      <div className="absolute top-20 right-20 text-5xl opacity-20 animate-float" style={{ animationDelay: '1s' }}>🎨</div>

      <div className="w-full max-w-md animate-fadeInUp flex flex-col items-center">
        <button
          onClick={() => navigate('/admin/login')}
          className="mb-6 text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors flex items-center gap-1 font-bold group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span> Quay lại đăng nhập
        </button>

        <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-10 w-full relative z-10 border border-white/50 backdrop-blur-sm">
          <div className="text-center mb-6">
            <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-bounce">
              <span className="text-3xl">🔑</span>
            </div>
            <h1 className="text-3xl font-black text-gray-800 mb-2 tracking-tight">Quên mật khẩu?</h1>
            <p className="text-gray-500 text-sm leading-relaxed px-4">
              Nhập thông tin tài khoản để nhận liên kết khôi phục.
            </p>
          </div>

          {/* Tab chọn loại tài khoản */}
          <div className="flex rounded-2xl overflow-hidden border-2 border-gray-100 mb-6 bg-gray-50 p-1 gap-1">
            <button
              type="button"
              onClick={() => handleTabChange('admin')}
              className={`flex-1 py-2.5 text-sm font-black transition-all rounded-xl ${
                accountType === 'admin'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              👑 Admin
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('staff')}
              className={`flex-1 py-2.5 text-sm font-black transition-all rounded-xl ${
                accountType === 'staff'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              👤 GV / Marketing
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Username — chỉ hiện cho staff */}
            {accountType === 'staff' && (
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                  Tên đăng nhập
                </label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required={accountType === 'staff'}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-100 bg-gray-50/50 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all outline-none text-gray-700 font-medium"
                    placeholder="LC12345678"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1.5 ml-1">
                  Tên đăng nhập dạng LC + 8 số, do admin cung cấp
                </p>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                {accountType === 'admin' ? 'Email Quản trị' : 'Email của bạn'}
              </label>
              <div className="relative group">
                <span className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${error ? 'text-red-400' : 'text-gray-400 group-focus-within:text-blue-500'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"/>
                  </svg>
                </span>
                <input
                  ref={emailRef}
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className={`w-full pl-12 pr-4 py-4 rounded-2xl border-2 transition-all outline-none text-gray-700 font-medium
                    ${error
                      ? 'border-red-200 bg-red-50/30 focus:border-red-400 focus:ring-4 focus:ring-red-100'
                      : 'border-gray-100 bg-gray-50/50 focus:border-blue-400 focus:ring-4 focus:ring-blue-50'}`}
                  placeholder={accountType === 'admin' ? 'admin@example.com' : 'email@example.com'}
                />
              </div>
              {accountType === 'staff' && (
                <p className="text-xs text-amber-600 mt-1.5 ml-1 font-medium">
                  ⚠️ Nếu chưa có email, liên hệ admin để được bổ sung
                </p>
              )}
            </div>

            {/* reCAPTCHA */}
            <RecaptchaBox ref={recaptchaRef} onVerify={setCaptchaToken} />

            <button
              type="submit"
              disabled={loading || !captchaToken}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-2xl font-black text-lg hover:shadow-[0_10px_20px_rgba(37,99,235,0.3)] transition-all disabled:opacity-70 active:scale-95 shadow-lg flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  <span>Đang gửi yêu cầu...</span>
                </>
              ) : 'Gửi link khôi phục'}
            </button>

            {message && (
              <div className="animate-fadeIn bg-green-50 p-4 rounded-2xl border border-green-200 flex items-start gap-3 shadow-sm">
                <span className="text-xl">✅</span>
                <p className="text-green-800 text-sm font-bold leading-tight mt-0.5">{message}</p>
              </div>
            )}
            {error && (
              <div className="animate-fadeIn bg-red-50 p-4 rounded-2xl border border-red-200 flex items-start gap-3 shadow-sm">
                <span className="text-xl">❌</span>
                <p className="text-red-800 text-sm font-bold leading-tight mt-0.5">
                  {error.includes('❌') ? error.replace('❌ ', '') : error}
                </p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
