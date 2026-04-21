import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const StaffLayout = () => {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isTeacher   = user?.role === 'teacher';
  const isMarketing = user?.role === 'marketing';

  // Menu items theo role
  const menuItems = isTeacher
    ? [
        { path: '/teacher/dashboard', label: 'Trang của tôi', icon: '👤' },
      ]
    : [
        { path: '/marketing/dashboard',     label: 'Thông tin cá nhân', icon: '👤' },
        { path: '/marketing/announcements', label: 'Thông báo',          icon: '📢' },
      ];

  const roleLabel = isTeacher ? 'Giáo viên' : 'Marketing';
  // Màu gradient sidebar theo role (giống tone AdminLayout nhưng phân biệt)
  const sidebarGradient = isTeacher
    ? 'from-emerald-600 to-emerald-700'
    : 'from-violet-600 to-violet-700';

  return (
    <div className="min-h-screen bg-gray-50 flex relative overflow-x-hidden">

      {/* Sidebar Overlay (mobile) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar — cấu trúc giống AdminLayout */}
      <aside className={`w-64 bg-gradient-to-b ${sidebarGradient} text-white flex flex-col fixed h-full z-50 transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>

        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <img
              src="/logo.jpeg"
              alt="Lucy Logo"
              className="w-10 h-10 object-contain rounded-lg shadow-sm hover:scale-105 transition duration-200"
              onError={e => e.target.src = '/placeholder.jpg'}
            />
            <div>
              <h1 className="text-white font-semibold text-lg leading-tight font-display">
                Lucy's Class
              </h1>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-medium text-white/90">
                {roleLabel}
              </span>
            </div>
            {/* Close button mobile */}
            <button
              className="md:hidden ml-auto text-white/70 hover:text-white p-1"
              onClick={() => setIsSidebarOpen(false)}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end
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

        {/* User info + Logout */}
        <div className="p-4 border-t border-white/10">
          <div className="mb-3 px-1">
            <p className="text-xs text-white/50 mb-0.5">Đăng nhập với</p>
            <p className="text-sm font-bold text-white truncate">
              {user?.displayName || user?.username}
            </p>
            <p className="text-xs font-mono text-white/60">{user?.username}</p>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 hover:text-white text-sm font-semibold transition-all"
          >
            <span>🚪</span> Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 md:ml-64 min-w-0 transition-all duration-300">

        {/* Top bar — giống AdminLayout */}
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6 sticky top-0 z-30 border-b border-gray-100">
          <div className="flex items-center gap-4">
            {/* Hamburger mobile */}
            <button
              className="md:hidden text-2xl text-gray-600"
              onClick={() => setIsSidebarOpen(true)}
            >
              ☰
            </button>
            <h2 className="text-lg font-bold text-gray-700 hidden sm:block">
              {menuItems.find(item =>
                window.location.pathname.startsWith(item.path)
              )?.label || roleLabel}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-600 hidden sm:block">
              👤 {user?.displayName || user?.username}
            </span>
            <button
              onClick={logout}
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

export default StaffLayout;
