import React from 'react';
import {
  Archive,
  Calendar,
  Users,
  Receipt,
  Clock,
  AlertTriangle,
  X,
  RotateCcw,
  GitMerge,
} from 'lucide-react';
import { Button } from './ui/Button';

export default function RestoreModal({
  isOpen,
  backupPayload,
  onClose,
  onConfirmRestore,
  isLoading = false,
}) {
  if (!isOpen || !backupPayload) return null;

  const { manifest, data } = backupPayload;
  const backupDate = manifest?.timestamp ? new Date(manifest.timestamp) : null;
  const formattedDate = backupDate && !isNaN(backupDate.getTime())
    ? backupDate.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'Unknown date';

  const roommates = Array.isArray(data?.roommates) ? data.roommates : [];
  const expenses = Array.isArray(data?.expenses) ? data.expenses : [];
  const history = Array.isArray(data?.history) ? data.history : [];

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-brand-text/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="bg-evenly-surface rounded-2xl sm:rounded-3xl shadow-2xl max-w-lg w-full my-auto relative z-10 flex flex-col border border-brand-border modal-animate-in overflow-hidden">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-brand-border flex items-center justify-between bg-evenly-bg/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-evenly-coral/20 flex items-center justify-center text-evenly-coral-deep shadow-xs flex-shrink-0">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-brand-text">
                Restore Evenly Backup
              </h2>
              <p className="text-xs text-brand-text-secondary">
                Verified .evenly backup archive
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-brand-text-secondary hover:text-brand-text hover:bg-evenly-sage transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Metadata Card */}
          <div className="bg-evenly-surface rounded-xl border border-brand-border p-4 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-brand-text-secondary">
              <Calendar className="w-4 h-4 text-evenly-coral-deep" />
              <span>Created: {formattedDate}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-brand-border/60 text-center">
              <div className="p-2 rounded-lg bg-evenly-sage/40 border border-brand-border/40">
                <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-brand-text-secondary">
                  <Users className="w-3.5 h-3.5" />
                  Roommates
                </div>
                <div className="text-lg font-black text-brand-text mt-0.5">
                  {roommates.length}
                </div>
              </div>

              <div className="p-2 rounded-lg bg-evenly-lavender/50 border border-brand-border/40">
                <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-brand-text-secondary">
                  <Receipt className="w-3.5 h-3.5" />
                  Expenses
                </div>
                <div className="text-lg font-black text-brand-text mt-0.5">
                  {expenses.length}
                </div>
              </div>

              <div className="p-2 rounded-lg bg-evenly-coral/20 border border-brand-border/40">
                <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-brand-text-secondary">
                  <Clock className="w-3.5 h-3.5" />
                  History
                </div>
                <div className="text-lg font-black text-brand-text mt-0.5">
                  {history.length}
                </div>
              </div>
            </div>

            {/* Roommate preview chips */}
            {roommates.length > 0 && (
              <div className="pt-2">
                <p className="text-[11px] font-semibold text-brand-text-secondary mb-1.5">
                  Included members:
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                  {roommates.map((name) => (
                    <span
                      key={name}
                      className="px-2 py-0.5 rounded-full text-xs bg-brand-bg text-brand-text border border-brand-border"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Warning Note */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              Choose <strong>Replace</strong> to set this backup as your active state, or <strong>Merge</strong> to combine it with your existing data.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 sm:px-6 py-4 bg-evenly-bg border-t border-brand-border flex flex-col sm:flex-row gap-2.5 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
            className="order-3 sm:order-1"
          >
            Cancel
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onConfirmRestore('merge')}
            disabled={isLoading}
            className="order-2 border-brand-border text-brand-text hover:bg-evenly-surface flex items-center justify-center gap-1.5"
            title="Combine backup with your current roommates and history"
          >
            <GitMerge className="w-4 h-4 text-evenly-coral-deep" />
            Merge with Current
          </Button>

          <Button
            size="sm"
            onClick={() => onConfirmRestore('replace')}
            disabled={isLoading}
            className="order-1 sm:order-3 bg-brand-primary text-white hover:bg-brand-primary/90 flex items-center justify-center gap-1.5 font-bold shadow-xs"
            title="Overwrite current state with backup contents"
          >
            <RotateCcw className="w-4 h-4" />
            Replace Everything
          </Button>
        </div>
      </div>
    </div>
  );
}
