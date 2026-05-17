import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { getImageUrl } from '../utils/getImageUrl';
import { openModal, closeModal } from '../utils/modalScrollLock';
import {
  GraduationCap,
  Globe,
  Baby,
  Star,
  MessageCircle,
  User,
  FileText,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  Eye,
  X,
} from 'lucide-react';

/* ─── Vivid palette for cards (cycles) ─── */
const CARD_PALETTES = [
  { bg: 'bg-gradient-to-br from-sky-200 to-blue-300', border: 'border-sky-400', badge: 'bg-sky-500 text-white', accent: '#0ea5e9' },
  { bg: 'bg-gradient-to-br from-amber-200 to-yellow-300', border: 'border-amber-400', badge: 'bg-amber-500 text-white', accent: '#f59e0b' },
  { bg: 'bg-gradient-to-br from-emerald-200 to-green-300', border: 'border-emerald-500', badge: 'bg-emerald-500 text-white', accent: '#10b981' },
  { bg: 'bg-gradient-to-br from-pink-200 to-rose-300', border: 'border-rose-400', badge: 'bg-rose-500 text-white', accent: '#f43f5e' },
  { bg: 'bg-gradient-to-br from-violet-200 to-purple-300', border: 'border-violet-500', badge: 'bg-violet-500 text-white', accent: '#8b5cf6' },
];

const palette = (i) => CARD_PALETTES[i % CARD_PALETTES.length];

/* ─── Star rendering helper ─── */
const Stars = ({ rating = 5, size = 'text-sm' }) => (
  <span className={`inline-flex gap-0.5 ${size}`} aria-label={`${rating} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((s) => (
      <span key={s} className={s <= Math.round(rating) ? 'text-amber-400' : 'text-gray-300'}>★</span>
    ))}
  </span>
);

/* ─── Decorative floating shapes ─── */
const FloatingDeco = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10" aria-hidden="true">
    <div className="absolute -top-10 -left-16 w-60 h-60 rounded-full bg-pastel-blue/30 blur-3xl animate-float-slow" />
    <div className="absolute top-1/2 -right-20 w-72 h-72 rounded-full bg-pastel-pink/20 blur-3xl float-medium" />
    <div className="absolute -bottom-14 left-1/3 w-52 h-52 rounded-full bg-pastel-yellow/25 blur-3xl float-fast" />
    <div className="absolute top-16 right-[15%] w-3 h-3 rounded-full bg-amber-300/60 animate-sparkle" />
    <div className="absolute top-[60%] left-[10%] w-2.5 h-2.5 rounded-full bg-sky-300/60 animate-sparkle" style={{ animationDelay: '0.6s' }} />
    <div className="absolute bottom-20 right-[30%] w-2 h-2 rounded-full bg-rose-300/60 animate-sparkle" style={{ animationDelay: '1.2s' }} />
  </div>
);

/* ═══════════════════════════════════════
   Teacher Card Component
   ═══════════════════════════════════════ */
const TeacherCard = ({ teacher, index, onHoverStart, onHoverEnd }) => {
  const { t } = useTranslation();
  const p = palette(index);

  return (
    <div
      className={`
        ${p.bg} relative rounded-[2rem] p-7 flex flex-col items-center text-center
        shadow-card hover:shadow-card-hover
        hover:scale-[1.05] hover:-translate-y-1
        transition-all duration-300 ease-out
        w-[270px] md:w-[300px] shrink-0 cursor-pointer
        group border-2 ${p.border}
      `}
      onMouseEnter={() => onHoverStart(teacher, index)}
      onMouseLeave={onHoverEnd}
    >
      {/* Glow on hover */}
      <div
        className="absolute inset-0 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ boxShadow: `0 0 40px ${p.accent}55, 0 0 80px ${p.accent}28` }}
      />

      {/* Avatar */}
      <div className="relative w-40 h-40 mb-4 rounded-[1.5rem] overflow-hidden bg-white shadow-lg ring-4 ring-white group-hover:scale-105 transition-transform duration-300">
        {teacher.avatar ? (
          <img
            src={getImageUrl(teacher.avatar)}
            alt={teacher.name}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.src = '/placeholder.jpg'; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-primary-100 to-primary-200"><User className="w-12 h-12 text-primary-400" /></div>
        )}
        {/* Online dot */}
        <div className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-400 border-2 border-white rounded-full" />
      </div>

      {/* Name */}
      <h4 className="text-xl font-black text-text-main leading-tight mb-1">{teacher.name}</h4>

      {/* Specialization */}
      <p className="text-sm font-semibold text-text-light mb-3 line-clamp-1">
        {teacher.specialization || t('teachersSection.card.defaultRole')}
      </p>

      {/* Experience badge */}
        <span className={`${p.badge} text-xs font-bold px-3 py-1 rounded-full mb-3 shadow-sm flex items-center gap-1`}>
          <GraduationCap className="w-3.5 h-3.5" /> {teacher.experience || 1}+ {t('teachersSection.card.yearsExp')}
        </span>

      {/* Rating */}
      <div className="flex items-center gap-1.5">
        <Stars rating={teacher.rating} />
        <span className="text-xs font-bold text-text-light ml-0.5">{Number(teacher.rating || 5).toFixed(1)}</span>
      </div>

      {/* Feedback summary */}
      {teacher.feedback && (
        <div className="mt-4 px-1 w-full">
          <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-3 border border-white/50 text-left shadow-inner group-hover:bg-white/60 transition-colors duration-300">
            <p className="text-[11px] text-text-light leading-relaxed italic line-clamp-3">
              "{teacher.feedback}"
            </p>
          </div>
        </div>
      )}

      {/* View Details hint */}
      <div className="mt-3 text-[11px] text-text-light/60 font-medium group-hover:text-text-light/90 transition-colors">
        {t('teachersSection.card.hoverHint')}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════
   Teacher Detail Modal
   ═══════════════════════════════════════ */
const TeacherModal = ({ teacher, index, onClose }) => {
  const { t } = useTranslation();
  const modalRef = useRef(null);
  const p = palette(index);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!teacher) return null;

  const feedbacks = teacher.feedback
    ? [{ text: teacher.feedback, rating: teacher.rating || 5, reviewer: t('teachersSection.modal.reviewer') }]
    : [];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fadeInUp" style={{ animationDuration: '0.2s' }} />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative bg-white rounded-[2rem] max-w-lg w-full shadow-heavy overflow-hidden"
        style={{ animation: 'teacherModalIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
        onClick={(e) => e.stopPropagation()}
        onMouseLeave={onClose}
      >
        {/* Top accent bar */}
        <div className={`h-2 w-full ${p.bg}`} />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-8 pt-7">
          {/* Header */}
          <div className="flex items-center gap-5 mb-6">
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-primary-100 to-primary-200 shadow-lg ring-4 ring-white shrink-0">
              {teacher.avatar ? (
                <img
                  src={getImageUrl(teacher.avatar)}
                  alt={teacher.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = '/placeholder.jpg'; }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl"><User className="w-10 h-10 text-primary-400" /></div>
              )}
            </div>
            <div>
              <h3 className="text-2xl font-black text-text-main leading-tight">{teacher.name}</h3>
              <p className="text-sm font-semibold text-primary-500 mt-0.5">
                {teacher.specialization || t('teachersSection.card.defaultRole')}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className={`${p.badge} text-xs font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1`}>
                  <GraduationCap className="w-3.5 h-3.5" /> {teacher.experience || 1}+ {t('teachersSection.card.yearsExp')}
                </span>
                <div className="flex items-center gap-1">
                  <Stars rating={teacher.rating} />
                  <span className="text-xs font-bold text-text-light">{Number(teacher.rating || 5).toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {teacher.description && (
            <p className="text-sm text-text-light leading-relaxed mb-5 bg-gray-50 rounded-xl p-4 border border-gray-100">
              "{teacher.description}"
            </p>
          )}

          {/* Feedbacks */}
          <div>
            <h4 className="text-sm font-bold text-text-main mb-3 flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4" /> {t('teachersSection.modal.reviews')}
            </h4>

            {feedbacks.length > 0 ? (
              <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                {feedbacks.slice(0, 3).map((fb, i) => (
                  <div key={i} className="bg-gradient-to-r from-amber-50/80 to-orange-50/50 rounded-xl p-4 border border-amber-100/60">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-text-main flex items-center gap-1"><User className="w-3 h-3" /> {fb.reviewer}</span>
                      <Stars rating={fb.rating} size="text-xs" />
                    </div>
                    <p className="text-sm text-text-light leading-relaxed">"{fb.text}"</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-6 text-center border border-gray-100">
                <FileText className="w-8 h-8 mb-2 mx-auto text-gray-300" />
                <p className="text-sm text-text-light font-medium">{t('teachersSection.modal.noReviews')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════
   Show All Modal Component (Mobile)
   ═══════════════════════════════════════ */
const ShowAllModal = ({ teachers, onClose, onSelectTeacher, t }) => {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div className="fixed inset-0 z-[10000] flex items-end justify-center p-0 md:hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative bg-white w-full rounded-t-[3rem] shadow-heavy max-h-[85vh] flex flex-col"
      >
        <div className="flex-1 p-6 pb-8 overflow-y-auto custom-scrollbar" style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}>
          <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-black text-text-main">{t('teachersSection.viewAll')}</h3>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"><X className="w-4 h-4 text-gray-500" /></button>
          </div>
          <div className="space-y-4">
            {teachers.map((teacher, i) => (
              <div
                key={teacher._id}
                className="flex items-center gap-4 p-4 rounded-3xl bg-gray-50 border border-gray-100 active:scale-95 transition-transform"
                onClick={() => onSelectTeacher(teacher, i)}
              >
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white shadow-sm ring-2 ring-white">
                  {teacher.avatar ? (
                    <img src={getImageUrl(teacher.avatar)} alt={teacher.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50"><User className="w-7 h-7 text-gray-400" /></div>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-text-main">{teacher.name}</h4>
                  <p className="text-xs text-text-light">{teacher.specialization}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

/* ═══════════════════════════════════════
   Main TeachersSection Component
   ═══════════════════════════════════════ */
const TeachersSection = () => {
  const { t } = useTranslation();
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const sectionRef = useRef(null);
  const hoverTimerRef = useRef(null);
  const autoRotateRef = useRef(null);
  const resumeTimerRef = useRef(null);
  const frameRef = useRef(null);
  const lastTimeRef = useRef(performance.now());
  const [isInView, setIsInView] = useState(false);

  const [rotation, setRotation] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [showAllModal, setShowAllModal] = useState(false);

  const interactionTimeoutRef = useRef(null);

  const BASE_ANGLES = useMemo(() => [-60, -30, 0, 30, 60], []);
  const normalize = useCallback((deg) => ((deg % 360) + 360) % 360, []);

  const fallbackTeachers = [
    { _id: '1', name: 'Ms. Emily', specialization: 'Phonics & Speaking', experience: 5, rating: 5, description: 'Friendly and creative teacher' },
    { _id: '2', name: 'Ms. Sarah', specialization: 'Creative Arts', experience: 3, rating: 4, description: 'Passionate about art education' },
    { _id: '3', name: 'Mr. David', specialization: 'Science Explorer', experience: 8, rating: 5, description: 'Making science fun for kids' },
    { _id: '4', name: 'Ms. Lucy', specialization: 'Music & Movement', experience: 6, rating: 5, description: 'Energetic and inspiring' },
  ];

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const res = await api.get('/teachers');
        const data = Array.isArray(res.data.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
        setTeachers(data);
      } catch (err) {
        console.error('Failed to fetch teachers for home page:', err);
        setTeachers(fallbackTeachers);
      }
    };
    fetchTeachers();
  }, []);

  // IntersectionObserver for reveal
  useEffect(() => {
    if (!sectionRef.current) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.target) {
          entry.target.classList.add('active');
          setIsInView(true);
        }
      });
    }, { threshold: 0.1 });

    const revealItems = sectionRef.current.querySelectorAll('.reveal');
    revealItems.forEach(item => { if (item) observer.observe(item); });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => { if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current); };
  }, []);

  useEffect(() => {
    if (selectedTeacher) {
      openModal();
    }
    return () => {
      if (selectedTeacher) closeModal();
    };
  }, [selectedTeacher]);

  const handleHoverStart = useCallback((teacher, index) => {
    setIsPaused(true);
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      setSelectedTeacher(teacher);
      setSelectedIndex(index);
    }, 750); // ← 0.75s delay
  }, []);

  const handleHoverEnd = useCallback(() => {
    setIsPaused(false);
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedTeacher(null);
    setIsPaused(false);
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }, []);

  const displayTeachers = teachers.length > 0 ? teachers : fallbackTeachers;
  const marqueeTeachers = displayTeachers.length < 4
    ? [...displayTeachers, ...displayTeachers, ...displayTeachers]
    : displayTeachers;

  const trustBadges = [
    { id: 'certified', icon: <GraduationCap className="w-5 h-5" />, labelKey: 'teachersSection.trust.certified' },
    { id: 'curriculum', icon: <Globe className="w-5 h-5" />, labelKey: 'teachersSection.trust.curriculum' },
    { id: 'childSafe', icon: <Baby className="w-5 h-5" />, labelKey: 'teachersSection.trust.childSafe' },
    { id: 'rated', icon: <Star className="w-5 h-5" />, labelKey: 'teachersSection.trust.rated' },
  ];

  // Interaction handler for pausing auto-behaviors
  const handleUserInteraction = useCallback(() => {
    setIsUserInteracting(true);
    if (interactionTimeoutRef.current) clearTimeout(interactionTimeoutRef.current);
    interactionTimeoutRef.current = setTimeout(() => {
      setIsUserInteracting(false);
    }, 3000);
  }, []);

  // Main card auto-switch (2 seconds)
  useEffect(() => {
    if (!isInView || showAllModal || selectedTeacher || window.innerWidth >= 768) return;
    console.log("Starting auto-rotate");

    const start = setTimeout(() => {
      const interval = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % displayTeachers.length);
      }, 3800);

      autoRotateRef.current = interval;
    }, 300)
    return () => {
      clearTimeout(start);
      if (autoRotateRef.current) clearInterval(autoRotateRef.current);
    };
  }, [displayTeachers.length, showAllModal, selectedTeacher, isInView]);

  // Continuous background ring rotation drift (Stabilized)
  useEffect(() => {
    if (!isInView || isUserInteracting || selectedTeacher || showAllModal || window.innerWidth >= 768) return;

    let raf;
    let last = performance.now();
    let accumulator = 0;

    const animate = (now) => {
      const delta = now - last;
      last = now;
      accumulator += delta;

      if (accumulator > 16) {
        setRotation(prev => prev + accumulator * 0.015);
        accumulator = 0;
      }
      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [isUserInteracting, selectedTeacher, showAllModal, isInView]);

  const handleMobileNav = (direction) => {
    handleUserInteraction();
    if (direction === 'next') {
      setCurrentIndex(prev => (prev + 1) % displayTeachers.length);
      setRotation(prev => prev + 30);
    } else {
      setCurrentIndex(prev => (prev - 1 + displayTeachers.length) % displayTeachers.length);
      setRotation(prev => prev - 30);
    }
  };

  return (
    <section ref={sectionRef} id="teachers" className="relative lc-section bg-[#F5F5F0] overflow-hidden">
      <FloatingDeco />

      <style>{`
        @keyframes teacherModalIn {
          from { opacity: 0; transform: scale(0.92) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes teachersMarquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .teachers-marquee-track {
          animation: teachersMarquee 45s linear infinite;
        }
        .teachers-marquee-track.paused {
          animation-play-state: paused;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
      `}</style>

      {/* ── Section header — inside centered container ── */}
      <div className="lc-container text-center">
        <div className="mb-4 reveal">
          <span className="inline-block bg-[#1C695C] text-white text-xs font-display font-bold px-4 py-1.5 rounded-full mb-4 tracking-wide uppercase">
            {t('teachersSection.badge')}
          </span>
        </div>
        <h2 className="text-[28px] md:text-[36px] lg:text-[48px] font-display font-black text-[#4A4A4A] mb-4 reveal stagger-1">
          {t('teachersSection.title')}
        </h2>
        <p className="text-base md:text-lg text-[#4A4A4A] font-semibold max-w-xl mx-auto mb-14 reveal stagger-2">
          {t('teachersSection.subtitle')}
        </p>
      </div>

      {/* ── Marquee carousel — full-width, outside centered container ── */}
      {/* FIX: placed outside max-w-7xl so fade overlays reach true screen edges */}
      <div className="relative py-4 w-full reveal stagger-3 hidden md:block overflow-hidden">
        {/* Fade left — anchored to viewport edge */}
        <div className="absolute left-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-r from-[#F5F5F0] via-[#F5F5F0]/75 to-transparent z-10 pointer-events-none" />
        {/* Fade right — anchored to viewport edge */}
        <div className="absolute right-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-l from-[#F5F5F0] via-[#F5F5F0]/75 to-transparent z-10 pointer-events-none" />

        <div
          className={`flex w-max teachers-marquee-track ${isPaused ? 'paused' : ''}`}
          style={{ paddingLeft: '24px', paddingRight: '24px' }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => {
            if (!selectedTeacher) setIsPaused(false);
          }}
        >
          {/* First set */}
          <div className="flex gap-7 pr-7">
            {marqueeTeachers.map((teacher, idx) => (
              <TeacherCard
                key={`a-${teacher._id}-${idx}`}
                teacher={teacher}
                index={idx}
                onHoverStart={handleHoverStart}
                onHoverEnd={handleHoverEnd}
              />
            ))}
          </div>
          {/* Duplicate for seamless loop */}
          <div className="flex gap-7 pr-7" aria-hidden="true">
            {marqueeTeachers.map((teacher, idx) => (
              <TeacherCard
                key={`b-${teacher._id}-${idx}`}
                teacher={teacher}
                index={idx}
                onHoverStart={handleHoverStart}
                onHoverEnd={handleHoverEnd}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Mobile Spotlight Carousel (md:hidden) ── */}
      <div className="md:hidden my-8 reveal stagger-3 px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={displayTeachers[currentIndex]?._id || 'none'}
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="lc-card border border-[#E6DCCF] p-6 text-center cursor-pointer"
            onClick={() => {
              setSelectedTeacher(displayTeachers[currentIndex]);
              setSelectedIndex(currentIndex);
            }}
          >
            <div className="w-36 h-36 mx-auto rounded-[1.25rem] overflow-hidden ring-4 ring-white shadow-md bg-[#F5F5F0] mb-4">
              {displayTeachers[currentIndex]?.avatar ? (
                <img
                  src={getImageUrl(displayTeachers[currentIndex].avatar)}
                  alt={displayTeachers[currentIndex].name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-10 h-10 text-[#1C695C]" />
                </div>
              )}
            </div>

            <h4 className="text-[22px] leading-[30px] font-display font-bold text-[#4A4A4A] line-clamp-1">
              {displayTeachers[currentIndex]?.name}
            </h4>
            <p className="text-sm font-semibold text-[#1C6970] mt-1 line-clamp-1">
              {displayTeachers[currentIndex]?.specialization || t('teachersSection.card.defaultRole')}
            </p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <Stars rating={displayTeachers[currentIndex]?.rating} size="text-sm" />
              <span className="text-xs font-bold text-[#4A4A4A]">
                {Number(displayTeachers[currentIndex]?.rating || 5).toFixed(1)}
              </span>
            </div>

            {/* Mobile Feedback summary */}
            {displayTeachers[currentIndex]?.feedback && (
              <div className="mt-4 bg-[#F5F5F0]/50 rounded-2xl p-4 border border-[#E6DCCF] text-left">
                <p className="text-sm text-[#4A4A4A] leading-relaxed italic line-clamp-3">
                  "{displayTeachers[currentIndex].feedback}"
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            onClick={() => handleMobileNav('prev')}
            className="w-11 h-11 bg-white border border-[#E6DCCF] rounded-full shadow-sm flex items-center justify-center active:scale-95 transition-transform"
            aria-label="Previous teacher"
          >
            <ChevronLeft className="w-5 h-5 text-[#4A4A4A]" />
          </button>
          <button
            onClick={() => {
              handleUserInteraction();
              setShowAllModal(true);
              setIsPaused(true);
            }}
            className="lc-btn lc-btn-primary px-6 text-xs"
          >
            <span className="inline-flex items-center gap-1.5">
              <Eye className="w-4 h-4" /> {t('teachersSection.viewAll')}
            </span>
          </button>
          <button
            onClick={() => handleMobileNav('next')}
            className="w-11 h-11 bg-white border border-[#E6DCCF] rounded-full shadow-sm flex items-center justify-center active:scale-95 transition-transform"
            aria-label="Next teacher"
          >
            <ChevronDown className="w-5 h-5 text-[#4A4A4A] rotate-[-90deg]" />
          </button>
        </div>

        <div className="mt-4 flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
          {displayTeachers.map((teacher, i) => {
            const active = i === currentIndex;
            return (
              <button
                key={teacher._id || i}
                type="button"
                onClick={() => {
                  handleUserInteraction();
                  setCurrentIndex(i);
                }}
                className={`snap-start shrink-0 flex items-center gap-2.5 px-3 py-2 rounded-full border transition-all duration-200 ${
                  active
                    ? 'bg-[#1C695C] text-white border-[#1C695C]'
                    : 'bg-white text-[#4A4A4A] border-[#E6DCCF]'
                }`}
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-[#F5F5F0]">
                  {teacher.avatar ? (
                    <img src={getImageUrl(teacher.avatar)} alt={teacher.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className={`w-4 h-4 ${active ? 'text-white' : 'text-[#1C695C]'}`} />
                    </div>
                  )}
                </div>
                <span className="text-xs font-bold max-w-[92px] truncate">{teacher.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Trust badges strip — back inside centered container ── */}
      <div className="max-w-7xl mx-auto px-6 text-center">
        <div className="flex flex-wrap justify-center gap-6 md:gap-10 mt-12 reveal stagger-4">
          {trustBadges
            .filter(item => {
              // On mobile, only show "certified"
              if (window.innerWidth < 768) return item.id === 'certified';
              return true;
            })
            .map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm font-semibold text-text-light bg-white/70 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-gray-100">
                <span className="text-lg">{item.icon}</span>
                {t(item.labelKey)}
              </div>
            ))}
        </div>
      </div>

      {/* ── Teacher detail modal ── */}
      <AnimatePresence>
        {selectedTeacher && (
          <TeacherModal
            teacher={selectedTeacher}
            index={selectedIndex}
            onClose={handleCloseModal}
          />
        )}
      </AnimatePresence>

      {/* ── All teachers list modal (Mobile) ── */}
      <AnimatePresence>
        {showAllModal && (
          <ShowAllModal
            teachers={displayTeachers}
            t={t}
            onClose={() => { setShowAllModal(false); setIsPaused(false); }}
            onSelectTeacher={(teacher, i) => {
              setSelectedTeacher(teacher);
              setSelectedIndex(i);
              setShowAllModal(false);
            }}
          />
        )}
      </AnimatePresence>
    </section>
  );
};

export default TeachersSection;