import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from '../components/NotificationBell';
import {
  User,
  Clock,
  Megaphone,
  GraduationCap,
  Mic2,
  X,
  Menu,
  LogOut,
} from 'lucide-react';

const StaffLayout = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isTeacher   = user?.role === 'teacher';
  const isMarketing = user?.role === 'marketing';

  const menuItems = isTeacher
    ? [
        { path: '/teacher/dashboard', label: t('staff.my_page'),      icon: User },
        { path: '/attendance',        label: t('staff.attendance'),    icon: Clock },
      ]
    : [
        { path: '/marketing/dashboard',     label: t('staff.my_info'),      icon: User },
        { path: '/attendance',              label: t('staff.attendance'),    icon: Clock },
        { path: '/marketing/announcements', label: t('staff.announcements'), icon: Megaphone },
      ];

  const roleLabel = isTeacher ? t('teacher.role_label') : 'Marketing';

  const sidebarGradient = isTeacher
    ? 'from-emerald-600 to-emerald-700'
    : 'from-violet-600 to-violet-700';

  const bellAccentColor = isTeacher ? '#059669' : '#7c3aed';

  const RoleBadgeIcon = isTeacher ? GraduationCap : Mic2;

  const toggleLang = () => {
    const nextLang =
      i18n.language === 'vi' ? 'en' : i18n.language === 'en' ? 'zh' : 'vi';
    i18n.changeLanguage(nextLang);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex relative overflow-x-hidden">

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`w-64 bg-gradient-to-b ${sidebarGradient} text-white flex flex-col fixed h-full z-50 transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>

        <div className="px-4 py-5 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 group cursor-pointer">
              <div
                className="relative flex-shrink-0 rounded-full overflow-hidden transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl"
                style={{
                  width: 46,
                  height: 46,
                  background: 'rgba(255,255,255,0.15)',
                  border: '2px solid rgba(255,255,255,0.35)',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
                }}
              >
                <img
                  src="/logo.jpeg"
                  alt="Lucy's Class"
                  className="w-full h-full object-cover"
                  onError={e => e.target.src = '/placeholder.jpg'}
                />
              </div>

              <div className="flex flex-col leading-none select-none">
                <div className="flex items-baseline gap-0">
                  <span
                    style={{
                      fontFamily: "'Nunito', 'Baloo 2', system-ui, sans-serif",
                      fontSize: '1.25rem',
                      fontWeight: 900,
                      letterSpacing: '0.14em',
                      color: '#ffffff',
                      lineHeight: 1,
                      textTransform: 'uppercase',
                      textShadow: '0 1px 4px rgba(0,0,0,0.2)',
                    }}
                  >
                    LUCY
                  </span>
                  <span
                    style={{
                      fontFamily: "'Nunito', 'Baloo 2', system-ui, sans-serif",
                      fontSize: '0.7rem',
                      fontWeight: 900,
                      letterSpacing: '0.22em',
                      color: 'rgba(255,255,255,0.65)',
                      lineHeight: 1,
                      textTransform: 'uppercase',
                      marginLeft: '5px',
                      alignSelf: 'flex-end',
                      paddingBottom: '1px',
                    }}
                  >
                    CLASS
                  </span>
                </div>
                <span
                  className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest"
                  style={{
                    background: 'rgba(255,255,255,0.18)',
                    color: 'rgba(255,255,255,0.9)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  <RoleBadgeIcon size={9} />
                  {roleLabel}
                </span>
              </div>
            </div>

            <button
              className="md:hidden text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto" data-lenis-prevent>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end
                onClick={() => setIsSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-white/20 text-white font-semibold shadow-sm'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <Icon size={17} strokeWidth={1.75} className="shrink-0" />
                <span className="text-sm">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="mb-3 px-1">
            <p className="text-xs text-white/50 mb-0.5">{t('staff.logged_in_as')}</p>
            <p className="text-sm font-bold text-white truncate">
              {user?.displayName || user?.username}
            </p>
            <p className="text-xs font-mono text-white/60">{user?.username}</p>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 hover:text-white text-sm font-semibold transition-all"
          >
            <LogOut size={15} />
            {t('staff.logout')}
          </button>
        </div>
      </aside>

      <div className="flex-1 md:ml-64 min-w-0 transition-all duration-300">

        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6 sticky top-0 z-30 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden text-gray-600 hover:text-gray-800 transition-colors"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={22} />
            </button>
            <h2 className="text-lg font-bold text-gray-700 hidden sm:block">
              {menuItems.find(item =>
                window.location.pathname.startsWith(item.path)
              )?.label || roleLabel}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {isTeacher && (
              <button
                onClick={toggleLang}
                className="w-9 h-9 rounded-full border border-gray-200 bg-white text-gray-700 text-xs font-black hover:bg-gray-50 transition-all"
                title="Đổi ngôn ngữ"
              >
                {i18n.language.toUpperCase()}
              </button>
            )}
            <NotificationBell enabled={!!user} accentColor={bellAccentColor} />

            <div className="hidden sm:flex items-center gap-1.5">
              <User size={13} className="text-gray-500" />
              <span className="text-xs font-bold text-gray-600">
                {user?.displayName || user?.username}
              </span>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-2 rounded-xl text-sm font-black hover:bg-red-100 hover:scale-105 active:scale-95 transition-all shadow-sm"
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </header>

        <main className="p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default StaffLayout;
