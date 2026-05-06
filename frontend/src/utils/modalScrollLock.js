let scrollPosition = 0;
let modalCount = 0;
let lenisInstance = null;

/**
 * Đăng ký Lenis instance để modalScrollLock có thể stop/start nó.
 * Gọi hàm này từ LenisProvider sau khi tạo Lenis.
 */
export const registerLenis = (lenis) => {
  lenisInstance = lenis;
};

export const unregisterLenis = () => {
  lenisInstance = null;
};

export const lockScroll = () => {
  if (typeof document === 'undefined') return;

  if (modalCount === 0) {
    scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
  }

  const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;

  // Chặn native scroll
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
  document.body.style.paddingRight = `${scrollBarWidth}px`;

  // Chặn Lenis smooth scroll — quan trọng!
  if (lenisInstance) {
    lenisInstance.stop();
  }
};

export const unlockScroll = () => {
  if (typeof document === 'undefined') return;

  const restorePosition = scrollPosition;

  document.documentElement.style.overflow = '';
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';

  // Khởi động lại Lenis smooth scroll
  if (lenisInstance) {
    lenisInstance.start();
  }

  // Restore scroll sau khi overflow đã clear
  window.scrollTo(0, restorePosition);
};

export const openModal = () => {
  if (modalCount === 0) lockScroll();
  modalCount++;
};

export const closeModal = () => {
  if (modalCount > 0) {
    modalCount--;
    if (modalCount === 0) unlockScroll();
  }
};
