import React, { useEffect } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Button } from './Button';

export function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText, isLoading }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen || isLoading) return;
      if (e.key === 'Escape') {
        onCancel();
      } else if (e.key === 'Enter') {
        onConfirm();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onCancel, onConfirm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-brand-text/40 backdrop-blur-sm"
        onClick={() => !isLoading && onCancel()}
      />
      
      {/* Modal */}
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 sm:p-8 relative z-10 modal-animate-in">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-brand-warning/10 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-brand-warning" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-brand-text mb-2">{title}</h3>
            <p className="text-sm text-brand-text-secondary leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 sm:flex-none"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 sm:flex-none sm:min-w-[140px] bg-brand-primary hover:bg-brand-primary-hover text-white"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            ) : (
              confirmText || 'Confirm'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
