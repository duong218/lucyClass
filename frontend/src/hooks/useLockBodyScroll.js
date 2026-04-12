import { useLayoutEffect } from 'react';

/**
 * Ultimate Stable Scroll Lock Hook
 * Prevents jumping, ensures background stability, and works across all devices.
 * Uses the position: fixed technique with full containment.
 * 
 * @param {boolean} isOpen - Modal open state
 */
export const useLockBodyScroll = (isOpen) => {
  useLayoutEffect(() => {
    if (!isOpen) return;

    // ✅ lưu vào biến thật
    const scrollY = window.scrollY;
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;

    // lock body
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.paddingRight = `${scrollBarWidth}px`;

    document.body.style.touchAction = 'none';

    return () => {
      // restore styles
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.body.style.paddingRight = '';

      // ✅ dùng scrollY gốc (KHÔNG parse từ style)
      document.body.style.touchAction = '';
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);
};
