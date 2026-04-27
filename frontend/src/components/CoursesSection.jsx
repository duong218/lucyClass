import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import CourseDetailModal from './CourseDetailModal';
import { getImageUrl } from '../utils/getImageUrl';
import { Telescope, Palette, FlaskConical, Music, ChevronUp, ChevronDown } from 'lucide-react';

const CoursesSection = () => {
  const { t } = useTranslation();
  const getInitialVisibleCount = () => (window.innerWidth < 768 ? 4 : 8);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [activeTab, setActiveTab] = useState('All');
  const [showAll, setShowAll] = useState(false);
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
    const icons = [
      <Telescope className="w-16 h-16 text-blue-500 opacity-70" />,
      <Palette className="w-16 h-16 text-yellow-500 opacity-70" />,
      <FlaskConical className="w-16 h-16 text-green-500 opacity-70" />,
      <Music className="w-16 h-16 text-orange-500 opacity-70" />,
    ];
    return icons[index % 4];
  };

  const handleImageError = (e) => {
    e.target.src = '/placeholder.jpg';
  };

  const getShortDescription = (description = '') => {
    const cleaned = description
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleaned) return t('coursesSection.explore');

    const words = cleaned.split(' ');
    const sliceLength = Math.min(5, Math.max(2, words.length >= 4 ? 4 : words.length));
    return words.slice(0, sliceLength).join(' ');
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
                setShowAll(false); // Reset on filter change
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

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8 mb-12 transition-all duration-300 items-start md:items-stretch">
          {(showAll ? filteredCourses : filteredCourses.slice(0, getInitialVisibleCount())).map((course, idx) => {
            const style = getCardStyle(idx, course.type);
            return (
              <div 
                key={course._id} 
                onClick={() => setSelectedCourse(course)}
                className={`course-card group relative cursor-pointer transform transition-all duration-150 ease-out active:scale-95 md:duration-300 md:hover:-translate-y-2 md:hover:scale-[1.02] rounded-2xl md:rounded-3xl md:border-transparent dark:bg-white/10 dark:backdrop-blur-xl dark:border-white/20 dark:hover:bg-white/20 h-fit md:h-auto ${idx % 2 === 0 ? 'md:animate-[float_6s_ease-in-out_infinite]' : 'md:animate-[float_8s_ease-in-out_infinite]'}`}
              >
                {/* Mobile Card – matches mockup design */}
                <div className="md:hidden bg-white rounded-2xl p-3 text-left shadow-sm border border-gray-100 flex flex-col gap-2">
                  {/* Illustration */}
                  <div className={`w-full rounded-xl ${style.bg} flex items-center justify-center overflow-hidden`} style={{ aspectRatio: '4/3' }}>
                    {course.image ? (
                      <img
                        src={getImageUrl(course.image)}
                        alt={course.name}
                        className="w-4/5 h-4/5 object-contain"
                        onError={handleImageError}
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full">{getIconForIndex(idx)}</div>
                    )}
                  </div>
                  {/* Text */}
                  <div className="flex flex-col gap-0.5 px-0.5">
                    <h3 className="text-[13px] font-bold text-gray-900 leading-snug line-clamp-2">{course.name}</h3>
                    <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">{getShortDescription(course.description || course.desc || '')}</p>
                    <p className="text-[11px] text-blue-500 font-semibold mt-1 flex items-center gap-0.5">Xem chi tiết <ChevronDown className="w-3 h-3 -rotate-90" /></p>
                  </div>
                </div>

                <div className="flip-card hidden md:block w-full h-full">
                  <div className="flip-card-inner hidden md:block">
                    {/* Front Side */}
                    <div className={`flip-card-front ${style.bg} border-2 border-transparent shadow-lg text-center rounded-3xl overflow-hidden`}>
                      {/* Large image area - rounded square with padding */}
                      <div className="p-3 pb-0">
                        <div className="w-full aspect-square overflow-hidden rounded-2xl flex items-center justify-center bg-white/40">
                        {course.image ? (
                          <img
                            src={getImageUrl(course.image)}
                            alt={course.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={handleImageError}
                          />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full">
                            {getIconForIndex(idx)}
                          </div>
                        )}
                        </div>
                      </div>
                      <div className="px-5 py-4">
                        <h3 className={`text-xl font-black ${style.text} leading-tight group-hover:text-blue-500 transition-colors`}>{course.name}</h3>
                      </div>
                    </div>

                    {/* Back Side */}
                    <div className={`flip-card-back border-2 shadow-2xl flex flex-col items-center justify-center p-8`} style={{ color: style.bg.replace('bg-[', '').replace(']', '') }}>
                      <p className="text-xl font-bold text-gray-800 mb-8 italic">{t('coursesSection.explore')}</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCourse(course);
                        }}
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
        {filteredCourses.length > getInitialVisibleCount() && (
          <div className="text-center mt-6 animate-fadeInUp pt-4">
            {/* Mobile: solid pill button like mockup */}
            <button
              onClick={() => setShowAll((prev) => !prev)}
              className="md:hidden w-full max-w-xs mx-auto block bg-blue-500 hover:bg-blue-600 active:scale-95 text-white font-bold py-3 px-8 rounded-full shadow-md transition-all duration-200"
            >
              {showAll ? t('coursesSection.showLess') : t('coursesSection.showMore')}
            </button>
            {/* Desktop: text link */}
            <button
              onClick={() => setShowAll((prev) => !prev)}
              className="hidden md:flex text-blue-500 hover:underline font-bold transition-all duration-300 items-center justify-center gap-1 mx-auto"
            >
              {showAll ? t('coursesSection.showLess') : t('coursesSection.showMore')}
              {showAll ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
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
