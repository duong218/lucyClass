import { useState, useEffect } from 'react';
import api from '../../services/api';
import { User, Phone, Mail, AlertCircle } from 'lucide-react';

const MarketingDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/me/profile');
        setProfile(res.data.data);
      } catch (err) {
        setError('Không thể tải thông tin. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-violet-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={20} className="text-red-500 shrink-0" />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Thông tin cá nhân</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-6 flex items-center gap-4">
          <div className="w-16 h-16 bg-violet-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {(profile?.displayName || profile?.username || 'M').charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              {profile?.displayName || profile?.username}
            </h2>
            <span className="inline-block bg-violet-100 text-violet-700 text-xs font-semibold px-2.5 py-1 rounded-full mt-1">
              Marketing
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="p-6 space-y-4">
          <InfoRow icon={<User size={16} />} label="Tên đăng nhập" value={profile?.username} mono />
          <InfoRow icon={<Mail size={16} />} label="Email" value={profile?.email || '(chưa cập nhật)'} dim={!profile?.email} />
          <InfoRow icon={<Phone size={16} />} label="Số điện thoại" value={profile?.phone || '(chưa cập nhật)'} dim={!profile?.phone} />
        </div>

        <div className="px-6 pb-5">
          <p className="text-xs text-gray-400">
            Để cập nhật thông tin cá nhân, vui lòng liên hệ admin.
          </p>
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({ icon, label, value, mono, dim }) => (
  <div className="flex items-start gap-3">
    <span className="text-gray-400 mt-0.5 shrink-0">{icon}</span>
    <div>
      <p className="text-xs text-gray-400 font-medium">{label}</p>
      <p className={`text-sm mt-0.5 ${dim ? 'text-gray-400 italic' : 'text-gray-800'} ${mono ? 'font-mono' : 'font-medium'}`}>
        {value}
      </p>
    </div>
  </div>
);

export default MarketingDashboard;