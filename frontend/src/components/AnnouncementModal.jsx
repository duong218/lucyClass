import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getImageUrl } from '../utils/getImageUrl';
import { useTranslation } from 'react-i18next';
import { openModal, closeModal } from '../utils/modalScrollLock';

const AnnouncementModal = ({ announcement, onClose }) => {
  const { t } = useTranslation();
  const modalRef = useRef(null);

  // Centralized scroll lock for multiple modals
  useEffect(() => {
    if (announcement) {
      openModal();
    }
    return () => {
      if (announcement) {
        closeModal();
      }
    };
  }, [announcement]);

  // Accessibility: Handle ESC key and Focus trapping (100% robust)
  useEffect(() => {
    if (!announcement) return;

    const handleKeyDown = (e) => {
      // ESC key to close
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Focus Trap Logic: Keep focus inside the modal during Tab navigation
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) { // Tab + Shift (backward)
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else { // Tab (forward)
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    // Auto-focus the close button or first available element
    const focusable = modalRef.current?.querySelector('button');
    if (focusable) focusable.focus();

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [announcement, onClose]);

  if (!announcement) return null;

  const handleImageError = (e) => {
    e.target.src = '/placeholder.jpg';
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-hidden pointer-events-none"
      role="dialog"
      aria-modal="true"
    >
      <AnimatePresence mode="wait">
        {announcement && (
          <div className="contents">
            {/* BACKDROP */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-pointer z-[1] pointer-events-auto"
              aria-hidden="true"
            />
            
            {/* MODAL CONTENT */}
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col z-[2] pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button 
                onClick={onClose}
                aria-label={t('common.close') || 'Close'}
                className="absolute top-4 right-4 z-[10] w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center text-gray-800 font-black hover:bg-gray-50 transition-all hover:scale-110 active:scale-95 outline-none focus:ring-4 focus:ring-primary-300"
              >
                ✕
              </button>

              <div className="relative h-[220px] sm:h-[350px] shrink-0 bg-gray-100">
                <img 
                  src={getImageUrl(announcement.image)} 
                  alt={announcement.title}
                  onError={handleImageError}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* SCROLL ONLY INSIDE CONTENT
                  data-lenis-prevent: báo cho Lenis không intercept wheel/touch
                  events bên trong element này.
              */}
              <div
                className="overflow-y-auto p-6 sm:p-10 flex-1 overscroll-contain custom-scrollbar"
                data-lenis-prevent
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-primary-100 text-primary-500 text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest">
                    News
                  </span>
                  <span className="text-xs text-gray-400 font-bold tracking-wide">
                    {t('announcements.posted_at')}: {new Date(announcement.createdAt || Date.now()).toLocaleDateString()}
                  </span>
                </div>

                <h2 id="modal-title" className="text-xl sm:text-3xl font-display font-black text-gray-800 leading-tight mb-4 uppercase tracking-tight">
                  {announcement.title}
                </h2>

                <div className="w-16 h-2 bg-yellow-400 rounded-full mb-8" aria-hidden="true"></div>

                <div className="prose prose-blue max-w-none">
                  <p className="text-gray-600 leading-relaxed text-base sm:text-lg font-medium whitespace-pre-wrap">
                    {announcement.description}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>,
    document.body
  );
};

export default AnnouncementModal;