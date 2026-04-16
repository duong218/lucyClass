import { useRef, useEffect, useState } from 'react';

export const useDraggableStreak = () => {
  const elementRef = useRef(null);
  const [hasMoved, setHasMoved] = useState(false);
  const supportsPointer = !!window.PointerEvent;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const margin = 10;
    const defaultSize = 80; // Reasonable fallback size
    const dragThreshold = 8; // px: small finger jitter should still count as tap
    let isDragging = false;
    let didDrag = false;
    let offsetX = 0;
    let offsetY = 0;
    let startClientX = 0;
    let startClientY = 0;
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
      // iOS fix: visualViewport?.height to calculate real mobile screen without keyboard/navbars
      const sh = window.visualViewport?.height || window.innerHeight; 
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

    const getClientCoords = (e) => {
      return {
        clientX: e.clientX ?? (e.touches?.[0]?.clientX || e.changedTouches?.[0]?.clientX),
        clientY: e.clientY ?? (e.touches?.[0]?.clientY || e.changedTouches?.[0]?.clientY),
      };
    };

    const onPointerDown = (e) => {
      if (e.button !== undefined && e.button !== 0 && e.type !== 'touchstart') return;

      const { clientX, clientY } = getClientCoords(e);
      if (clientX === undefined || clientY === undefined) return;

      isDragging = true;
      didDrag = false;
      setHasMoved(false);
      
      element.style.transition = "none";

      const rect = element.getBoundingClientRect();
      offsetX = clientX - rect.left;
      offsetY = clientY - rect.top;
      startClientX = clientX;
      startClientY = clientY;
      
      lastEventTime = performance.now();
      lastClientX = clientX;
      velocityX = 0;

      element.style.left = `${rect.left}px`;
      element.style.top = `${rect.top}px`;
      element.style.right = 'auto';
      element.style.bottom = 'auto';
      element.style.cursor = "grabbing";

      // iOS fix: only call setPointerCapture if it exists and pointerId exists
      try {
        if (typeof element.setPointerCapture === 'function' && e.pointerId !== undefined) {
          element.setPointerCapture(e.pointerId);
        }
      } catch (err) {}
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;

      const { clientX, clientY } = getClientCoords(e);
      if (clientX === undefined || clientY === undefined) return;

      if (!didDrag) {
        const dx = clientX - startClientX;
        const dy = clientY - startClientY;
        if ((dx * dx) + (dy * dy) < (dragThreshold * dragThreshold)) {
          return;
        }
        didDrag = true;
        setHasMoved(true);
      }

      // iOS fix: block scroll bouncing only after this is a real drag gesture
      if (e.cancelable) {
        e.preventDefault();
      }

      const now = performance.now();
      const dt = now - lastEventTime;
      if (dt > 0) {
        velocityX = (clientX - lastClientX) / dt;
      }
      lastEventTime = now;
      lastClientX = clientX;

      const { width, height } = getElementSize();
      const { maxX, maxY } = getBounds(width, height);

      let x = clientX - offsetX;
      let y = clientY - offsetY;

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

      // iOS fix: only release capture if supported/present
      try {
        if (typeof element.releasePointerCapture === 'function' && e.pointerId !== undefined) {
          element.releasePointerCapture(e.pointerId);
        }
      } catch (err) {}

      // Tap: keep position and allow normal click to open modal
      if (!didDrag) {
        setHasMoved(false);
        return;
      }

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
    if (supportsPointer) {
    // Standard pointer events
      element.addEventListener("pointerdown", onPointerDown);
    // iOS fix: use passive false
      element.addEventListener("pointermove", onPointerMove, { passive: false });
      element.addEventListener("pointerup", onPointerUp);
      element.addEventListener("pointercancel", onPointerUp);
      window.addEventListener("resize", handleResize);
    } else {
    // iOS fix: touch fallback using named handlers ensuring correct cleanup
      element.addEventListener("touchstart", onPointerDown, { passive: false });
      element.addEventListener("touchmove", onPointerMove, { passive: false });
      element.addEventListener("touchend", onPointerUp);
      element.addEventListener("touchcancel", onPointerUp);
    }

    return () => {
      clearTimeout(initTimer);
      if (resizeTimeout) clearTimeout(resizeTimeout);

      if (supportsPointer) {
        element.removeEventListener("pointerdown", onPointerDown);
        element.removeEventListener("pointermove", onPointerMove);
        element.removeEventListener("pointerup", onPointerUp);
        element.removeEventListener("pointercancel", onPointerUp);
        window.removeEventListener("resize", handleResize);
      } else {
        element.removeEventListener("touchstart", onPointerDown);
        element.removeEventListener("touchmove", onPointerMove);
        element.removeEventListener("touchend", onPointerUp);
        element.removeEventListener("touchcancel", onPointerUp);
      }
    };
  }, [supportsPointer]);

  return { elementRef, hasMoved };
};
