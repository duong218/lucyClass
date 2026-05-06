import { useState, useEffect, Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import api from '../services/api';
import { getImageUrl } from '../utils/getImageUrl';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';

// Reuse modal chi tiết đã có sẵn
const AnnouncementModal = lazy(() => import('./AnnouncementModal'));

/**
 * AnnouncementListModal
 * Modal danh sách thông báo — dùng chung cho bell icon ở AdminLayout & StaffLayout.
 *
 * Props:
 *  @param {boolean}  isOpen    - hiển thị hay ẩn modal
 *  @param {function} onClose   - callback đóng modal
 */
const AnnouncementListModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  // Fetch khi mở
  useEffect(() => {
    if (!isOpen) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.get('/announcements');
        const sorted = (res.data.data || []).sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setAnnouncements(sorted);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [isOpen]);

  // Lock scroll (bao gồm Lenis) khi list hoặc detail đang mở
  // useLockBodyScroll giờ dùng lockScroll/unlockScroll từ modalScrollLock
  // nên Lenis cũng được stop/start đúng cách
  useLockBodyScroll(isOpen || !!selectedAnnouncement);

  // ESC để đóng
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const handleImageError = (e) => { e.target.src = '/placeholder.jpg'; };

  if (!isOpen && !selectedAnnouncement) return null;

  return createPortal((
    <>
      {/* ── List Modal ── */}
      {isOpen && !selectedAnnouncement && (
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-[40px] p-8 w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border-4 border-primary-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {t('announcements.all', 'Tất cả thông báo')}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
            >
              ✕
            </button>
          </div>

          {/* List — data-lenis-prevent để Lenis không nuốt scroll event */}
          <div className="overflow-y-auto pr-2 custom-scrollbar flex-1" data-lenis-prevent>
            {loading ? (
              <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
                Đang tải...
              </div>
            ) : announcements.length === 0 ? (
              <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
                Chưa có thông báo nào
              </div>
            ) : (
              <div className="space-y-4 pb-4">
                {announcements.map((item) => (
                  <div
                    key={item._id}
                    className="group/item flex gap-5 p-4 rounded-3xl hover:bg-primary-50 transition-all border border-transparent hover:border-primary-100 cursor-pointer"
                    onClick={() => setSelectedAnnouncement(item)}
                  >
                    <div className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-2xl shadow-sm">
                      <img
                        src={getImageUrl(item.image)}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500"
                        onError={handleImageError}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-display font-black text-gray-800 mb-1 group-hover/item:text-primary-500 transition-colors uppercase text-sm tracking-tight line-clamp-1">
                        {item.title}
                      </h4>
                      <p className="text-sm text-gray-500 font-medium line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                      <span className="text-[10px] text-primary-400 font-black tracking-widest uppercase mt-2 inline-block">
                        {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-10 py-3 bg-gray-100 text-gray-700 rounded-full font-black uppercase tracking-widest hover:bg-primary-50 transition-all text-sm"
            >
              {t('common.close', 'Đóng')}
            </button>
          </div>
        </div>
      </div>
      )}

      {/* ── Detail Modal ── */}
      <Suspense fallback={null}>
        {selectedAnnouncement && (
          <AnnouncementModal
            announcement={selectedAnnouncement}
            onClose={() => setSelectedAnnouncement(null)}
          />
        )}
      </Suspense>
    </>
  ), document.body);
};

export default AnnouncementListModal;