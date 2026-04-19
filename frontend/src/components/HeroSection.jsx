import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import heroBg from "../assets/hero-bg.png";
import heroMobile from "../assets/hero-mobile.png";
import { getDeviceId } from '../utils/deviceId';

const HeroSection = () => {
  const { t } = useTranslation();
  const [scrollY, setScrollY] = useState(0);
  const [isTabletOrMobile, setIsTabletOrMobile] = useState(false);

  useEffect(() => {
    getDeviceId();
  }, []);
  
  useEffect(() => {
    const handleResize = () => {
      setIsTabletOrMobile(window.innerWidth < 1024);
    };

    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isTabletOrMobile) return;

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isTabletOrMobile]);

  const scrollToCourses = () => {
    const el = document.getElementById('courses');
    if (!el) return;
    const offset = 80;
    const y = el.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top: y, behavior: 'smooth' });
  };

  return (
    <section
      id="hero"
      className="relative min-h-screen min-h-[100dvh] flex items-center justify-center overflow-hidden"
    >
      <div
        className="absolute inset-0 z-0 bg-cover bg-no-repeat pointer-events-none"
        style={{
          backgroundImage: `url(${isTabletOrMobile ? heroMobile : heroBg})`,
          backgroundPosition: isTabletOrMobile ? 'center center' : 'center',
          transform: isTabletOrMobile ? 'none' : `translateY(${scrollY * 0.2}px)`
        }}
      />



      {/* Content Container (CENTER) */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 bg-transparent">
        <div className="flex flex-col items-center justify-center text-center">

          <div className="max-w-4xl animate-fadeInUp">
            <h1
              className="text-gray-900 text-[26px] md:text-[38px] lg:text-[50px] font-display font-black mb-6 md:mb-8 leading-[1.2] uppercase tracking-tight"
              style={{ textShadow: '0 0 4px rgba(255,255,255,0.8), 0 0 8px rgba(255,255,255,0.6), 0 2px 6px rgba(255,255,255,0.4)' }}
            >
              {t('hero.title')}
            </h1>

            <p
              className="text-gray-700 text-[14px] md:text-[16px] lg:text-[18px] font-bold mb-10 md:mb-14 max-w-3xl mx-auto leading-[1.6]"
              style={{ textShadow: '0 0 4px rgba(255,255,255,0.8), 0 0 8px rgba(255,255,255,0.6), 0 2px 6px rgba(255,255,255,0.4)' }}
            >
              {t('hero.subtitle')}
            </p>

            <button
              onClick={scrollToCourses}
              className="bg-[#3B82F6] text-white px-10 md:px-14 py-4 md:py-5 rounded-full text-lg md:text-xl font-bold transition-all shadow-[0_10px_20px_rgba(59,130,246,0.3)] hover:shadow-[0_15px_30px_rgba(59,130,246,0.4)] hover:-translate-y-1 hover:scale-105 active:scale-95"
            >
              {t('hero.cta')}
            </button>
          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;