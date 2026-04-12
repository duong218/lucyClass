import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useRecaptcha } from './RecaptchaProvider';

const RecaptchaBox = forwardRef(({ onVerify }, ref) => {
  const { isReady } = useRecaptcha();
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const isRenderingRef = useRef(false);
  const onVerifyRef = useRef(onVerify);

  // Keep callback ref updated without triggering effects
  useEffect(() => {
    onVerifyRef.current = onVerify;
  }, [onVerify]);

  // Expose reset to parent
  useImperativeHandle(ref, () => ({
    reset: () => {
      if (window.grecaptcha && widgetIdRef.current !== null) {
        try {
          window.grecaptcha.reset(widgetIdRef.current);
          if (onVerifyRef.current) onVerifyRef.current(null);
        } catch (e) {
          console.warn("[RecaptchaBox] reset error:", e);
        }
      }
    }
  }), []);

  useEffect(() => {
  let isMounted = true;
  let retryCount = 0;

  const render = () => {
    if (!isMounted) return;

    if (
      !isReady ||
      !window.grecaptcha ||
      !containerRef.current
    ) {
      if (retryCount < 10) {
        retryCount++;
        setTimeout(render, 300);
      }
      return;
    }

    if (widgetIdRef.current !== null || isRenderingRef.current) return;

    const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
    if (!siteKey) {
      console.warn("[RecaptchaBox] No site key found");
      return;
    }

    try {
      isRenderingRef.current = true;

      containerRef.current.innerHTML = '';

      const id = window.grecaptcha.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token) => {
          if (isMounted && onVerifyRef.current) {
            onVerifyRef.current(token);
          }
        },
        'expired-callback': () => {
          if (isMounted && onVerifyRef.current) {
            onVerifyRef.current(null);
          }
        },
        'error-callback': () => {
          if (isMounted && onVerifyRef.current) {
            onVerifyRef.current(null);
          }
        }
      });

      widgetIdRef.current = id;

    } catch (err) {
      console.warn("[RecaptchaBox] Retry render:", err);
      if (retryCount < 10) {
        retryCount++;
        setTimeout(render, 500);
      }
    } finally {
      isRenderingRef.current = false;
    }
  };

  render();

  return () => {
    isMounted = false;

    if (widgetIdRef.current !== null) {
      try {
        window.grecaptcha.reset(widgetIdRef.current);
      } catch (e) {}
      widgetIdRef.current = null;
    }

    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    isRenderingRef.current = false;
  };
}, [isReady]);

  return (
    <div className="recaptcha-outer flex justify-center py-2 min-h-[78px] z-[1]">
      <div 
        ref={containerRef} 
        className="recaptcha-inner"
        style={{ minHeight: '78px', minWidth: '302px' }}
      ></div>
    </div>
  );
});

RecaptchaBox.displayName = 'RecaptchaBox';

export default RecaptchaBox;
