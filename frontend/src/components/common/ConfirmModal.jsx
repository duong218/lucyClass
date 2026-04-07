import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fadeInUp">
      {/* Modal Container */}
      <div 
        className="bg-white rounded-3xl shadow-heavy w-full max-w-sm p-6 transform transition-all relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Lottie/Icon Area */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center animate-float-medium">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>
        
        {/* Text Content */}
        <div className="text-center mb-6">
          <h3 className="font-display text-xl text-gray-800 mb-2">
            {title || "Cẩn thận nhé! ⚠️"}
          </h3>
          <p className="font-sans text-gray-500 text-sm">
            {message || "Bạn chắc chắn muốn tiến hành hành động này chứ? Dữ liệu không thể phục hồi đâu nhé! 🌪️"}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-2xl bg-gray-100 text-gray-800 font-semibold hover:bg-gray-200 transition-colors"
          >
            Thôi, quay lại
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 py-3 px-4 rounded-2xl bg-red-400 text-white font-semibold hover:bg-red-500 hover:shadow-button hover:-translate-y-0.5 transition-all"
          >
            Đúng, xoá luôn!
          </button>
        </div>
      </div>
    </div>
  );
}
