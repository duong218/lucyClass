import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import CourseDetailModal from './CourseDetailModal';
import { getImageUrl } from '../utils/getImageUrl';

const CoursesSection = () => {
  const { t } = useTranslation();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [activeTab, setActiveTab] = useState('All');
  const [visibleCount, setVisibleCount] = useState(8);
  const sectionRef = useRef(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get('/courses');
        setCourses(Array.isArray(res.data.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []));
      } catch (err) {
        console.error('Failed to fetch courses for home page:', err);
        setCourses(fallbackCourses);
      }
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    if (!sectionRef.current) return;

    const cards = sectionRef.current.querySelectorAll(".course-card");
    const observer = new IntersectionObserver(
      (entries) => {
        try {
          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.target) {
              entry.target.classList.add("visible");
            }
          });
        } catch (err) {
          console.error("IntersectionObserver callback error:", err);
        }
      },
      { threshold: 0.2 }
    );

    cards.forEach((card) => {
      if (card) {
        card.classList.add("animate");
        observer.observe(card);
      }
    });

    const revealItems = sectionRef.current.querySelectorAll('.reveal:not(.course-card)');
    revealItems.forEach(item => {
      if (item) observer.observe(item);
    });

    return () => observer.disconnect();
  }, [courses]);

  const fallbackCourses = [
    { _id: '1', name: 'English Explorers', type: 'blue' },
    { _id: '2', name: 'Creative Arts', type: 'yellow' },
    { _id: '3', name: 'Science Kids', type: 'green' },
    { _id: '4', name: 'Music & Movement', type: 'orange' },
  ];

  const getCardStyle = (idx, type) => {
    const styles = [
      { bg: 'bg-[#c8dff0]', text: 'text-blue-800' },
      { bg: 'bg-[#f0db9f]', text: 'text-yellow-800' },
      { bg: 'bg-[#c8e2c4]', text: 'text-green-800' },
      { bg: 'bg-[#f0c4a8]', text: 'text-orange-800' },
    ];

    if (type === 'blue') return styles[0];
    if (type === 'yellow') return styles[1];
    if (type === 'green') return styles[2];
    if (type === 'orange') return styles[3];
    return styles[idx % 4];
  };

  const getIconForIndex = (index) => {
    const icons = ['🔭', '🎨', '🔬', '🎵'];
    return icons[index % 4];
  };

  const handleImageError = (e) => {
    e.target.src = '/placeholder.jpg';
  };

  const categories = ['All', 'Cambridge', 'IELTS', 'Kids'];
  const dataToRender = courses.length > 0 ? courses : fallbackCourses;
  
  const filteredCourses = dataToRender.filter((course) => {
    if (activeTab === 'All') return true;
    const search = activeTab.toLowerCase();
    const name = (course.name || '').toLowerCase();
    const type = (course.type || '').toLowerCase();
    return name.includes(search) || type.includes(search);
  });

  return (
    <section ref={sectionRef} id="courses" className="py-16 px-10 bg-mesh relative overflow-hidden backdrop-blur-md rounded-[24px]">
      {/* Background soft blur circles */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-blue-100 rounded-full blur-[100px] opacity-40 float-slow pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-100 rounded-full blur-[120px] opacity-40 float-fast pointer-events-none" style={{ animationDelay: '1s' }} />

      <div className="max-w-6xl mx-auto text-center relative z-10">
        <h2 className="text-4xl md:text-6xl font-display font-black text-text-main mb-12">
          {t('coursesSection.title')}
        </h2>

        {/* Filter Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-12 animate-fadeInUp">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveTab(cat);
                setVisibleCount(8); // Reset count on filter change
              }}
              className={`px-6 py-2 rounded-full font-bold text-sm md:text-base border-2 transition-all duration-300 ${
                activeTab === cat 
                  ? 'bg-blue-500 text-white border-blue-500 shadow-lg scale-105' 
                  : 'bg-white text-gray-600 border-transparent hover:border-blue-300 hover:text-blue-500 hover:shadow-md'
              }`}
            >
              {cat === 'All' ? t('coursesSection.all') : cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {filteredCourses.slice(0, visibleCount).map((course, idx) => {
            const style = getCardStyle(idx, course.type);
            return (
              <div 
                key={course._id} 
                className={`course-card group relative transform transition-all duration-300 ease-out hover:-translate-y-2 hover:scale-[1.02] shadow-md hover:shadow-xl rounded-3xl dark:bg-white/10 dark:backdrop-blur-xl dark:border dark:border-white/20 dark:hover:bg-white/20 ${idx % 2 === 0 ? 'animate-[float_6s_ease-in-out_infinite]' : 'animate-[float_8s_ease-in-out_infinite]'}`}
              >
                <div className="flip-card w-full h-full">
                  <div className="flip-card-inner">
                    {/* Front Side */}
                    <div className={`flip-card-front ${style.bg} border-2 border-transparent shadow-lg text-center rounded-3xl`}>
                      <div className="w-32 h-32 bg-white/80 rounded-full flex items-center justify-center text-6xl mb-6 shadow-soft group-hover:scale-110 transition-transform duration-300">
                        {course.image ? (
                          <img 
                            src={getImageUrl(course.image)} 
                            alt={course.name} 
                            className="w-full h-full object-cover rounded-full" 
                            onError={handleImageError}
                          />
                        ) : (
                          getIconForIndex(idx)
                        )}
                      </div>
                      <h3 className={`text-2xl font-black ${style.text} leading-tight group-hover:text-blue-500 transition-colors`}>{course.name}</h3>
                    </div>

                    {/* Back Side */}
                    <div className={`flip-card-back border-2 shadow-2xl flex flex-col items-center justify-center p-8`} style={{ color: style.bg.replace('bg-[', '').replace(']', '') }}>
                      <p className="text-xl font-bold text-gray-800 mb-8 italic">{t('coursesSection.explore')}</p>
                      <button
                        onClick={() => setSelectedCourse(course)}
                        className="bg-[#4A90E2] text-white font-black py-4 px-8 rounded-full shadow-xl hover:scale-110 transition-transform active:scale-95"
                      >
                        {t('coursesSection.viewCourse')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Show More / Show Less Button */}
        {filteredCourses.length > 8 && (
          <div className="text-center mt-6 animate-fadeInUp pt-4">
            <button
              onClick={() => setVisibleCount(visibleCount === 8 ? filteredCourses.length : 8)}
              className="text-blue-500 hover:underline font-bold transition-all duration-300 flex items-center justify-center gap-1 mx-auto"
            >
              {visibleCount === 8 ? t('coursesSection.showMore') : t('coursesSection.showLess')}
              <span className="text-lg leading-none">{visibleCount === 8 ? '↓' : '↑'}</span>
            </button>
          </div>
        )}
      </div>

      {selectedCourse && (
        <CourseDetailModal
          course={selectedCourse}
          onClose={() => setSelectedCourse(null)}
        />
      )}
    </section>
  );
};

export default CoursesSection;
