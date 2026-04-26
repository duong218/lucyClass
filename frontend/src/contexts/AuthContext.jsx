import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import api, { setInitializing, setAccessToken } from '../services/api';

const AuthContext = createContext(null);

// Redirect mặc định theo role
export const getDashboardPath = (role) => {
  switch (role) {
    case 'admin':      return '/admin/dashboard';
    case 'teacher':    return '/teacher/dashboard';
    case 'marketing':  return '/marketing/dashboard';
    default:           return '/admin/login';
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [sessionConflict, setSessionConflict] = useState(false);
  const initRef = useRef(false);
  const conflictHandledRef = useRef(false);
  // ✅ FIX: dùng ref để track user mới nhất, tránh stale closure trong event listener
  const userRef = useRef(null);

  // Sync userRef mỗi khi user thay đổi
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // =========================
  // 🚪 LOGOUT
  // =========================
  const performLogout = useCallback(async (skipApi = false) => {
    if (!skipApi) {
      try { await api.post('/auth/logout'); } catch (err) { /* ignore */ }
    }
    localStorage.removeItem('hasSession');
    setUser(null);
  }, []);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const initializeAuth = async () => {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Init timeout after 8s')), 8000)
      );

      const authFlow = async () => {
        try {
          const meRes = await api.get('/auth/me');
          setUser(meRes.data?.user || meRes.data);
          localStorage.setItem('hasSession', 'true');
        } catch (meError) {
          if (meError?.code === 'SESSION_CONFLICT' || meError?.response?.data?.code === 'SESSION_CONFLICT') {
            localStorage.removeItem('hasSession');
            setUser(null);
            return;
          }
          const hasSession = localStorage.getItem('hasSession') === 'true';
          if (hasSession) {
            try {
              const refreshRes = await api.post('/auth/refresh-token', {});
              if (refreshRes.data.accessToken) setAccessToken(refreshRes.data.accessToken);
              const meRes = await api.get('/auth/me');
              setUser(meRes.data?.user || meRes.data);
            } catch (refreshError) {
              const refreshData = refreshError?.response?.data || refreshError;
              if (refreshData?.code === 'SESSION_CONFLICT') {
                localStorage.removeItem('hasSession');
                setUser(null);
                return;
              }
              localStorage.removeItem('hasSession');
              setUser(null);
            }
          } else {
            setUser(null);
          }
        }
      };

      try {
        await Promise.race([authFlow(), timeoutPromise]);
      } catch (err) {
        localStorage.removeItem('hasSession');
        setUser(null);
      } finally {
        setLoading(false);
        setIsInitialized(true);
      }
    };

    const setupAuth = async () => {
      setInitializing(true);
      await initializeAuth();
      setInitializing(false);
    };
    setupAuth();

    const handleLogoutEvent = () => {
      localStorage.removeItem('hasSession');
      setUser(null);
      window.location.href = '/admin/login';
    };

    const handleSessionConflict = () => {
      if (conflictHandledRef.current) return;
      conflictHandledRef.current = true;

      // ✅ FIX: dùng userRef.current thay vì user (tránh stale closure)
      // Không cần check user có tồn tại hay không —
      // nếu có session conflict thì luôn show modal và clear session
      localStorage.removeItem('hasSession');
      setUser(null);
      setSessionConflict(true);
    };

    window.addEventListener('auth:logout', handleLogoutEvent);
    window.addEventListener('session:conflict', handleSessionConflict);
    return () => {
      window.removeEventListener('auth:logout', handleLogoutEvent);
      window.removeEventListener('session:conflict', handleSessionConflict);
    };
  }, []);

  // Polling session conflict
  useEffect(() => {
    if (!user || sessionConflict) return;
    const interval = setInterval(async () => {
      try {
        await api.get('/auth/check-session');
      } catch (err) {
        if (err?.code === 'SESSION_CONFLICT' || err?.response?.data?.code === 'SESSION_CONFLICT') {
          if (conflictHandledRef.current) return;
          conflictHandledRef.current = true;
          localStorage.removeItem('hasSession');
          setUser(null);
          setSessionConflict(true);
        }
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [user, sessionConflict]);

  // =========================
  // 🔐 LOGIN
  // =========================
  const login = async (credentials) => {
    setLoading(true);
    try {
      setSessionConflict(false);
      conflictHandledRef.current = false;
      const res = await api.post('/auth/login', credentials);
      if (res.data.accessToken) setAccessToken(res.data.accessToken);
      localStorage.setItem('hasSession', 'true');
      setUser(res.data.user);
      return res.data.user; // trả về user để component biết role để redirect
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // 🚪 LOGOUT (public)
  // =========================
  const logout = async () => {
    await performLogout(false);
    window.location.href = '/admin/login';
  };

  // =========================
  // 🔒 SESSION CONFLICT DISMISS
  // =========================
  const handleConflictDismiss = () => {
    setSessionConflict(false);
    conflictHandledRef.current = false;
    // Redirect về trang login chung (admin/login phục vụ tất cả roles)
    window.location.href = '/admin/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading,
        isInitialized,
        isAuthenticated: !!user,
        // helper tiện dùng trong component
        isAdmin: user?.role === 'admin',
        isTeacher: user?.role === 'teacher',
        isMarketing: user?.role === 'marketing',
      }}
    >
      {children}

      {sessionConflict && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div style={{ marginBottom: 16 }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', margin: '0 0 12px' }}>Phiên đăng nhập bị gián đoạn</h2>
            <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 24px', lineHeight: 1.6 }}>
              Tài khoản của bạn đã được đăng nhập từ thiết bị khác. Vui lòng đăng nhập lại.
            </p>
            <button onClick={handleConflictDismiss} style={buttonStyle}
              onMouseOver={e => e.target.style.background = '#2563eb'}
              onMouseOut={e => e.target.style.background = '#3b82f6'}
            >OK - Đăng nhập lại</button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

const overlayStyle = { position:'fixed',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.6)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:99999 };
const modalStyle = { background:'#ffffff',borderRadius:16,padding:'32px 40px',maxWidth:420,width:'90%',textAlign:'center',boxShadow:'0 25px 50px -12px rgba(0,0,0,0.25)' };
const buttonStyle = { background:'#3b82f6',color:'#ffffff',border:'none',borderRadius:10,padding:'12px 32px',fontSize:15,fontWeight:600,cursor:'pointer',transition:'background 0.2s ease',width:'100%' };

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
