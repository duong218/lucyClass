import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading, isInitialized } = useAuth();

  console.log(`[ProtectedRoute] User: ${user?.username || 'null'}, Loading: ${loading}, Initialized: ${isInitialized}`);

  // Requirement 5: Wait for initialization before redirecting
  if (!isInitialized || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-[#4A90E2] border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-gray-500 font-semibold animate-pulse">Initializing Secure Session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.warn('[ProtectedRoute] No user found after initialization, redirecting to login');
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
