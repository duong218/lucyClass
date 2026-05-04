import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

const RecaptchaContext = createContext({ isReady: false, executeRecaptcha: null });

export const useRecaptcha = () => useContext(RecaptchaContext);

export const RecaptchaProvider = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const isLoadedRef = useRef(false);

  const checkAvailability = useCallback(() => {
    if (window.grecaptcha && typeof window.grecaptcha.execute === 'function') {
      window.grecaptcha.ready(() => {
        setIsReady(true);
        isLoadedRef.current = true;
      });
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    // 1. Double mount check
    if (isLoadedRef.current) return;

    // 2. Already exists in window?
    if (checkAvailability()) return;

    // 3. Script already in DOM?
    const SCRIPT_URL = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
    const existingScript = document.querySelector(`script[src="${SCRIPT_URL}"]`);
    if (existingScript) {
      existingScript.onload = checkAvailability;
      const interval = setInterval(() => {
        if (checkAvailability()) clearInterval(interval);
      }, 500);
      return () => clearInterval(interval);
    }

    // 4. Create and inject script
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = checkAvailability;
    script.onerror = () => console.error("[RecaptchaProvider] Script load failed");
    document.head.appendChild(script);

    return () => {
      // Script stays in head to prevent reload issues
    };
  }, [checkAvailability]);

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
