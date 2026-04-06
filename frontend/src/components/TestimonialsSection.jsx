import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { getImageUrl } from '../utils/getImageUrl';

const TestimonialsSection = () => {
  const { t, i18n } = useTranslation();
  const [feedbacks, setFeedbacks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

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

  const fallbackFeedbacks = [
    { _id: '1', parentName: 'Mrs. Lan', childName: 'Minh Anh', childAge: 7, text: 'My child used to be shy when speaking English, but after joining the classes, she became much more confident and enjoys learning every day.', rating: 5 },
    { _id: '2', parentName: 'Mrs. Lan', childName: 'Minh Anh', childAge: 7, text: 'My child used to be shy when speaking English, but after joining the classes, she became much more confident and enjoys learning every day.', rating: 5 },
    { _id: '3', parentName: 'Mrs. Lan', childName: 'Minh Anh', childAge: 7, text: 'My child used to be shy when speaking English, but after joining the classes, she became much more confident and enjoys learning every day.', rating: 5 },
    { _id: '4', parentName: 'Mrs. Lan', childName: 'Minh Anh', childAge: 7, text: 'My child used to be shy when speaking English, but after joining the classes, she became much more confident and enjoys learning every day.', rating: 5 },
    { _id: '5', parentName: 'Mrs. Lan', childName: 'Minh Anh', childAge: 7, text: 'My child used to be shy when speaking English, but after joining the classes, she became much more confident and enjoys learning every day.', rating: 5 },
  ];

  const handleImageError = (e) => {
    e.target.src = '/placeholder.jpg';
  };

  return (
    <section key={i18n.language} className="py-20 px-6 bg-[#F8FDFE] relative">
      {/* Decorative stars */}
      <div className="absolute top-10 left-[10%] text-3xl opacity-60 text-yellow-400">⭐</div>
      <div className="absolute top-32 right-[5%] text-4xl opacity-60 text-blue-300">✨</div>
      <div className="absolute bottom-20 left-[5%] text-4xl opacity-60 text-yellow-400">⭐</div>
      <div className="absolute bottom-10 right-[10%] text-2xl opacity-60 text-blue-300">✨</div>

      <div className="max-w-6xl mx-auto text-center relative z-10">
        <h2 className="text-3xl md:text-4xl font-display font-black text-text-main mb-2">{t('testimonials.title')}</h2>
        <h3 className="text-2xl font-bold text-text-main mb-4">{t('testimonials.title')}</h3>
        <p className="text-gray-500 mb-16 max-w-2xl mx-auto">{t('testimonials.subtitle')}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {(() => {
            const feedbacksList = feedbacks.length > 0 ? feedbacks : fallbackFeedbacks;
            const startIndex = (currentPage - 1) * itemsPerPage;
            const currentItems = feedbacksList.slice(startIndex, startIndex + itemsPerPage);
            const totalPages = Math.ceil(feedbacksList.length / itemsPerPage);

            return (
              <>
                {currentItems.map((fb, idx) => (
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
                ))}
              </>
            );
          })()}
        </div>

        {/* Pagination Controls */}
        <div className="flex justify-center items-center gap-6 mt-12">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-6 py-2 bg-white text-blue-500 border-2 border-blue-100 rounded-full font-bold shadow-sm transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
          >
            {t('common.prev', 'Trước')}
          </button>
          
          <div className="flex gap-2">
            {(() => {
              const feedbacksList = feedbacks.length > 0 ? feedbacks : fallbackFeedbacks;
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
              const feedbacksList = feedbacks.length > 0 ? feedbacks : fallbackFeedbacks;
              const totalPages = Math.ceil(feedbacksList.length / itemsPerPage);
              setCurrentPage(prev => Math.min(prev + 1, totalPages));
            }}
            disabled={(() => {
              const feedbacksList = feedbacks.length > 0 ? feedbacks : fallbackFeedbacks;
              const totalPages = Math.ceil(feedbacksList.length / itemsPerPage);
              return currentPage >= totalPages;
            })()}
            className="px-6 py-2 bg-blue-500 text-white rounded-full font-bold shadow-md transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
          >
            {t('common.next', 'Tiếp')}
          </button>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
