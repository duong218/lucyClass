import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Heart,
  MessageCircle,
  Loader2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { popupActivityData } from '../utils/popupActivityData';
import { openModal, closeModal } from '../utils/modalScrollLock';

// ─── Video URL Detection & Conversion ────────────────────────────────────────

/**
 * Detect video type from a raw URL string.
 * Returns 'youtube' | 'tiktok' | 'mp4' | null
 */
const detectVideoType = (url) => {
  if (!url || typeof url !== 'string') return null;
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('tiktok.com')) return 'tiktok';
  if (url.toLowerCase().endsWith('.mp4')) return 'mp4';
  return null;
};

/**
 * Extract YouTube video ID from various URL formats.
 */
const extractYouTubeId = (url) => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

/**
 * Extract TikTok video ID from URL.
 */
const extractTikTokId = (url) => {
  const match = url.match(/\/video\/(\d+)/);
  return match ? match[1] : null;
};

/**
 * Convert a raw video URL into a normalized object with type & embed URL.
 * Returns { type, embedUrl, originalUrl } or null if unsupported.
 */
const normalizeVideo = (url) => {
  const type = detectVideoType(url);
  if (!type) return null;

  switch (type) {
    case 'youtube': {
      const id = extractYouTubeId(url);
      if (!id) return null;
      return { type, embedUrl: `https://www.youtube.com/embed/${id}`, id, originalUrl: url };
    }
    case 'tiktok': {
      const id = extractTikTokId(url);
      if (!id) return null;
      return { type, embedUrl: `https://www.tiktok.com/embed/v2/${id}`, id, originalUrl: url };
    }
    case 'mp4':
      return { type, embedUrl: url, originalUrl: url };
    default:
      return null;
  }
};

/**
 * Build iframe src for YouTube with mute control.
 */
const buildYouTubeSrc = (embedUrl, id, isMuted) =>
  `${embedUrl}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&loop=1&playlist=${id}`;

/**
 * Build iframe src for TikTok.
 */
const buildTikTokSrc = (embedUrl) => embedUrl;

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * ActivityPopup Component
 * A high-quality, kid-friendly React component for Lucy Class.
 * Features:
 * - Auto-detection of video types from raw URLs.
 * - Content-base + Overlaid Frame logic for perfect alignment.
 * - Fixed, animated "Close popup" button with i18n support.
 * - Mute/unmute toggle for audio control.
 * - Touch & Swipe support (Framer Motion).
 * - Responsive mobile-first design.
 */
const ActivityPopup = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [currentAlbumIndex, setCurrentAlbumIndex] = useState(0);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);

  // ─── Data Processing ─────────────────────────────────────────────────────
  const albumImages = useMemo(
    () => popupActivityData.albumImages.filter((url) => url && url.trim() !== ''),
    []
  );

  const videoList = useMemo(
    () => popupActivityData.videos
      .filter((url) => url && url.trim() !== '')
      .map(normalizeVideo)
      .filter(Boolean),
    []
  );

  const hasAlbum = albumImages.length > 0;
  const hasVideos = videoList.length > 0;

  // ─── Effects ──────────────────────────────────────────────────────────────

  // Handle ESC key press
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Prevent background scrolling when popup is open
  useEffect(() => {
    if (isOpen) {
      openModal();
      return () => closeModal();
    }
  }, [isOpen]);

  // Sync mute state to mp4 video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted, currentVideoIndex]);

  // ─── Navigation ───────────────────────────────────────────────────────────

  const nextImage = () => setCurrentAlbumIndex((prev) => (prev + 1) % albumImages.length);
  const prevImage = () => setCurrentAlbumIndex((prev) => (prev - 1 + albumImages.length) % albumImages.length);
  const nextVideo = () => {
    setIsVideoLoading(true);
    setCurrentVideoIndex((prev) => (prev + 1) % videoList.length);
  };
  const prevVideo = () => {
    setIsVideoLoading(true);
    setCurrentVideoIndex((prev) => (prev - 1 + videoList.length) % videoList.length);
  };

  // ─── Drag / Swipe ────────────────────────────────────────────────────────

  const handleAlbumDragEnd = (event, info) => {
    if (info.offset.x < -40) nextImage();
    else if (info.offset.x > 40) prevImage();
  };

  const handleVideoDragEnd = (event, info) => {
    if (info.offset.y < -40) nextVideo();
    else if (info.offset.y > 40) prevVideo();
  };

  // ─── Early Returns ────────────────────────────────────────────────────────

  if (!isOpen) return null;
  if (!hasAlbum && !hasVideos) return null;

  // ─── Render Helpers ───────────────────────────────────────────────────────

  const currentVideo = hasVideos ? videoList[currentVideoIndex] : null;

  const renderVideoContent = () => {
    if (!currentVideo) return null;

    switch (currentVideo.type) {
      case 'youtube':
        return (
          <iframe
            src={buildYouTubeSrc(currentVideo.embedUrl, currentVideo.id, isMuted)}
            title="Activity Video"
            allow="autoplay; encrypted-media"
            className="w-full h-full border-0 pointer-events-none"
            onLoad={() => setIsVideoLoading(false)}
          />
        );
      case 'tiktok':
        return (
          <iframe
            src={buildTikTokSrc(currentVideo.embedUrl)}
            title="TikTok Video"
            allow="autoplay; encrypted-media"
            className="w-full h-full border-0"
            onLoad={() => setIsVideoLoading(false)}
          />
        );
      case 'mp4':
        return (
          <video
            ref={videoRef}
            src={currentVideo.embedUrl}
            onLoadedData={() => setIsVideoLoading(false)}
            autoPlay
            muted={isMuted}
            loop
            playsInline
            className="w-full h-full object-cover"
          />
        );
      default:
        return null;
    }
  };

  // ─── Styles & Animations ─────────────────────────────────────────────────

  const popupBgStyle = {
    background: 'linear-gradient(135deg, #FFF9F0 0%, #FFEFD5 100%)',
    backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(245,197,66,0.1) 2px, transparent 2px)',
    backgroundSize: '20px 20px',
  };

  const floatAnimation = {
    y: [0, -8, 0],
    rotate: [-3, 3, -3],
    transition: { duration: 5, repeat: Infinity, ease: "easeInOut" }
  };

  const bouncyButton = {
    whileHover: { scale: 1.1, rotate: 2 },
    whileTap: { scale: 0.9, rotate: -2 },
  };

  // ─── JSX ──────────────────────────────────────────────────────────────────

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-6 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          style={popupBgStyle}
          className="relative w-full h-full md:h-[650px] max-w-[1024px] md:rounded-[40px] shadow-[0_30px_100px_rgba(0,0,0,0.3)] flex flex-col md:flex-row border-8 border-white overflow-hidden"
        >
          {/* Main Content Area (Scrollable on Mobile) */}
          <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden no-scrollbar pb-24 md:pb-0">

            {/* Left Column: Lucy's Album */}
            {hasAlbum && (
              <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-4 md:p-8 relative">
                <h3 className="font-display text-2xl md:text-3xl text-[#4A90E2] mb-4 md:mb-6 drop-shadow-sm">Lucy's Album</h3>

                <div className="relative aspect-square w-full" style={{ maxWidth: 'min(380px, 100%)' }}>
                  {/* 1. Content: Base Layer */}
                  <div className="absolute inset-0 flex items-center justify-center translate-y-[3%]">
                    <motion.div
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      onDragEnd={handleAlbumDragEnd}
                      className="w-[84%] h-[84%] overflow-hidden rounded-[28px] bg-white cursor-grab active:cursor-grabbing shadow-2xl"
                    >
                      <AnimatePresence mode="wait">
                        <motion.img
                          key={currentAlbumIndex}
                          src={albumImages[currentAlbumIndex]}
                          initial={{ opacity: 0, scale: 1.1 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.4, ease: "circOut" }}
                          className="w-full h-full object-cover select-none"
                          loading="lazy"
                        />
                      </AnimatePresence>
                    </motion.div>
                  </div>

                  {/* 2. Frame: Overlay Layer */}
                  <img
                    src="/images/frame-albums.png"
                    alt="Frame"
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10 scale-[1.18]"
                  />

                  {/* Navigation Arrows */}
                  <motion.button
                    {...bouncyButton}
                    onClick={prevImage}
                    className="absolute left-[-14px] top-[42%] -translate-y-1/2 z-20 w-11 h-11 bg-[#F5C542] text-white rounded-full flex items-center justify-center shadow-xl border-4 border-white"
                  >
                    <ChevronLeft size={24} strokeWidth={3} />
                  </motion.button>
                  <motion.button
                    {...bouncyButton}
                    onClick={nextImage}
                    className="absolute right-[-14px] top-[42%] -translate-y-1/2 z-20 w-11 h-11 bg-[#F5C542] text-white rounded-full flex items-center justify-center shadow-xl border-4 border-white"
                  >
                    <ChevronRight size={24} strokeWidth={3} />
                  </motion.button>
                </div>

                {/* Dots */}
                <div className="flex gap-2 mt-8">
                  {albumImages.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentAlbumIndex(i)}
                      className={`h-2.5 rounded-full transition-all duration-300 ${i === currentAlbumIndex ? 'bg-[#F5C542] w-8' : 'bg-white shadow-sm w-2.5'}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Right Column: Video Phone */}
            {hasVideos && (
              <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-4 md:p-8 bg-white/20">
                <div className="relative" style={{ height: 'min(500px, calc(100vh - 200px))', aspectRatio: '9 / 16' }}>
                  {/* 1. Content: Base Layer */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      drag="y"
                      dragConstraints={{ top: 0, bottom: 0 }}
                      onDragEnd={handleVideoDragEnd}
                      className="w-[84%] h-[96%] overflow-hidden rounded-[40px] bg-black relative shadow-2xl cursor-grab active:cursor-grabbing"
                    >
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={currentVideoIndex}
                          initial={{ opacity: 0, y: 100 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -100 }}
                          transition={{ duration: 0.5, type: "spring" }}
                          className="w-full h-full"
                        >
                          {isVideoLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-30">
                              <Loader2 className="w-10 h-10 text-white animate-spin" />
                            </div>
                          )}
                          {renderVideoContent()}
                        </motion.div>
                      </AnimatePresence>

                      {/* Sidebar Buttons: Mute + Decorative */}
                      <div className="absolute right-3 bottom-20 z-40 flex flex-col gap-4 drop-shadow-md">
                        <motion.button
                          {...bouncyButton}
                          onClick={() => setIsMuted((prev) => !prev)}
                          className="w-10 h-10 bg-white/20 backdrop-blur-lg rounded-full flex items-center justify-center text-white border border-white/30"
                        >
                          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                        </motion.button>
                        <button className="w-10 h-10 bg-white/20 backdrop-blur-lg rounded-full flex items-center justify-center text-white border border-white/30">
                          <Heart size={20} fill="white" />
                        </button>
                        <button className="w-10 h-10 bg-white/20 backdrop-blur-lg rounded-full flex items-center justify-center text-white border border-white/30">
                          <MessageCircle size={20} />
                        </button>
                      </div>
                    </motion.div>
                  </div>

                  {/* 2. Frame: Overlay Layer */}
                  <img
                    src="/images/frame-phone.png"
                    alt="Phone"
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10 scale-[1.28]"
                  />

                  {/* Vertical Arrows */}
                  <div className="absolute right-0 md:right-[-40px] top-1/2 -translate-y-1/2 z-30 flex flex-col gap-6 scale-90 md:scale-100">
                    <motion.button
                      {...bouncyButton}
                      onClick={prevVideo}
                      className="w-11 h-11 bg-[#4A90E2] text-white rounded-full flex items-center justify-center shadow-xl border-4 border-white"
                    >
                      <ChevronUp size={24} strokeWidth={3} />
                    </motion.button>
                    <motion.button
                      {...bouncyButton}
                      onClick={nextVideo}
                      className="w-11 h-11 bg-[#4A90E2] text-white rounded-full flex items-center justify-center shadow-xl border-4 border-white"
                    >
                      <ChevronDown size={24} strokeWidth={3} />
                    </motion.button>
                  </div>
                </div>

                <p className="mt-4 text-[#666] text-xs font-bold animate-pulse">
                  Swipe up/down for more! 🎬
                </p>
              </div>
            )}
          </div>

          {/* Fixed Decorative Stickers */}
          <div className="hidden md:block pointer-events-none">
            <motion.div animate={floatAnimation} className="absolute top-10 left-10 text-5xl">☺️</motion.div>
            <motion.div animate={floatAnimation} transition={{ delay: 1 }} className="absolute bottom-20 left-16 text-4xl">⭐</motion.div>
            <motion.div animate={floatAnimation} transition={{ delay: 2 }} className="absolute top-32 right-16 text-4xl">💖</motion.div>
            <motion.div animate={floatAnimation} transition={{ delay: 3 }} className="absolute bottom-16 right-20 text-5xl">✏️</motion.div>
          </div>

          {/* FIXED CLOSE BUTTON AT BOTTOM CENTER */}
          <div className="absolute bottom-5 inset-x-0 flex justify-center px-4"
            style={{
              zIndex: 9999,
              //pointerEvents: 'none'
            }}
          >
            <motion.button
              {...bouncyButton}
              animate={{ y: [0, -6, 0] }}
              transition={{
                y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                scale: { duration: 0.1 }
              }}
              onClick={onClose}
              className="px-10 py-3 bg-[#F5C542] hover:bg-[#E0B030] text-white rounded-full text-lg font-black shadow-[0_10px_25px_rgba(245,197,66,0.4)] border-4 border-white flex items-center gap-2"
            >
              <span>🏡</span> {t('activities.close_popup')}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ActivityPopup;
