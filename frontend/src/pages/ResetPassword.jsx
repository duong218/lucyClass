import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { setAccessToken } from '../services/api';

const ResetPassword = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp!');
      return;
    }
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await api.post(`/auth/reset-password/${token}`, { password });
      if (res.data.success) {
        // Xoá toàn bộ session cũ ở client — backend đã xoá session server-side
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 relative overflow-hidden">
      {/* Decorative — giữ nguyên style gốc */}
      <div className="absolute top-10 left-10 text-5xl opacity-20 animate-float">🔑</div>
      <div className="absolute bottom-20 left-20 text-5xl opacity-20 animate-float" style={{ animationDelay: '0.5s' }}>🛡️</div>

      <div className="w-full max-w-md animate-fadeInUp flex flex-col items-center">
        <div className="bg-white rounded-3xl shadow-2xl p-10 w-full relative z-10">
          <div className="text-center mb-6">
            <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🔐</span>
            </div>
            <h1 className="text-2xl font-display text-gray-800 mb-1">Đặt lại mật khẩu</h1>
            <p className="text-gray-500 text-sm">Nhập mật khẩu mới của bạn bên dưới</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Mật khẩu mới</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400">🔒</span>
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)} required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  placeholder="Ít nhất 6 ký tự"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Xác nhận mật khẩu mới</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400">✅</span>
                <input
                  type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  placeholder="Nhập lại mật khẩu"
                />
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50 active:scale-95 shadow-md"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Đang cập nhật...
                </span>
              ) : 'Cập nhật mật khẩu'}
            </button>

            {message && (
              <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                <p className="text-green-700 text-center text-sm font-semibold">✅ {message}</p>
              </div>
            )}
            {error && (
              <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                <p className="text-red-600 text-center text-sm font-semibold">❌ {error}</p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
