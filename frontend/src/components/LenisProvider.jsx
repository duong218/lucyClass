import { createContext, useContext, useEffect, useRef } from 'react';
import Lenis from 'lenis';

const LenisContext = createContext(null);

/**
 * Hook lấy instance Lenis để dùng scrollTo ở bất kỳ component nào.
 */
export const useLenis = () => useContext(LenisContext);

/**
 * LenisProvider — bọc toàn bộ app để kích hoạt cuộn mượt (smooth scroll).
 * Chỉ xử lý cuộn, KHÔNG thay đổi bất kỳ logic nào khác.
 */
const LenisProvider = ({ children }) => {
  const lenisRef = useRef(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,          // thời gian easing (giây)
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // easeOutExpo
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      touchMultiplier: 2,
    });

    lenisRef.current = lenis;

    // RAF loop — Lenis cần được gọi raf() mỗi frame
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return (
    <LenisContext.Provider value={lenisRef}>
      {children}
    </LenisContext.Provider>
  );
};

export default LenisProvider;
