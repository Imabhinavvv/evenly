import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Share2,
  QrCode,
  FileText,
  FileCode,
  Loader2,
} from 'lucide-react';
import { Button } from './ui/Button';
import { shareLogViaApp } from '../utils/shareHelper';
import { shareSingleLogFile } from '../utils/logShare';
import QRShareModal from './QRShareModal';

export default function ShareLogDropdown({
  expenses = [],
  roommates = [],
  transactions = [],
  totalSpent = [],
  sessionName = null,
  isSettled = false,
  onNotify,
  buttonText = 'Share',
  size = 'sm',
  className = '',
  iconOnly = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSharingText, setIsSharingText] = useState(false);
  const [isSharingFile, setIsSharingFile] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, openUp: false });

  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  // Calculate viewport-safe menu position to prevent X/Y-axis clipping or overflow
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const menuWidth = 176; // w-44 in pixels
    const menuHeight = 125; // compact unslopped menu height

    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < menuHeight + 12 && rect.top > menuHeight + 12;

    const top = openUp ? Math.max(10, rect.top - menuHeight - 6) : rect.bottom + 6;

    // Align right side with button's right edge, but clamp within viewport [10px, innerWidth - menuWidth - 10px]
    let left = rect.right - menuWidth;
    if (left < 10) {
      left = 10;
    }
    if (left + menuWidth > window.innerWidth - 10) {
      left = Math.max(10, window.innerWidth - menuWidth - 10);
    }

    setMenuPosition({ top, left, openUp });
  }, []);

  // Update position on open and listen for scroll / resize / outside click
  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handleOutsideClick = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, updatePosition]);

  const handleShareText = async () => {
    setIsOpen(false);
    if (isSharingText || expenses.length === 0) return;
    setIsSharingText(true);
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
        console.error('Sharing text error:', err);
        if (onNotify) {
          onNotify({
            message: `Share failed: ${err.message || 'Unknown error'}`,
            type: 'error',
          });
        }
      }
    } finally {
      setIsSharingText(false);
    }
  };

  const handleShareFile = async () => {
    setIsOpen(false);
    if (isSharingFile || expenses.length === 0) return;
    setIsSharingFile(true);
    try {
      await shareSingleLogFile({
        name: sessionName || 'Expense Log',
        roommates,
        expenses,
        isSettled: Boolean(isSettled),
      });

      if (onNotify) {
        onNotify({
          message: 'Log file ready to share.',
          type: 'success',
        });
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Sharing file error:', err);
        if (onNotify) {
          onNotify({
            message: `File share failed: ${err.message || 'Unknown error'}`,
            type: 'error',
          });
        }
      }
    } finally {
      setIsSharingFile(false);
    }
  };

  const handleOpenQR = () => {
    setIsOpen(false);
    setIsQRModalOpen(true);
  };

  const isBusy = isSharingText || isSharingFile;

  return (
    <div className="relative inline-block" ref={triggerRef}>
      {iconOnly ? (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          disabled={isBusy || expenses.length === 0}
          aria-label="Share options"
          title="Share log"
          className={`p-1.5 sm:p-2 rounded-lg border border-brand-border bg-brand-bg/50 hover:bg-brand-surface-subtle text-brand-text transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${className}`}
        >
          {isBusy ? (
            <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
          ) : (
            <Share2 className="w-4 h-4 text-evenly-coral-deep" />
          )}
        </button>
      ) : (
        <Button
          variant="outline"
          size={size}
          onClick={() => setIsOpen((prev) => !prev)}
          disabled={isBusy || expenses.length === 0}
          className={`flex items-center gap-1.5 font-semibold text-brand-text border-brand-border hover:border-brand-border-hover hover:bg-evenly-sage/40 transition-all shadow-2xs ${className}`}
          title="Share log"
        >
          {isBusy ? (
            <Loader2 className="h-4 w-4 animate-spin text-brand-primary" />
          ) : (
            <Share2 className="h-4 w-4 text-evenly-coral-deep" />
          )}
          {buttonText && <span>{buttonText}</span>}
        </Button>
      )}

      {/* Unslopped Dropdown Menu via Portal to prevent any parent container overflow-hidden or x/y-axis clipping */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
            width: '176px',
          }}
          className="rounded-xl bg-evenly-surface border border-brand-border shadow-2xl py-1 z-[9999] text-left animate-in fade-in-50 zoom-in-95 duration-150"
        >
          <button
            type="button"
            onClick={handleOpenQR}
            className="w-full px-3 py-2 text-xs font-semibold text-brand-text hover:bg-brand-bg/80 flex items-center gap-2.5 transition-colors cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-brand-primary shrink-0" />
            <span>Show QR Code</span>
          </button>

          <button
            type="button"
            onClick={handleShareFile}
            className="w-full px-3 py-2 text-xs font-semibold text-brand-text hover:bg-brand-bg/80 flex items-center gap-2.5 transition-colors cursor-pointer"
          >
            <FileCode className="w-4 h-4 text-evenly-coral-deep shrink-0" />
            <span>Share .evenly File</span>
          </button>

          <div className="my-1 border-t border-brand-border/60" />

          <button
            type="button"
            onClick={handleShareText}
            className="w-full px-3 py-2 text-xs font-semibold text-brand-text hover:bg-brand-bg/80 flex items-center gap-2.5 transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Share Summary</span>
          </button>
        </div>,
        document.body
      )}

      {/* QR Share Modal */}
      <QRShareModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        log={{
          name: sessionName || 'Expense Log',
          roommates,
          expenses,
          isSettled: Boolean(isSettled),
        }}
        onNotify={onNotify}
      />
    </div>
  );
}