import React from 'react';
import { X } from 'lucide-react';

export function PageModal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-brand-text/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full my-8 relative flex flex-col evenly-animate-in">
        <div className="sticky top-0 bg-white/90 backdrop-blur-md z-10 pb-4 pt-6 px-6 sm:px-8 border-b border-brand-border rounded-t-2xl flex justify-between items-center">
          <h2 className="text-2xl font-bold text-brand-text">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-evenly-sage rounded-full transition-colors text-brand-text-secondary hover:text-brand-text"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar max-h-[70vh]">
          {children}
        </div>
      </div>
    </div>
  );
}
