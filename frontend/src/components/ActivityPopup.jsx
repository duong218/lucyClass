import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Loader2,
  Maximize2,
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
    background: 'linear-gradient(160deg, #1C695C 0%, #1C6970 40%, #134d44 100%)',
  };

  const floatAnimation = { y: [0, -8, 0], transition: { duration: 5, repeat: Infinity } }; // kept for compat

  const bouncyButton = {
    whileHover: { scale: 1.1, rotate: 2 },
    whileTap: { scale: 0.9, rotate: -2 },
  };

  // ─── JSX ──────────────────────────────────────────────────────────────────

  // Navbar height: 72px mobile, 88px desktop — popup starts right below
  const NAVBAR_H_MOBILE = 72;
  const NAVBAR_H_DESKTOP = 88;

  return (
    <AnimatePresence>
      {/* ── Backdrop ── */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/55 backdrop-blur-sm"
        style={{ zIndex: 200 }}
      />

      {/* ════════════════ MOBILE SHEET (< md) ════════════════
          Slides up from bottom, sits flush below navbar at top */}
      <motion.div
        key="mobile-sheet"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 340, damping: 36 }}
        style={{
          ...popupBgStyle,
          zIndex: 201,
          top: NAVBAR_H_MOBILE,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
        }}
        className="fixed inset-x-0 bottom-0 md:hidden flex flex-col overflow-hidden shadow-[0_-20px_60px_rgba(0,0,0,0.45)]"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/30" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 shrink-0">
          <div className="flex flex-col leading-none">
            <span className="text-[9px] font-bold tracking-[0.22em] uppercase" style={{ color: '#3FA48F' }}>✦ LUCY CLASS ✦</span>
            <span className="text-[1.3rem] font-black" style={{
              fontFamily: "'Nunito', system-ui, sans-serif",
              background: 'linear-gradient(90deg, #D9A441, #F5C542, #D9A441)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>Lucy Album</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.88 }}
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white border border-white/25 shrink-0"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/>
            </svg>
          </motion.button>
        </div>

        {/* Thin divider */}
        <div className="mx-5 mb-3 h-px shrink-0" style={{ background: 'rgba(255,255,255,0.12)' }} />

        {/* Scrollable content — Album + Video stacked */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-6" data-lenis-prevent>

          {/* Album */}
          {hasAlbum && (
            <div className="flex flex-col items-center px-4 pb-4">
              <div className="relative w-full" style={{ maxWidth: 310, aspectRatio: '1/1' }}>
                <div className="absolute inset-0 flex items-center justify-center translate-y-[3%]">
                  <motion.div
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    onDragEnd={handleAlbumDragEnd}
                    className="w-[84%] h-[84%] overflow-hidden rounded-[24px] bg-white cursor-grab active:cursor-grabbing shadow-xl"
                  >
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={currentAlbumIndex}
                        src={albumImages[currentAlbumIndex]}
                        initial={{ opacity: 0, scale: 1.08 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.94 }}
                        transition={{ duration: 0.35, ease: 'circOut' }}
                        className="w-full h-full object-cover select-none"
                        loading="lazy"
                      />
                    </AnimatePresence>
                  </motion.div>
                </div>
                <img src="/images/frame-albums.png" alt="Frame"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10 scale-[1.18]" />
                <motion.button {...bouncyButton} onClick={prevImage}
                  className="absolute left-[-10px] top-[42%] -translate-y-1/2 z-20 w-9 h-9 text-white rounded-full flex items-center justify-center shadow-lg border-[3px] border-white"
                  style={{ background: '#1C695C' }}>
                  <ChevronLeft size={18} strokeWidth={3} />
                </motion.button>
                <motion.button {...bouncyButton} onClick={nextImage}
                  className="absolute right-[-10px] top-[42%] -translate-y-1/2 z-20 w-9 h-9 text-white rounded-full flex items-center justify-center shadow-lg border-[3px] border-white"
                  style={{ background: '#1C695C' }}>
                  <ChevronRight size={18} strokeWidth={3} />
                </motion.button>
              </div>
              {/* Dots */}
              <div className="flex gap-1.5 mt-3">
                {albumImages.map((_, i) => (
                  <button key={i} onClick={() => setCurrentAlbumIndex(i)}
                    className="h-2 rounded-full transition-all duration-300"
                    style={i === currentAlbumIndex
                      ? { background: '#D9A441', width: '1.5rem' }
                      : { background: 'rgba(255,255,255,0.35)', width: '0.5rem' }} />
                ))}
              </div>
            </div>
          )}

          {/* Divider between album & video on mobile */}
          {hasAlbum && hasVideos && (
            <div className="mx-6 my-3 h-px" style={{ background: 'rgba(255,255,255,0.12)' }} />
          )}

          {/* Video */}
          {hasVideos && (
            <div className="flex flex-col items-center px-2 pb-2">
              {/* Video container: tall, width-driven for natural 9/16 */}
              <div className="relative" style={{ height: 'min(500px, calc(100vh - 200px))', aspectRatio: '9 / 16' }}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    drag="y"
                    dragConstraints={{ top: 0, bottom: 0 }}
                    onDragEnd={handleVideoDragEnd}
                    className="w-[84%] h-[96%] overflow-hidden rounded-[32px] bg-black relative shadow-2xl cursor-grab active:cursor-grabbing"
                  >
                    <AnimatePresence mode="wait">
                      <motion.div key={currentVideoIndex}
                        initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -60 }}
                        transition={{ duration: 0.4, type: 'spring', damping: 22 }}
                        className="w-full h-full">
                        {isVideoLoading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-30">
                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                          </div>
                        )}
                        {renderVideoContent()}
                      </motion.div>
                    </AnimatePresence>
                    {/* Expand button */}
                    <motion.button {...bouncyButton}
                      onClick={() => currentVideo && window.open(currentVideo.originalUrl, '_blank')}
                      className="absolute top-2.5 right-2.5 z-40 w-9 h-9 rounded-full flex items-center justify-center text-white shadow-lg border border-white/25"
                      style={{ background: 'rgba(28,105,92,0.85)', backdropFilter: 'blur(8px)' }}
                      title="Xem video đầy đủ">
                      <Maximize2 size={15} strokeWidth={2.5} />
                    </motion.button>
                  </motion.div>
                </div>
                <img src="/images/frame-phone.png" alt="Phone"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10 scale-[1.28]" />
                {/* Nav arrows — right side */}
                <div className="absolute right-[-32px] top-1/2 -translate-y-1/2 z-30 flex flex-col gap-3">
                  <motion.button {...bouncyButton} onClick={prevVideo}
                    className="w-8 h-8 text-white rounded-full flex items-center justify-center shadow-lg border-[3px] border-white"
                    style={{ background: '#1C695C' }}>
                    <ChevronUp size={16} strokeWidth={3} />
                  </motion.button>
                  <motion.button {...bouncyButton} onClick={nextVideo}
                    className="w-8 h-8 text-white rounded-full flex items-center justify-center shadow-lg border-[3px] border-white"
                    style={{ background: '#1C695C' }}>
                    <ChevronDown size={16} strokeWidth={3} />
                  </motion.button>
                </div>
              </div>
              <p className="mt-2 text-[10px] font-bold animate-pulse" style={{ color: 'rgba(63,164,143,0.85)' }}>
                ↕ Swipe for more 🎬
              </p>
            </div>
          )}
        </div>

        {/* Close button — sticky footer */}
        <div className="shrink-0 flex justify-center py-3 px-5" style={{ background: 'rgba(0,0,0,0.18)' }}>
          <motion.button
            {...bouncyButton}
            onClick={onClose}
            className="px-8 py-2.5 text-white rounded-full text-sm font-black shadow-lg flex items-center gap-2 border-2 border-white/20"
            style={{ background: 'linear-gradient(135deg, #D9A441 0%, #F5C542 100%)', boxShadow: '0 6px 20px rgba(217,164,65,0.4)' }}
          >
            <span>🏡</span> {t('activities.close_popup')}
          </motion.button>
        </div>
      </motion.div>

      {/* ════════════════ DESKTOP DIALOG (≥ md) ════════════════
          Centered, sits below navbar, nice rounded card */}
      <div
        key="desktop-wrapper"
        className="fixed inset-x-0 bottom-0 hidden md:flex items-end justify-center px-6 pb-6"
        style={{ top: NAVBAR_H_DESKTOP, zIndex: 201 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{ ...popupBgStyle, maxHeight: 'calc(100dvh - 110px)' }}
          className="relative w-full max-w-[960px] rounded-[36px] shadow-[0_24px_80px_rgba(0,0,0,0.5)] flex flex-col border border-white/10 overflow-hidden"
        >
          {/* ── Desktop Header ── */}
          <div className="shrink-0 flex items-center justify-between px-8 py-5" style={{ background: 'rgba(0,0,0,0.18)' }}>
            <div className="flex flex-col leading-none">
              <span className="text-[10px] font-bold tracking-[0.22em] uppercase" style={{ color: '#3FA48F' }}>✦ LUCY CLASS ✦</span>
              <h2 className="text-2xl font-black" style={{
                fontFamily: "'Nunito', system-ui, sans-serif",
                background: 'linear-gradient(90deg, #D9A441, #F5C542, #D9A441)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.25))',
              }}>Lucy Album</h2>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.88 }}
              transition={{ duration: 0.18 }}
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white border border-white/20"
              style={{ background: 'rgba(255,255,255,0.12)' }}
              aria-label="Close"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
            </motion.button>
          </div>

          {/* ── Desktop Body: 2 columns ── */}
          <div className="flex-1 flex flex-row overflow-hidden min-h-0">

            {/* Left: Album */}
            {hasAlbum && (
              <div className="w-1/2 flex flex-col items-center justify-center p-6 lg:p-8">
                <div className="relative w-full" style={{ maxWidth: 360, aspectRatio: '1/1' }}>
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
                          initial={{ opacity: 0, scale: 1.08 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.94 }}
                          transition={{ duration: 0.38, ease: 'circOut' }}
                          className="w-full h-full object-cover select-none"
                          loading="lazy"
                        />
                      </AnimatePresence>
                    </motion.div>
                  </div>
                  <img src="/images/frame-albums.png" alt="Frame"
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10 scale-[1.18]" />
                  <motion.button {...bouncyButton} onClick={prevImage}
                    className="absolute left-[-14px] top-[42%] -translate-y-1/2 z-20 w-11 h-11 text-white rounded-full flex items-center justify-center shadow-xl border-4 border-white"
                    style={{ background: '#1C695C' }}>
                    <ChevronLeft size={22} strokeWidth={3} />
                  </motion.button>
                  <motion.button {...bouncyButton} onClick={nextImage}
                    className="absolute right-[-14px] top-[42%] -translate-y-1/2 z-20 w-11 h-11 text-white rounded-full flex items-center justify-center shadow-xl border-4 border-white"
                    style={{ background: '#1C695C' }}>
                    <ChevronRight size={22} strokeWidth={3} />
                  </motion.button>
                </div>
                {/* Dots */}
                <div className="flex gap-2 mt-5">
                  {albumImages.map((_, i) => (
                    <button key={i} onClick={() => setCurrentAlbumIndex(i)}
                      className="h-2.5 rounded-full transition-all duration-300"
                      style={i === currentAlbumIndex
                        ? { background: '#D9A441', width: '2rem' }
                        : { background: 'rgba(255,255,255,0.35)', width: '0.625rem' }} />
                  ))}
                </div>
              </div>
            )}

            {/* Vertical divider */}
            {hasAlbum && hasVideos && (
              <div className="w-px my-6 shrink-0" style={{ background: 'rgba(255,255,255,0.1)' }} />
            )}

            {/* Right: Video */}
            {hasVideos && (
              <div className="w-1/2 flex flex-col items-center justify-center py-4 px-4" style={{ background: 'rgba(0,0,0,0.1)' }}>
                <div className="relative" style={{ height: 'min(500px, calc(100vh - 200px))', aspectRatio: '9 / 16' }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      drag="y"
                      dragConstraints={{ top: 0, bottom: 0 }}
                      onDragEnd={handleVideoDragEnd}
                      className="w-[84%] h-[96%] overflow-hidden rounded-[40px] bg-black relative shadow-2xl cursor-grab active:cursor-grabbing"
                    >
                      <AnimatePresence mode="wait">
                        <motion.div key={currentVideoIndex}
                          initial={{ opacity: 0, y: 80 }} animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -80 }}
                          transition={{ duration: 0.45, type: 'spring', damping: 24 }}
                          className="w-full h-full">
                          {isVideoLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-30">
                              <Loader2 className="w-10 h-10 text-white animate-spin" />
                            </div>
                          )}
                          {renderVideoContent()}
                        </motion.div>
                      </AnimatePresence>
                      {/* Expand */}
                      <motion.button {...bouncyButton}
                        onClick={() => currentVideo && window.open(currentVideo.originalUrl, '_blank')}
                        className="absolute top-3 right-3 z-40 w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg border border-white/25"
                        style={{ background: 'rgba(28,105,92,0.85)', backdropFilter: 'blur(8px)' }}
                        title="Xem video đầy đủ">
                        <Maximize2 size={17} strokeWidth={2.5} />
                      </motion.button>
                    </motion.div>
                  </div>
                  <img src="/images/frame-phone.png" alt="Phone"
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10 scale-[1.28]" />
                  {/* Nav arrows */}
                  <div className="absolute right-[-44px] top-1/2 -translate-y-1/2 z-30 flex flex-col gap-4">
                    <motion.button {...bouncyButton} onClick={prevVideo}
                      className="w-10 h-10 text-white rounded-full flex items-center justify-center shadow-xl border-4 border-white"
                      style={{ background: '#1C695C' }}>
                      <ChevronUp size={20} strokeWidth={3} />
                    </motion.button>
                    <motion.button {...bouncyButton} onClick={nextVideo}
                      className="w-10 h-10 text-white rounded-full flex items-center justify-center shadow-xl border-4 border-white"
                      style={{ background: '#1C695C' }}>
                      <ChevronDown size={20} strokeWidth={3} />
                    </motion.button>
                  </div>
                </div>
                <p className="mt-3 text-[11px] font-bold animate-pulse" style={{ color: 'rgba(63,164,143,0.85)' }}>
                  {t('activities.swipeForMore')}
                </p>
              </div>
            )}
          </div>

          {/* ── Desktop Footer ── */}
          <div className="shrink-0 flex justify-center py-4 px-8" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={{ y: [0, -5, 0] }}
              transition={{ y: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }, scale: { duration: 0.12 } }}
              onClick={onClose}
              className="px-10 py-2.5 text-white rounded-full text-sm font-black shadow-lg flex items-center gap-2 border-2 border-white/20"
              style={{ background: 'linear-gradient(135deg, #D9A441 0%, #F5C542 100%)', boxShadow: '0 8px 24px rgba(217,164,65,0.35)' }}
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