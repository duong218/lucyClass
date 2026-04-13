import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useRecaptcha } from './RecaptchaProvider';

const RecaptchaBox = forwardRef(({ onVerify }, ref) => {
  const { isReady } = useRecaptcha();
  const outerRef = useRef(null);       // stable wrapper div — never replaced
  const containerRef = useRef(null);   // inner div given to grecaptcha — replaced on each mount
  const widgetIdRef = useRef(null);
  const isRenderingRef = useRef(false);
  const onVerifyRef = useRef(onVerify);

  useEffect(() => {
    onVerifyRef.current = onVerify;
  }, [onVerify]);

  useImperativeHandle(ref, () => ({
    reset: () => {
      if (window.grecaptcha && widgetIdRef.current !== null) {
        try {
          window.grecaptcha.reset(widgetIdRef.current);
          if (onVerifyRef.current) onVerifyRef.current(null);
        } catch (e) {
          console.warn('[RecaptchaBox] reset error:', e);
        }
      }
    }
  }), []);

  useEffect(() => {
    let isMounted = true;
    let retryTimeout = null;
    let retryCount = 0;

    // ✅ KEY FIX: Create a fresh DOM node each mount cycle.
    // grecaptcha tracks ownership by DOM node reference.
    // Re-using the same node (even after innerHTML='') still triggers
    // "already been rendered" because grecaptcha holds a ref to the node itself.
    const freshContainer = document.createElement('div');
    freshContainer.style.minHeight = '78px';
    freshContainer.style.minWidth = '302px';

    if (outerRef.current) {
      if (containerRef.current && outerRef.current.contains(containerRef.current)) {
        outerRef.current.replaceChild(freshContainer, containerRef.current);
      } else {
        outerRef.current.appendChild(freshContainer);
      }
    }
    containerRef.current = freshContainer;

    const render = () => {
      if (!isMounted) return;

      if (!isReady || !window.grecaptcha || !containerRef.current) {
        if (retryCount < 10) {
          retryCount++;
          retryTimeout = setTimeout(render, 300);
        }
        return;
      }

      if (widgetIdRef.current !== null) return;
      if (isRenderingRef.current) return;

      const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
      if (!siteKey) {
        console.warn('[RecaptchaBox] No site key found');
        return;
      }

      isRenderingRef.current = true;

      try {
        const id = window.grecaptcha.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token) => {
            if (isMounted && onVerifyRef.current) onVerifyRef.current(token);
          },
          'expired-callback': () => {
            if (isMounted && onVerifyRef.current) onVerifyRef.current(null);
          },
          'error-callback': () => {
            if (isMounted && onVerifyRef.current) onVerifyRef.current(null);
          },
        });

        widgetIdRef.current = id;
        isRenderingRef.current = false;

      } catch (err) {
        isRenderingRef.current = false;
        console.warn('[RecaptchaBox] Render error:', err?.message);

        if (retryCount < 3) {
          retryCount++;
          retryTimeout = setTimeout(render, 500);
        } else {
          console.warn('[RecaptchaBox] Gave up rendering reCAPTCHA.');
        }
      }
    };

    render();

    return () => {
      isMounted = false;
      clearTimeout(retryTimeout);

      if (widgetIdRef.current !== null) {
        try {
          window.grecaptcha?.reset(widgetIdRef.current);
        } catch (_) {}
        widgetIdRef.current = null;
      }

      // ✅ Remove the node entirely — grecaptcha loses its reference.
      // Next mount injects a brand-new node it has never seen before.
      if (containerRef.current && outerRef.current?.contains(containerRef.current)) {
        outerRef.current.removeChild(containerRef.current);
      }
      containerRef.current = null;
      isRenderingRef.current = false;
    };
  }, [isReady]);

  return (
    <div className="recaptcha-outer flex justify-center py-2 min-h-[78px] z-[1]">
      {/* outerRef is the stable anchor — containerRef node is swapped each lifecycle */}
      <div ref={outerRef} />
    </div>
  );
});

RecaptchaBox.displayName = 'RecaptchaBox';

export default RecaptchaBox;
