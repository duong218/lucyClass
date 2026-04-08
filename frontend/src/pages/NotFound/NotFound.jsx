import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLucyGame } from './GameLogic';
import bg404 from '../../assets/404.png';
import bg404Mobile from '../../assets/404-9x16.png';
import './NotFound.css';

const NotFound = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  
  // Game States
  const [isContainerShaking, setIsContainerShaking] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isProcessingClick, setIsProcessingClick] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [lucyImg, setLucyImg] = useState('/model-transform/LucyClass.png');
  const containerRef = React.useRef(null);

  // Sound Refs (Stable)
  const correctSound = React.useRef(new Audio('/sounds/correct.mp3'));
  const wrongSound = React.useRef(new Audio('/sounds/wrong.mp3'));
  const hintSound = React.useRef(new Audio('/sounds/hint.mp3'));
  const nearSound = React.useRef(new Audio('/sounds/near.mp3'));

  // Preload sounds
  useEffect(() => {
    [correctSound, wrongSound, hintSound, nearSound].forEach(ref => {
      if (ref.current) ref.current.load();
    });
  }, []);

  const playSound = (audioRef, volume = 1) => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    audioRef.current.volume = volume;
    audioRef.current.play().catch(() => {});
  };

  const {
    lives,
    gameStatus,
    lucyPos,
    hintActive,
    hintCooldown,
    handleGuess,
    triggerHint,
    restartGame
  } = useLucyGame();

  // Mobile Detection
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === "en" ? "vi" : "en");
  };

  const handleClick = (e) => {
    if (isProcessingClick || gameStatus !== 'playing' || !containerRef.current) return;

    setIsProcessingClick(true);
    setTimeout(() => setIsProcessingClick(false), 100);

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const threshold = isMobile ? 7 : 5;
    const result = handleGuess(x, y, threshold);

    if (result === 'win') {
      playSound(correctSound);
    } else if (result === 'near') {
      playSound(nearSound, 0.7);
    } else if (result === 'miss') {
      playSound(wrongSound);
      setIsContainerShaking(true);
    }
  };

  const onHintClick = () => {
    const success = triggerHint();
    if (success) playSound(hintSound);
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
            onClick={() => setShowHelp(true)}
            className="help-btn"
            aria-label="Help"
          >
            ?
          </button>

          <button
            onClick={toggleLang}
            className="lang-switcher-btn"
          >
            {i18n.language.toUpperCase()}
          </button>

          <button 
            className={`hint-button ${hintCooldown ? 'cooldown' : ''}`} 
            onClick={onHintClick}
            aria-label={t('game.hint')}
            disabled={gameStatus !== 'playing' || hintCooldown}
          >
            <img src="/model-transform/GoiY.png" alt="Hint" />
            {hintCooldown && <div className="cooldown-overlay" />}
          </button>
        </div>
      </div>

      <h1 className="game-title">
        {t('game.title')}
      </h1>

      {/* Main Game Container */}
      <div 
        ref={containerRef}
        className={`game-container ${
          isContainerShaking 
            ? (lives <= 2 ? 'container-shake-heavy' : 'container-shake') 
            : ''
        }`}
        style={{ backgroundImage: `url(${isMobile ? bg404Mobile : bg404})` }}
        onAnimationEnd={() => setIsContainerShaking(false)}
        onClick={handleClick}
      >
        {/* Hint Highlight Circle */}
        {hintActive && (
          <div 
            className="hint-circle"
            style={{ 
              left: `${lucyPos.x}%`, 
              top: `${lucyPos.y}%` 
            }}
          />
        )}

        {/* Lucy Character (Visible only when found) */}
        <img 
          src={lucyImg} 
          alt="Lucy" 
          className={`lucy-character ${gameStatus === 'won' ? 'visible' : ''} ${isMobile ? 'mobile' : ''}`}
          style={{ 
            top: `${lucyPos.y}%`, 
            left: `${lucyPos.x}%`
          }}
          onError={() => setLucyImg('/model-transform/LucyCat.png')}
        />
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

      {/* Help Modal */}
      {showHelp && (
        <div className="game-overlay help-overlay" onClick={() => setShowHelp(false)}>
          <div className="help-modal" onClick={e => e.stopPropagation()}>
            <h3>{t('game.howToPlay')}</h3>
            <ul>
              <li>{t('game.help1')}</li>
              <li>{t('game.help2')}</li>
              <li>{t('game.help3')}</li>
            </ul>
            <button className="btn-primary" onClick={() => setShowHelp(false)}>
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotFound;
