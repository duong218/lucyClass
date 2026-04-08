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

  // ✅ Lỗi 3 fix: fallback text phòng trường hợp i18n key chưa có
  // Thêm các key này vào file JSON translation của bạn (xem hướng dẫn bên dưới)
  const isVi = i18n.language === 'vi';
  const helpTexts = {
    howToPlay: t('game.howToPlay', isVi ? 'Cách chơi' : 'How to Play'),
    help1: t('game.help1', isVi
      ? '🖱️ Click vào bức tranh để tìm Lucy đang ẩn'
      : '🖱️ Click on the image to find hidden Lucy'),
    help2: t('game.help2', isVi
      ? '💡 Nhấn nút bóng đèn để xem gợi ý vị trí'
      : '💡 Press the hint button to reveal her location'),
    help3: t('game.help3', isVi
      ? '❤️ Bạn có 5 lượt đoán sai, hết tim là thua!'
      : '❤️ You have 5 wrong guesses before game over!'),
  };

  return (
    <div className="not-found-game">
      {/* Game Header */}
      <div className="game-header">
        <div className="lives-container">
          <span className="lives-text">{t('game.lives', isVi ? 'Tìm còn lại' : 'Lives')}:</span>
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
            aria-label={t('game.hint', 'Hint')}
            disabled={gameStatus !== 'playing' || hintCooldown}
          >
            <img src="/model-transform/GoiY.png" alt="Hint" />
            {hintCooldown && <div className="cooldown-overlay" />}
          </button>
        </div>
      </div>

      <h1 className="game-title">
        {t('game.title', isVi ? '🔍 Tìm Lucy nào!' : '🔍 Find Lucy!')}
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

        {/* ✅ Lỗi 1 fix: Lucy hiện mờ 10% để người chơi thấy nhân vật cần tìm */}
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
            {t('game.won', isVi ? '🎉 Tìm thấy Lucy rồi!' : '🎉 You found Lucy!')}
          </h2>
          <p>{t('game.redirecting', isVi ? 'Đang về trang chủ...' : 'Redirecting to home...')}</p>
        </div>
      )}

      {/* Loss Overlay */}
      {gameStatus === 'lost' && (
        <div className="game-overlay">
          <h2 className="game-message">
            {t('game.lost', isVi ? '😢 Hết lượt rồi!' : '😢 Game Over!')}
          </h2>
          <div style={{ display: 'flex', gap: '15px' }}>
            <button className="btn-primary" onClick={restartGame}>
              {t('game.retry', isVi ? 'Thử lại' : 'Try Again')}
            </button>
            <button 
              className="btn-back-home" 
              onClick={() => navigate('/')}
            >
              {t('game.backHome', isVi ? '🏠 Về trang chủ' : '🏠 Back Home')}
            </button>
          </div>
        </div>
      )}

      {/* ✅ Lỗi 3 fix: Help Modal dùng helpTexts với fallback */}
      {showHelp && (
        <div className="game-overlay help-overlay" onClick={() => setShowHelp(false)}>
          <div className="help-modal" onClick={e => e.stopPropagation()}>
            <h3>{helpTexts.howToPlay}</h3>
            <ul>
              <li>{helpTexts.help1}</li>
              <li>{helpTexts.help2}</li>
              <li>{helpTexts.help3}</li>
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
