import { useTranslation } from 'react-i18next';
import { getImageUrl } from '../utils/getImageUrl';

const CourseDetailModal = ({ course, onClose }) => {
  const { t } = useTranslation();

  const handleImageError = (e) => {
    e.target.src = '/placeholder.jpg';
  };

  const handleRegisterClick = () => {
    onClose();
    document.getElementById('register')?.scrollIntoView({ behavior: 'smooth' });
  };

  const courseHighlights = course.highlights?.length > 0 
    ? course.highlights 
    : ['Phát âm chuẩn', 'Học qua trò chơi', 'Phản xạ tiếng Anh', 'Giáo viên thân thiện'];

  const highlightIcons = ['🗣️', '🎲', '⚡', '👩‍🏫'];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-0 md:p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-t-3xl md:rounded-[2.5rem] w-full md:max-w-4xl max-h-[85vh] shadow-2xl relative flex flex-col animate-fadeInUp overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Mobile Drag Handle */}
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3 mb-2 md:hidden shrink-0" />

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 bg-white shadow-md hover:bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-500 transition-colors z-20"
        >
          ✕
        </button>

        {/* Scrollable Inner Content */}
        <div className="overflow-y-auto flex-1 p-8 pt-2 md:pt-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Left Side: Course Info */}
            <div className="flex-1 space-y-6">
              <div>
                <span className="bg-yellow-100 text-yellow-800 text-sm font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                  Course Details
                </span>
                <h2 className="text-4xl font-display font-black text-text-main mt-4 mb-2">{course.name}</h2>
              </div>

              <div className="flex flex-wrap gap-3">
                <span className="bg-[#D0EAF9] text-blue-900 border-2 border-blue-200 px-4 py-1.5 rounded-full font-bold flex items-center gap-2">
                  <span className="text-lg">👶</span> {course.ageGroup || '4-6 tuổi'}
                </span>
                <span className="bg-[#D5F1D5] text-green-900 border-2 border-green-200 px-4 py-1.5 rounded-full font-bold flex items-center gap-2">
                  <span className="text-lg">👥</span> {course.classSize || '8 - 10 học sinh'}
                </span>
                <span className="bg-[#FCD7C4] text-orange-900 border-2 border-orange-200 px-4 py-1.5 rounded-full font-bold flex items-center gap-2">
                  <span className="text-lg">🕐</span> {course.duration || '12 tuần – 2 buổi/tuần'}
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-2">Mô tả chi tiết:</h3>
                <p className="text-text-main opacity-80 font-medium leading-relaxed">
                  {course.description || 'Chương trình học tiếng Anh dành cho trẻ em, kết hợp với các hoạt động vui nhộn giúp trẻ tiếp thu ngôn ngữ một cách tự nhiên.'}
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4">Điểm nổi bật:</h3>
                <div className="grid grid-cols-2 gap-4">
                  {courseHighlights.map((hl, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-xl shadow-sm border border-gray-100">
                        {highlightIcons[idx % 4]}
                      </span>
                      <span className="font-bold text-gray-700">{hl}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Side: Teacher & CTA */}
            <div className="w-full md:w-80 flex flex-col gap-6">
              <div className="bg-[#FDF0C6] rounded-[2rem] p-6 flex flex-col items-center text-center shadow-sm border-2 border-yellow-100">
                <h3 className="font-bold text-yellow-800 mb-4 bg-yellow-200 px-4 py-1 rounded-full text-sm">Giáo viên phụ trách</h3>
                <div className="w-28 h-28 bg-white/50 rounded-full overflow-hidden mb-4 border-4 border-white shadow-sm flex items-center justify-center">
                   {course.teacher?.avatar ? (
                      <img 
                        src={getImageUrl(course.teacher.avatar)} 
                        alt={course.teacher.name} 
                        className="w-full h-full object-cover" 
                        onError={handleImageError}
                      />
                    ) : (
                      <span className="text-6xl">👩‍🏫</span>
                    )}
                </div>
                <h4 className="text-xl font-bold text-text-main">{course.teacher?.name || 'Ms. Emily'}</h4>
                <p className="font-bold text-gray-500">{course.teacher?.specialization || 'English Guide'}</p>
              </div>

              <button 
                onClick={handleRegisterClick}
                className="w-full bg-[#4A90E2] text-white py-4 rounded-2xl text-xl font-bold transition-all shadow-[0_6px_0_#2b6cb0] hover:shadow-[0_2px_0_#2b6cb0] hover:translate-y-1"
              >
                Đăng ký ngay
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailModal;
