import { useLayoutEffect, useRef } from 'react';

/**
 * Ultimate Stable Scroll Lock Hook - Mobile Fixed
 * 
 * Root cause of mobile jump:
 * The `position: fixed` approach causes a layout recalculation before
 * window.scrollTo fires, making the page visually snap to top then jump back.
 * 
 * Fix: Use `overflow: hidden` on <html> instead of `position: fixed` on <body>.
 * This preserves scroll position natively without any scrollTo restore needed.
 * paddingRight compensation still applied to prevent layout shift from scrollbar.
 * 
 * @param {boolean} isOpen - Modal open state
 */
export const useLockBodyScroll = (isOpen) => {
  const scrollBarWidthRef = useRef(0);

  useLayoutEffect(() => {
    if (!isOpen) return;

    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    scrollBarWidthRef.current = scrollBarWidth;

    const html = document.documentElement;
    const body = document.body;

    // Lock via overflow on <html> — browser keeps scroll position internally
    html.style.overflow = 'hidden';

    // Compensate scrollbar width to prevent layout shift
    if (scrollBarWidth > 0) {
      body.style.paddingRight = `${scrollBarWidth}px`;
    }

    // Prevent touch scroll bleed-through on iOS
    body.style.touchAction = 'none';

    return () => {
      html.style.overflow = '';
      body.style.paddingRight = '';
      body.style.touchAction = '';
      // ✅ NO scrollTo needed — scroll position was never lost
    };
  }, [isOpen]);
};