export const makeDraggable = (element) => {
  if (!element) return;

  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  const onPointerDown = (e) => {
    isDragging = true;

    const rect = element.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    element.style.transition = "none";
    element.style.cursor = "grabbing";

    try {
      element.setPointerCapture(e.pointerId);
    } catch (err) {}
  };

  const onPointerMove = (e) => {
    if (!isDragging) return;

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    let x = e.clientX - offsetX;
    let y = e.clientY - offsetY;

    const rect = element.getBoundingClientRect();

    const maxX = screenWidth - rect.width;
    const maxY = screenHeight - rect.height;

    x = Math.max(0, Math.min(x, maxX));
    y = Math.max(0, Math.min(y, maxY));

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

    const screenWidth = window.innerWidth;
    const rect = element.getBoundingClientRect();

    const middle = screenWidth / 2;
    const elementCenter = rect.left + rect.width / 2;

    element.style.transition = "all 0.3s ease";

    // SNAP
    if (elementCenter < middle) {
      element.style.left = "10px";
    } else {
      element.style.left = `${screenWidth - rect.width - 10}px`;
    }
  };

  element.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);

  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);

  return () => {
    element.removeEventListener("pointerdown", onPointerDown);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerUp);
  };
};
