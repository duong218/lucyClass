import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLenis } from "../components/LenisProvider";

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const lenisRef = useLenis();

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

    const offset = -90; // Lenis dùng offset âm để trừ khoảng cách navbar

    if (lenisRef?.current) {
      lenisRef.current.scrollTo(el, { offset, duration: 1.2 });
    } else {
      // Fallback nếu Lenis chưa sẵn sàng
      const y = el.getBoundingClientRect().top + window.pageYOffset + offset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
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

  const openStreakModal = () => {
    window.dispatchEvent(new Event('open-streak-modal'));
  };

  return (
    <header className="fixed top-0 left-0 w-full z-[100] h-[72px] px-4 lg:px-10 border-b border-[#14524680]" style={{ background: "linear-gradient(100deg, #1C695C 0%, #1C6970 100%)", boxShadow: "0 4px 24px rgba(28,105,92,0.22)" }}>
      <nav className="h-full lc-container flex items-center justify-between gap-4">

        {/* ───────── Logo Section ───────── */}
        <div
          onClick={() => scrollToSection("hero")}
          className="flex items-center gap-3 cursor-pointer group bg-white/10 hover:bg-white/20 rounded-full px-4 py-2 transition-all duration-300 border border-white/30"
          style={{ textDecoration: "none" }}
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
                color: "#FFFFFF",
                letterSpacing: "0.18em",
                lineHeight: 1,
                fontFamily: "'Outfit', 'Quicksand', sans-serif",
              }}
            >
              LUCY
            </span>

            {/* CLASS — nhỏ hơn, màu cam đất bổ sung */}
            <span
              className="font-black tracking-[0.22em] uppercase transition-colors duration-300"
              style={{
                fontSize: "0.72rem",
                color: "#F4C97A",
                letterSpacing: "0.28em",
                lineHeight: 1.2,
                fontFamily: "'Outfit', 'Quicksand', sans-serif",
              }}
            >
              CLASS
            </span>

            {/* Tagline — chỉ hiện trên md trở lên */}
            <span
              className="hidden md:block mt-0.5 font-medium italic"
              style={{
                fontSize: "0.55rem",
                color: "rgba(255,255,255,0.75)",
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
        <div className="hidden lg:flex items-center bg-white/10 rounded-full px-2 py-2 border border-white/20 gap-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className={`px-4 py-2 rounded-full font-sans text-base transition-all duration-200 active:scale-95 whitespace-nowrap ${
                activeSection === item.id
                  ? "text-white font-bold border-b-[3px] border-white rounded-none"
                  : "text-white/75 font-normal"
              }`}
              style={
                activeSection === item.id
                  ? {}
                  : {}
              }
              onMouseEnter={(e) => {
                if (activeSection !== item.id) {
                  e.currentTarget.style.color = "#FFFFFF";
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
          {/* Streak Button */}
          <button
            onClick={openStreakModal}
            className="h-10 bg-white/15 hover:bg-white/25 rounded-full flex items-center justify-center font-display font-bold text-xs hover:scale-105 active:scale-95 transition-all border border-white/30 px-3 gap-1.5 text-white"
            title="Streak"
          >
            <span>🔥</span>
            <span className="hidden sm:inline">Streak</span>
          </button>

          {/* Language Switcher */}
          <button
            onClick={toggleLang}
            className="w-10 h-10 bg-white/15 hover:bg-white/25 rounded-full flex items-center justify-center font-display font-bold text-xs hover:scale-105 active:scale-95 transition-all border border-white/30 text-white"
          >
            {i18n.language.toUpperCase()}
          </button>

          {/* Hamburger (Mobile) */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden w-10 h-10 bg-white/15 hover:bg-white/25 rounded-full flex items-center justify-center text-xl hover:scale-105 active:scale-95 transition-all z-50 border border-white/30 text-white"
          >
            <span className="transform transition-transform duration-300">
              {isMenuOpen ? "✕" : "☰"}
            </span>
          </button>
        </div>

        {/* Mobile Menu Panel */}
        <div
          className={`fixed top-[72px] right-0 bottom-0 left-0 bg-[#1C695C] z-[40] lg:hidden flex flex-col items-center justify-start gap-4 transition-all duration-300 ease-in-out px-6 py-8 ${
            isMenuOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full pointer-events-none"
          }`}
        >
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className={`w-full max-w-sm py-4 rounded-[24px] font-sans font-bold text-xl transition-all active:scale-95 shadow-sm border border-white/25 text-white ${
                activeSection === item.id
                  ? "bg-white/15 border-l-4 border-l-[#D9A441]"
                  : "bg-transparent"
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