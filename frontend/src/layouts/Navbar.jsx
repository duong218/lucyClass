import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");

  const toggleLang = () => {
    const nextLang =
      i18n.language === "vi"
        ? "en"
        : i18n.language === "en"
        ? "zh"
        : "vi";
    i18n.changeLanguage(nextLang);
  };

  useEffect(() => {
    const handleScroll = () => {
      const sections = ["hero", "courses", "activities", "teachers", "announcements", "register", "contact"];
      const current = sections.find(id => {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          return rect.top >= -100 && rect.top <= 300;
        }
        return false;
      });
      if (current) setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id) => {
    setIsMenuOpen(false);
    setActiveSection(id);
    const el = document.getElementById(id);
    if (!el) return;

    const offset = 90;
    const y = el.getBoundingClientRect().top + window.pageYOffset - offset;

    window.scrollTo({
      top: y,
      behavior: "smooth",
    });

    // iOS fallback
    setTimeout(() => {
      const updatedY = el.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo(0, updatedY);
    }, 300);
  };

  const menuItems = [
    { id: "hero", label: t("nav.home") },
    { id: "courses", label: t("nav.courses") },
    { id: "activities", label: t("nav.activities") },
    { id: "teachers", label: t("nav.teachers") },
    { id: "announcements", label: t("nav.announcements") || "Announcements" },
    { id: "register", label: t("nav.register") },
    { id: "contact", label: t("nav.contact") },
  ];

  return (
    <header className="fixed top-0 left-0 w-full z-[100] px-4 py-4 md:py-6 transition-all border-none">
      <nav className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Logo Section - White Rounded Pill */}
        <div
          className="bg-white rounded-full px-5 py-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.08)] flex items-center gap-3 cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all z-50 group border border-blue-50/50"
          onClick={() => scrollToSection("hero")}
        >
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-blue-100 group-hover:border-blue-300 transition-colors">
            <img
              src="/logo.jpeg"
              alt="Lucy's Class logo"
              className="w-full h-full object-cover"
              onError={(e) => e.target.src = '/placeholder.jpg'}
            />
          </div>
          <span className="font-display font-black text-xl md:text-2xl text-blue-600 tracking-tight">
            Lucy's Class
          </span>
        </div>

        {/* Desktop Menu - Floating Pill Style */}
        <div className="hidden lg:flex items-center bg-white/60 backdrop-blur-xl rounded-full px-2 py-2 shadow-sm border border-white/40 gap-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className={`px-6 py-2.5 rounded-full font-display font-bold text-sm transition-all duration-300 transform active:scale-95 whitespace-nowrap ${
                activeSection === item.id 
                  ? "bg-[#4A90E2] text-white shadow-[0_4px_12px_rgba(74,144,226,0.3)] scale-105" 
                  : "text-gray-600 hover:text-blue-500 hover:bg-white/80"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Right Section: Language & Mobile Menu */}
        <div className="flex items-center gap-3">
          {/* Language Switcher - Circle Button */}
          <button
            onClick={toggleLang}
            className="w-12 h-12 bg-white rounded-full flex items-center justify-center font-display font-black text-sm text-gray-700 shadow-[0_4px_15px_rgba(0,0,0,0.08)] hover:shadow-lg hover:scale-110 active:scale-90 transition-all border border-blue-50/30"
          >
            {i18n.language.toUpperCase()}
          </button>

          {/* Hamburger (Mobile) */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md text-2xl text-blue-500 hover:scale-110 active:scale-90 transition-all z-50 border border-blue-50/30"
          >
            <span className="transform transition-transform duration-300">{isMenuOpen ? "✕" : "☰"}</span>
          </button>
        </div>

        {/* Mobile Menu Panel */}
        <div className={`fixed inset-0 bg-white/95 backdrop-blur-xl z-[40] lg:hidden flex flex-col items-center justify-center gap-6 transition-all duration-500 ease-in-out px-6 ${
          isMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none"
        }`}>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className={`w-full max-w-sm py-4 rounded-3xl font-display font-black text-2xl transition-all active:scale-95 shadow-sm border border-white/50 ${
                activeSection === item.id 
                  ? "bg-[#4A90E2] text-white shadow-xl scale-105" 
                  : "bg-white text-gray-600 hover:bg-blue-50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>

    </header>
  );
};

export default Navbar;