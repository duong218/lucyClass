let scrollPosition = 0;
let modalCount = 0;

export const lockScroll = () => {
  if (typeof document === 'undefined') return;

  if (modalCount === 0) {
    scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
  }

  const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;

  // Chỉ dùng overflow hidden — KHÔNG dùng position:fixed
  // position:fixed reset scrollTop về 0 trên mobile, gây bug cuộn lên top
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
  document.body.style.paddingRight = `${scrollBarWidth}px`;
};

export const unlockScroll = () => {
  if (typeof document === 'undefined') return;

  const restorePosition = scrollPosition;

  document.documentElement.style.overflow = '';
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';

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
