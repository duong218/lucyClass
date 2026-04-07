import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook to manage "Find Lucy" game logic
 * @param {number} totalHotspots - Number of available hotspots in the game
 */
export const useLucyGame = (totalHotspots) => {
  const [lives, setLives] = useState(5);
  const [gameStatus, setGameStatus] = useState('playing'); // 'playing' | 'won' | 'lost'
  const [lucyPos, setLucyPos] = useState(null);
  const [hintActive, setHintActive] = useState(false);
  const [wrongGuesses, setWrongGuesses] = useState([]);

  // Initialize game: find a random spot for Lucy
  const initGame = useCallback(() => {
    const randomPos = Math.floor(Math.random() * totalHotspots);
    setLucyPos(randomPos);
    setLives(5);
    setGameStatus('playing');
    setWrongGuesses([]);
    setHintActive(false);
  }, [totalHotspots]);

  // Run on mount
  useEffect(() => {
    if (totalHotspots > 0) {
      initGame();
    }
  }, [totalHotspots, initGame]);

  // Handle a hotspot click
  const handleGuess = useCallback((index) => {
    if (gameStatus !== 'playing' || hintActive) return;

    if (index !== -1 && index === lucyPos) {
      setGameStatus('won');
    } else {
      // Wrong guess (either a decoy hotspot or the background at index -1)
      const newLives = lives - 1;
      setLives(newLives);

      if (index !== -1 && !wrongGuesses.includes(index)) {
        setWrongGuesses((prev) => [...prev, index]);
      }
      
      if (newLives <= 0) {
        setGameStatus('lost');
      }
    }
  }, [gameStatus, hintActive, lucyPos, lives, wrongGuesses]);

  // Trigger hint (highlight correct spot for 2s)
  const triggerHint = useCallback(() => {
    if (gameStatus !== 'playing' || hintActive) return;
    setHintActive(true);
    setTimeout(() => {
      setHintActive(false);
    }, 2000);
  }, [gameStatus, hintActive]);

  return {
    lives,
    gameStatus,
    lucyPos,
    hintActive,
    wrongGuesses,
    handleGuess,
    triggerHint,
    restartGame: initGame
  };
};
