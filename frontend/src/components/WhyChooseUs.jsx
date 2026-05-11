import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Flame } from 'lucide-react';
import { useLenis } from './LenisProvider';
import step1Img from '../assets/why-us-step1.png';
import step2Img from '../assets/why-us-step2.png';
import step3Img from '../assets/why-us-step3.png';

// Ranking trophy images
const rankImages = {
  1: '/ranking/oneChamp.png',
  2: '/ranking/top2.png',
  3: '/ranking/top3.png',
};
const rankingAvatars = [
  '/avatar-ranking/avatar-rank1.png',
  '/avatar-ranking/avatar-rank2.png',
  '/avatar-ranking/avatar-rank3.png',
  '/avatar-ranking/avatar-rank4.png',
  '/avatar-ranking/avatar-rank5.png',
];

// Decorative assets
const decorations = [
  { src: '/decorate/music-note.png', className: 'absolute top-6 left-4 w-10 h-10 opacity-70', delay: 0,   yRange: [-12, 12],  rotate: [-15, 15] },
  { src: '/decorate/start-ranking.png', className: 'absolute top-12 right-6 w-8 h-8 opacity-80',  delay: 0.4, yRange: [-8, 8],   rotate: [0, 360] },
  { src: '/decorate/moon.png',        className: 'absolute bottom-16 right-4 w-9 h-9 opacity-60', delay: 0.8, yRange: [-10, 10], rotate: [-10, 10] },
  { src: '/decorate/music-note.png',  className: 'absolute bottom-8 left-8 w-7 h-7 opacity-50',  delay: 1.2, yRange: [-6, 14],  rotate: [0, -20] },
  { src: '/decorate/start-ranking.png',className: 'absolute top-1/2 left-2 w-6 h-6 opacity-60',   delay: 0.6, yRange: [-14, 6],  rotate: [0, 180] },
];

const truncateSkill = (value, max = 30) => {
  if (!value || typeof value !== 'string') return '';
  const text = value.trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max)}...`;
};

// ─── Floating deco item ───────────────────────
const FloatingDeco = ({ src, className, delay, yRange, rotate }) => (
  <motion.img
    src={src}
    className={className}
    animate={{ y: yRange, rotate }}
    transition={{
      duration: 4 + delay,
      repeat: Infinity,
      repeatType: 'mirror',
      ease: 'easeInOut',
      delay,
    }}
    onError={(e) => { e.target.style.display = 'none'; }}
  />
);

// ─── Single rank row ─────────────────────────
const RankRow = ({ entry, rank, delay, mode }) => {
  const isTop3 = rank <= 3;
  const isFirst = rank === 1;
  const avatarSrc = rankingAvatars[(rank - 1) % rankingAvatars.length];
  const skillLabel = truncateSkill(entry.skill, 30);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: delay * 0.08 + 0.15, duration: 0.4, type: 'spring', stiffness: 220, damping: 22 }}
      whileHover={isFirst
        ? { scale: 1.1, y: -2, boxShadow: '0 18px 45px rgba(255,170,0,0.45)' }
        : isTop3
          ? { scale: 1.03, y: -2, boxShadow: '0 12px 30px rgba(107,114,128,0.25)' }
          : { scale: 1.02, y: -1, boxShadow: '0 10px 24px rgba(15,23,42,0.12)' }
      }
      className={`relative flex items-center gap-3 rounded-3xl px-4 py-3.5 transition-all cursor-default overflow-hidden
        ${isFirst
          ? 'scale-[1.06] bg-gradient-to-r from-amber-300 via-yellow-200 to-orange-300 border-2 border-amber-400 shadow-xl shadow-amber-200/80'
          : rank === 2
            ? 'bg-gradient-to-r from-slate-100 to-zinc-100 border border-slate-200 shadow-md'
            : rank === 3
              ? 'bg-gradient-to-r from-gray-100 to-slate-50 border border-gray-200 shadow-md'
              : 'bg-white border border-gray-100 shadow-sm'
        }`}
    >
      {/* Rank badge / image */}
      <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
        {isTop3 ? (
          <motion.img
            src={rankImages[rank]}
            alt={`Top ${rank}`}
            className="w-10 h-10 object-contain drop-shadow-md"
            animate={isFirst ? { y: [0, -4, 0], rotate: [-3, 3, -3] } : {}}
            transition={isFirst ? { duration: 2.5, repeat: Infinity, ease: 'easeInOut' } : {}}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <span className="text-sm font-black text-gray-400 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            #{rank}
          </span>
        )}
      </div>

      {isFirst && (
        <div className="absolute top-2 right-2 text-sm">👑</div>
      )}

      {/* Left column: avatar + student + skill */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <img
          src={avatarSrc}
          alt={`Avatar rank ${rank}`}
          className="w-11 h-11 rounded-full object-cover flex-shrink-0 border-2 border-white shadow"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <div className="min-w-0">
          <p className={`font-black truncate text-sm ${isFirst ? 'text-amber-900' : 'text-gray-800'}`}>
            {entry.childName}
          </p>
          <p className={`text-[11px] truncate font-semibold ${isFirst ? 'text-amber-700' : 'text-gray-500'}`}>
            {skillLabel || '—'}
          </p>
        </div>
      </div>

      {/* Right column: course + stars */}
      <div className="flex flex-col items-end justify-center flex-shrink-0 text-right max-w-[42%]">
        <p className={`text-[11px] truncate w-full ${isFirst ? 'text-amber-800 font-semibold' : 'text-gray-500'}`}>
          {entry.courseName || '—'}
        </p>
        <div className={`mt-1 inline-flex items-center gap-1 px-2.5 py-1 rounded-full ${isFirst ? 'bg-white/50 text-amber-900' : 'bg-gray-100 text-gray-700'}`}>
          <span className="text-sm">{mode === 'streak' ? '🔥' : '⭐'}</span>
          <span className="font-black text-sm">{entry.stars}</span>
        </div>
      </div>

      {/* Gold shimmer for rank 1 */}
      {isFirst && (
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.4, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 1 }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent -skew-x-12 translate-x-[-100%] animate-[shimmer_2.5s_infinite_1s]" />
        </motion.div>
      )}
    </motion.div>
  );
};

// ─── Skeleton loader ─────────────────────────
const SkeletonRow = ({ i }) => (
  <div className="flex items-center gap-3 rounded-2xl px-4 py-3 bg-gray-50 border border-gray-100 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}>
    <div className="w-10 h-10 rounded-full bg-gray-200" />
    <div className="w-9 h-9 rounded-full bg-gray-200" />
    <div className="flex-1 space-y-1.5">
      <div className="h-3 bg-gray-200 rounded-full w-2/3" />
      <div className="h-2 bg-gray-100 rounded-full w-1/2" />
    </div>
    <div className="w-8 h-3 bg-gray-200 rounded-full" />
  </div>
);

// ─── Tab indicator (dot) ─────────────────────
const TabDots = ({ mode, onToggle }) => (
  <button
    onClick={onToggle}
    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors cursor-pointer"
    aria-label="Switch ranking mode"
  >
    <span className={`w-2 h-2 rounded-full transition-all duration-300 ${mode === 'ranking' ? 'bg-white scale-125' : 'bg-white/40'}`} />
    <span className={`w-2 h-2 rounded-full transition-all duration-300 ${mode === 'streak' ? 'bg-white scale-125' : 'bg-white/40'}`} />
  </button>
);

// ─── Ranking Board ───────────────────────────
const RankingBoard = () => {
  const { t } = useTranslation();
  const [mode, setMode] = useState('ranking'); // 'ranking' | 'streak'
  const [rankings, setRankings] = useState([]);
  const [streaks, setStreaks] = useState([]);
  const [loading, setLoading] = useState(true);

  // FIX: Track previous mode to know slide direction
  const [slideDirection, setSlideDirection] = useState(1); // 1 = left→right, -1 = right→left

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { default: api } = await import('../services/api');
        const [rankRes, streakRes] = await Promise.all([
          api.get('/rankings/top').catch(() => ({ data: { success: false } })),
          api.get('/streak/leaderboard').catch(() => ({ data: { success: false } }))
        ]);
        if (rankRes.data?.success) setRankings(rankRes.data.data.slice(0, 5));
        if (streakRes.data?.success) setStreaks(streakRes.data.data.slice(0, 5));
      } catch (err) {
        console.warn('[RankingBoard] Fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setSlideDirection(1);
      setMode(prev => prev === 'ranking' ? 'streak' : 'ranking');
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleToggle = () => {
    const next = mode === 'ranking' ? 'streak' : 'ranking';
    setSlideDirection(next === 'streak' ? 1 : -1);
    setMode(next);
  };

  const displayData = mode === 'ranking' ? rankings : streaks;

  // FIX: Normalize data once so list height is always consistent (5 items)
  const normalizedData = loading
    ? []
    : displayData.length > 0
      ? displayData.map((entry, i) =>
          mode === 'ranking'
            ? entry
            : { ...entry, childName: entry.name, stars: entry.streakCount, courseName: '🔥 Streak', skill: 'Daily streak' }
        )
      : [];

  // FIX: slide variants — no height change, only opacity + translateX
  const listVariants = {
    enter: (dir) => ({ opacity: 0, x: dir * 30 }),
    center: { opacity: 1, x: 0 },
    exit: (dir) => ({ opacity: 0, x: dir * -30 }),
  };

  return (
    <div className="relative w-full max-w-[420px] mx-auto">
      {/* Decorative floating elements */}
      {decorations.map((d, i) => (
        <FloatingDeco key={i} {...d} />
      ))}

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, type: 'spring', stiffness: 120 }}
        className="bg-white/95 backdrop-blur-md rounded-[2rem] shadow-[0_28px_60px_rgba(15,23,42,0.16)] border border-gray-100/80 overflow-hidden relative z-10 p-1"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-400 via-amber-300 to-orange-400 px-6 py-5 relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full blur-xl" />
          <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/10 rounded-full blur-xl" />
          <div className="relative z-10 flex items-center gap-3">
            <AnimatePresence mode="wait">
              {mode === 'ranking' ? (
                <motion.img
                  key="cup"
                  src="/ranking/cup.png"
                  alt="Ranking Cup"
                  className="w-10 h-10 object-contain"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: [1, 1.1, 1], rotate: [0, -10, 10, 0] }}
                  exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />
              ) : (
                <motion.div
                  key="flame"
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: [1, 1.1, 1] }}
                  exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Flame className="w-6 h-6 text-orange-500 fill-orange-500" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Title + subtitle with crossfade */}
            <div className="flex-1 min-w-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                >
                  <h3 className="text-lg font-black text-white leading-none tracking-tight">
                    {mode === 'ranking' ? t('ranking.title') : t('streak.title')}
                  </h3>
                  <p className="text-yellow-100 text-xs font-medium mt-0.5">
                    {mode === 'ranking' ? t('ranking.subtitle') : t('streak.subtitle')}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Dot navigator — lets user manually switch too */}
            <TabDots mode={mode} onToggle={handleToggle} />
          </div>
        </div>

        {/* 
          FIX: List container has a FIXED min-height so switching modes never 
          changes the card height → eliminates page jump on mobile.
          5 rows × ~64px each ≈ 320px, plus spacing = ~380px
        */}
        <div className="p-5 relative" style={{ minHeight: '380px' }}>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <SkeletonRow key={i} i={i} />)}
            </div>
          ) : (
            <AnimatePresence mode="wait" custom={slideDirection}>
              <motion.div
                key={mode}
                custom={slideDirection}
                variants={listVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="space-y-3"
                // FIX: absolute during transition so height doesn't collapse
                style={{ width: '100%' }}
              >
                {normalizedData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-gray-300" style={{ minHeight: '300px' }}>
                    <div className="mb-2">
                      {mode === 'ranking' ? (
                        <img
                          src="/ranking/cup.png"
                          alt="Ranking Cup"
                          className="w-10 h-10 object-contain mx-auto grayscale"
                        />
                      ) : (
                        <Flame className="w-10 h-10 mx-auto text-gray-300" />
                      )}
                    </div>
                    <p className="text-sm font-bold">Chưa có danh sách nào</p>
                  </div>
                ) : (
                  normalizedData.map((entry, i) => (
                    <RankRow
                      key={`${mode}-${entry._id || i}`}
                      entry={entry}
                      rank={i + 1}
                      delay={i}
                      mode={mode}
                    />
                  ))
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </motion.div>

      {/* Background glow blobs */}
      <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-amber-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-200/20 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
};

// ─────────────────────────────────────────────
// 🏠 Main Section
// ─────────────────────────────────────────────
const WhyChooseUs = () => {
  const { t } = useTranslation();
  const lenisRef = useLenis();

  const containerVariants = {
    hidden:  { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, staggerChildren: 0.2 } },
  };

  const itemVariants = {
    hidden:  { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
  };

  const steps = [
    {
      id: '01',
      title: t('whyUs.teachers'),
      desc: t('whyUs.teachersDesc'),
      image: step1Img,
      bgColor: 'bg-pastel-blue',
    },
    {
      id: '02',
      title: t('whyUs.funClasses'),
      desc: t('whyUs.funClassesDesc'),
      image: step2Img,
      bgColor: 'bg-pastel-green',
    },
    {
      id: '03',
      title: t('whyUs.confidence'),
      desc: t('whyUs.confidenceDesc'),
      image: step3Img,
      bgColor: 'bg-pastel-orange',
    },
  ];

  return (
    <section className="lc-section bg-[#F5F5F0] overflow-hidden relative">
      {/* Decorative Background */}
      <div className="absolute top-20 -left-20 w-64 h-64 bg-pastel-blue/30 rounded-full blur-3xl" />
      <div className="absolute bottom-20 -right-20 w-80 h-80 bg-pastel-yellow/30 rounded-full blur-3xl" />

      <motion.div
        className="lc-container"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={containerVariants}
      >
        {/* Section title */}
        <div className="text-center mb-16">
          <motion.span
            className="inline-block px-4 py-1.5 bg-primary-100 text-primary-600 rounded-full text-sm font-bold tracking-wider uppercase mb-4"
            variants={itemVariants}
          >
            {t('whyUs.title')}
          </motion.span>
          <motion.h2
            className="text-4xl md:text-5xl font-display font-black text-text-main mb-6 leading-tight"
            variants={itemVariants}
          >
            {t('whyUs.subtitle')}
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* ── Left: Ranking Board ── */}
          <motion.div variants={itemVariants}>
            <RankingBoard />
          </motion.div>

          {/* ── Right: Step Journey ── */}
          <div className="space-y-8 relative">
            <div className="absolute left-6 top-8 bottom-8 w-1 border-l-2 border-dashed border-primary-200 hidden md:block" />

            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                variants={itemVariants}
                whileHover={{ scale: 1.02, x: 10 }}
                className="relative flex gap-3 md:gap-6"
              >
                <div className="relative z-10 hidden md:flex flex-shrink-0 w-12 h-12 rounded-full bg-white border-4 border-primary-100 shadow-md items-center justify-center font-display font-black text-primary-500">
                  {step.id}
                </div>

                <div className="flex-grow bg-white p-4 md:p-6 rounded-3xl shadow-sm hover:shadow-md transition border border-gray-100/50 group">
                  <div className="flex flex-col md:flex-row gap-3 md:gap-6 items-center">
                    <div className={`w-14 h-14 md:w-20 md:h-20 ${step.bgColor} rounded-2xl flex items-center justify-center flex-shrink-0 transition-all group-hover:rotate-3`}>
                      <img
                        src={step.image}
                        alt={step.title}
                        className="w-10 h-10 md:w-16 md:h-16 object-contain"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                    <div className="text-center md:text-left">
                      <h4 className="text-base md:text-xl font-bold text-text-main mb-2 font-display">{step.title}</h4>
                      <p className="text-gray-500 text-xs md:text-sm leading-relaxed line-clamp-1 md:line-clamp-none">{step.desc}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* CTA */}
            <motion.div className="pt-6 md:pl-20" variants={itemVariants}>
              <button
                onClick={() => {
                  const el = document.getElementById('courses');
                  if (!el) return;
                  if (lenisRef?.current) {
                    lenisRef.current.scrollTo(el, { offset: -80, duration: 1.2 });
                  } else {
                    window.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' });
                  }
                }}
            className="lc-btn lc-btn-primary inline-flex items-center gap-3"
              >
                <span>{t('whyUs.exploreMore')}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default WhyChooseUs;
