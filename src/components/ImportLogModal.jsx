import React from 'react';
import {
  FileDown,
  Users,
  Receipt,
  PlusCircle,
  FolderInput,
  History,
  X,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Button } from './ui/Button';
import { formatCurrency } from '../utils/currency';

export default function ImportLogModal({
  isOpen,
  log,
  onClose,
  onOpenAsNewGroup,
  onLoadToCurrentGroup,
  onSaveToHistory,
  activeGroupName = 'Current Group',
}) {
  if (!isOpen || !log) return null;

  const roommates = Array.isArray(log.roommates) ? log.roommates : [];
  const expenses = Array.isArray(log.expenses) ? log.expenses : [];
  const grandTotal = typeof log.grandTotal === 'number'
    ? log.grandTotal
    : expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-brand-text/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="bg-evenly-surface rounded-2xl sm:rounded-3xl shadow-2xl max-w-md w-full my-auto relative z-10 flex flex-col border border-brand-border modal-animate-in overflow-hidden">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-brand-border flex items-center justify-between bg-evenly-bg/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-evenly-coral/20 flex items-center justify-center text-evenly-coral-deep shadow-xs flex-shrink-0">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-brand-text">
                Import Expense Log
              </h2>
              <p className="text-xs text-brand-text-secondary">
                Review and choose where to load this log
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-brand-text-secondary hover:text-brand-text hover:bg-evenly-sage transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Summary Card */}
          <div className="bg-brand-bg/60 rounded-xl border border-brand-border p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold tracking-wider text-brand-text-secondary block">
                  Log Title
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <h3 className="text-sm sm:text-base font-bold text-brand-text truncate">
                    {log.name || 'Shared Expense Log'}
                  </h3>
                  {log.isSettled ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      Settled
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                      <Clock className="w-3 h-3" />
                      Pending
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-[10px] uppercase font-bold tracking-wider text-brand-text-secondary block">
                  Grand Total
                </span>
                <span className="text-sm sm:text-base font-extrabold text-brand-text">
                  {formatCurrency(grandTotal)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-brand-border/60">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-evenly-surface border border-brand-border/40">
                <Users className="w-4 h-4 text-evenly-coral-deep flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] text-brand-text-secondary uppercase font-semibold">Members</div>
                  <div className="text-xs font-bold text-brand-text truncate">{roommates.length} people</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-evenly-surface border border-brand-border/40">
                <Receipt className="w-4 h-4 text-brand-primary flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] text-brand-text-secondary uppercase font-semibold">Expenses</div>
                  <div className="text-xs font-bold text-brand-text truncate">{expenses.length} entries</div>
                </div>
              </div>
            </div>

            {roommates.length > 0 && (
              <div className="pt-2 flex flex-wrap gap-1.5 items-center">
                <span className="text-[11px] text-brand-text-secondary mr-1">Members:</span>
                {roommates.slice(0, 4).map((m) => (
                  <span
                    key={m}
                    className="px-2 py-0.5 rounded-md bg-evenly-surface border border-brand-border text-[11px] font-semibold text-brand-text truncate max-w-[100px]"
                  >
                    {m}
                  </span>
                ))}
                {roommates.length > 4 && (
                  <span className="text-[11px] font-semibold text-brand-text-secondary">
                    +{roommates.length - 4} more
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Action Choices */}
          <div className="space-y-2 pt-1">
            <Button
              onClick={() => onOpenAsNewGroup(log)}
              className="w-full bg-evenly-coral text-brand-text hover:bg-evenly-coral-hover font-bold text-xs py-2.5 rounded-xl border border-evenly-coral-deep/30 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <PlusCircle className="w-4 h-4 text-evenly-coral-deep" />
              Open as New Group
            </Button>

            <Button
              variant="outline"
              onClick={() => onLoadToCurrentGroup(log)}
              className="w-full text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <FolderInput className="w-4 h-4 text-brand-primary" />
              Load into {activeGroupName}
            </Button>

            {onSaveToHistory && (
              <Button
                variant="ghost"
                onClick={() => onSaveToHistory(log)}
                className="w-full text-xs font-semibold py-2 text-brand-text-secondary hover:text-brand-text flex items-center justify-center gap-2 cursor-pointer"
              >
                <History className="w-3.5 h-3.5" />
                Save to Group History
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
