import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { User, Phone, Mail, BookOpen, AlertCircle, Users, ChevronRight } from 'lucide-react';

const TeacherDashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/me/profile');
        setProfile(res.data.data);
      } catch (err) {
        setError(t('teacher.error_load'));
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
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

  const courses = profile?.courseIds || [];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-800">{t('teacher.dashboard_title')}</h1>

      {/* ── Thông tin cá nhân ──────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 flex items-center gap-4">
          {/* Avatar: dùng ảnh thật nếu có, fallback chữ cái */}
          {profile?.avatar ? (
            <img
              src={profile.avatar}
              alt={profile.displayName || profile.username}
              className="w-16 h-16 rounded-full object-cover shrink-0 border-2 border-emerald-200"
            />
          ) : (
            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white text-2xl font-bold shrink-0">
              {(profile?.displayName || profile?.username || 'T').charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              {profile?.displayName || profile?.username}
            </h2>
            <span className="inline-block bg-emerald-100 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full mt-1">
              {t('teacher.role_label')}
            </span>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <InfoRow icon={<User size={16} />} label={t('teacher.username')} value={profile?.username} mono />
          <InfoRow icon={<Mail size={16} />} label={t('teacher.email')} value={profile?.email || t('teacher.not_updated')} dim={!profile?.email} />
          <InfoRow icon={<Phone size={16} />} label={t('teacher.phone')} value={profile?.phone || t('teacher.not_updated')} dim={!profile?.phone} />
        </div>

        <div className="px-6 pb-5">
          <p className="text-xs text-gray-400">
            {t('teacher.contact_admin')}
          </p>
        </div>
      </div>

      {/* ── Lớp học phụ trách ──────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={18} className="text-blue-500" />
          <h2 className="text-lg font-bold text-gray-800">{t('teacher.my_classes')}</h2>
          <span className="ml-1 bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
            {t('teacher.class_count', { count: courses.length })}
          </span>
        </div>

        {courses.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
            <div className="text-5xl mb-3 opacity-30">📭</div>
            <p className="text-gray-400 font-semibold">{t('teacher.no_class')}</p>
            <p className="text-gray-300 text-sm mt-1">{t('teacher.no_class_hint')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((course) => {
              const percent = course.classSize
                ? Math.min(100, Math.round(((course.activeStudentCount ?? 0) / course.classSize) * 100))
                : 0;
              const isFull = percent >= 100;
              const isNearFull = percent >= 80 && !isFull;

              return (
                <div
                  key={course._id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 overflow-hidden group"
                >
                  {/* Card header */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-4 flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-gray-800 text-base truncate group-hover:text-blue-600 transition-colors">
                        {course.name}
                      </h3>
                      {course.ageGroup && (
                        <span className="text-xs text-blue-500 font-semibold">{course.ageGroup}</span>
                      )}
                    </div>
                    {/* Status badge */}
                    {isFull ? (
                      <span className="ml-3 shrink-0 text-[10px] font-black px-2.5 py-1 rounded-full bg-rose-100 text-rose-600 uppercase tracking-wide">
                        {t('teacher.status_full')}
                      </span>
                    ) : isNearFull ? (
                      <span className="ml-3 shrink-0 text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-100 text-amber-600 uppercase tracking-wide">
                        {t('teacher.status_near_full')}
                      </span>
                    ) : (
                      <span className="ml-3 shrink-0 text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-600 uppercase tracking-wide">
                        {t('teacher.status_available')}
                      </span>
                    )}
                  </div>

                  {/* Card body */}
                  <div className="px-5 py-4 space-y-3">
                    {/* Sĩ số */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Users size={14} />
                        <span className="font-medium">{t('teacher.student_count')}</span>
                      </div>
                      <span className="font-black text-gray-700">
                        {course.activeStudentCount ?? 0}
                        <span className="text-gray-300 font-bold"> / {course.classSize ?? '?'}</span>
                      </span>
                    </div>

                    {/* Progress bar */}
                    {course.classSize > 0 && (
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            isFull
                              ? 'bg-gradient-to-r from-rose-400 to-pink-500'
                              : isNearFull
                              ? 'bg-gradient-to-r from-amber-400 to-orange-400'
                              : 'bg-gradient-to-r from-blue-400 to-indigo-500'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    )}

                    {/* Thời lượng */}
                    {course.duration && (
                      <p className="text-xs text-gray-400 font-medium">🕐 {course.duration}</p>
                    )}

                    {/* Nút xem học sinh */}
                    <button
                      onClick={() => navigate(`/teacher/students/course/${course._id}`)}
                      className="w-full mt-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm shadow-blue-200"
                    >
                      <Users size={15} />
                      {t('teacher.view_students')}
                      <ChevronRight size={15} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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

export default TeacherDashboard;
