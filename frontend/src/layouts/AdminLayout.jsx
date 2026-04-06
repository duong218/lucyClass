import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

const AdminLayout = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout(); // AuthContext handles API call, cleanup, and redirect
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
    { path: '/admin/history', label: t('history.title'), icon: '📜' },
  ];

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
      <aside className={`w-64 bg-gradient-to-b from-blue-600 to-blue-700 text-white flex flex-col fixed h-full z-50 transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.jpeg" 
              alt="Lucy Logo" 
              className="w-10 h-10 object-contain rounded-lg shadow-sm hover:scale-105 transition duration-200"
              onError={(e) => e.target.src = '/placeholder.jpg'}
            />
            <div>
              <h1 className="text-white font-semibold text-lg leading-tight font-display">
                Lucy’s Class
              </h1>
              <p className="text-xs text-white/70">
                {t("admin_panel")}
              </p>
            </div>
            {/* Close button for mobile */}
            <button 
              className="md:hidden ml-auto text-white/70 hover:text-white p-1"
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
            {/* Hamburger for mobile */}
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
          <div className="flex items-center space-x-4 text-right">
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
