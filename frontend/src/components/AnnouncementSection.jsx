import { useState, useEffect, Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

import { getImageUrl } from '../utils/getImageUrl';
import AnnouncementListModal from './AnnouncementListModal';
// Lazy load modal chi tiet (dung cho card click truc tiep)
const AnnouncementModal = lazy(() => import('./AnnouncementModal'));

const AnnouncementSection = () => {
  const { t, i18n } = useTranslation();
  const [announcements, setAnnouncements] = useState([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [openAll, setOpenAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await api.get('/announcements');
        setAnnouncements(res.data.data || []);
      } catch (error) {
        console.error('Failed to fetch announcements:', error);
        setHasError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);



  const handleImageError = (e) => {
    e.target.src = '/placeholder.jpg';
  };

  const sortedNotifications = [...announcements].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const visibleItems = sortedNotifications.slice(0, 4);
  const remainingCount = sortedNotifications.length - visibleItems.length;
  const latestTen = sortedNotifications.slice(0, 10);

  const cardColors = ['bg-[#E0F2FE]', 'bg-[#F3E8FF]', 'bg-[#FCE7F3]', 'bg-[#FEF3C7]'];

  const getCardTheme = (index) => {
    const themes = [
      { border: "border-blue-300", ring: "ring-blue-200", text: "text-blue-600" }, // Blue
      { border: "border-purple-300", ring: "ring-purple-200", text: "text-purple-600" }, // Purple
      { border: "border-pink-300", ring: "ring-pink-200", text: "text-pink-600" }, // Pink
      { border: "border-yellow-400", ring: "ring-yellow-200", text: "text-yellow-700" }, // Yellow
    ];
    return themes[index % themes.length];
  };

  const getCardStyle = (index) => {
    const offset = index - activeIndex;

    if (offset === 0)
      return "z-40 translate-x-0 rotate-0 scale-100 shadow-2xl";

    if (offset === 1)
      return "z-30 translate-x-16 rotate-3 scale-95 opacity-90 shadow-xl";

    if (offset === 2)
      return "z-20 translate-x-28 rotate-6 scale-90 opacity-70 shadow-lg";

    if (offset === 3)
      return "z-10 translate-x-40 rotate-9 scale-85 opacity-50 shadow-md";

    return "hidden";
  };

  if (loading || hasError || announcements.length === 0) {
    return null;
  }

  return (
    <section 
      id="announcements"
      key={i18n.language}
      className="relative py-12 lg:py-24 px-4 lg:px-6 overflow-hidden bg-white border-t border-primary-50 isolate z-0 font-sans"
    >

      {/* ═══════════════════════════════════════════════════════════════════
          MILKY WAY BACKGROUND — Desktop Only, purely decorative
          All pointer-events: none, z-index below content
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:block absolute inset-0 pointer-events-none overflow-hidden z-0">

        {/* Milky Way arc — soft diagonal aurora band */}
        <div
          className="absolute"
          style={{
            top: '-10%', left: '-5%', width: '110%', height: '70%',
            background: 'linear-gradient(125deg, rgba(147,197,253,0.70) 0%, rgba(196,181,253,0.65) 35%, rgba(249,168,212,0.55) 65%, rgba(253,230,138,0.50) 100%)',
            borderRadius: '0 0 60% 40%',
            filter: 'blur(48px)',
            transform: 'rotate(-8deg)',
          }}
        />

        {/* Secondary aurora ribbon — bottom */}
        <div
          className="absolute"
          style={{
            bottom: '-5%', right: '-5%', width: '80%', height: '45%',
            background: 'linear-gradient(300deg, rgba(167,139,250,0.50) 0%, rgba(110,231,183,0.40) 50%, rgba(96,165,250,0.50) 100%)',
            borderRadius: '40% 0 0 60%',
            filter: 'blur(56px)',
          }}
        />

        {/* Star field — tiny twinkling dots */}
        {[
          { top:'8%', left:'7%', size:5, delay:'0s', color:'#3b82f6' },
          { top:'14%', left:'18%', size:6, delay:'0.8s', color:'#8b5cf6' },
          { top:'6%', left:'32%', size:5, delay:'1.4s', color:'#f59e0b' },
          { top:'18%', left:'48%', size:7, delay:'0.3s', color:'#ec4899' },
          { top:'9%', left:'62%', size:5, delay:'2.1s', color:'#10b981' },
          { top:'22%', left:'75%', size:6, delay:'0.6s', color:'#3b82f6' },
          { top:'7%', left:'88%', size:5, delay:'1.8s', color:'#8b5cf6' },
          { top:'32%', left:'5%', size:6, delay:'1.1s', color:'#f59e0b' },
          { top:'38%', left:'92%', size:5, delay:'0.4s', color:'#ec4899' },
          { top:'55%', left:'3%', size:7, delay:'2.5s', color:'#3b82f6' },
          { top:'60%', left:'94%', size:6, delay:'1.3s', color:'#8b5cf6' },
          { top:'72%', left:'8%', size:5, delay:'0.9s', color:'#10b981' },
          { top:'78%', left:'88%', size:6, delay:'2.0s', color:'#f59e0b' },
          { top:'85%', left:'20%', size:5, delay:'0.2s', color:'#ec4899' },
          { top:'88%', left:'72%', size:7, delay:'1.6s', color:'#3b82f6' },
        ].map((star, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-twinkle-slower"
            style={{
              top: star.top, left: star.left,
              width: star.size, height: star.size,
              background: star.color,
              boxShadow: `0 0 ${star.size * 4}px ${star.color}, 0 0 ${star.size * 2}px ${star.color}`,
              animationDelay: star.delay,
            }}
          />
        ))}

        {/* Sparkle ✦ stars — larger decorative */}
        {[
          { top:'12%', left:'12%', size:'1.6rem', color:'#7c3aed', delay:'0s' },
          { top:'20%', left:'55%', size:'1.3rem', color:'#2563eb', delay:'1.2s' },
          { top:'10%', left:'78%', size:'1.5rem', color:'#db2777', delay:'0.6s' },
          { top:'45%', left:'2%', size:'1.4rem', color:'#059669', delay:'2.0s' },
          { top:'50%', left:'96%', size:'1.3rem', color:'#d97706', delay:'0.9s' },
          { top:'75%', left:'14%', size:'1.5rem', color:'#4f46e5', delay:'1.5s' },
          { top:'82%', left:'80%', size:'1.4rem', color:'#e11d48', delay:'0.3s' },
        ].map((sp, i) => (
          <span
            key={i}
            className="absolute animate-twinkle-slower"
            style={{
              top: sp.top, left: sp.left,
              fontSize: sp.size, color: sp.color,
              lineHeight: 1,
              animationDelay: sp.delay,
              filter: `drop-shadow(0 0 6px ${sp.color}) drop-shadow(0 0 10px ${sp.color})`,
            }}
          >✦</span>
        ))}

        {/* Floating educational icons — SVG inline, gentle drift */}
        {/* Book — top left zone */}
        <div className="absolute animate-float-around" style={{ top:'15%', left:'3%', animationDelay:'0.5s', opacity:0.90 }}>
          <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
            <rect x="4" y="6" width="22" height="26" rx="3" fill="#60a5fa" stroke="#2563eb" strokeWidth="1.5"/>
            <rect x="8" y="6" width="3" height="26" rx="1.5" fill="#1d4ed8"/>
            <line x1="12" y1="14" x2="22" y2="14" stroke="#eff6ff" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="12" y1="19" x2="22" y2="19" stroke="#eff6ff" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="12" y1="24" x2="18" y2="24" stroke="#eff6ff" strokeWidth="1.5" strokeLinecap="round"/>
            <text x="28" y="12" fontSize="10" fill="#f59e0b">★</text>
          </svg>
        </div>

        {/* Pencil — top right zone */}
        <div className="absolute animate-float-around" style={{ top:'8%', right:'4%', animationDelay:'1.8s', opacity:0.88 }}>
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <rect x="15" y="4" width="7" height="22" rx="2" fill="#a78bfa" stroke="#7c3aed" strokeWidth="1.5" transform="rotate(35 18 15)"/>
            <polygon points="11,28 18,14 22,17" fill="#fef3c7" stroke="#d97706" strokeWidth="1"/>
            <rect x="15" y="4" width="7" height="4" rx="2" fill="#ec4899" transform="rotate(35 18 15)"/>
          </svg>
        </div>

        {/* Lightbulb — left mid zone */}
        <div className="absolute animate-float-around" style={{ top:'48%', left:'1.5%', animationDelay:'2.8s', opacity:0.88 }}>
          <svg width="34" height="40" viewBox="0 0 34 40" fill="none">
            <ellipse cx="17" cy="15" rx="11" ry="12" fill="#fde68a" stroke="#d97706" strokeWidth="1.5"/>
            <rect x="12" y="25" width="10" height="4" rx="2" fill="#9ca3af" stroke="#6b7280" strokeWidth="1"/>
            <rect x="13" y="29" width="8" height="3" rx="1.5" fill="#6b7280"/>
            <line x1="17" y1="6" x2="17" y2="4" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="8" y1="9" x2="6.5" y2="7.5" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="26" y1="9" x2="27.5" y2="7.5" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round"/>
            <ellipse cx="17" cy="17" rx="5" ry="6" fill="#fbbf24" opacity="0.9"/>
          </svg>
        </div>

        {/* Rocket — right mid zone */}
        <div className="absolute animate-float-around" style={{ top:'42%', right:'1.5%', animationDelay:'0.7s', opacity:0.88 }}>
          <svg width="34" height="40" viewBox="0 0 34 40" fill="none">
            <path d="M17 4 C12 10 10 18 10 24 L17 28 L24 24 C24 18 22 10 17 4Z" fill="#818cf8" stroke="#4f46e5" strokeWidth="1.5"/>
            <ellipse cx="17" cy="21" rx="4" ry="4" fill="#312e81" opacity="0.85"/>
            <path d="M10 24 L6 30 L10 28Z" fill="#ef4444"/>
            <path d="M24 24 L28 30 L24 28Z" fill="#ef4444"/>
            <path d="M13 28 C13 32 14 35 17 36 C20 35 21 32 21 28Z" fill="#fb923c" opacity="0.95"/>
          </svg>
        </div>

        {/* Musical note — bottom left */}
        <div className="absolute animate-float-around" style={{ bottom:'14%', left:'4%', animationDelay:'1.4s', opacity:0.88 }}>
          <svg width="30" height="34" viewBox="0 0 30 34" fill="none">
            <path d="M14 6 L22 4 L22 12 L14 14 Z" fill="#f472b6" stroke="#be185d" strokeWidth="1.2"/>
            <line x1="14" y1="14" x2="14" y2="26" stroke="#be185d" strokeWidth="1.5" strokeLinecap="round"/>
            <ellipse cx="11" cy="26" rx="4" ry="3" fill="#f472b6" stroke="#be185d" strokeWidth="1.2"/>
          </svg>
        </div>

        {/* Globe — bottom right */}
        <div className="absolute animate-float-around" style={{ bottom:'12%', right:'3%', animationDelay:'2.2s', opacity:0.88 }}>
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="13" fill="#6ee7b7" stroke="#059669" strokeWidth="1.5"/>
            <ellipse cx="18" cy="18" rx="6" ry="13" fill="none" stroke="#047857" strokeWidth="1" opacity="0.9"/>
            <line x1="5" y1="18" x2="31" y2="18" stroke="#047857" strokeWidth="1" opacity="0.9"/>
            <line x1="7" y1="12" x2="29" y2="12" stroke="#047857" strokeWidth="0.8" opacity="0.7"/>
            <line x1="7" y1="24" x2="29" y2="24" stroke="#047857" strokeWidth="0.8" opacity="0.7"/>
          </svg>
        </div>

        {/* Floating color bubbles — scattered, translucent */}
        {[
          { top:'25%', left:'8%', w:70, h:70, bg:'rgba(96,165,250,0.55)', delay:'0.3s' },
          { top:'65%', left:'6%', w:50, h:50, bg:'rgba(167,139,250,0.52)', delay:'1.7s' },
          { top:'35%', right:'6%', w:80, h:80, bg:'rgba(244,114,182,0.48)', delay:'0.9s' },
          { top:'70%', right:'5%', w:55, h:55, bg:'rgba(52,211,153,0.50)', delay:'2.4s' },
          { top:'50%', left:'88%', w:40, h:40, bg:'rgba(251,191,36,0.55)', delay:'1.1s' },
          { bottom:'6%', left:'42%', w:60, h:60, bg:'rgba(129,140,248,0.48)', delay:'0.6s' },
        ].map((b, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-float-around"
            style={{
              top: b.top, left: b.left, right: b.right, bottom: b.bottom,
              width: b.w, height: b.h,
              background: b.bg,
              border: '2px solid rgba(255,255,255,0.8)',
              animationDelay: b.delay,
            }}
          />
        ))}

        {/* Confetti dots — tiny scattered colorful circles */}
        {[
          { top:'30%', left:'16%', s:10, c:'#f59e0b' },
          { top:'42%', left:'11%', s:8, c:'#ec4899' },
          { top:'56%', left:'15%', s:11, c:'#10b981' },
          { top:'28%', right:'12%', s:9, c:'#8b5cf6' },
          { top:'58%', right:'10%', s:10, c:'#3b82f6' },
          { top:'15%', left:'42%', s:8, c:'#ef4444' },
          { bottom:'20%', left:'30%', s:11, c:'#f59e0b' },
          { bottom:'28%', right:'28%', s:9, c:'#7c3aed' },
          { top:'3%', left:'55%', s:8, c:'#059669' },
        ].map((dot, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-float-around"
            style={{
              top: dot.top, left: dot.left, right: dot.right, bottom: dot.bottom,
              width: dot.s, height: dot.s,
              background: dot.c,
              opacity: 0.85,
              animationDelay: `${i * 0.35}s`,
            }}
          />
        ))}

      </div>
      {/* ═══════════════════════════════════════════════════════════════════ */}

      <div className="relative group max-w-7xl mx-auto">
        {/* OUTER GLOW LAYER (soft pastel gradient) */}
        <div
          className="
            absolute -inset-4
            rounded-[48px]
            bg-gradient-to-r from-pastel-blue/40 via-pastel-purple/30 to-pastel-pink/40
            blur-3xl
            opacity-60
          "
        ></div>

        {/* INNER WRAPPER (main content container) */}
        <div className="relative rounded-[24px] lg:rounded-[40px] bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50 p-4 md:p-8 lg:p-12 border border-white/50 shadow-card overflow-hidden">
          {/* Animated Characters (Desktop Only) */}
          <div className="hidden lg:block pointer-events-none">
            {/* Shin - Left Side */}
            <div className="absolute left-0 bottom-0 z-0 select-none">
              <div className="relative">
                {/* Smoke/Dust Effect */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-48 h-12 bg-gradient-to-t from-gray-400/20 to-transparent blur-2xl rounded-full" />
                <img
                  src="/model-transform/shin.png"
                  alt="Shin"
                  className="w-56 md:w-64 lg:w-72 h-auto animate-float-rotate"
                />
              </div>
            </div>

            {/* Doraemon - Right Side */}
            <div className="absolute right-0 bottom-0 z-0 select-none">
              <div className="relative">
                {/* Pocket Glow Effect */}
                <div className="absolute top-[45%] left-1/2 -translate-x-1/2 w-10 h-10 bg-yellow-300/40 blur-xl rounded-full animate-pulse-glow" />
                <div className="absolute top-[45%] left-1/2 -translate-x-1/2 w-8 h-8 bg-yellow-400/30 rounded-full animate-ping [animation-duration:3s]" />
                <img
                  src="/model-transform/doraemon.png"
                  alt="Doraemon"
                  className="w-52 md:w-60 lg:w-68 h-auto animate-sway-slow"
                />
              </div>
            </div>
          </div>

          {/* Floating Kids Graphics */}
          <div className="absolute inset-0 pointer-events-none z-0">
            {/* Bubbles */}
            <div className="absolute top-10 left-[10%] w-12 h-12 rounded-full bg-blue-200/40 animate-float-around"></div>
            <div className="absolute top-40 right-[15%] w-16 h-16 rounded-full bg-purple-200/40 animate-float-around [animation-delay:1s]"></div>
            <div className="absolute bottom-20 left-[20%] w-20 h-20 rounded-full bg-pink-200/40 animate-float-around [animation-delay:2s]"></div>
            <div className="absolute top-1/2 right-[5%] w-10 h-10 rounded-full bg-yellow-200/40 animate-float-around [animation-delay:1.5s]"></div>
            <div className="absolute bottom-[10%] left-[5%] w-14 h-14 rounded-full bg-blue-100/40 animate-float-around [animation-delay:0.5s]"></div>
            <div className="absolute top-[30%] left-[45%] w-8 h-8 rounded-full bg-purple-100/40 animate-float-around [animation-delay:2.5s]"></div>

            {/* Stars */}
            <span className="absolute top-20 left-[25%] text-2xl text-yellow-400/60 animate-twinkle-slower">✦</span>
            <span className="absolute top-[60%] right-[25%] text-3xl text-blue-400/60 animate-twinkle-slower [animation-delay:1.5s]">✦</span>
            <span className="absolute bottom-[25%] left-[40%] text-xl text-pink-400/60 animate-twinkle-slower [animation-delay:0.7s]">✦</span>
            <span className="absolute top-10 right-[40%] text-2xl text-purple-400/60 animate-twinkle-slower [animation-delay:2.2s]">✦</span>
          </div>
          <div className="text-center mb-6 lg:mb-16">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-display font-black tracking-tight text-gray-800 drop-shadow-sm uppercase">
              {t('announcements.title') || "What's New at Lucy English Center?"}
            </h2>
            <p className="mt-4 text-base md:text-lg text-gray-600 font-medium max-w-2xl mx-auto">
              {t('announcements.slogan')}
            </p>
            <div className="w-24 h-2 bg-primary-300 mx-auto mt-6 rounded-full shadow-inner"></div>
          </div>

          {/* ── DECORATIVE STRIP ── */}
          <div className="relative mb-6 lg:mb-10 pointer-events-none select-none">

            {/* ── DESKTOP: wrap freely ── */}
            <div className="hidden lg:flex items-center justify-center gap-2 flex-wrap px-4 mb-6">
              {['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'].map((letter, i) => {
                const colors = [
                  { bg: '#DBEAFE', text: '#1D4ED8', border: '#BFDBFE', shadow: 'rgba(59,130,246,0.25)' },
                  { bg: '#EDE9FE', text: '#6D28D9', border: '#DDD6FE', shadow: 'rgba(139,92,246,0.25)' },
                  { bg: '#FCE7F3', text: '#BE185D', border: '#FBCFE8', shadow: 'rgba(236,72,153,0.25)' },
                  { bg: '#D1FAE5', text: '#065F46', border: '#A7F3D0', shadow: 'rgba(16,185,129,0.25)' },
                  { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A', shadow: 'rgba(245,158,11,0.25)' },
                  { bg: '#FFE4E6', text: '#9F1239', border: '#FECDD3', shadow: 'rgba(239,68,68,0.25)' },
                ];
                const c = colors[i % colors.length];
                const sizes = ['w-9 h-9 text-sm','w-10 h-10 text-base','w-8 h-8 text-xs','w-11 h-11 text-base'];
                const delays = [0,0.3,0.6,0.9,1.2,0.15,0.45,0.75,1.05,1.35];
                return (
                  <div key={letter}
                    className={`${sizes[i%sizes.length]} rounded-full flex items-center justify-center font-black animate-float-around`}
                    style={{ background:c.bg, color:c.text, boxShadow:`0 4px 12px ${c.shadow}`, border:`2px solid ${c.border}`, animationDelay:`${delays[i%delays.length]}s`, fontFamily:"'Nunito',system-ui,sans-serif" }}
                  >{letter}</div>
                );
              })}
            </div>

            {/* ── MOBILE: auto-scrolling marquee phải → trái ── */}
            <div className="lg:hidden relative mb-4 overflow-hidden">
              {/* CSS keyframe inline */}
              <style>{`
                @keyframes marquee-letters {
                  0%   { transform: translateX(0); }
                  100% { transform: translateX(-50%); }
                }
                .marquee-letters-track {
                  animation: marquee-letters 18s linear infinite;
                  will-change: transform;
                }
                .marquee-letters-track:hover {
                  animation-play-state: paused;
                }
              `}</style>
              {/* fade edges */}
              <div className="absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none"
                style={{ background: 'linear-gradient(to right, rgba(255,255,255,1), transparent)' }} />
              <div className="absolute right-0 top-0 bottom-0 w-8 z-10 pointer-events-none"
                style={{ background: 'linear-gradient(to left, rgba(255,255,255,1), transparent)' }} />
              {/* track — tripled để loop mượt */}
              <div className="marquee-letters-track flex gap-2" style={{ width: 'max-content' }}>
                {[...Array(3)].flatMap((_, rep) =>
                  'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((letter, i) => {
                    const colors = [
                      { bg:'#DBEAFE', text:'#1D4ED8', border:'#BFDBFE' },
                      { bg:'#EDE9FE', text:'#6D28D9', border:'#DDD6FE' },
                      { bg:'#FCE7F3', text:'#BE185D', border:'#FBCFE8' },
                      { bg:'#D1FAE5', text:'#065F46', border:'#A7F3D0' },
                      { bg:'#FEF3C7', text:'#92400E', border:'#FDE68A' },
                      { bg:'#FFE4E6', text:'#9F1239', border:'#FECDD3' },
                    ];
                    const c = colors[i % colors.length];
                    return (
                      <div key={`${rep}-${letter}`}
                        className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm shrink-0"
                        style={{ background:c.bg, color:c.text, border:`2px solid ${c.border}`, fontFamily:"'Nunito',system-ui,sans-serif" }}
                      >{letter}</div>
                    );
                  })
                )}
              </div>
            </div>

            {/* ── DESKTOP stats: flex wrap ── */}
            <div className="hidden lg:flex items-center justify-center gap-3 flex-wrap px-4">
              {[
                { emoji:'📚', labelKey:'announcements.stat_lessons',  value:'100+', color:'#1D4ED8', bg:'#DBEAFE' },
                { emoji:'⭐', labelKey:'announcements.stat_students',  value:'100+', color:'#92400E', bg:'#FEF3C7' },
                { emoji:'🎯', labelKey:'announcements.stat_courses',   value:'5+',  color:'#065F46', bg:'#D1FAE5' },
                { emoji:'🏆', labelKey:'announcements.stat_teachers',  value:'5+',   color:'#6D28D9', bg:'#EDE9FE' },
              ].map(({ emoji, labelKey, value, color, bg }) => (
                <div key={labelKey} className="flex items-center gap-2 px-4 py-2 rounded-2xl"
                  style={{ background:bg, border:`2px dashed ${color}30` }}>
                  <span className="text-xl">{emoji}</span>
                  <div>
                    <p className="font-black text-base leading-none" style={{ color, fontFamily:"'Nunito',system-ui" }}>{value}</p>
                    <p className="text-xs font-semibold text-gray-400 leading-none mt-0.5">{t(labelKey)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* ── MOBILE stats: 2×2 compact grid ── */}
            <div className="lg:hidden grid grid-cols-2 gap-2 px-1">
              {[
                { emoji:'📚', labelKey:'announcements.stat_lessons',  value:'100+', color:'#1D4ED8', bg:'#DBEAFE', border:'#BFDBFE' },
                { emoji:'⭐', labelKey:'announcements.stat_students',  value:'200+', color:'#92400E', bg:'#FEF3C7', border:'#FDE68A' },
                { emoji:'🎯', labelKey:'announcements.stat_courses',   value:'10+',  color:'#065F46', bg:'#D1FAE5', border:'#A7F3D0' },
                { emoji:'🏆', labelKey:'announcements.stat_teachers',  value:'5+',   color:'#6D28D9', bg:'#EDE9FE', border:'#DDD6FE' },
              ].map(({ emoji, labelKey, value, color, bg, border }) => (
                <div key={labelKey}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl"
                  style={{ background:bg, border:`1.5px solid ${border}` }}
                >
                  <span className="text-2xl leading-none">{emoji}</span>
                  <div className="min-w-0">
                    <p className="font-black text-lg leading-none" style={{ color, fontFamily:"'Nunito',system-ui" }}>{value}</p>
                    <p className="text-[11px] font-semibold text-gray-400 leading-tight mt-0.5 truncate">{t(labelKey)}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
          {/* ── END DECORATIVE STRIP ── */}

          {/* UX Improvement: Back to Latest Button */}
          {activeIndex !== 0 && (
            <div className="flex justify-center mb-6">
              <button
                onClick={() => setActiveIndex(0)}
                className="text-sm font-bold text-primary-500/80 hover:text-primary-600 transition-all flex items-center gap-2 group/back"
              >
                <span className="group-hover/back:-translate-x-1 transition-transform font-black">←</span>
                {t("announcements.back_latest", "Quay lại thông báo mới nhất")}
              </button>
            </div>
          )}

          {/* Fan Card Stack Layout Container */}
          <div className="relative w-full max-w-md h-[380px] lg:h-[420px] mx-auto">
            {visibleItems.map((announcement, index) => (
              <div
                key={announcement._id}
                onClick={() => setActiveIndex(index)}
                className={`absolute top-0 left-0 w-full cursor-pointer transition-all duration-500 ease-in-out hover:scale-[1.02] ${getCardStyle(index)} ${
                  index === activeIndex
                    ? `ring-8 ${getCardTheme(index).ring}/50 scale-100 rounded-[40px]`
                    : ""
                }`}
              >
                <div
                  className={`relative ${cardColors[index % cardColors.length]} rounded-[40px] shadow-heavy border-4 ${index === activeIndex ? getCardTheme(index).border : "border-white/50"} p-8 flex flex-col h-full transition-all duration-300`}
                  onClick={(e) => {
                    if (index === activeIndex) {
                      setSelectedAnnouncement(announcement);
                    }
                  }}
                >
                  {/* OPTIONAL: ADD "NEWEST" BADGE FOR MAIN CARD */}
                  {index === 0 && activeIndex === 0 && (
                    <span className="absolute top-6 left-6 z-20 text-[10px] uppercase tracking-[0.2em] font-black bg-pink-500 px-4 py-1.5 rounded-full text-white shadow-md animate-pulse">
                      {t("announcements.newest", "Mới nhất")}
                    </span>
                  )}

                  {/* Image Container */}
                  <div className="relative h-[180px] w-full mb-6 overflow-hidden rounded-2xl shadow-sm">
                    <img 
                      src={getImageUrl(announcement.image)} 
                      alt={announcement.title}
                      onError={handleImageError}
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                      loading="lazy"
                    />
                  </div>

                  {/* Content Panel */}
                  <div className="text-center flex-1 flex flex-col">
                    <h3 className={`text-xl font-display font-black ${index === activeIndex ? getCardTheme(index).text : "text-gray-800"} mb-3 line-clamp-1 transition-colors uppercase tracking-tight`}>
                      {announcement.title}
                    </h3>
                    <p className="text-gray-700 text-sm font-medium line-clamp-2 mb-6 leading-relaxed flex-1">
                      {announcement.description}
                    </p>
                    <div className="mt-auto">
                      <button className="bg-gradient-to-r from-primary-400 to-primary-600 hover:from-primary-500 hover:to-primary-700 text-white rounded-full px-8 py-3 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg font-black text-sm uppercase tracking-widest">
                        {t('announcements.read_more', "Explore")}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Remaining Count Label */}
          {remainingCount > 0 && (
            <div className="mt-8 text-center text-sm font-medium text-gray-400">
              +{remainingCount} {t("announcements.others", "thông báo khác")}
            </div>
          )}

          {/* View All Button */}
          <div className="flex justify-center mt-6 lg:mt-12">
            <button 
              onClick={() => setOpenAll(true)}
              className="px-10 py-3 rounded-full bg-primary-400 text-white font-black uppercase tracking-widest hover:bg-primary-500 hover:scale-105 active:scale-95 transition-all duration-200 shadow-heavy"
            >
              {t("announcements.view_all", "Xem tất cả")}
            </button>
          </div>

          <AnnouncementListModal
            isOpen={openAll}
            onClose={() => setOpenAll(false)}
          />
        </div>
      </div>

      <Suspense fallback={null}>
        {selectedAnnouncement && (
          <AnnouncementModal 
            announcement={selectedAnnouncement} 
            onClose={() => setSelectedAnnouncement(null)} 
          />
        )}
      </Suspense>



    </section>
  );
};

export default AnnouncementSection;
