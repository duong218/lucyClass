import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { getImageUrl } from '../utils/getImageUrl';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';

// ─── Mobile Card Modal ───────────────────────────────────────────────────────
const MobileModal = ({ fb, onClose }) => {
  useLockBodyScroll(true);

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm
                   bg-white rounded-t-3xl rounded-b-xl px-6 pt-8 pb-8 shadow-xl
                   animate-slide-up"
        style={{ animation: 'slideUp 0.3s ease-out' }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Stars curved above avatar */}
        <div className="flex justify-center mb-1">
          <div className="relative flex items-end gap-[2px]">
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                className={`text-base transition-transform ${i < fb.rating ? 'text-yellow-400' : 'text-gray-200'}`}
                style={{
                  transform: `translateY(${[4, 2, 0, 2, 4][i]}px)`,
                  display: 'inline-block',
                }}
              >
                ★
              </span>
            ))}
          </div>
        </div>

        {/* Avatar */}
        <div className="w-20 h-20 mx-auto rounded-full bg-[#FCD7C4] flex items-center justify-center mb-4 overflow-hidden border-4 border-blue-50 shadow-sm">
          {fb.photo ? (
            <img
              src={getImageUrl(fb.photo)}
              alt={fb.parentName}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.src = '/placeholder.jpg'; }}
            />
          ) : (
            <span className="text-4xl">👩</span>
          )}
        </div>

        {/* Name */}
        <h4 className="font-bold text-gray-800 text-center text-base leading-tight">
          {fb.parentName} - Parent of
        </h4>
        <h4 className="font-bold text-gray-800 text-center text-base mb-4">
          {fb.childName} ({fb.childAge} years old)
        </h4>

        {/* Full feedback text */}
        <p className="text-sm text-gray-600 leading-relaxed text-center">
          {fb.text}
        </p>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translate(-50%, 100%); opacity: 0; }
          to   { transform: translate(-50%, 0);    opacity: 1; }
        }
      `}</style>
    </>
  );
};

// ─── Mobile Compact Card ─────────────────────────────────────────────────────
const MobileCard = ({ fb, onClick }) => (
  <div
    onClick={onClick}
    className="
      snap-start flex-shrink-0 w-[32vw] max-w-[130px]
      bg-white rounded-2xl p-3 shadow-sm border border-blue-50
      flex flex-col items-center cursor-pointer
      active:scale-95 transition-transform duration-150
    "
  >
    {/* Stars arc above avatar */}
    <div className="flex items-end gap-[1px] mb-1">
      {[...Array(5)].map((_, i) => (
        <span
          key={i}
          className={`text-[10px] ${i < fb.rating ? 'text-yellow-400' : 'text-gray-200'}`}
          style={{
            transform: `translateY(${[3, 1.5, 0, 1.5, 3][i]}px)`,
            display: 'inline-block',
          }}
        >
          ★
        </span>
      ))}
    </div>

    {/* Avatar */}
    <div className="w-12 h-12 rounded-full bg-[#FCD7C4] flex items-center justify-center overflow-hidden mb-2 border-2 border-blue-50">
      {fb.photo ? (
        <img
          src={getImageUrl(fb.photo)}
          alt={fb.parentName}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.src = '/placeholder.jpg'; }}
        />
      ) : (
        <span className="text-2xl">👩</span>
      )}
    </div>

    {/* Name */}
    <p className="text-[10px] font-bold text-gray-700 text-center leading-tight line-clamp-2 mb-1">
      {fb.parentName}
    </p>
    <p className="text-[9px] text-blue-400 text-center leading-tight mb-2">
      {fb.childName}, {fb.childAge}y
    </p>

    {/* Truncated text */}
    <p className="text-[9px] text-gray-500 leading-snug text-center line-clamp-3">
      {fb.text}
    </p>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const TestimonialsSection = () => {
  const { t, i18n } = useTranslation();
  const [feedbacks, setFeedbacks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const itemsPerPage = 3;

  const fallbackFeedbacks = [
    { _id: '1', parentName: 'Mrs. Lan', childName: 'Minh Anh', childAge: 7, text: 'My child used to be shy when speaking English, but after joining the classes, she became much more confident and enjoys learning every day.', rating: 5 },
    { _id: '2', parentName: 'Mrs. Lan', childName: 'Minh Anh', childAge: 7, text: 'My child used to be shy when speaking English, but after joining the classes, she became much more confident and enjoys learning every day.', rating: 5 },
    { _id: '3', parentName: 'Mrs. Lan', childName: 'Minh Anh', childAge: 7, text: 'My child used to be shy when speaking English, but after joining the classes, she became much more confident and enjoys learning every day.', rating: 5 },
    { _id: '4', parentName: 'Mrs. Lan', childName: 'Minh Anh', childAge: 7, text: 'My child used to be shy when speaking English, but after joining the classes, she became much more confident and enjoys learning every day.', rating: 5 },
    { _id: '5', parentName: 'Mrs. Lan', childName: 'Minh Anh', childAge: 7, text: 'My child used to be shy when speaking English, but after joining the classes, she became much more confident and enjoys learning every day.', rating: 5 },
  ];

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const res = await api.get('/feedback');
        const data = Array.isArray(res.data.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
        setFeedbacks(data.slice(0, 6));
      } catch (err) {
        console.error('Failed to fetch feedback for testimonials:', err);
        setFeedbacks(fallbackFeedbacks);
      }
    };
    fetchFeedback();
  }, []);

  const handleImageError = (e) => {
    e.target.src = '/placeholder.jpg';
  };

  const feedbacksList = feedbacks.length > 0 ? feedbacks : fallbackFeedbacks;

  return (
    <section key={i18n.language} className="py-20 px-6 bg-[#F8FDFE] relative">
      {/* Decorative stars */}
      <div className="absolute top-10 left-[10%] text-3xl opacity-60 text-yellow-400">⭐</div>
      <div className="absolute top-32 right-[5%] text-4xl opacity-60 text-blue-300">✨</div>
      <div className="absolute bottom-20 left-[5%] text-4xl opacity-60 text-yellow-400">⭐</div>
      <div className="absolute bottom-10 right-[10%] text-2xl opacity-60 text-blue-300">✨</div>

      <div className="max-w-6xl mx-auto text-center relative z-10">
        <h2 className="text-3xl md:text-4xl font-display font-black text-text-main mb-2">
          {t('testimonials.title')}
        </h2>
        <p className="text-gray-500 mb-16 max-w-2xl mx-auto">
          {t('testimonials.subtitle')}
        </p>

        {/* ── MOBILE: horizontal scroll strip ─────────────────────────────── */}
        <div className="md:hidden -mx-6 px-6 overflow-x-auto flex gap-3 snap-x snap-mandatory pb-4 scrollbar-hide">
          {feedbacksList.map((fb, idx) => (
            <MobileCard
              key={fb._id || idx}
              fb={fb}
              onClick={() => setSelectedFeedback(fb)}
            />
          ))}
        </div>

        {/* ── DESKTOP: grid (unchanged) ─────────────────────────────────── */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {(() => {
            const startIndex = (currentPage - 1) * itemsPerPage;
            const currentItems = feedbacksList.slice(startIndex, startIndex + itemsPerPage);

            return currentItems.map((fb, idx) => (
              <div
                key={fb._id || idx}
                className="bg-white rounded-[2rem] p-8 border-2 border-gray-100 shadow-sm relative text-center hover:shadow-md transition-shadow"
              >
                {/* Quote icon top left */}
                <div className="absolute -top-4 -left-4 text-5xl text-blue-200">❝</div>
                {/* Stars top right */}
                <div className="absolute top-4 right-6 flex">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`text-sm ${i < fb.rating ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                  ))}
                </div>

                <div className="w-20 h-20 mx-auto rounded-full bg-[#FCD7C4] flex items-center justify-center mb-4 overflow-hidden mt-2">
                  {fb.photo ? (
                    <img
                      src={getImageUrl(fb.photo)}
                      alt={fb.parentName}
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                    />
                  ) : (
                    <span className="text-4xl">👩</span>
                  )}
                </div>

                <h4 className="font-bold text-text-main">{fb.parentName} - Parent of</h4>
                <h4 className="font-bold text-text-main mb-4">{fb.childName} ({fb.childAge} years old)</h4>

                <p className="text-sm text-text-main font-medium leading-relaxed opacity-80">
                  {fb.text}
                </p>

                {/* Quote icon bottom right */}
                <div className="absolute -bottom-6 -right-2 text-5xl text-blue-200 rotate-180">❝</div>
              </div>
            ));
          })()}
        </div>

        {/* ── DESKTOP Pagination (unchanged, hidden on mobile) ─────────── */}
        <div className="hidden md:flex justify-center items-center gap-6 mt-12">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-6 py-2 bg-white text-blue-500 border-2 border-blue-100 rounded-full font-bold shadow-sm transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
          >
            {t('common.prev', 'Trước')}
          </button>

          <div className="flex gap-2">
            {(() => {
              const totalPages = Math.ceil(feedbacksList.length / itemsPerPage);
              return [...Array(totalPages)].map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${currentPage === i + 1 ? 'bg-blue-500 w-6' : 'bg-blue-200'}`}
                />
              ));
            })()}
          </div>

          <button
            onClick={() => {
              const totalPages = Math.ceil(feedbacksList.length / itemsPerPage);
              setCurrentPage(prev => Math.min(prev + 1, totalPages));
            }}
            disabled={currentPage >= Math.ceil(feedbacksList.length / itemsPerPage)}
            className="px-6 py-2 bg-blue-500 text-white rounded-full font-bold shadow-md transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
          >
            {t('common.next', 'Tiếp')}
          </button>
        </div>
      </div>

      {/* ── Mobile Modal ───────────────────────────────────────────────── */}
      {selectedFeedback && (
        <MobileModal
          fb={selectedFeedback}
          onClose={() => setSelectedFeedback(null)}
        />
      )}
    </section>
  );
};

export default TestimonialsSection;
