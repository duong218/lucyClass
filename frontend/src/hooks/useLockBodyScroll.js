import { useLayoutEffect, useRef } from 'react';
// Import trực tiếp từ modalScrollLock để dùng cùng lenisInstance
import { lockScroll, unlockScroll } from '../utils/modalScrollLock';

/**
 * useLockBodyScroll
 *
 * Khoá cuộn trang (bao gồm Lenis smooth scroll) khi modal mở.
 * Dùng lockScroll/unlockScroll từ modalScrollLock để đảm bảo
 * Lenis được stop/start đúng cách, tránh xung đột với openModal/closeModal.
 *
 * @param {boolean} isOpen - Modal open state
 */
export const useLockBodyScroll = (isOpen) => {
  useLayoutEffect(() => {
    if (!isOpen) return;

    lockScroll();

    return () => {
      unlockScroll();
    };
  }, [isOpen]);
};