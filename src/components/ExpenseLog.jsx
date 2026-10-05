import React from 'react';
import { Trash2, Edit2, BookmarkCheck, Clock } from 'lucide-react';
import { Button } from './ui/Button';
import { formatCurrency } from '../utils/currency';

export default function ExpenseLog({
  expenses,
  onDeleteExpense,
  onEditExpense,
  onClearLog,
  onSaveLog,
  onOpenHistory,
  historyCount = 0,
}) {
  return (
    <div className="uiverse-card p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-brand-text mb-0">4. Expense Log</h2>
          {expenses.length > 0 && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-evenly-sage text-brand-text border border-brand-border">
              {expenses.length} {expenses.length === 1 ? 'item' : 'items'}
            </span>
          )}
        </div>

        {expenses.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            {onSaveLog && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSaveLog}
                className="border-evenly-coral/60 hover:bg-evenly-coral/15 text-brand-text font-semibold shadow-xs"
                title="Save this session to History and clear screen"
              >
                <BookmarkCheck className="h-4 w-4 mr-1.5 text-evenly-coral-deep" />
                Save Log
              </Button>
            )}

            {onClearLog && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearLog}
                className="text-brand-danger hover:bg-red-50 hover:text-brand-danger border-red-200 font-semibold shadow-xs"
                title="Clear all current expenses"
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Clear Log
              </Button>
            )}
          </div>
        ) : (
          historyCount > 0 && onOpenHistory && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenHistory}
              className="text-xs text-brand-text-secondary hover:text-brand-text self-start sm:self-auto"
            >
              <Clock className="h-3.5 w-3.5 mr-1.5 text-evenly-coral-deep" />
              View {historyCount} Saved {historyCount === 1 ? 'Session' : 'Sessions'}
            </Button>
          )
        )}
      </div>

      {expenses.length === 0 ? (
        <div className="text-center py-12 text-brand-text-secondary border-2 border-dashed border-brand-border rounded-xl bg-transparent font-medium">
          <p>No expenses yet. Add one above!</p>
          {historyCount > 0 && onOpenHistory && (
            <button
              onClick={onOpenHistory}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-evenly-coral-deep hover:underline"
            >
              <Clock className="w-3.5 h-3.5" />
              Check your saved history logs
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {expenses.map((e) => (
            <div
              key={e.id}
              className="p-5 rounded-xl border border-brand-border bg-white relative group transition-all duration-200 hover:border-brand-border-hover hover:shadow-md hover:scale-[1.01]"
            >
              <div className="flex justify-between items-start mb-3 pr-20 sm:pr-24">
                <div className="overflow-hidden min-w-0 flex-1">
                  <h3 className="font-bold text-brand-text text-base sm:text-lg tracking-tight truncate">
                    {e.description}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-brand-text-secondary/70 font-medium mt-1">
                    {new Date(e.date).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="font-black text-brand-primary text-lg sm:text-xl whitespace-nowrap pl-2">
                  {formatCurrency(e.amount)}
                </div>
              </div>

              <div className="text-xs sm:text-sm text-brand-text-secondary/80 mt-4 space-y-1.5 border-t border-brand-border pt-4">
                <p className="break-words">
                  <span className="font-semibold text-brand-text-secondary">Paid:</span>{' '}
                  {Object.entries(e.paidBy)
                    .filter(([_, amt]) => amt > 0)
                    .map(([name, amt]) => `${name} ${formatCurrency(amt)}`)
                    .join(', ')}
                </p>
                <p className="break-words">
                  <span className="font-semibold text-brand-text-secondary">Split:</span>{' '}
                  {e.splitBetween.join(', ')}
                </p>
              </div>

              <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 flex items-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition-all duration-200">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEditExpense(e.id)}
                  className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-brand-text-secondary hover:text-brand-primary hover:bg-brand-primary/10 mr-0.5 sm:mr-1"
                  title="Edit expense"
                >
                  <Edit2 className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDeleteExpense(e.id)}
                  className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-brand-text-secondary hover:text-brand-danger hover:bg-brand-danger/10"
                  title="Delete expense"
                >
                  <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
