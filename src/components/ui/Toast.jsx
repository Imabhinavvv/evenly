import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[300] modal-animate-in">
      <div className="bg-white border border-brand-border shadow-lg rounded-xl p-4 pr-6 flex items-center gap-3 min-w-[250px]">
        {type === 'success' ? (
          <CheckCircle2 className="w-5 h-5 text-brand-success" />
        ) : (
          <AlertCircle className="w-5 h-5 text-brand-danger" />
        )}
        <p className="text-sm font-semibold text-brand-text">{message}</p>
      </div>
    </div>
  );
}
