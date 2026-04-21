import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * ProtectedRoute — bảo vệ route theo role
 *
 * Props:
 *   allowedRoles?: string[]  — nếu không truyền thì chỉ cần đăng nhập là đủ
 *
 * Ví dụ:
 *   <ProtectedRoute allowedRoles={['admin']}>          — chỉ admin
 *   <ProtectedRoute allowedRoles={['teacher', 'marketing']}>  — staff
 *   <ProtectedRoute>                                   — bất kỳ role nào
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isInitialized } = useAuth();

  if (!isInitialized || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-[#4A90E2] border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-gray-500 font-semibold animate-pulse">Đang khởi động...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  // Nếu có yêu cầu role cụ thể
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect về dashboard đúng của role hiện tại
    const redirectMap = {
      admin:     '/admin/dashboard',
      teacher:   '/teacher/dashboard',
      marketing: '/marketing/dashboard'
    };
    return <Navigate to={redirectMap[user.role] || '/admin/login'} replace />;
  }

  return children;
};

export default ProtectedRoute;