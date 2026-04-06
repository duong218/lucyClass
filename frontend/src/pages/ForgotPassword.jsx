import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { fetchCsrfToken } from '../services/api';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaReady, setCaptchaReady] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const emailRef = useRef(null); // Ref for input focus
  const captchaRef = useRef(null);
  const widgetId = useRef(null);

  // Auto-clear messages after 5 seconds
  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage('');
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, error]);

  // Manual reCAPTCHA rendering to avoid "No reCAPTCHA clients exist"
  useEffect(() => {
    let timeoutId;
    const initCaptcha = () => {
      if (window.grecaptcha && window.grecaptcha.render) {
        if (captchaRef.current && widgetId.current === null) {
          try {
            widgetId.current = window.grecaptcha.render(captchaRef.current, {
              sitekey: import.meta.env.VITE_RECAPTCHA_SITE_KEY,
              callback: () => setCaptchaReady(true),
              'expired-callback': () => setCaptchaReady(false)
            });
          } catch (e) {
            console.warn("reCAPTCHA rendering skipped or failed:", e);
          }
        }
      } else {
        timeoutId = setTimeout(initCaptcha, 500);
      }
    };

    initCaptcha();
    return () => clearTimeout(timeoutId);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(`[Frontend] Gửi yêu cầu đặt lại mật khẩu cho: ${email}`);

    // Verify grecaptcha is ready + widget exists
    if (!window.grecaptcha || widgetId.current === null) {
      setError('Hệ thống bảo mật chưa sẵn sàng, vui lòng đợi trong giây lát');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    // Safety delay before getResponse (300ms)
    await new Promise(resolve => setTimeout(resolve, 300));

    // Get reCAPTCHA token using specific widgetId
    const recaptchaToken = window.grecaptcha.getResponse(widgetId.current);
    if (!recaptchaToken) {
      setError('Vui lòng xác minh reCAPTCHA');
      setLoading(false);
      return;
    }

    try {
      // Step 1: Fetch CSRF Token
      await fetchCsrfToken();

      // Step 2: Call protected API
      const res = await api.post('/auth/forgot-password', { email, recaptchaToken });
      console.log('[Frontend] API Response:', res.data);
      if (res.data.success) {
        setMessage('Kiểm tra email của bạn để lấy liên kết khôi phục! (Có thể mất vài phút)');
      }
    } catch (err) {
      console.error('[Frontend] API Error:', err);
      const serverMsg = err.response?.data?.message;

      // Custom Error Mapping
      if (serverMsg === 'Không tìm thấy tài khoản') {
        setError('❌ Email không thuộc tài khoản admin');
      } else {
        setError(serverMsg || 'Có lỗi xảy ra, vui lòng thử lại sau');
      }

      // Focus back to input on error
      emailRef.current?.focus();
    } finally {
      setLoading(false);
      // Reset reCAPTCHA and readiness state after submission
      if (window.grecaptcha && widgetId.current !== null) {
        window.grecaptcha.reset(widgetId.current);
        setCaptchaReady(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 relative overflow-hidden font-display">
      {/* Decorative */}
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
          <div className="text-center mb-8">
            <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-bounce">
              <span className="text-3xl">🔑</span>
            </div>
            <h1 className="text-3xl font-black text-gray-800 mb-2 tracking-tight">Quên mật khẩu?</h1>
            <p className="text-gray-500 text-sm leading-relaxed px-4">Đừng lo! Nhập email quản trị để nhận liên kết khôi phục tài khoản.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Email Quản trị</label>
              <div className="relative group">
                <span className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${error ? 'text-red-400' : 'text-gray-400 group-focus-within:text-blue-500'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
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
                  placeholder="admin@example.com"
                />
              </div>
            </div>

            {/* Google reCAPTCHA Container */}
            <div className="flex justify-center min-h-[78px]">
              <div ref={captchaRef}></div>
            </div>

            <button
              type="submit"
              disabled={loading || widgetId.current === null || !captchaReady}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-2xl font-black text-lg hover:shadow-[0_10px_20px_rgba(37,99,235,0.3)] transition-all disabled:opacity-70 active:scale-95 shadow-lg flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Đang gửi yêu cầu...</span>
                </>
              ) : (
                'Gửi link khôi phục'
              )}
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
