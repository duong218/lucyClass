import React from 'react';
import { Loader2 } from 'lucide-react';

export default function PrimaryButton({ isLoading, onClick, children, className = '', type = "button", disabled = false, variant = "primary" }) {
  const baseClasses = "relative flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 text-sm";
  
  const variants = {
    primary: "text-white bg-primary-500 hover:bg-primary-600 hover:shadow-button hover:-translate-y-0.5",
    success: "text-white bg-green-500 hover:bg-green-600 hover:shadow-button hover:-translate-y-0.5"
  };

  const isBtnDisabled = isLoading || disabled;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isBtnDisabled}
      className={`
        ${baseClasses}
        ${variants[variant] || variants.primary}
        ${isBtnDisabled ? "!opacity-70 !cursor-not-allowed !transform-none !shadow-none" : ""}
        ${className}
      `}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      <span>{isLoading ? "Đang xử lý... ⏳" : children}</span>
    </button>
  );
}
