import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook to manage "Find Lucy" game logic
 * @param {number} totalHotspots - Number of available hotspots in the game
 */
export const useLucyGame = () => {
  const [lives, setLives] = useState(5);
  const [gameStatus, setGameStatus] = useState('playing'); // 'playing' | 'won' | 'lost'
  const [lucyPos, setLucyPos] = useState({ x: 0, y: 0 });
  const [hintActive, setHintActive] = useState(false);
  const [hintCooldown, setHintCooldown] = useState(false);
  const [lastCheckResult, setLastCheckResult] = useState(null); // 'win' | 'near' | 'miss'

  // Initialize game: find a random spot for Lucy with padding
  // x: 8% to 92%, y: 12% to 88%
  const initGame = useCallback(() => {
    const x = Math.floor(Math.random() * (92 - 8 + 1)) + 8;
    const y = Math.floor(Math.random() * (88 - 20 + 1)) + 20;
    
    setLucyPos({ x, y });
    setLives(5);
    setGameStatus('playing');
    setHintActive(false);
    setHintCooldown(false);
    setLastCheckResult(null);
  }, []);

  // Run on mount
  useEffect(() => {
    initGame();
  }, [initGame]);

  // Handle a click guess based on percentages
  const handleGuess = useCallback((clickX, clickY, threshold) => {
    if (gameStatus !== 'playing') return 'none';

    // Euclidean distance
    const dist = Math.sqrt(
      Math.pow(clickX - lucyPos.x, 2) + 
      Math.pow(clickY - lucyPos.y, 2)
    );

    if (dist <= threshold) {
      setGameStatus('won');
      setLastCheckResult('win');
      return 'win';
    } else if (dist <= threshold * 2) {
      setLastCheckResult('near');
      return 'near';
    } else {
      const newLives = lives - 1;
      setLives(newLives);
      setLastCheckResult('miss');
      
      if (newLives <= 0) {
        setGameStatus('lost');
      }
      return 'miss';
    }
  }, [gameStatus, lucyPos, lives]);

  // Trigger hint (highlight correct spot for 2s) with 5s cooldown
  const triggerHint = useCallback(() => {
    if (gameStatus !== 'playing' || hintActive || hintCooldown) return false;
    
    setHintActive(true);
    setHintCooldown(true);

    // Hide hint after 2 seconds
    setTimeout(() => {
      setHintActive(false);
    }, 2000);

    // Reset cooldown after 5 seconds total
    setTimeout(() => {
      setHintCooldown(false);
    }, 5000);

    return true;
  }, [gameStatus, hintActive, hintCooldown]);

  return {
    lives,
    gameStatus,
    lucyPos,
    hintActive,
    hintCooldown,
    lastCheckResult,
    handleGuess,
    triggerHint,
    restartGame: initGame
  };
};
