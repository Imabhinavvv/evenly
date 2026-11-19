import React from 'react';
import { Trash2, Edit2, BookmarkCheck, Clock } from 'lucide-react';
import { formatCurrency } from '../utils/currency';

export default function ExpenseLog({
  expenses = [],
  roommates = [],
  onDeleteExpense,
  onEditExpense,
  onClearLog,
  onSaveLog,
  onOpenHistory,
  historyCount = 0,
}) {
  const hasExpenses = expenses.length > 0;

  return (
    <div className="space-y-4">
      {/* 4. Section Title */}
      <div>
        <h2 className="text-xl font-bold text-brand-text mb-0">4. Expense Log</h2>
        <p className="text-xs text-brand-text-secondary mt-1">
          Detailed breakdown of all logged group expenditures
        </p>
      </div>

      {!hasExpenses ? (
        <div className="text-center py-10 px-4 border border-dashed border-brand-border rounded-2xl bg-brand-bg/40 text-brand-text-secondary font-medium">
          <p className="text-xs sm:text-sm">
            {roommates.length === 0
              ? 'Create a group and add expenses to view the log.'
              : 'No expenses logged in this group yet. Add one above!'}
          </p>
          {historyCount > 0 && onOpenHistory && (
            <button
              onClick={onOpenHistory}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-evenly-coral-deep hover:underline cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5" />
              Check your saved history logs
            </button>
          )}
        </div>
      ) : (
        /* Single container with top bar and scrollable list with section breaks */
        <div className="rounded-2xl border border-brand-border bg-evenly-surface overflow-hidden shadow-2xs">
          {/* Top Bar: Save Log on left, Delete on right */}
          <div className="flex items-center justify-between px-3.5 py-2.5 sm:px-4 sm:py-3 border-b border-brand-border/70 bg-brand-surface-subtle">
            {/* Left side: Save Log */}
            <div className="flex items-center gap-2">
              {onSaveLog && (
                <button
                  type="button"
                  onClick={onSaveLog}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-evenly-coral text-brand-text hover:bg-evenly-coral-hover transition-all shadow-xs border border-evenly-coral-deep/30 flex items-center gap-1 cursor-pointer active:scale-95"
                  title="Save this session to History and clear screen"
                >
                  <BookmarkCheck className="w-3.5 h-3.5 text-evenly-coral-deep" />
                  Save Log
                </button>
              )}
              {historyCount > 0 && onOpenHistory && (
                <button
                  type="button"
                  onClick={onOpenHistory}
                  className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-brand-text-secondary hover:text-brand-text transition-colors cursor-pointer ml-1"
                  title="View Saved Sessions"
                >
                  <Clock className="w-3 h-3 text-evenly-coral-deep" />
                  {historyCount} saved
                </button>
              )}
            </div>

            {/* Right side: Delete */}
            {onClearLog && (
              <button
                type="button"
                onClick={onClearLog}
                className="p-1.5 sm:p-2 rounded-lg border border-brand-border bg-brand-bg/50 hover:bg-red-50 dark:hover:bg-red-950/30 text-brand-danger transition-all active:scale-95 cursor-pointer"
                title="Clear all current expenses"
                aria-label="Clear all current expenses"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Scrollable list items with section breaks */}
          <div className="max-h-80 sm:max-h-96 overflow-y-auto custom-scrollbar divide-y divide-brand-border/60">
            {expenses.map((e) => (
              <div
                key={e.id}
                className="p-3.5 sm:p-4 hover:bg-brand-bg/40 transition-colors relative group"
              >
                <div className="flex justify-between items-start pr-16 sm:pr-20">
                  <div className="overflow-hidden min-w-0 flex-1">
                    <h3 className="font-bold text-brand-text text-sm sm:text-base tracking-tight truncate">
                      {e.description}
                    </h3>
                    <p className="text-[11px] text-brand-text-secondary/70 font-medium mt-0.5">
                      {new Date(e.date).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="font-black text-brand-primary text-sm sm:text-base whitespace-nowrap pl-2">
                    {formatCurrency(e.amount)}
                  </div>
                </div>

                <div className="text-[11px] sm:text-xs text-brand-text-secondary/80 mt-2 space-y-0.5">
                  <p className="truncate">
                    <span className="font-semibold text-brand-text-secondary">Paid:</span>{' '}
                    {Object.entries(e.paidBy)
                      .filter(([_, amt]) => amt > 0)
                      .map(([name, amt]) => `${name} ${formatCurrency(amt)}`)
                      .join(', ')}
                  </p>
                  <p className="truncate">
                    <span className="font-semibold text-brand-text-secondary">Split:</span>{' '}
                    {e.splitBetween.join(', ')}
                  </p>
                </div>

                <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => onEditExpense(e.id)}
                    className="p-1.5 rounded-md text-brand-text-secondary hover:text-brand-primary hover:bg-brand-surface-subtle transition-colors cursor-pointer"
                    title="Edit expense"
                    aria-label="Edit expense"
                  >
                    <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteExpense(e.id)}
                    className="p-1.5 rounded-md text-brand-text-secondary hover:text-brand-danger hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                    title="Delete expense"
                    aria-label="Delete expense"
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
