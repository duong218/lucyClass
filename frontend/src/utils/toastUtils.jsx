import React from 'react';
import { toast } from 'react-toastify';
import { CheckCircle2, XCircle, Info, AlertTriangle } from 'lucide-react';

const CustomToastContent = ({ type, message }) => {
  const Icon = type === 'success' ? CheckCircle2 : type === 'error' ? XCircle : Info;
  
  return (
    <div className="flex items-center gap-3 w-full">
      <Icon className="w-5 h-5 animate-pulse shrink-0" />
      <span className="font-bold text-sm tracking-wide">{message}</span>
    </div>
  );
};

const ConfirmToastContent = ({ message, onConfirm, onCancel }) => (
  <div className="flex flex-col gap-3 w-full py-1">
    <div className="flex items-center gap-3">
      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
      <span className="font-bold text-sm tracking-wide text-gray-800">{message}</span>
    </div>
    <div className="flex gap-2 justify-end">
      <button
        onClick={onCancel}
        className="px-4 py-1.5 text-xs font-bold rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
      >
        Hủy
      </button>
      <button
        onClick={onConfirm}
        className="px-4 py-1.5 text-xs font-bold rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
      >
        Xác nhận
      </button>
    </div>
  </div>
);

export const showToast = {
  success: (message) => {
    toast(<CustomToastContent type="success" message={message} />, {
      className: '!bg-pastel-green !text-green-800 !border !border-green-200 !rounded-full !shadow-card-hover !mb-4',
      progressClassName: '!bg-green-400',
      icon: false,
    });
  },
  error: (message) => {
    toast(<CustomToastContent type="error" message={message} />, {
      className: '!bg-red-50 !text-red-800 !border !border-red-200 !rounded-full !shadow-card-hover !mb-4',
      progressClassName: '!bg-red-400',
      icon: false,
    });
  },
  info: (message) => {
    toast(<CustomToastContent type="info" message={message} />, {
      className: '!bg-blue-50 !text-blue-800 !border !border-blue-200 !rounded-full !shadow-card-hover !mb-4',
      progressClassName: '!bg-primary-400',
      icon: false,
    });
  },
  confirm: (message) => {
    return new Promise((resolve) => {
      const toastId = toast(
        <ConfirmToastContent
          message={message}
          onConfirm={() => { toast.dismiss(toastId); resolve(true); }}
          onCancel={() => { toast.dismiss(toastId); resolve(false); }}
        />,
        {
          className: '!bg-amber-50 !text-amber-900 !border !border-amber-200 !rounded-2xl !shadow-card-hover !mb-4',
          icon: false,
          autoClose: false,
          closeOnClick: false,
          closeButton: false,
          draggable: false,
        }
      );
    });
  }
};
