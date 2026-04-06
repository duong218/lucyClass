import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import api, { fetchCsrfToken, setInitializing, setAccessToken } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [sessionConflict, setSessionConflict] = useState(false);
  const initRef = useRef(false);
  const conflictHandledRef = useRef(false);

  // =========================
  // 🚪 LOGOUT (defined early for event handlers)
  // =========================
  const performLogout = useCallback(async (skipApi = false) => {
    if (!skipApi) {
      try {
        await api.post('/auth/logout');
      } catch (err) {
        console.warn('[Auth] Logout API failed');
      }
    }
    localStorage.removeItem('hasSession');
    setUser(null);
  }, []);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const initializeAuth = async () => {
      try {
        console.log('[Auth] Initializing...');

        await fetchCsrfToken();

        // 1. Try to validate session via cookie
        try {
          const meRes = await api.get('/auth/me');
          setUser(meRes.data?.user || meRes.data);
          localStorage.setItem('hasSession', 'true');
        } catch (meError) {
          // 🎯 Silent cleanup on initial load conflict
          if (meError?.code === 'SESSION_CONFLICT' || meError?.response?.data?.code === 'SESSION_CONFLICT') {
            console.log('[Auth] Session conflict detected on init - silent cleanup');
            localStorage.removeItem('hasSession');
            setUser(null);
            return;
          }

          // 2. If /me fails, check if we expected a session
          const hasSession = localStorage.getItem('hasSession') === 'true';
          
          if (hasSession) {
            console.log('[Auth] Session expected, attempting refresh...');
            try {
              const refreshRes = await api.post('/auth/refresh-token', {});
              if (refreshRes.data.accessToken) {
                setAccessToken(refreshRes.data.accessToken);
              }
              const meRes = await api.get('/auth/me');
              setUser(meRes.data?.user || meRes.data);
            } catch (refreshError) {
              // 🎯 Silent cleanup on refresh conflict
              const refreshData = refreshError?.response?.data || refreshError;
              if (refreshData?.code === 'SESSION_CONFLICT') {
                console.log('[Auth] Session conflict detected on refresh - silent cleanup');
                localStorage.removeItem('hasSession');
                setUser(null);
                return;
              }
              console.warn('[Auth] Refresh failed, clearing session');
              localStorage.removeItem('hasSession');
              setUser(null);
            }
          } else {
            console.log('[Auth] No session indicator, skipping refresh');
            setUser(null);
          }
        }
      } catch (err) {
        console.warn('[Auth] Init error:', err.message);
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

    // ✅ LISTEN LOGOUT EVENT
    const handleLogoutEvent = () => {
      console.log('[Auth] Logout event triggered');
      localStorage.removeItem('hasSession');
      setUser(null);
      window.location.href = '/admin/login';
    };

    // ✅ LISTEN SESSION CONFLICT EVENT
    const handleSessionConflict = () => {
      if (conflictHandledRef.current) return;
      
      // 🎯 Only show popup if user was previously authenticated
      if (user) {
        console.warn('[Auth] Session conflict detected for active user');
        conflictHandledRef.current = true;
        setSessionConflict(true);
      } else {
        // Silent cleanup for non-authenticated state (e.g. initial load)
        console.log('[Auth] Session conflict detected for null user - silent cleanup');
        localStorage.removeItem('hasSession');
        setUser(null);
      }
    };

    window.addEventListener('auth:logout', handleLogoutEvent);
    window.addEventListener('session:conflict', handleSessionConflict);

    return () => {
      window.removeEventListener('auth:logout', handleLogoutEvent);
      window.removeEventListener('session:conflict', handleSessionConflict);
    };
  }, []);

  // ✅ POLLING SESSION CONFLICT (Idle Detection)
  useEffect(() => {
    if (!user || sessionConflict) return;

    const interval = setInterval(async () => {
      try {
        // Light-weight endpoint that will trigger 401 if session conflict exists
        await api.get('/auth/check-session');
      } catch (err) {
        // Double check conflict code in case event listener missed it
        if (err?.code === 'SESSION_CONFLICT' || err?.response?.data?.code === 'SESSION_CONFLICT') {
          console.warn('[Auth] Session conflict detected via polling');
          setSessionConflict(true);
        }
        console.warn('[Auth] Check session error:', err.message);
      }
    }, 10000); // 🎯 10 seconds (for faster detection)

    return () => clearInterval(interval);
  }, [user, sessionConflict]);

  // =========================
  // 🔐 LOGIN
  // =========================
  const login = async (credentials) => {
    setLoading(true);
    try {
      // Reset conflict state on new login
      setSessionConflict(false);
      conflictHandledRef.current = false;

      const res = await api.post('/auth/login', credentials);

      await fetchCsrfToken();

      if (res.data.accessToken) {
        setAccessToken(res.data.accessToken);
      }

      localStorage.setItem('hasSession', 'true');
      setUser(res.data.user);

      return true;
    } catch (error) {
      console.error('[Auth] Login failed:', error.message);
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
  // 🔒 SESSION CONFLICT HANDLER
  // =========================
  const handleConflictDismiss = () => {
    setSessionConflict(false);
    conflictHandledRef.current = false;
    localStorage.removeItem('hasSession');
    setUser(null);
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
        isAuthenticated: !!user
      }}
    >
      {children}

      {/* 🔒 SESSION CONFLICT MODAL */}
      {sessionConflict && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div style={iconContainerStyle}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <h2 style={titleStyle}>Phiên đăng nhập bị gián đoạn</h2>
            <p style={messageStyle}>
              Tài khoản của bạn đã được đăng nhập từ thiết bị khác. 
              Vui lòng đăng nhập lại.
            </p>
            <button 
              onClick={handleConflictDismiss} 
              style={buttonStyle}
              onMouseOver={(e) => e.target.style.background = '#2563eb'}
              onMouseOut={(e) => e.target.style.background = '#3b82f6'}
            >
              OK - Đăng nhập lại
            </button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

// =========================
// 💅 MODAL STYLES
// =========================
const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 99999,
  animation: 'fadeIn 0.3s ease'
};

const modalStyle = {
  background: '#ffffff',
  borderRadius: '16px',
  padding: '32px 40px',
  maxWidth: '420px',
  width: '90%',
  textAlign: 'center',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  animation: 'slideUp 0.3s ease'
};

const iconContainerStyle = {
  marginBottom: '16px'
};

const titleStyle = {
  fontSize: '18px',
  fontWeight: '700',
  color: '#1e293b',
  margin: '0 0 12px 0',
  lineHeight: '1.4'
};

const messageStyle = {
  fontSize: '14px',
  color: '#64748b',
  margin: '0 0 24px 0',
  lineHeight: '1.6'
};

const buttonStyle = {
  background: '#3b82f6',
  color: '#ffffff',
  border: 'none',
  borderRadius: '10px',
  padding: '12px 32px',
  fontSize: '15px',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'background 0.2s ease',
  width: '100%'
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};