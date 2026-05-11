import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import heroBg from "../assets/hero-bg.png";
import heroMobile from "../assets/hero-mobile.png";
import { getDeviceId } from '../utils/deviceId';
import { useLenis } from './LenisProvider';

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

  const lenisRef = useLenis();

  const scrollToCourses = () => {
    const el = document.getElementById('courses');
    if (!el) return;
    if (lenisRef?.current) {
      lenisRef.current.scrollTo(el, { offset: -80, duration: 1.2 });
    } else {
      const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <section
      id="hero"
      className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden"
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
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(28,105,92,0.85),rgba(28,105,112,0.8),rgba(63,164,143,0.7))] z-[1]" />
      <div className="relative z-10 w-full lc-container px-4 md:px-6 lg:px-10 bg-transparent">
        <div className="flex flex-col items-center justify-center text-center">

          <div className="max-w-4xl animate-fadeInUp">
            <h1
              className="text-white text-[36px] md:text-[42px] lg:text-[50px] font-display font-black mb-6 md:mb-8 leading-[1.2] tracking-tight"
            >
              {t('hero.title')}
            </h1>

            <p
              className="text-white/95 text-[16px] lg:text-[18px] font-semibold mb-10 md:mb-14 max-w-3xl mx-auto leading-[1.6]"
            >
              {t('hero.subtitle')}
            </p>

            <button
              onClick={scrollToCourses}
              className="lc-btn lc-btn-promo px-8 md:px-10 py-3 md:py-3.5 text-sm md:text-sm w-full sm:w-auto"
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