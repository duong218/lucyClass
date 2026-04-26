import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { setAccessToken } from '../services/api';
import {
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  XCircle,
  Check,
  X,
  KeyRound,
} from 'lucide-react';

// Kiểm tra từng tiêu chí — đồng bộ với regex backend
const getPasswordChecks = (pw) => [
  { label: 'Ít nhất 8 ký tự', pass: pw.length >= 8 },
  { label: 'Có chữ thường (a-z)', pass: /[a-z]/.test(pw) },
  { label: 'Có chữ hoa (A-Z)', pass: /[A-Z]/.test(pw) },
  { label: 'Có chữ số (0-9)', pass: /\d/.test(pw) },
  { label: 'Có ký tự đặc biệt (!@#...)', pass: /[^A-Za-z\d]/.test(pw) },
];

const ResetPassword = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const checks = useMemo(() => getPasswordChecks(password), [password]);
  const allPassed = checks.every(c => c.pass);
  const passedCount = checks.filter(c => c.pass).length;

  const strengthColor = () => {
    if (passedCount <= 1) return '#e5e7eb';
    if (passedCount === 2) return '#C96A3D';
    if (passedCount === 3) return '#d97706';
    if (passedCount === 4) return '#3FA48F';
    return '#1C695C';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!allPassed) {
      setError('Mật khẩu chưa đáp ứng đủ yêu cầu bên dưới');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp!');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await api.post(`/auth/reset-password/${token}`, { password });
      if (res.data.success) {
        localStorage.removeItem('hasSession');
        setAccessToken(null);

        setMessage('Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại với mật khẩu mới.');
        setTimeout(() => navigate('/admin/login'), 2500);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Có lỗi xảy ra hoặc liên kết đã hết hạn');
    } finally {
      setLoading(false);
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
                Đặt lại mật khẩu
              </h1>
              <p className="text-gray-400 text-sm font-medium mt-0.5">
                Nhập mật khẩu mới cho tài khoản của bạn
              </p>
            </div>
          </div>

          {/* Security notice */}
          <div
            className="flex items-start gap-3 rounded-2xl p-3.5 mb-6"
            style={{ background: 'rgba(28,105,92,0.07)', border: '1px solid rgba(28,105,92,0.2)' }}
          >
            <ShieldCheck size={16} className="shrink-0 mt-0.5" style={{ color: '#1C695C' }} />
            <p className="text-xs font-semibold leading-relaxed" style={{ color: '#1C695C' }}>
              Mật khẩu mới sẽ áp dụng ngay lập tức — tất cả phiên đăng nhập cũ sẽ bị huỷ
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* New password */}
            <div>
              <label
                className="block text-sm font-bold text-gray-700 mb-2"
                style={{ fontFamily: "'Nunito', system-ui" }}
              >
                Mật khẩu mới
              </label>
              <div className="relative">
                <div
                  className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: password ? '#1C695C' : '#9ca3af' }}
                >
                  <Lock size={17} strokeWidth={2} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full pl-11 pr-12 py-3.5 rounded-2xl text-sm font-semibold text-gray-800 outline-none transition-all duration-200"
                  style={{
                    background: '#f8fafb',
                    border: '2px solid',
                    borderColor: password ? '#1C695C' : '#e5e7eb',
                  }}
                  placeholder="Tối thiểu 8 ký tự, chữ hoa, số, ký tự đặc biệt"
                  onFocus={e => (e.target.style.borderColor = '#1C695C')}
                  onBlur={e => (e.target.style.borderColor = password ? '#1C695C' : '#e5e7eb')}
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

              {/* Strength bar */}
              {password.length > 0 && (
                <div className="mt-2.5">
                  <div className="flex gap-1 mb-2.5">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div
                        key={i}
                        className="flex-1 h-1.5 rounded-full transition-all duration-300"
                        style={{
                          background: i <= passedCount ? strengthColor() : '#e5e7eb',
                        }}
                      />
                    ))}
                  </div>

                  {/* Checklist */}
                  <div className="grid grid-cols-1 gap-1">
                    {checks.map(c => (
                      <div key={c.label} className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-all duration-200"
                          style={{
                            background: c.pass ? 'rgba(28,105,92,0.15)' : 'rgba(201,106,61,0.12)',
                          }}
                        >
                          {c.pass
                            ? <Check size={10} strokeWidth={3} style={{ color: '#1C695C' }} />
                            : <X size={10} strokeWidth={3} style={{ color: '#C96A3D' }} />}
                        </div>
                        <span
                          className="text-xs font-semibold transition-colors duration-200"
                          style={{ color: c.pass ? '#1C695C' : '#9ca3af' }}
                        >
                          {c.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label
                className="block text-sm font-bold text-gray-700 mb-2"
                style={{ fontFamily: "'Nunito', system-ui" }}
              >
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <div
                  className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{
                    color:
                      confirmPassword && confirmPassword === password
                        ? '#1C695C'
                        : confirmPassword && confirmPassword !== password
                          ? '#C96A3D'
                          : '#9ca3af',
                  }}
                >
                  <KeyRound size={17} strokeWidth={2} />
                </div>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  className="w-full pl-11 pr-12 py-3.5 rounded-2xl text-sm font-semibold text-gray-800 outline-none transition-all duration-200"
                  style={{
                    background: '#f8fafb',
                    border: '2px solid',
                    borderColor:
                      confirmPassword && confirmPassword === password
                        ? '#1C695C'
                        : confirmPassword && confirmPassword !== password
                          ? 'rgba(201,106,61,0.5)'
                          : '#e5e7eb',
                  }}
                  placeholder="Nhập lại mật khẩu"
                  onFocus={e => (e.target.style.borderColor = '#1C695C')}
                  onBlur={e => {
                    if (confirmPassword && confirmPassword !== password)
                      e.target.style.borderColor = 'rgba(201,106,61,0.5)';
                    else if (confirmPassword === password)
                      e.target.style.borderColor = '#1C695C';
                    else e.target.style.borderColor = '#e5e7eb';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors hover:bg-gray-100"
                  style={{ color: '#9ca3af' }}
                >
                  {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {confirmPassword && confirmPassword !== password && (
                <p className="text-xs font-semibold mt-1.5 ml-1" style={{ color: '#C96A3D' }}>
                  Mật khẩu xác nhận chưa khớp
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl font-black text-white flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
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
                  Đang cập nhật...
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  Cập nhật mật khẩu
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
                  {error}
                </p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;