import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FaFacebookF, FaInstagram, FaTiktok } from "react-icons/fa";
import { SiZalo } from "react-icons/si";
import CreatorPopup from '../components/CreatorPopup';
import HeartRain from '../components/HeartRain';

const Footer = () => {
  const { t } = (typeof useTranslation !== 'undefined') ? useTranslation() : { t: (key) => key };
  const [showCreatorPopup, setShowCreatorPopup] = useState(false);
  const [showHeartRain, setShowHeartRain] = useState(false);

  const handleHeartClick = useCallback(() => {
    setShowHeartRain(true);
    setTimeout(() => setShowHeartRain(false), 3000);
  }, []);

  return (
    <footer id="contact" className="bg-[#C2E0F9] pt-16 pb-8 px-6 text-text-main">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 mb-12 border-b-2 border-white/50 pb-10">

        {/* Brand & Social */}
        <div>
          {/* ── Brand block — đồng nhất với Navbar ── */}
          <div className="inline-flex items-center gap-3 bg-white rounded-full px-4 py-2.5 shadow-md border mb-6" style={{ borderColor: "#3FA48F30" }}>
            {/* Logo circle */}
            <div
              className="relative flex items-center justify-center rounded-full overflow-hidden shadow-lg flex-shrink-0"
              style={{ width: 64, height: 64, background: "#1C695C", border: "2.5px solid #3FA48F" }}
            >
              <img
                src="/logo.jpeg"
                alt="Lucy's Class logo"
                className="w-full h-full object-cover"
                onError={(e) => (e.target.src = "/placeholder.jpg")}
              />
            </div>
            {/* Brand text */}
            <div className="flex flex-col leading-none select-none">
              <span
                className="font-black tracking-widest uppercase"
                style={{ fontSize: "1.1rem", color: "#1C695C", letterSpacing: "0.18em", lineHeight: 1, fontFamily: "'Nunito', 'Fredoka One', 'Baloo 2', system-ui, sans-serif" }}
              >
                LUCY
              </span>
              <span
                className="font-black tracking-[0.22em] uppercase"
                style={{ fontSize: "0.68rem", color: "#C96A3D", letterSpacing: "0.28em", lineHeight: 1.2, fontFamily: "'Nunito', 'Fredoka One', 'Baloo 2', system-ui, sans-serif" }}
              >
                CLASS
              </span>
              <span
                className="mt-0.5 font-medium italic"
                style={{ fontSize: "0.52rem", color: "#3FA48F", letterSpacing: "0.04em", lineHeight: 1, fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Teach from the heart, learn from the joy
              </span>
            </div>
          </div>
          <p className="font-semibold opacity-80 mb-6 max-w-xs">
            {t('footer.desc')}
          </p>
          <div className="social-icons">
            <a href="https://www.facebook.com/lucyclass2019" target="_blank" rel="noopener noreferrer" title="Facebook">
              <FaFacebookF />
            </a>

            <a href="https://www.instagram.com/lucyclass2019" target="_blank" rel="noopener noreferrer" title="Instagram">
              <FaInstagram />
            </a>

            <a href="https://www.tiktok.com/@lucyclass" target="_blank" rel="noopener noreferrer" title="TikTok">
              <FaTiktok />
            </a>

            <a href="https://zalo.me/0973702074" target="_blank" rel="noopener noreferrer" title="Zalo">
              <SiZalo />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-display font-black text-xl mb-6">{t('footer.quickLinks')}</h4>
          <ul className="space-y-3 font-bold opacity-80">
            <li><a href="#hero" className="hover:text-blue-600 transition-colors">{t('nav.home')}</a></li>
            <li><a href="#courses" className="hover:text-blue-600 transition-colors">{t('nav.courses')}</a></li>
            <li><a href="#teachers" className="hover:text-blue-600 transition-colors">{t('nav.teachers')}</a></li>
            <li><a href="#activities" className="hover:text-blue-600 transition-colors">{t('nav.activities')}</a></li>
            <li><a href="/admin/login" className="hover:text-blue-600 transition-colors">{t('nav.admin')} Login</a></li>
            <li>
              <a
                onClick={(e) => {
                  e.preventDefault();
                  setShowCreatorPopup(true);
                }}
                href="#"
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md -ml-1
                border border-blue-300
                hover:bg-blue-600 hover:text-white hover:border-blue-600
                transition-all duration-200"
              >
                <span>{t('creator.link')}</span>
              </a>
            </li>
          </ul>
        </div>

        {/* Contact Us */}
        <div>
          <h4 className="font-display font-black text-xl mb-6">{t('footer.contactInfo')}</h4>
          <ul className="space-y-4 font-bold opacity-80">
            <li className="flex items-start gap-3">
              <span className="text-xl">📍</span>
              <span>S1.07 1105 Vinhomes Ocean Park 1</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-xl">📞</span>
              <span>+84 931768790</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-xl">✉️</span>
              <span>lucyclass2019@gmail.com</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-xl">⏰</span>
              <span>Mon - Fri: 2:00 PM - 9:00 PM <br />
                Sat: 8:00 AM - 11:00 AM <br /> 2:00PM - 3:30PM
              </span>
            </li>
          </ul>
        </div>

      </div>

      <div className="text-center font-bold opacity-70">
        <p>{t('footer.copyright').replace('© 2024 Lucy\'s Class. All rights reserved.', `© ${new Date().getFullYear()} Lucy's Class. All rights reserved.`)}</p>
      </div>

      {/* Creator Popup */}
      {showCreatorPopup && (
        <CreatorPopup
          onClose={() => setShowCreatorPopup(false)}
          onHeartClick={handleHeartClick}
        />
      )}

      {/* Heart Rain */}
      {showHeartRain && <HeartRain />}
    </footer>
  );
};

export default Footer;
