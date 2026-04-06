import { useState, useEffect, Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

import { getImageUrl } from '../utils/getImageUrl';
import { openModal, closeModal } from '../utils/modalScrollLock';
// Lazy load modal
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

  useEffect(() => {
    if (openAll) {
      openModal();
    } else {
      closeModal();
    }

    return () => {
      if (openAll) {
        closeModal();
      }
    };
  }, [openAll]);


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
      className="relative py-24 px-6 overflow-hidden bg-white border-t border-primary-50 isolate z-0 font-sans"
    >

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
        <div className="relative rounded-[40px] bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50 p-8 md:p-12 border border-white/50 shadow-card overflow-hidden">
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
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-black tracking-tight text-gray-800 drop-shadow-sm uppercase">
              {t('announcements.title') || "What's New at Lucy English Center?"}
            </h2>
            <p className="mt-4 text-base md:text-lg text-gray-600 font-medium max-w-2xl mx-auto">
              {t('announcements.slogan')}
            </p>
            <div className="w-24 h-2 bg-primary-300 mx-auto mt-6 rounded-full shadow-inner"></div>
          </div>

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
          <div className="relative w-full max-w-md h-[420px] mx-auto">
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
          <div className="flex justify-center mt-12">
            <button 
              onClick={() => setOpenAll(true)}
              className="px-10 py-3 rounded-full bg-primary-400 text-white font-black uppercase tracking-widest hover:bg-primary-500 hover:scale-105 active:scale-95 transition-all duration-200 shadow-heavy"
            >
              {t("announcements.view_all", "Xem tất cả")}
            </button>
          </div>

          {/* View All Modal */}
          {openAll && (
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
              onClick={() => setOpenAll(false)}
            >
                <div 
                  className="bg-white rounded-[40px] p-8 w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-heavy border-4 border-primary-100 overscroll-contain"
                  onClick={(e) => e.stopPropagation()}
                >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {t("announcements.all", "Tất cả thông báo")}
                  </h2>
                  <button 
                    onClick={() => setOpenAll(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="overflow-y-auto pr-2 custom-scrollbar">
                  <div className="space-y-6 pb-4">
                    {latestTen.map((item) => (
                      <div 
                        key={item._id} 
                        className="group/item flex gap-6 p-4 rounded-3xl hover:bg-primary-50 transition-all border border-transparent hover:border-primary-100 cursor-pointer"
                        onClick={() => {
                          setSelectedAnnouncement(item);
                          setOpenAll(false);
                        }}
                      >
                        <div className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-2xl shadow-sm">
                          <img 
                            src={getImageUrl(item.image)} 
                            alt={item.title}
                            className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500"
                            onError={handleImageError}
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-display font-black text-gray-800 mb-2 group-hover/item:text-primary-500 transition-colors uppercase text-sm tracking-tight">
                            {item.title}
                          </h4>
                          <p className="text-sm text-gray-500 font-medium line-clamp-2">
                            {item.description}
                          </p>
                          <span className="text-[10px] text-primary-400 font-black tracking-widest uppercase mt-3 inline-block">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end mt-6 pt-4 border-t border-gray-100 dark:border-slate-700">
                  <button
                    onClick={() => setOpenAll(false)}
                    className="px-10 py-3 bg-gray-100 text-gray-700 rounded-full font-black uppercase tracking-widest hover:bg-primary-50 transition-all"
                  >
                    {t("common.close", "Đóng")}
                  </button>
                </div>
              </div>
            </div>
          )}
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
