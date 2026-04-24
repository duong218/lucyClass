import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from '../components/NotificationBell';

const AdminLayout = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const menuItems = [
    { path: '/admin/dashboard', label: t('dashboard'), icon: '📊' },
    { path: '/admin/registrations', label: t('registrations'), icon: '📋' },
    { path: '/admin/courses', label: t('courses'), icon: '📚' },
    { path: '/admin/teachers', label: t('teachers'), icon: '👩‍🏫' },
    { path: '/admin/feedback', label: t('feedback'), icon: '💬' },
    { path: '/admin/statistics', label: t('statistics'), icon: '📈' },
    { path: '/admin/students', label: t('student_management'), icon: '👨‍🎓' },
    { path: '/admin/announcements', label: t('announcements.manage_title'), icon: '📢' },
    { path: '/admin/timetable', label: t('admin.timetable'), icon: '🗓️' },
    { path: '/admin/attendance', label: 'Chấm công', icon: '🕐' },
    { path: '/admin/accounts', label: t('admin.accounts_management'), icon: '👥' },
    { path: '/admin/history', label: t('history.title'), icon: '📜' },
  ];

  const BRAND = {
    primary: '#1C695C',
    primaryLight: '#3FA48F',
    primaryDeep: '#1C6970'
  };

  return (
    <div className="min-h-screen bg-gray-50 flex relative overflow-x-hidden">
      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`w-64 text-white flex flex-col fixed h-full z-50 transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        style={{ background: `linear-gradient(to bottom, ${BRAND.primary}, ${BRAND.primaryDeep})` }}
      >
        <div className="px-4 py-5 border-b border-white/10">
          <div className="flex items-center justify-between">
            {/* Brand Logo */}
            <div className="flex items-center gap-3 group cursor-pointer">
              {/* Logo circle */}
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
                  onError={(e) => (e.target.src = '/placeholder.jpg')}
                />
              </div>

              {/* Brand text */}
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
                {/* Role badge */}
                <span
                  className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest"
                  style={{
                    background: 'rgba(255,255,255,0.18)',
                    color: 'rgba(255,255,255,0.9)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  <span style={{ fontSize: '8px' }}>⚙️</span>
                  {t("admin_panel")}
                </span>
              </div>
            </div>

            <button
              className="md:hidden text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all"
              onClick={() => setIsSidebarOpen(false)}
            >
              ✕
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-white/20 text-white font-semibold shadow-sm'
                    : 'text-white/90 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 md:ml-64 min-w-0 transition-all duration-300">
        {/* Top bar */}
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6 sticky top-0 z-30 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden text-2xl text-gray-600"
              onClick={() => setIsSidebarOpen(true)}
            >
              ☰
            </button>
            <h2 className="text-lg font-bold text-gray-700 hidden sm:block">
              {menuItems.find(item => window.location.pathname.startsWith(item.path))?.label || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* ✅ Notification Bell */}
            <NotificationBell
              enabled={!!user}
              accentColor={BRAND.primary}
            />

            <div className="flex flex-col items-end">
              <div className="bg-yellow-50 border border-yellow-200 px-3 py-1 rounded-lg mb-1 animate-pulse shadow-sm">
                <p className="text-[10px] text-yellow-800 font-bold">
                  ⚠️ {t("logout_reminder")}
                </p>
              </div>
              <span className="text-xs font-bold text-gray-700">👤 {user?.username}</span>
            </div>

            <button
              onClick={handleLogout}
              className="bg-red-50 text-red-600 px-3 py-2 rounded-xl text-sm font-black hover:bg-red-100 hover:scale-105 active:scale-95 transition-all shadow-sm"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
