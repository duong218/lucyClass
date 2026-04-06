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

    // Save current scroll position
    const scrollY = window.scrollY;
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;

    // Apply styles to lock body and prevent jump
    // Adding left: 0 and right: 0 for extra stability on mobile browsers
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.paddingRight = `${scrollBarWidth}px`;

    return () => {
      // Restore styles
      const savedScrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.body.style.paddingRight = '';
      
      // Restore scroll position
      window.scrollTo(0, parseInt(savedScrollY || '0') * -1);
    };
  }, [isOpen]);
};
