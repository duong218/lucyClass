import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import RecaptchaBox from '../components/RecaptchaBox';
import {
  ArrowLeft,
  Mail,
  User,
  ShieldAlert,
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  Crown,
  Users,
} from 'lucide-react';

const ForgotPassword = () => {
  const navigate = useNavigate();

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
      const payload = { email, accountType, recaptchaToken: captchaToken };
      if (accountType === 'staff') payload.username = username.trim();

      const res = await api.post('/auth/forgot-password', payload);
      if (res.data.success) {
        setMessage('Kiểm tra email của bạn để lấy liên kết khôi phục! (Có thể mất vài phút)');
      }
    } catch (err) {
      const serverMsg = err.response?.data?.message || err.message;
      setError(serverMsg || 'Có lỗi xảy ra, vui lòng thử lại sau');
      emailRef.current?.focus();
    } finally {
      setLoading(false);
      if (recaptchaRef.current) { try { recaptchaRef.current.reset(); } catch (_) {} }
      setCaptchaToken(null);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden p-4"
      style={{ background: '#f0f7f5' }}
    >
      {/* Background decorative blobs */}
      <div
        className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(28,105,92,0.12), transparent 70%)' }}
      />
      <div
        className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(28,105,112,0.10), transparent 70%)' }}
      />
      {/* Grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(28,105,92,1) 1px, transparent 1px), linear-gradient(90deg, rgba(28,105,92,1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="w-full max-w-md relative z-10">

        {/* Back button */}
        <button
          onClick={() => navigate('/admin/login')}
          className="flex items-center gap-2 mb-6 text-sm font-bold transition-opacity hover:opacity-70"
          style={{ color: '#1C695C', fontFamily: "'Nunito', system-ui, sans-serif" }}
        >
          <ArrowLeft size={16} />
          Quay lại đăng nhập
        </button>

        {/* Card */}
        <div
          className="bg-white rounded-3xl p-8 lg:p-10"
          style={{ boxShadow: '0 20px 60px rgba(28,105,92,0.12), 0 4px 16px rgba(0,0,0,0.06)' }}
        >

          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #1C695C, #1C6970)' }}
            >
              <img
                src="/logo.jpeg"
                alt="Lucy Class"
                className="w-full h-full object-cover"
                onError={e => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML =
                    '<span style="color:white;font-weight:900;font-size:1.1rem;font-family:Nunito,system-ui">LC</span>';
                }}
              />
            </div>
            <div>
              <h1
                className="text-2xl font-black text-gray-900 leading-tight"
                style={{ fontFamily: "'Nunito', system-ui, sans-serif" }}
              >
                Quên mật khẩu?
              </h1>
              <p className="text-gray-400 text-sm font-medium mt-0.5">
                Nhập thông tin để nhận liên kết khôi phục
              </p>
            </div>
          </div>

          {/* Tab chọn loại tài khoản */}
          <div
            className="flex rounded-2xl p-1 gap-1 mb-6"
            style={{ background: '#f0f7f5' }}
          >
            {[
              { key: 'admin', label: 'Admin', Icon: Crown },
              { key: 'staff', label: 'GV / Marketing', Icon: Users },
            ].map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => handleTabChange(key)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-black transition-all duration-200"
                style={
                  accountType === key
                    ? {
                        background: 'linear-gradient(135deg, #1C695C, #1C6970)',
                        color: '#ffffff',
                        boxShadow: '0 4px 12px rgba(28,105,92,0.3)',
                        fontFamily: "'Nunito', system-ui",
                      }
                    : {
                        color: '#6b7280',
                        fontFamily: "'Nunito', system-ui",
                      }
                }
              >
                <Icon size={15} strokeWidth={2.5} />
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Username — chỉ hiện cho staff */}
            {accountType === 'staff' && (
              <div>
                <label
                  className="block text-sm font-bold text-gray-700 mb-2"
                  style={{ fontFamily: "'Nunito', system-ui" }}
                >
                  Tên đăng nhập
                </label>
                <div className="relative">
                  <div
                    className="absolute left-3.5 top-1/2 -translate-y-1/2"
                    style={{ color: username ? '#1C695C' : '#9ca3af' }}
                  >
                    <User size={17} strokeWidth={2} />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required={accountType === 'staff'}
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm font-semibold text-gray-800 outline-none transition-all duration-200"
                    style={{
                      background: '#f8fafb',
                      border: '2px solid',
                      borderColor: username ? '#1C695C' : '#e5e7eb',
                    }}
                    placeholder="LC12345678"
                    onFocus={e => (e.target.style.borderColor = '#1C695C')}
                    onBlur={e => (e.target.style.borderColor = username ? '#1C695C' : '#e5e7eb')}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1.5 ml-1 font-medium">
                  Tên đăng nhập dạng LC + 8 số, do admin cung cấp
                </p>
              </div>
            )}

            {/* Email */}
            <div>
              <label
                className="block text-sm font-bold text-gray-700 mb-2"
                style={{ fontFamily: "'Nunito', system-ui" }}
              >
                {accountType === 'admin' ? 'Email quản trị' : 'Email của bạn'}
              </label>
              <div className="relative">
                <div
                  className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: email ? '#1C695C' : error ? '#C96A3D' : '#9ca3af' }}
                >
                  <Mail size={17} strokeWidth={2} />
                </div>
                <input
                  ref={emailRef}
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm font-semibold text-gray-800 outline-none transition-all duration-200"
                  style={{
                    background: error ? 'rgba(201,106,61,0.04)' : '#f8fafb',
                    border: '2px solid',
                    borderColor: error ? 'rgba(201,106,61,0.4)' : email ? '#1C695C' : '#e5e7eb',
                  }}
                  placeholder={accountType === 'admin' ? 'admin@example.com' : 'email@example.com'}
                  onFocus={e => (e.target.style.borderColor = '#1C695C')}
                  onBlur={e =>
                    (e.target.style.borderColor = error
                      ? 'rgba(201,106,61,0.4)'
                      : email
                      ? '#1C695C'
                      : '#e5e7eb')
                  }
                />
              </div>
              {accountType === 'staff' && (
                <div
                  className="flex items-start gap-2 mt-1.5 ml-1 rounded-xl px-3 py-2"
                  style={{ background: 'rgba(217,154,65,0.08)', border: '1px solid rgba(217,154,65,0.2)' }}
                >
                  <ShieldAlert size={13} className="shrink-0 mt-0.5" style={{ color: '#C96A3D' }} />
                  <p className="text-xs font-semibold" style={{ color: '#C96A3D' }}>
                    Nếu chưa có email, liên hệ admin để được bổ sung
                  </p>
                </div>
              )}
            </div>

            {/* reCAPTCHA */}
            <RecaptchaBox ref={recaptchaRef} onVerify={setCaptchaToken} />

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !captchaToken}
              className="w-full py-3.5 rounded-2xl font-black text-white flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: loading
                  ? '#3FA48F'
                  : 'linear-gradient(135deg, #1C695C 0%, #1C6970 100%)',
                boxShadow: loading ? 'none' : '0 8px 24px rgba(28,105,92,0.35)',
                fontFamily: "'Nunito', system-ui",
                fontSize: '15px',
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Đang gửi yêu cầu...
                </>
              ) : (
                <>
                  <Send size={17} />
                  Gửi link khôi phục
                </>
              )}
            </button>

            {/* Success */}
            {message && (
              <div
                className="flex items-start gap-3 rounded-2xl px-4 py-3.5"
                style={{
                  background: 'rgba(28,105,92,0.07)',
                  border: '1px solid rgba(28,105,92,0.25)',
                }}
              >
                <CheckCircle2 size={17} className="shrink-0 mt-0.5" style={{ color: '#1C695C' }} />
                <p className="text-sm font-semibold" style={{ color: '#1C695C' }}>
                  {message}
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div
                className="flex items-start gap-3 rounded-2xl px-4 py-3.5"
                style={{
                  background: 'rgba(201,106,61,0.07)',
                  border: '1px solid rgba(201,106,61,0.25)',
                }}
              >
                <XCircle size={17} className="shrink-0 mt-0.5" style={{ color: '#C96A3D' }} />
                <p className="text-sm font-semibold" style={{ color: '#C96A3D' }}>
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