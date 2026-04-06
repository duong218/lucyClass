let scrollPosition = 0;
let modalCount = 0;

/**
 * Robust Scroll Lock System
 * Handles scrollbar jumps, iOS bleed, and nested modals
 */
export const lockScroll = () => {
  if (typeof document === 'undefined') return;

  // Calculate scrollbar width to prevent "jumping"
  const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
  scrollPosition = window.pageYOffset;

  // Apply styles to body
  document.body.style.overflow = 'hidden';
  document.body.style.paddingRight = `${scrollBarWidth}px`;
  
  // Extra stability for iOS and specific browsers
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollPosition}px`;
  document.body.style.left = '0';
  document.body.style.right = '0';
  document.body.style.width = '100%';
};

export const unlockScroll = () => {
  if (typeof document === 'undefined') return;

  // Restore styles
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.left = '';
  document.body.style.right = '';
  document.body.style.width = '';

  // Restore scroll position
  window.scrollTo(0, scrollPosition);
};

export const openModal = () => {
  if (modalCount === 0) {
    lockScroll();
  }
  modalCount++;
};

export const closeModal = () => {
  if (modalCount > 0) {
    modalCount--;
    if (modalCount === 0) {
      unlockScroll();
    }
  }
};
