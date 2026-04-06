import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { getImageUrl } from '../utils/getImageUrl';

const TeachersSection = () => {
  const { t } = useTranslation();
  const [teachers, setTeachers] = useState([]);
  const sectionRef = useRef(null);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const res = await api.get('/teachers');
        setTeachers(Array.isArray(res.data.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []));
      } catch (err) {
        console.error('Failed to fetch teachers for home page:', err);
        setTeachers(fallbackTeachers);
      }
    };
    fetchTeachers();

    if (!sectionRef.current) return;

    const observer = new IntersectionObserver((entries) => {
      try {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.target) {
            entry.target.classList.add('active');
          }
        });
      } catch (err) {
        console.error("IntersectionObserver callback error:", err);
      }
    }, { threshold: 0.1 });

    const revealItems = sectionRef.current.querySelectorAll('.reveal');
    revealItems.forEach(item => {
      if (item) observer.observe(item);
    });

    return () => observer.disconnect();
  }, []);

  const fallbackTeachers = [
    { _id: '1', name: 'Ms. Emily' },
    { _id: '2', name: 'Ms. Emily' },
    { _id: '3', name: 'Ms. Emily' },
    { _id: '4', name: 'Ms. Emily' },
  ];

  const getCardStyle = (index) => {
    const styles = [
      'bg-[#f0db9f]', // yellow
      'bg-[#c8e2c4]', // green
      'bg-[#f0c4a8]', // orange
      'bg-[#FAD2E5]', // pink
    ];
    return styles[index % 4];
  };

  const handleImageError = (e) => {
    e.target.src = '/placeholder.jpg';
  };

  return (
    <section ref={sectionRef} id="teachers" className="py-24 px-6 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-4xl md:text-6xl font-display font-black text-text-main mb-16 reveal">
          {t('teachersSection.title')}
        </h2>

        <style>{`
          @keyframes teachersMarquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-teachers-marquee {
            animation: teachersMarquee 40s linear infinite;
          }
          .animate-teachers-marquee:hover {
            animation-play-state: paused;
          }
        `}</style>

        <div className="relative py-8 w-full reveal stagger-2">
          <div className="flex w-max animate-teachers-marquee hover:pause">
            {/* First Set */}
              <div className="flex gap-8 pr-8">
                {(teachers.length > 0 ? teachers : fallbackTeachers).map((teacher, idx) => (
                  <div 
                    key={`first-${teacher._id}-${idx}`} 
                    className={`${getCardStyle(idx)} rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center shadow-lg hover:shadow-2xl hover:scale-110 transition-all duration-300 w-[280px] md:w-[320px] shrink-0 cursor-pointer group`}
                  >
                    <div className="w-32 h-32 mb-6 rounded-full overflow-hidden flex items-center justify-center bg-white shadow-soft group-hover:rotate-6 transition-transform">
                      {teacher.avatar ? (
                        <img 
                          src={getImageUrl(teacher.avatar)} 
                          alt={teacher.name} 
                          className="w-full h-full object-cover" 
                          onError={handleImageError}
                        />
                      ) : (
                        <div className="text-6xl">👩‍🏫</div>
                      )}
                    </div>
                    <h4 className="text-2xl font-black text-text-main">{teacher.name}</h4>
                    <p className="text-lg font-bold text-text-main opacity-80 mt-2">{teacher.specialization || 'English Guide'}</p>
                  </div>
                ))}
              </div>
              
              {/* Second Set */}
              <div className="flex gap-8 pr-8" aria-hidden="true">
                {(teachers.length > 0 ? teachers : fallbackTeachers).map((teacher, idx) => (
                  <div 
                    key={`second-${teacher._id}-${idx}`} 
                    className={`${getCardStyle(idx)} rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center shadow-lg hover:shadow-2xl hover:scale-110 transition-all duration-300 w-[280px] md:w-[320px] shrink-0 cursor-pointer group`}
                  >
                    <div className="w-32 h-32 mb-6 rounded-full overflow-hidden flex items-center justify-center bg-white shadow-soft group-hover:rotate-6 transition-transform">
                      {teacher.avatar ? (
                        <img 
                          src={getImageUrl(teacher.avatar)} 
                          alt={teacher.name} 
                          className="w-full h-full object-cover" 
                          onError={handleImageError}
                        />
                      ) : (
                        <div className="text-6xl">👩‍🏫</div>
                      )}
                    </div>
                    <h4 className="text-2xl font-black text-text-main">{teacher.name}</h4>
                    <p className="text-lg font-bold text-text-main opacity-80 mt-2">{teacher.specialization || 'English Guide'}</p>
                  </div>
                ))}
              </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TeachersSection;
