import React from 'react';
import { FaTimes } from 'react-icons/fa';

export const AdminModal = ({
  isOpen = false,
  onClose = () => {},
  title = 'Modal',
  children = null,
  size = 'md',
}) => {
  if (!isOpen) {
    return null;
  }

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
  };

  return (
    <div className="fixed inset-0 z-[90] overflow-y-auto px-4 py-8">
      <div className="absolute inset-0 bg-slate-950/68 backdrop-blur-sm" onClick={onClose} />

      <div className={`relative mx-auto flex min-h-full w-full items-center justify-center ${sizeClasses[size]}`}>
        <div className="ff-panel ff-panel--strong overflow-hidden rounded-[32px]">
          <div className="flex items-center justify-between border-b border-slate-200/70 px-6 py-5 dark:border-white/10">
            <div>
              <p className="ff-eyebrow">Fit Feast admin</p>
              <h2 className="mt-3 text-2xl font-bold text-slate-950 dark:text-white">{title}</h2>
            </div>
            <button type="button" onClick={onClose} className="ff-icon-button h-11 w-11">
              <FaTimes size={18} className="text-slate-500 dark:text-slate-300" />
            </button>
          </div>

          <div className="max-h-[calc(100vh-180px)] overflow-y-auto px-6 py-6 sm:px-7">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
