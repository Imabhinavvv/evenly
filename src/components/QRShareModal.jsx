import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Share2,
  Users,
  Receipt,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from './ui/Button';
import { generateLogQRDataUrl, shareSingleLogFile } from '../utils/logShare';
import { formatCurrency } from '../utils/currency';

export default function QRShareModal({
  isOpen,
  onClose,
  log,
  onNotify,
}) {
  const [qrState, setQrState] = useState({ loading: true, dataUrl: null, isTooLarge: false, length: 0 });
  const [isSharingFile, setIsSharingFile] = useState(false);
  const [hasSharedFile, setHasSharedFile] = useState(false);

  useEffect(() => {
    if (!isOpen || !log) return;

    let isMounted = true;
    setQrState({ loading: true, dataUrl: null, isTooLarge: false, length: 0 });
    setHasSharedFile(false);

    generateLogQRDataUrl(log)
      .then((res) => {
        if (!isMounted) return;
        setQrState({
          loading: false,
          dataUrl: res.dataUrl,
          isTooLarge: res.isTooLarge,
          length: res.length,
        });
      })
      .catch((err) => {
        console.error('QR generation error:', err);
        if (!isMounted) return;
        setQrState({
          loading: false,
          dataUrl: null,
          isTooLarge: false,
          length: 0,
        });
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, log]);

  if (!isOpen || !log) return null;

  const roommates = Array.isArray(log.roommates) ? log.roommates : [];
  const expenses = Array.isArray(log.expenses) ? log.expenses : [];
  const grandTotal = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const handleShareFile = async () => {
    if (isSharingFile) return;
    setIsSharingFile(true);
    try {
      await shareSingleLogFile(log);
      setHasSharedFile(true);
      if (onNotify) {
        onNotify({
          message: 'Log file ready to share.',
          type: 'success',
        });
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('File sharing error:', err);
        if (onNotify) {
          onNotify({
            message: `Could not share file: ${err.message || 'Unknown error'}`,
            type: 'error',
          });
        }
      }
    } finally {
      setIsSharingFile(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-brand-text/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="bg-evenly-surface rounded-2xl sm:rounded-3xl shadow-2xl max-w-sm w-full my-auto relative z-10 flex flex-col border border-brand-border modal-animate-in overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-brand-border flex items-center justify-between bg-evenly-bg/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-evenly-coral/20 flex items-center justify-center text-evenly-coral-deep shadow-xs flex-shrink-0">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-brand-text">
                Scan to Import Log
              </h2>
              <p className="text-[11px] text-brand-text-secondary">
                Direct offline peer transfer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-brand-text-secondary hover:text-brand-text hover:bg-evenly-sage transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col items-center text-center space-y-4">
          {/* QR Display Container */}
          <div className="w-full flex items-center justify-center">
            {qrState.loading ? (
              <div className="w-64 h-64 rounded-2xl bg-brand-bg/50 border border-brand-border flex flex-col items-center justify-center gap-2 text-brand-text-secondary">
                <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
                <span className="text-xs font-semibold">Generating QR code...</span>
              </div>
            ) : qrState.isTooLarge ? (
              <div className="w-full p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-left space-y-2.5">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Log Exceeds QR Capacity</span>
                </div>
                <p className="text-[11px] text-brand-text-secondary leading-relaxed">
                  This log contains {expenses.length} expenses. Transfer it directly as a lightweight <code className="font-mono text-brand-text">.evenly</code> file via Quick Share, Bluetooth, or messaging instead.
                </p>
                <Button
                  onClick={handleShareFile}
                  disabled={isSharingFile}
                  className="w-full bg-evenly-coral text-brand-text hover:bg-evenly-coral-hover font-bold text-xs py-2 rounded-xl border border-evenly-coral-deep/30 flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                >
                  {isSharingFile ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Share2 className="w-3.5 h-3.5 text-evenly-coral-deep" />
                  )}
                  <span>Share .evenly File</span>
                </Button>
              </div>
            ) : qrState.dataUrl ? (
              <div className="p-3 bg-white rounded-2xl border border-brand-border shadow-xs">
                <img
                  src={qrState.dataUrl}
                  alt="Evenly Log QR Code"
                  className="w-56 h-56 object-contain block mx-auto"
                />
              </div>
            ) : (
              <div className="w-64 h-64 rounded-2xl bg-brand-bg/50 border border-brand-border flex flex-col items-center justify-center gap-2 text-rose-500 p-4">
                <AlertCircle className="w-6 h-6" />
                <span className="text-xs font-semibold">Failed to generate QR code.</span>
              </div>
            )}
          </div>

          {/* Log Quick Meta */}
          <div className="w-full p-3 rounded-xl bg-brand-bg/50 border border-brand-border space-y-1 text-left">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs font-bold text-brand-text truncate">
                  {log.name || 'Expense Log'}
                </span>
                {log.isSettled ? (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    Settled
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                    Pending
                  </span>
                )}
              </div>
              <span className="text-xs font-extrabold text-brand-text flex-shrink-0">
                {formatCurrency(grandTotal)}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-brand-text-secondary">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3 text-evenly-coral-deep" />
                {roommates.length} members
              </span>
              <span className="flex items-center gap-1">
                <Receipt className="w-3 h-3 text-brand-primary" />
                {expenses.length} expenses
              </span>
            </div>
          </div>

          {/* Secondary Action: Share as File */}
          {!qrState.isTooLarge && (
            <div className="w-full space-y-2">
              <Button
                variant="outline"
                onClick={handleShareFile}
                disabled={isSharingFile}
                className="w-full text-xs font-semibold py-2 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isSharingFile ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-primary" />
                ) : hasSharedFile ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-success" />
                ) : (
                  <Share2 className="w-3.5 h-3.5 text-evenly-coral-deep" />
                )}
                <span>Share .evenly File</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
