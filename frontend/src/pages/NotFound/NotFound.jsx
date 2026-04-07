import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLucyGame } from './GameLogic';
import bg404 from '../../assets/404.png';
import './NotFound.css';

// Hotspot definitions (Percentages for responsive positioning)
const HOTSPOTS = [
  { id: 'desk', name: 'Teacher Desk', top: '70%', left: '20%' },
  { id: 'bookshelf', name: 'Bookshelf', top: '45%', left: '45%' },
  { id: 'chair', name: 'Student Chair', top: '75%', left: '80%' },
  { id: 'blackboard', name: 'Blackboard', top: '30%', left: '55%' },
];

const NotFound = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [isContainerShaking, setIsContainerShaking] = useState(false);

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === "en" ? "vi" : "en");
  };

  const {
    lives,
    gameStatus,
    lucyPos,
    hintActive,
    wrongGuesses,
    handleGuess,
    triggerHint,
    restartGame
  } = useLucyGame(HOTSPOTS.length);


  // Trigger container shake when a wrong guess happens
  const onWrongGuess = (index) => {
    handleGuess(index);
    if (index === -1 || (index !== lucyPos && !wrongGuesses.includes(index))) {
      setIsContainerShaking(true);
    }
  };

  // Redirect to home after winning
  useEffect(() => {
    if (gameStatus === 'won') {
      const timer = setTimeout(() => {
        navigate('/');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [gameStatus, navigate]);

  const renderHearts = () => {
    return Array.from({ length: 5 }).map((_, i) => (
      <span 
        key={i} 
        className={`heart ${i < lives ? 'active' : ''}`}
        style={{ opacity: i < lives ? 1 : 0.3 }}
      >
        ❤️
      </span>
    ));
  };

  return (
    <div className="not-found-game">
      {/* Game Header */}
      <div className="game-header">
        <div className="lives-container">
          <span className="lives-text">{t('game.lives')}:</span>
          {renderHearts()}
        </div>
        
        <div className="header-actions">
          <button
            onClick={toggleLang}
            className="lang-switcher-btn"
          >
            {i18n.language.toUpperCase()}
          </button>

          <button 
            className="hint-button" 
            onClick={triggerHint}
            aria-label={t('game.hint')}
            disabled={gameStatus !== 'playing'}
          >
            <img src="/model-transform/GoiY.png" alt="Hint" />
          </button>
        </div>
      </div>

      <h1 className="game-title">
        {t('game.title')}
      </h1>

      {/* Main Game Container */}
      <div 
        className={`game-container ${isContainerShaking ? 'container-shake' : ''}`}
        style={{ backgroundImage: `url(${bg404})` }}
        onAnimationEnd={() => setIsContainerShaking(false)}
      >
        {/* Background Click Area (Wrong Guess) */}
        <div 
          className="hotspot-background-click" 
          onClick={() => onWrongGuess(-1)}
          aria-hidden="true"
        />

        {HOTSPOTS.map((spot, index) => (
          <button
            key={spot.id}
            className={`hotspot 
              ${wrongGuesses.includes(index) ? 'shake' : ''} 
              ${hintActive && index === lucyPos ? 'hint-highlight' : ''}`
            }
            style={{ top: spot.top, left: spot.left }}
            onClick={(e) => {
              e.stopPropagation();
              onWrongGuess(index);
            }}
            aria-label={`Search ${spot.name}`}
            role="button"
            disabled={gameStatus !== 'playing' || wrongGuesses.includes(index)}
          />
        ))}

        {/* Lucy Cat (Visible only when found) */}
        {lucyPos !== null && (
          <img 
            src="/model-transform/LucyCat.png" 
            alt="Lucy" 
            className={`lucy-character ${gameStatus === 'won' ? 'visible' : ''}`}
            style={{ 
              top: HOTSPOTS[lucyPos].top, 
              left: HOTSPOTS[lucyPos].left,
              transform: 'translate(-50%, -80%)' // Center over hotspot
            }}
          />
        )}
      </div>

      {/* Win Overlay */}
      {gameStatus === 'won' && (
        <div className="game-overlay">
          <h2 className="game-message animate-bounce">
            {t('game.won')}
          </h2>
          <p>{t('game.redirecting')}</p>
        </div>
      )}

      {/* Loss Overlay */}
      {gameStatus === 'lost' && (
        <div className="game-overlay">
          <h2 className="game-message">
            {t('game.lost')}
          </h2>
          <div style={{ display: 'flex', gap: '15px' }}>
            <button className="btn-primary" onClick={restartGame}>
              {t('game.retry')}
            </button>
            <button 
              className="btn-back-home" 
              onClick={() => navigate('/')}
            >
              {t('game.backHome')}
            </button>
          </div>
        </div>
      )}

      {/* Static Footer CTA */}
      <div style={{ marginTop: '2rem' }}>
        <button 
          className="btn-back-home"
          onClick={() => navigate('/')}
        >
          {t('game.backHome')}
        </button>
      </div>
    </div>
  );
};

export default NotFound;
