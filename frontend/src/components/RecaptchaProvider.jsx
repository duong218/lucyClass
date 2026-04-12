import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const RecaptchaContext = createContext({ isReady: false });

export const useRecaptcha = () => useContext(RecaptchaContext);

const SCRIPT_URL = 'https://www.google.com/recaptcha/api.js?render=explicit';

export const RecaptchaProvider = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const isLoadedRef = useRef(false);

  const checkAvailability = useCallback(() => {
    if (window.grecaptcha && typeof window.grecaptcha.render === 'function') {
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
    const existingScript = document.querySelector(`script[src="${SCRIPT_URL}"]`);
    if (existingScript) {
      existingScript.onload = checkAvailability;
      // Safety interval in case onload doesn't fire (e.g. cached but not executed)
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

  return (
    <RecaptchaContext.Provider value={{ isReady }}>
      {children}
    </RecaptchaContext.Provider>
  );
};
