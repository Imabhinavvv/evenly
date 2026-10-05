import React, { useState, useEffect, useRef } from 'react';
import { BookmarkCheck, CheckCircle2, X } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { formatCurrency } from '../utils/currency';
import { getDefaultSessionName } from '../utils/sessionHelper';

export default function SaveSessionModal({
  isOpen,
  onClose,
  onSave,
  isSettling = false,
  expenses = [],
  roommates = [],
}) {
  const [sessionName, setSessionName] = useState('');
  const inputRef = useRef(null);

  const defaultName = getDefaultSessionName(expenses, isSettling);
  const grandTotal = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  useEffect(() => {
    if (isOpen) {
      setSessionName('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const finalName = sessionName.trim() || defaultName;
    onSave(finalName, isSettling);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-brand-text/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 sm:p-8 relative z-10 modal-animate-in border border-brand-border">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-brand-text-secondary hover:text-brand-text hover:bg-evenly-sage transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${
              isSettling
                ? 'bg-brand-success/15 text-brand-success border border-brand-success/20'
                : 'bg-evenly-coral/30 text-evenly-coral-deep border border-evenly-coral/40'
            }`}
          >
            {isSettling ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <BookmarkCheck className="w-6 h-6" />
            )}
          </div>
          <div className="pr-6">
            <h3 className="text-xl font-bold text-brand-text">
              {isSettling ? 'Settle Up & Save Session' : 'Save Expense Session'}
            </h3>
            <p className="text-sm text-brand-text-secondary mt-1">
              {isSettling
                ? 'Archive this settled calculation into your History and clear the screen for next month.'
                : 'Save this expense log and balance calculation into your History and clear the current screen.'}
            </p>
          </div>
        </div>

        {/* Session Summary Card */}
        <div className="bg-evenly-bg border border-brand-border rounded-xl p-4 mb-6 space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-brand-text-secondary font-medium">Expenses Count:</span>
            <span className="font-bold text-brand-text">{expenses.length} items</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-brand-text-secondary font-medium">Grand Total:</span>
            <span className="font-extrabold text-brand-primary text-base">
              {formatCurrency(grandTotal)}
            </span>
          </div>
          {roommates.length > 0 && (
            <div className="flex justify-between items-start text-xs pt-1 border-t border-brand-border/60">
              <span className="text-brand-text-secondary font-medium mt-1">Participants:</span>
              <div className="flex flex-wrap gap-1 justify-end max-w-[240px]">
                {roommates.map((r) => (
                  <span
                    key={r}
                    className="px-2 py-0.5 rounded-md bg-white border border-brand-border text-brand-text font-medium text-[11px]"
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-text-secondary mb-1.5">
              Session Name (Optional)
            </label>
            <Input
              ref={inputRef}
              type="text"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder={`e.g. ${defaultName}`}
              className="w-full text-base py-3"
            />
            <p className="text-xs text-brand-text-secondary/80 mt-1.5">
              Leave blank to use default name:{' '}
              <span className="font-semibold text-brand-text">"{defaultName}"</span>
            </p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-brand-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className={`w-full sm:w-auto font-bold shadow-md ${
                isSettling
                  ? 'bg-brand-success hover:bg-brand-success/90 text-white border border-brand-success/50'
                  : 'bg-evenly-coral hover:bg-evenly-coral-hover text-brand-text'
              }`}
            >
              {isSettling ? 'Settle & Save to History' : 'Save & Clear Screen'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
