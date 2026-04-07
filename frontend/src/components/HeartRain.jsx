import React, { useMemo } from 'react';

const HeartRain = () => {
  // Generate 30 hearts with random properties
  const hearts = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * (32 - 16) + 16}px`,
      duration: `${Math.random() * (3 - 1) + 1}s`,
      delay: `${Math.random()}s`,
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      <style>
        {`
          @keyframes heartFall {
            0% {
              transform: translateY(-10vh) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translateY(110vh) rotate(360deg);
              opacity: 0.3;
            }
          }
          .falling-heart {
            position: absolute;
            top: -50px;
            animation-name: heartFall;
            animation-timing-function: linear;
            animation-iteration-count: 1;
          }
        `}
      </style>
      {hearts.map((heart) => (
        <div
          key={heart.id}
          className="falling-heart"
          style={{
            left: heart.left,
            fontSize: heart.size,
            animationDuration: heart.duration,
            animationDelay: heart.delay,
          }}
        >
          ❤️
        </div>
      ))}
    </div>
  );
};

export default HeartRain;
