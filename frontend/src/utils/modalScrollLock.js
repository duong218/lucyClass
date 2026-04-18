let scrollPosition = 0;
let modalCount = 0;

/**
 * Robust Scroll Lock System
 * Handles scrollbar jumps, iOS bleed, and nested modals
 */
export const lockScroll = () => {
  if (typeof document === 'undefined') return;

  // Chỉ lưu scrollPosition lần đầu tiên (tránh overwrite khi nested modal)
  if (modalCount === 0) {
    scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
  }

  // Calculate scrollbar width to prevent "jumping"
  const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;

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

  // Cache lại trước khi clear để tránh mất giá trị
  const restorePosition = scrollPosition;

  // Restore styles trước
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.left = '';
  document.body.style.right = '';
  document.body.style.width = '';

  // Double RAF: frame 1 chờ browser reflow xong layout,
  // frame 2 scroll sau khi layout đã stable
  // Fix race condition trên cả iOS Safari lẫn Android Chrome/WebView
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.scrollTo(0, restorePosition);

      // Fallback thêm cho Android WebView / Samsung Internet
      // Nếu scroll vẫn sai sau 100ms thì force lại, nếu đúng thì không làm gì
      setTimeout(() => {
        if (window.pageYOffset !== restorePosition) {
          window.scrollTo(0, restorePosition);
        }
      }, 100);
    });
  });
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
