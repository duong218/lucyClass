import React from 'react';
import { toast } from 'react-toastify';
import { CheckCircle2, XCircle, Info } from 'lucide-react';

const CustomToastContent = ({ type, message }) => {
  const Icon = type === 'success' ? CheckCircle2 : type === 'error' ? XCircle : Info;
  
  return (
    <div className="flex items-center gap-3 w-full">
      <Icon className="w-5 h-5 animate-pulse shrink-0" />
      <span className="font-bold text-sm tracking-wide">{message}</span>
    </div>
  );
};

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
  }
};
