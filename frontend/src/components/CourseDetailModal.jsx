import { useTranslation } from 'react-i18next';
import { getImageUrl } from '../utils/getImageUrl';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { openModal, closeModal } from '../utils/modalScrollLock';

const CourseDetailModal = ({ course, onClose }) => {
  const { t } = useTranslation();

  useEffect(() => {
    openModal();
    return () => { closeModal(); };
  }, []);

  const handleImageError = (e) => { e.target.src = '/placeholder.jpg'; };

  const handleRegisterClick = () => {
    onClose();
    setTimeout(() => {
      document.getElementById('register')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const defaultHighlights = t('courseDetail.defaultHighlights', { returnObjects: true });
  const courseHighlights = course.highlights?.length > 0 ? course.highlights : defaultHighlights;
  const highlightIcons = ['🗣️', '🎲', '⚡', '👩‍🏫'];

  const hasAdditionalTeachers = course.additionalTeachers?.length > 0;

  return createPortal(
    (
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
        onClick={onClose}
      >
        <div
          className={`
            bg-white w-full relative flex flex-col overflow-hidden
            rounded-t-[28px]
            max-h-[88dvh]
            md:rounded-[2.5rem] md:max-w-4xl md:max-h-[80vh] md:shadow-2xl md:animate-fadeInUp md:mt-16
            animate-slideUpMobile
          `}
          onClick={e => e.stopPropagation()}
          style={{ boxShadow: '0 -4px 40px 0 rgba(0,0,0,0.13)' }}
        >
          {/* ── MOBILE HEADER ── */}
          <div className="md:hidden shrink-0 bg-white rounded-t-[28px] px-5 pt-3 pb-3 border-b border-gray-100 relative z-10">
            <div className="w-10 h-1.5 bg-gray-200 rounded-full mx-auto mb-3" />
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <span className="bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                  {t('courseDetail.badge')}
                </span>
                <h2 className="text-lg font-black text-gray-900 mt-1 leading-tight truncate">{course.name}</h2>
              </div>
              <button
                onClick={onClose}
                className="shrink-0 w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold text-sm transition-colors"
                aria-label={t('courseDetail.closeBtnLabel')}
              >✕</button>
            </div>
          </div>

          {/* ── DESKTOP CLOSE BUTTON — nằm ngoài scroll, luôn hiển thị ── */}
          <div className="hidden md:flex shrink-0 justify-end px-5 pt-4 pb-0">
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white shadow-md hover:bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-500 transition-colors"
              aria-label={t('courseDetail.closeBtnLabel')}
            >✕</button>
          </div>

          {/* ── SCROLLABLE BODY ── */}
          <div className="overflow-y-auto flex-1" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div className="p-5 pt-4 md:p-8 md:pt-3">
              <div className="flex flex-col md:flex-row gap-5 md:gap-8">

                {/* ── LEFT: Course Info ── */}
                <div className="flex-1 space-y-5 md:space-y-6">
                  {/* Desktop-only title block */}
                  <div className="hidden md:block">
                    <span className="bg-yellow-100 text-yellow-800 text-sm font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                      {t('courseDetail.desktopBadge')}
                    </span>
                    <h2 className="text-4xl font-display font-black text-text-main mt-4 mb-2">{course.name}</h2>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 md:gap-3">
                    <span className="bg-[#D0EAF9] text-blue-900 border-2 border-blue-200 px-3 md:px-4 py-1 md:py-1.5 rounded-full font-bold flex items-center gap-1.5 md:gap-2 text-sm">
                      <span className="text-base md:text-lg">👶</span> {course.ageGroup || t('courseDetail.defaultAge')}
                    </span>
                    <span className="bg-[#D5F1D5] text-green-900 border-2 border-green-200 px-3 md:px-4 py-1 md:py-1.5 rounded-full font-bold flex items-center gap-1.5 md:gap-2 text-sm">
                      <span className="text-base md:text-lg">👥</span> {course.classSize || t('courseDetail.defaultClassSize')}
                    </span>
                    <span className="bg-[#FCD7C4] text-orange-900 border-2 border-orange-200 px-3 md:px-4 py-1 md:py-1.5 rounded-full font-bold flex items-center gap-1.5 md:gap-2 text-sm">
                      <span className="text-base md:text-lg">🕐</span> {course.duration || t('courseDetail.defaultDuration')}
                    </span>
                  </div>

                  {/* Description */}
                  <div>
                    <h3 className="text-base md:text-xl font-bold mb-2">{t('courseDetail.descriptionTitle')}</h3>
                    <p className="text-text-main opacity-80 font-medium leading-relaxed text-sm md:text-base">
                      {course.description || t('courseDetail.defaultDesc')}
                    </p>
                  </div>

                  {/* Highlights */}
                  <div>
                    <h3 className="text-base md:text-xl font-bold mb-3 md:mb-4">{t('courseDetail.highlightsTitle')}</h3>
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                      {courseHighlights.map((hl, idx) => (
                        <div key={idx} className="flex items-center gap-2 md:gap-3">
                          <span className="w-9 h-9 md:w-10 md:h-10 bg-gray-50 rounded-full flex items-center justify-center text-lg md:text-xl shadow-sm border border-gray-100 shrink-0">
                            {highlightIcons[idx % 4]}
                          </span>
                          <span className="font-bold text-gray-700 text-sm md:text-base leading-tight">{hl}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── RIGHT: Teacher & CTA ── */}
                <div className="w-full md:w-80 flex flex-col gap-4 md:gap-6">

                  {/* ── Giáo viên chính ── */}
                  <div className="bg-[#FDF0C6] rounded-2xl md:rounded-[2rem] p-4 md:p-6 border-2 border-yellow-100 shadow-sm">
                    <h3 className="font-bold text-yellow-800 mb-3 bg-yellow-200 px-3 py-1 rounded-full text-xs md:text-sm w-fit mx-auto md:mx-auto text-center">
                      {t('courseDetail.teacherTitle')}
                    </h3>
                    <div className="flex items-center gap-4 md:flex-col md:items-center md:text-center md:gap-0">
                      <div className="w-16 h-16 md:w-28 md:h-28 bg-white/50 rounded-full overflow-hidden border-4 border-white shadow-sm flex items-center justify-center shrink-0 md:mb-4">
                        {course.teacher?.avatar ? (
                          <img
                            src={getImageUrl(course.teacher.avatar)}
                            alt={course.teacher.name}
                            className="w-full h-full object-cover"
                            onError={handleImageError}
                          />
                        ) : (
                          <span className="text-4xl md:text-6xl">👩‍🏫</span>
                        )}
                      </div>
                      <div>
                        <h4 className="text-base md:text-xl font-bold text-text-main">
                          {course.teacher?.name || t('courseDetail.defaultTeacher')}
                        </h4>
                        <p className="font-bold text-gray-500 text-sm">
                          {course.teacher?.specialization || t('courseDetail.defaultSpecialization')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ── Giáo viên phụ ── */}
                  {hasAdditionalTeachers && (
                    <div className="bg-blue-50 rounded-2xl md:rounded-[2rem] p-4 md:p-5 border-2 border-blue-100 shadow-sm">
                      <h3 className="font-bold text-blue-700 mb-3 bg-blue-100 px-3 py-1 rounded-full text-xs md:text-sm w-fit mx-auto text-center">
                        {t('courseDetail.additionalTeachersTitle')}
                      </h3>
                      <div className="flex flex-col gap-2.5">
                        {course.additionalTeachers.map((teacher) => (
                          <div key={teacher._id} className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-full overflow-hidden border-2 border-blue-200 flex items-center justify-center shrink-0 shadow-sm">
                              {teacher.avatar ? (
                                <img
                                  src={getImageUrl(teacher.avatar)}
                                  alt={teacher.name}
                                  className="w-full h-full object-cover"
                                  onError={handleImageError}
                                />
                              ) : (
                                <span className="text-xl">👩‍🏫</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-gray-800 text-sm leading-tight truncate">{teacher.name}</p>
                              {teacher.specialization && (
                                <p className="text-xs text-gray-500 truncate">{teacher.specialization}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CTA Button */}
                  <button
                    onClick={handleRegisterClick}
                    className="w-full bg-[#4A90E2] text-white py-3.5 md:py-4 rounded-2xl text-lg md:text-xl font-bold transition-all shadow-[0_6px_0_#2b6cb0] hover:shadow-[0_2px_0_#2b6cb0] hover:translate-y-1 active:translate-y-1 active:shadow-[0_2px_0_#2b6cb0]"
                  >
                    {t('courseDetail.registerBtn')}
                  </button>
                </div>

              </div>
            </div>

            {/* Safe area bottom padding on mobile */}
            <div className="md:hidden h-4" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} />
          </div>
        </div>

        <style>{`
          @keyframes slideUpMobile {
            from { transform: translateY(100%); opacity: 0; }
            to   { transform: translateY(0);    opacity: 1; }
          }
          @media (max-width: 767px) {
            .animate-slideUpMobile {
              animation: slideUpMobile 0.32s cubic-bezier(0.32, 0.72, 0, 1) both;
            }
          }
        `}</style>
      </div>
    ),
    document.body
  );
};

export default CourseDetailModal;
