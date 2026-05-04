import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
const SCRIPT_URL = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;

const RecaptchaContext = createContext({ isReady: false, executeRecaptcha: null });

export const useRecaptcha = () => useContext(RecaptchaContext);

export const RecaptchaProvider = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const isLoadedRef = useRef(false);

  useEffect(() => {
    if (isLoadedRef.current) return;

    // Inject script nếu chưa có trong DOM
    if (!document.querySelector(`script[src="${SCRIPT_URL}"]`)) {
      const script = document.createElement('script');
      script.src = SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.onerror = () => console.error('[RecaptchaProvider] Script load failed');
      document.head.appendChild(script);
    }

    // Poll cho đến khi grecaptcha.ready() fire — không phụ thuộc onload
    const interval = setInterval(() => {
      if (window.grecaptcha && typeof window.grecaptcha.execute === 'function') {
        clearInterval(interval);
        window.grecaptcha.ready(() => {
          if (isLoadedRef.current) return;
          isLoadedRef.current = true;
          setIsReady(true);
        });
      }
    }, 300);

    // Fallback: sau 8s nếu vẫn chưa ready thì force (tránh block UI mãi mãi)
    const timeout = setTimeout(() => {
      if (!isLoadedRef.current && window.grecaptcha?.execute) {
        console.warn('[RecaptchaProvider] Forcing isReady after timeout');
        clearInterval(interval);
        isLoadedRef.current = true;
        setIsReady(true);
      }
    }, 8000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  /**
   * Execute reCAPTCHA v3 and return a token.
   * @param {string} action - The action name (e.g. 'login', 'register', 'forgot_password')
   * @returns {Promise<string|null>} The token, or null on failure
   */
  const executeRecaptcha = useCallback(async (action = 'submit') => {
    if (!isReady || !window.grecaptcha) {
      console.warn('[RecaptchaProvider] grecaptcha not ready');
      return null;
    }
    try {
      const token = await window.grecaptcha.execute(SITE_KEY, { action });
      return token;
    } catch (err) {
      console.error('[RecaptchaProvider] Execute error:', err);
      return null;
    }
  }, [isReady]);

  return (
    <RecaptchaContext.Provider value={{ isReady, executeRecaptcha }}>
      {children}
    </RecaptchaContext.Provider>
  );
};