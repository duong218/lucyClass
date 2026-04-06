import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

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
    console.log('[Frontend] Thử đặt lại mật khẩu với token:', token?.substring(0, 5) + '...');
    
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp!');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await api.post(`/auth/reset-password/${token}`, { password });
      console.log('[Frontend] Reset Response:', res.data);
      if (res.data.success) {
        setMessage('Đặt lại mật khẩu thành công! Đang chuyển hướng...');
        setTimeout(() => navigate('/admin/login'), 2000);
      }
    } catch (err) {
      console.error('[Frontend] Reset Error:', err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra hoặc liên kết đã hết hạn');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-10 left-10 text-5xl opacity-20 animate-float">🔑</div>
      <div className="absolute bottom-20 left-20 text-5xl opacity-20 animate-float" style={{ animationDelay: '0.5s' }}>🛡️</div>

      <div className="w-full max-w-md animate-fadeInUp flex flex-col items-center">
        <div className="bg-white rounded-3xl shadow-2xl p-10 w-full relative z-10">
          <div className="text-center mb-6">
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
                  className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  placeholder="••••••••"
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
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50 active:scale-95 shadow-md"
            >
              {loading ? 'đang cập nhật...' : 'Cập nhật mật khẩu'}
            </button>

            {message && (
              <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                <p className="text-green-600 text-center text-sm font-semibold">{message}</p>
              </div>
            )}
            {error && (
              <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                <p className="text-red-600 text-center text-sm font-semibold">{error}</p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
