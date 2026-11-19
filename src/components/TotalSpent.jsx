import React from 'react';
import { PieChart } from 'lucide-react';
import { formatCurrency } from '../utils/currency';

export default function TotalSpent({
  expenses = [],
  totalSpent = [],
}) {
  const hasExpenses = expenses.length > 0;
  const grandTotal = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <div className="space-y-4">
      {/* 5. Section Title */}
      <div>
        <h2 className="text-xl font-bold text-brand-text mb-0">5. Total Spent by Person</h2>
        <p className="text-xs text-brand-text-secondary mt-1">
          Cumulative outlay contributed by each member
        </p>
      </div>

      {!hasExpenses ? (
        <div className="text-center py-10 px-4 border border-dashed border-brand-border rounded-2xl bg-brand-bg/40">
          <div className="w-12 h-12 rounded-2xl bg-evenly-sage/40 flex items-center justify-center mx-auto mb-3 text-emerald-700 dark:text-emerald-400">
            <PieChart className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-brand-text mb-1">
            No Spending Recorded Yet
          </h3>
          <p className="text-xs sm:text-sm text-brand-text-secondary max-w-sm mx-auto">
            Log expenses to track individual spending shares.
          </p>
        </div>
      ) : (
        /* Single container with top bar and scrollable list with section breaks */
        <div className="rounded-2xl border border-brand-border bg-evenly-surface overflow-hidden shadow-2xs">
          {/* Top Bar with "Grand Total:" on the left and total value on the right */}
          <div className="flex items-center justify-between px-3.5 py-2.5 sm:px-4 sm:py-3 border-b border-brand-border/70 bg-brand-surface-subtle">
            {/* Left side: "Grand Total:" */}
            <span className="text-xs font-bold uppercase tracking-wider text-brand-text-secondary">
              Grand Total:
            </span>

            {/* Right side: Total Value */}
            <span className="text-base sm:text-lg font-black text-brand-primary tracking-tight">
              {formatCurrency(grandTotal)}
            </span>
          </div>

          {/* Scrollable list items with section breaks */}
          <div className="max-h-60 sm:max-h-72 overflow-y-auto custom-scrollbar divide-y divide-brand-border/60">
            {totalSpent.map((t, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center px-3.5 py-3 sm:px-4 sm:py-3.5 hover:bg-brand-bg/40 transition-colors text-xs sm:text-sm"
              >
                <span className="font-semibold text-brand-text truncate pr-4">{t.name}</span>
                <span className="font-bold text-brand-primary whitespace-nowrap">
                  {formatCurrency(t.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
