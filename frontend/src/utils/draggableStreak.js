import { useRef, useEffect, useState } from 'react';

export const useDraggableStreak = () => {
  const elementRef = useRef(null);
  const [hasMoved, setHasMoved] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const margin = 10;
    const defaultSize = 80; // Reasonable fallback size
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;
    let lastEventTime = 0;
    let lastClientX = 0;
    let velocityX = 0;
    let resizeTimeout = null;

    element.style.cursor = "grab";
    element.ondragstart = () => false;

    const getElementSize = () => {
      const rect = element.getBoundingClientRect();
      const width = element.offsetWidth || rect.width || defaultSize;
      const height = element.offsetHeight || rect.height || defaultSize;
      return { width, height };
    };

    const getBounds = (width, height) => {
      const sw = window.innerWidth;
      const sh = window.innerHeight;
      return {
        maxX: Math.max(margin, sw - width - margin),
        maxY: Math.max(margin, sh - height - margin),
        sw,
        sh
      };
    };

    const savePosition = (left, top) => {
      localStorage.setItem('streak_position', JSON.stringify({ left, top }));
    };

    const enforceBounds = (animate = false) => {
      if (!element) return null;
      
      const { width, height } = getElementSize();
      const { maxX, maxY } = getBounds(width, height);
      
      const rect = element.getBoundingClientRect();
      let currentLeft = rect.left;
      let currentTop = rect.top;

      let newLeft = Math.max(margin, Math.min(currentLeft, maxX));
      let newTop = Math.max(margin, Math.min(currentTop, maxY));

      if (animate) {
        element.style.transition = "left 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), top 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)";
      } else {
        element.style.transition = "none";
      }

      element.style.left = `${newLeft}px`;
      element.style.top = `${newTop}px`;
      element.style.right = 'auto';
      element.style.bottom = 'auto';
      
      return { left: newLeft, top: newTop };
    };
    
    const forceRepaintAndFixScale = () => {
    if (!element) return;

    // Reset mọi transform có thể gây scale
    element.style.transform = "scale(1)";
    element.style.zoom = "1";

    // Force GPU repaint
    element.style.transform = "translateZ(0)";

    // Force reflow (rất quan trọng)
    void element.offsetHeight;

    // Reset lại transform chuẩn
    element.style.transform = "scale(1)";
  };

    const handleResize = () => {
      if (isDragging) return;
      if (resizeTimeout) clearTimeout(resizeTimeout);
      
      resizeTimeout = setTimeout(() => {
        forceRepaintAndFixScale();
        const newPos = enforceBounds(true);
        if (newPos) {
          savePosition(newPos.left, newPos.top);
        }
      }, 50);
    };

    // MOUNT INITIALIZATION
    const initTimer = setTimeout(() => {
      const { width, height } = getElementSize();
      const { maxX, maxY, sw, sh } = getBounds(width, height);
      const saved = localStorage.getItem('streak_position');

      let initLeft, initTop;

      if (saved) {
        try {
          const pos = JSON.parse(saved);
          if (typeof pos.left === 'number' && typeof pos.top === 'number') {
            initLeft = pos.left;
            initTop = pos.top;
          }
        } catch (e) {}
      }

      // Fallback: bottom-right
      if (initLeft === undefined || initTop === undefined) {
        initLeft = Math.max(margin, sw - width - margin);
        initTop = Math.max(margin, Math.min(sh * 0.75, sh - height - margin));
      }

      // Clamp initial pos
      initLeft = Math.max(margin, Math.min(initLeft, maxX));
      initTop = Math.max(margin, Math.min(initTop, maxY));

      element.style.transition = "none";
      element.style.left = `${initLeft}px`;
      element.style.top = `${initTop}px`;
      element.style.right = 'auto';
      element.style.bottom = 'auto';

      enforceBounds(false); // Double check layout
    }, 50);

    const onPointerDown = (e) => {
      if (e.button !== 0 && e.type !== 'touchstart') return;

      isDragging = true;
      setHasMoved(false);
      
      element.style.transition = "none";

      const rect = element.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      
      lastEventTime = performance.now();
      lastClientX = e.clientX;
      velocityX = 0;

      element.style.left = `${rect.left}px`;
      element.style.top = `${rect.top}px`;
      element.style.right = 'auto';
      element.style.bottom = 'auto';
      element.style.cursor = "grabbing";

      try {
        element.setPointerCapture(e.pointerId);
      } catch (err) {}
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;
      
      setHasMoved(prev => {
        if (!prev) return true;
        return prev;
      });

      const now = performance.now();
      const dt = now - lastEventTime;
      if (dt > 0) {
        velocityX = (e.clientX - lastClientX) / dt;
      }
      lastEventTime = now;
      lastClientX = e.clientX;

      const { width, height } = getElementSize();
      const { maxX, maxY } = getBounds(width, height);

      let x = e.clientX - offsetX;
      let y = e.clientY - offsetY;

      // Strict Clamp
      x = Math.max(margin, Math.min(x, maxX));
      y = Math.max(margin, Math.min(y, maxY));

      element.style.left = `${x}px`;
      element.style.top = `${y}px`;
    };

    const onPointerUp = (e) => {
      if (!isDragging) return;

      isDragging = false;
      element.style.cursor = "grab";

      try {
        element.releasePointerCapture(e.pointerId);
      } catch (err) {}

      const { width, height } = getElementSize();
      const { maxX, maxY, sw } = getBounds(width, height);
      const rect = element.getBoundingClientRect();

      // Magnetic snap with inertia projection
      const currentLeft = rect.left;
      const currentTop = rect.top;
      const center = currentLeft + width / 2;
      const middle = sw / 2;
      
      // Project center 150ms into future based on velocity
      const projectedCenter = center + (velocityX * 150);

      let finalLeft;
      if (projectedCenter < middle) {
        finalLeft = margin;
      } else {
        finalLeft = maxX;
      }
      
      let finalTop = Math.max(margin, Math.min(currentTop, maxY));

      element.style.transition = "left 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.2), top 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)";
      element.style.left = `${finalLeft}px`;
      element.style.top = `${finalTop}px`;
      
      savePosition(finalLeft, finalTop);

      setTimeout(() => {
        setHasMoved(false);
      }, 50);
    };

    element.addEventListener("pointerdown", onPointerDown);
    element.addEventListener("pointermove", onPointerMove);
    element.addEventListener("pointerup", onPointerUp);
    element.addEventListener("pointercancel", onPointerUp);
    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(initTimer);
      if (resizeTimeout) clearTimeout(resizeTimeout);
      element.removeEventListener("pointerdown", onPointerDown);
      element.removeEventListener("pointermove", onPointerMove);
      element.removeEventListener("pointerup", onPointerUp);
      element.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return { elementRef, hasMoved };
};
