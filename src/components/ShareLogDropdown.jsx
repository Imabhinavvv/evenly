import React, { useState } from 'react';
import { Share2, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';
import { shareLogViaApp } from '../utils/shareHelper';

export default function ShareLogDropdown({
  expenses = [],
  roommates = [],
  transactions = [],
  totalSpent = [],
  sessionName = null,
  onNotify,
  buttonText = 'Share',
  size = 'sm',
  className = '',
  iconOnly = false,
}) {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    if (isSharing || expenses.length === 0) return;
    setIsSharing(true);
    try {
      const res = await shareLogViaApp({
        app: 'system',
        expenses,
        roommates,
        transactions,
        totalSpent,
        sessionName,
      });

      if (res && res.message && onNotify) {
        onNotify({
          message: res.message,
          type: res.success ? 'success' : 'error',
        });
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Sharing error:', err);
        if (onNotify) {
          onNotify({
            message: `Share failed: ${err.message || 'Unknown error'}`,
            type: 'error',
          });
        }
      }
    } finally {
      setIsSharing(false);
    }
  };

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={handleShare}
        disabled={isSharing || expenses.length === 0}
        aria-label="Share report"
        title="Share report"
        className={`p-1.5 sm:p-2 rounded-lg border border-brand-border bg-brand-bg/50 hover:bg-brand-surface-subtle text-brand-text transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${className}`}
      >
        {isSharing ? (
          <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
        ) : (
          <Share2 className="w-4 h-4 text-evenly-coral-deep" />
        )}
      </button>
    );
  }

  return (
    <Button
      variant="outline"
      size={size}
      onClick={handleShare}
      disabled={isSharing || expenses.length === 0}
      className={`flex items-center gap-1.5 font-semibold text-brand-text border-brand-border hover:border-brand-border-hover hover:bg-evenly-sage/40 transition-all shadow-2xs ${className}`}
      title="Share report"
    >
      {isSharing ? (
        <Loader2 className="h-4 w-4 animate-spin text-brand-primary" />
      ) : (
        <Share2 className="h-4 w-4 text-evenly-coral-deep" />
      )}
      {buttonText && <span>{buttonText}</span>}
    </Button>
  );
}
