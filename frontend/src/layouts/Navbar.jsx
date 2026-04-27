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

        {/* ───────── Logo Section ───────── */}
        <div
          onClick={() => scrollToSection("hero")}
          className="flex items-center gap-3 cursor-pointer group bg-white rounded-full px-4 py-2.5 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-300 border"
          style={{ borderColor: "#3FA48F30", textDecoration: "none" }}
        >
          {/* Logo image pill */}
          <div
            className="relative flex items-center justify-center rounded-full overflow-hidden shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105"
            style={{
              width: 50,
              height: 50,
              background: "#1C695C",
              border: "2.5px solid #3FA48F",
              flexShrink: 0,
            }}
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
            {/* LUCY — dùng màu xanh ngọc đậm chủ đạo */}
            <span
              className="font-black tracking-widest uppercase transition-colors duration-300"
              style={{
                fontSize: "1.15rem",
                color: "#1C695C",
                letterSpacing: "0.18em",
                lineHeight: 1,
                fontFamily: "'Nunito', 'Fredoka One', 'Baloo 2', system-ui, sans-serif",
              }}
            >
              LUCY
            </span>

            {/* CLASS — nhỏ hơn, màu cam đất bổ sung */}
            <span
              className="font-black tracking-[0.22em] uppercase transition-colors duration-300"
              style={{
                fontSize: "0.72rem",
                color: "#C96A3D",
                letterSpacing: "0.28em",
                lineHeight: 1.2,
                fontFamily: "'Nunito', 'Fredoka One', 'Baloo 2', system-ui, sans-serif",
              }}
            >
              CLASS
            </span>

            {/* Tagline — chỉ hiện trên md trở lên */}
            <span
              className="hidden md:block mt-0.5 font-medium italic"
              style={{
                fontSize: "0.55rem",
                color: "#3FA48F",
                letterSpacing: "0.04em",
                lineHeight: 1,
                fontFamily: "Georgia, 'Times New Roman', serif",
              }}
            >
              Teach from the heart, learn from the joy
            </span>
          </div>
        </div>
        {/* ───────── End Logo ───────── */}

        {/* Desktop Menu - Floating Pill Style */}
        <div className="hidden lg:flex items-center bg-white/60 backdrop-blur-xl rounded-full px-2 py-2 shadow-sm border border-white/40 gap-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className={`px-6 py-2.5 rounded-full font-display font-bold text-sm transition-all duration-300 transform active:scale-95 whitespace-nowrap ${
                activeSection === item.id
                  ? "shadow-lg scale-105"
                  : "text-gray-600"
              }`}
              style={
                activeSection === item.id
                  ? { background: "#1C695C", color: "#ffffff", boxShadow: "0 4px 14px rgba(28,105,92,0.35)" }
                  : {}
              }
              onMouseEnter={(e) => {
                if (activeSection !== item.id) {
                  e.currentTarget.style.background = "#3FA48F20";
                  e.currentTarget.style.color = "#1C695C";
                }
              }}
              onMouseLeave={(e) => {
                if (activeSection !== item.id) {
                  e.currentTarget.style.background = "";
                  e.currentTarget.style.color = "";
                }
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Right Section: Language & Mobile Menu */}
        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <button
            onClick={toggleLang}
            className="w-12 h-12 bg-white rounded-full flex items-center justify-center font-display font-black text-sm shadow-md hover:shadow-lg hover:scale-110 active:scale-90 transition-all border"
            style={{ color: "#1C695C", borderColor: "#3FA48F40" }}
          >
            {i18n.language.toUpperCase()}
          </button>

          {/* Hamburger (Mobile) */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md text-2xl hover:scale-110 active:scale-90 transition-all z-50 border"
            style={{ color: "#1C695C", borderColor: "#3FA48F40" }}
          >
            <span className="transform transition-transform duration-300">
              {isMenuOpen ? "✕" : "☰"}
            </span>
          </button>
        </div>

        {/* Mobile Menu Panel */}
        <div
          className={`fixed inset-0 bg-white/95 backdrop-blur-xl z-[40] lg:hidden flex flex-col items-center justify-center gap-6 transition-all duration-500 ease-in-out px-6 ${
            isMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none"
          }`}
        >
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className={`w-full max-w-sm py-4 rounded-3xl font-display font-black text-2xl transition-all active:scale-95 shadow-sm border`}
              style={
                activeSection === item.id
                  ? {
                      background: "#1C695C",
                      color: "#fff",
                      borderColor: "#1C695C",
                      boxShadow: "0 8px 24px rgba(28,105,92,0.3)",
                      transform: "scale(1.05)",
                    }
                  : {
                      background: "#fff",
                      color: "#1C695C",
                      borderColor: "#3FA48F30",
                    }
              }
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
