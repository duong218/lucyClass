import axios from 'axios';

// ✅ Base URL
// In local dev, use "" so requests go through the Vite proxy (same-origin).
// We explicitly ignore localhost backend URLs to prevent cross-origin cookie rejection.
const envUrl = import.meta.env.VITE_API_URL || "";
export const BASE_URL = (envUrl.includes('localhost:5000') || envUrl.includes('127.0.0.1:5000'))
  ? ""
  : envUrl;

// ✅ Axios instance
const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  withCredentials: true // gửi refreshToken cookie
});

// ==============================
// 🔐 ACCESS TOKEN MANAGEMENT (In-Memory)
// ==============================
let _accessToken = null;

export const setAccessToken = (token) => {
  _accessToken = token;
};

// ==============================
// 🔐 CSRF TOKEN HANDLING
// ==============================
let _csrfToken = null;

export const setCsrfToken = (token) => {
  _csrfToken = token;
};

export const fetchCsrfToken = async () => {
  try {
    // ✅ Use api instance (goes through Vite proxy in dev, uses BASE_URL in prod)
    const response = await api.get('/csrf-token');
    setCsrfToken(response.data.csrfToken);
    return response.data.csrfToken;
  } catch (error) {
    console.warn('[CSRF] Fetch failed:', error.message);
    return null;
  }
};

// ==============================
// 🚀 REQUEST INTERCEPTOR
// ==============================
api.interceptors.request.use(
  (config) => {
    // ✅ Attach Access Token if available
    if (_accessToken) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${_accessToken}`;
    }

    // ✅ Attach CSRF token for write methods
    const method = config.method?.toLowerCase();
    if (['post', 'put', 'delete', 'patch'].includes(method) && _csrfToken) {
      config.headers = config.headers || {};
      config.headers['X-CSRF-Token'] = _csrfToken;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ==============================
// 🔁 REFRESH TOKEN STATE
// ==============================
let isRefreshing = false;
let failedQueue = [];

let _isInitializing = false;
export const setInitializing = (val) => {
  _isInitializing = val;
};

// xử lý queue khi refresh xong
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// ==============================
// 🔄 RESPONSE INTERCEPTOR
// ==============================
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error?.response?.data || error);
    }

    // 🎯 Handle 401
    if (
      error.response?.status === 401 &&
      !originalRequest.url.includes('/auth/logout')
    ) {
      const data = error.response?.data || {};
      const message = (data.message || '').toLowerCase();

      // 🎯 SESSION_CONFLICT: another device logged in
      if (data.code === 'SESSION_CONFLICT') {
        console.warn('[API] Session conflict detected - another device logged in');
        localStorage.removeItem('hasSession');
        window.dispatchEvent(new CustomEvent('session:conflict', {
          detail: { message: data.message }
        }));
        return Promise.reject(data);
      }

      // 🔥 FIX: check cả message + structure
      if (
        message.includes('google') ||
        data?.success === false && message.includes('expired')
      ) {
        console.warn('[API] Google token expired - skip refresh');
        return Promise.reject(data || error);
      }

      // ❌ Nếu đã retry rồi → reject
      if (originalRequest._retry) {
        return Promise.reject(error.response?.data || error);
      }

      // ✅ đánh dấu retry
      originalRequest._retry = true;

      // ==========================
      // 🧠 Check if session is expected
      // ==========================
      const hasSession = localStorage.getItem('hasSession') === 'true';
      if (!hasSession) {
        return Promise.reject(error.response?.data || error);
      }

      // ==========================
      // 🧠 Nếu đang refresh → queue lại
      // ==========================
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      // ==========================
      // 🚀 START REFRESH FLOW
      // ==========================
      isRefreshing = true;
      console.log('[API] 401 → Refreshing token...');

      return new Promise((resolve, reject) => {
        // ✅ Use api instance for refresh (goes through Vite proxy, sends cookies)
        api.post('/auth/refresh-token', {})
          .then((res) => {
            console.log('[API] Refresh success');

            // 🎯 NEW: Capture accessToken from response JSON
            const newAccessToken = res.data.accessToken;
            if (newAccessToken) {
              setAccessToken(newAccessToken);
            }

            localStorage.setItem('hasSession', 'true');

            // ✅ Giải queue
            processQueue(null);

            // ✅ Retry request cũ
            resolve(api(originalRequest));
          })
          .catch((refreshError) => {
            console.error('[API] Refresh failed');
            localStorage.removeItem('hasSession');

            const refreshData = refreshError.response?.data || refreshError.data || {};
            const isRefreshFail = refreshError.response?.status === 401
              || (refreshError.status === 401);

            // 🎯 SESSION_CONFLICT from refresh endpoint
            if (refreshData.code === 'SESSION_CONFLICT') {
              console.warn('[API] Session conflict during refresh');
              window.dispatchEvent(new CustomEvent('session:conflict', {
                detail: { message: refreshData.message }
              }));
            } else if (isRefreshFail && !_isInitializing) {
              // ❌ Refresh token cũng chết → logout
              window.dispatchEvent(new CustomEvent('auth:logout', {
                detail: { reason: 'session_expired' }
              }));
            }

            processQueue(refreshError, null);
            reject(refreshError);
          })
          .finally(() => {
            isRefreshing = false;
          });
      });
    }

    // ==========================
    // ❌ OTHER ERRORS
    // ==========================
    return Promise.reject(
      error?.response?.data || {
        success: false,
        message: 'Hệ thống đang bảo trì'
      }
    );
  }
);

export default api;