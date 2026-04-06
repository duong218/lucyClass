import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaFacebookF, FaInstagram, FaTiktok } from "react-icons/fa";
import { SiZalo } from "react-icons/si";

const Footer = () => {
  const { t } = (typeof useTranslation !== 'undefined') ? useTranslation() : { t: (key) => key };

  return (
    <footer id="contact" className="bg-[#C2E0F9] pt-16 pb-8 px-6 text-text-main">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 mb-12 border-b-2 border-white/50 pb-10">

        {/* Brand & Social */}
        <div>
          <div className="bg-white px-4 py-2 rounded-full shadow-sm font-display font-bold text-xl inline-flex items-center gap-2 mb-6">
            Lucy's Class
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
    </footer>
  );
};

export default Footer;
