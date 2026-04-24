import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getImageUrl } from '../utils/getImageUrl';
import { useTranslation } from 'react-i18next';
import { openModal, closeModal } from '../utils/modalScrollLock';
import { reviewAnnouncement } from '../services/announcementService';
import { showToast } from '../utils/toastUtils';

/**
 * AnnouncementReviewModal
 * Modal để admin duyệt / từ chối thông báo do MKT gửi.
 *
 * Props:
 *  @param {object|null} announcement — object thông báo (status: 'pending')
 *  @param {function}    onClose      — đóng modal
 *  @param {function}    onReviewed   — callback sau khi duyệt/từ chối xong
 *                                      nhận (id, action) để cha cập nhật list
 */
const AnnouncementReviewModal = ({ announcement, onClose, onReviewed }) => {
  const { t } = useTranslation();
  const modalRef = useRef(null);

  const [reviewNote, setReviewNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [contentExpanded, setContentExpanded] = useState(false);

  // ── Scroll lock ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (announcement) openModal();
    return () => { if (announcement) closeModal(); };
  }, [announcement]);

  // ── Keyboard: ESC + focus trap ─────────────────────────────────────────────
  useEffect(() => {
    if (!announcement) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (lightboxOpen) { setLightboxOpen(false); return; }
        onClose();
        return;
      }
      if (e.key === 'Tab' && modalRef.current && !lightboxOpen) {
        const focusable = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last  = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
        } else {
          if (document.activeElement === last)  { e.preventDefault(); first?.focus(); }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const btn = modalRef.current?.querySelector('button');
    if (btn) btn.focus();
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [announcement, onClose, lightboxOpen]);

  // Reset state khi mở thông báo khác
  useEffect(() => {
    setReviewNote('');
    setError('');
    setLoading(false);
    setContentExpanded(false);
    setLightboxOpen(false);
  }, [announcement?._id]);

  if (!announcement) return null;

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleAction = async (action) => {
    if (action === 'reject' && reviewNote.trim().length === 0) {
      setError('Vui lòng nhập lý do từ chối trước khi gửi.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await reviewAnnouncement(announcement._id, action, reviewNote.trim());
      if (action === 'approve') {
        showToast.success('Thông báo đã được duyệt và công khai!');
      } else {
        showToast.info('Thông báo đã bị từ chối.');
      }
      onReviewed(announcement._id, action);
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra, vui lòng thử lại.';
      setError(msg);
      showToast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleImageError = (e) => { e.target.src = '/placeholder.jpg'; };

  const submitter = announcement.submittedBy;
  const submitterName = submitter?.displayName || submitter?.username || 'MKT';

  const PREVIEW_LENGTH = 180;
  const isLong = announcement.description.length > PREVIEW_LENGTH;
  const displayedContent = isLong && !contentExpanded
    ? announcement.description.slice(0, PREVIEW_LENGTH) + '…'
    : announcement.description;

  // ── Render ─────────────────────────────────────────────────────────────────
  return createPortal(
    <>
      {/* ── Lightbox ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/85 cursor-zoom-out p-4"
            onClick={() => setLightboxOpen(false)}
          >
            <motion.img
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ duration: 0.2 }}
              src={getImageUrl(announcement.image)}
              alt={announcement.title}
              onError={handleImageError}
              className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-5 right-5 w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full text-white font-black text-lg flex items-center justify-center transition-all"
              aria-label="Đóng ảnh"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Modal ───────────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-hidden pointer-events-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-modal-title"
      >
        <AnimatePresence mode="wait">
          {announcement && (
            <div className="contents">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/55 backdrop-blur-sm cursor-pointer z-[1] pointer-events-auto"
                aria-hidden="true"
              />

              {/* Modal content */}
              <motion.div
                ref={modalRef}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.25 }}
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col z-[2] pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* ── Header (fixed) ──────────────────────────────────────── */}
                <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-100 text-amber-600 text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                      Chờ duyệt
                    </span>
                    <span className="text-xs text-gray-400 font-medium">
                      {new Date(announcement.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <button
                    onClick={onClose}
                    aria-label="Đóng"
                    className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-black hover:bg-gray-200 transition-all hover:scale-110 active:scale-95 outline-none focus:ring-2 focus:ring-primary-300"
                  >
                    ✕
                  </button>
                </div>

                {/* ── Scrollable body ─────────────────────────────────────── */}
                <div className="overflow-y-auto flex-1 overscroll-contain custom-scrollbar">

                  {/* Thumbnail + thông tin ảnh */}
                  <div className="px-6 pt-5 pb-2 flex gap-4 items-start">
                    <div className="relative group/img shrink-0">
                      <div className="w-[90px] h-[90px] rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
                        <img
                          src={getImageUrl(announcement.image)}
                          alt={announcement.title}
                          onError={handleImageError}
                          className="w-full h-full object-cover group-hover/img:opacity-80 transition-opacity"
                        />
                      </div>
                      {/* Zoom icon overlay */}
                      <button
                        onClick={() => setLightboxOpen(true)}
                        className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 rounded-xl transition-all opacity-0 group-hover/img:opacity-100"
                        aria-label="Xem ảnh đầy đủ"
                      >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                          <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
                        </svg>
                      </button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => setLightboxOpen(true)}
                        className="text-xs text-primary-500 font-bold hover:underline mb-1 inline-block"
                      >
                        Xem ảnh đầy đủ →
                      </button>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Ảnh sẽ hiển thị trên website sau khi được duyệt.
                      </p>
                      {submitter && (
                        <p className="text-xs text-gray-500 mt-2">
                          <span className="font-semibold">Người gửi:</span> {submitterName}
                          {submitter.role && (
                            <span className="ml-1 text-violet-500 font-bold uppercase text-[10px]">
                              ({submitter.role})
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Tiêu đề */}
                  <div className="px-6 pt-2 pb-1">
                    <h2
                      id="review-modal-title"
                      className="text-lg sm:text-2xl font-display font-black text-gray-800 leading-tight uppercase tracking-tight"
                    >
                      {announcement.title}
                    </h2>
                    <div className="w-12 h-1.5 bg-yellow-400 rounded-full mt-2 mb-4" aria-hidden="true" />
                  </div>

                  {/* Nội dung với expand/collapse */}
                  <div className="px-6 pb-4">
                    <p className="text-gray-600 text-sm sm:text-base leading-relaxed font-medium whitespace-pre-wrap">
                      {displayedContent}
                    </p>
                    {isLong && (
                      <button
                        onClick={() => setContentExpanded(v => !v)}
                        className="mt-2 text-xs font-bold text-primary-500 hover:underline"
                      >
                        {contentExpanded ? 'Thu gọn ↑' : 'Xem thêm ↓'}
                      </button>
                    )}
                  </div>

                  {/* Ghi chú / lý do từ chối */}
                  <div className="px-6 pb-5">
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      Ghi chú{' '}
                      <span className="text-red-400 font-normal">(bắt buộc khi từ chối)</span>
                    </label>
                    <textarea
                      value={reviewNote}
                      onChange={(e) => { setReviewNote(e.target.value); setError(''); }}
                      rows={3}
                      placeholder="Nhập lý do từ chối hoặc nhận xét cho MKT..."
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300 placeholder:text-gray-400 transition-all"
                    />
                    {error && (
                      <p className="mt-1 text-xs text-red-500 font-semibold">{error}</p>
                    )}
                  </div>
                </div>

                {/* ── Footer (fixed) ───────────────────────────────────────── */}
                <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-end gap-3 shrink-0 bg-gray-50/60">
                  {/* Bỏ qua — giữ pending, đóng modal */}
                  <button
                    onClick={onClose}
                    disabled={loading}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 text-sm font-black uppercase tracking-widest hover:bg-gray-100 transition-all active:scale-95 disabled:opacity-50"
                  >
                    Bỏ qua
                  </button>

                  {/* Từ chối */}
                  <button
                    onClick={() => handleAction('reject')}
                    disabled={loading}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200 text-sm font-black uppercase tracking-widest hover:bg-red-100 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {loading ? '...' : '✕ Từ chối'}
                  </button>

                  {/* Chấp nhận */}
                  <button
                    onClick={() => handleAction('approve')}
                    disabled={loading}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-black uppercase tracking-widest hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
                  >
                    {loading ? '...' : '✓ Chấp nhận'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </>,
    document.body
  );
};

export default AnnouncementReviewModal;