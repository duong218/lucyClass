import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';

const BOTTOM_THRESHOLD = 200;

const ScrollHintButton = () => {
  const [isNearBottom, setIsNearBottom] = useState(false);

  useEffect(() => {
    const updatePosition = () => {
      const nearBottom =
        window.scrollY + window.innerHeight >= document.body.scrollHeight - BOTTOM_THRESHOLD;
      setIsNearBottom(nearBottom);
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, { passive: true });
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, []);

  const handleClick = () => {
    if (isNearBottom) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    window.scrollBy({
      top: window.innerHeight * 0.8,
      behavior: 'smooth',
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isNearBottom ? 'Scroll to top' : 'Scroll down'}
      className="fixed bottom-4 left-4 z-50 md:hidden rounded-full bg-white border-2 border-black/40 backdrop-blur-md shadow-md p-3 transition-transform hover:scale-105 active:scale-95"
    >
      {isNearBottom ? <ArrowUp className="w-4 h-4 text-gray-700" /> : <ArrowDown className="w-4 h-4 text-gray-700" />}
    </button>
  );
};

export default ScrollHintButton;
