import React from 'react';
import { ArrowRight, CheckCircle, Scale, BookmarkCheck } from 'lucide-react';
import { BsFiletypeCsv, BsFiletypePdf } from 'react-icons/bs';
import { formatCurrency } from '../utils/currency';
import ShareLogDropdown from './ShareLogDropdown';

export default function BalanceDashboard({
  expenses = [],
  transactions = [],
  roommates = [],
  totalSpent = [],
  groupName = null,
  onSettleUp,
  onSaveSession,
  onExportPDF,
  onExportCSV,
  onNotify,
}) {
  const hasExpenses = expenses.length > 0;

  return (
    <div className="space-y-4">
      {/* 3. Section Title */}
      <div>
        <h2 className="text-xl font-bold text-brand-text mb-0">3. Who Owes What</h2>
        <p className="text-xs text-brand-text-secondary mt-1">
          Minimal transfers required to settle all debts
        </p>
      </div>

      {!hasExpenses ? (
        <div className="text-center py-8 px-4 border border-dashed border-brand-border rounded-2xl bg-brand-bg/40">
          <div className="w-12 h-12 rounded-2xl bg-evenly-coral/15 flex items-center justify-center mx-auto mb-3 text-evenly-coral-deep">
            <Scale className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-brand-text mb-1">
            No Outstanding Balances
          </h3>
          <p className="text-xs sm:text-sm text-brand-text-secondary max-w-sm mx-auto">
            {roommates.length === 0
              ? 'Create a group and log expenses above to calculate debt balances.'
              : 'Log expenses above to calculate debt balances.'}
          </p>
        </div>
      ) : (
        /* Single container with top bar and scrollable list with section breaks */
        <div className="rounded-2xl border border-brand-border bg-evenly-surface overflow-hidden shadow-2xs">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-3.5 py-2.5 sm:px-4 sm:py-3 border-b border-brand-border/70 bg-brand-surface-subtle">
            {/* Left side: Settle Up / Save Session */}
            <div className="flex items-center gap-2">
              {transactions.length > 0 ? (
                <button
                  type="button"
                  onClick={onSettleUp}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-brand-success text-white hover:bg-brand-success/90 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                  title="Settle debts and save session to History"
                >
                  Settle Up
                </button>
              ) : onSaveSession ? (
                <button
                  type="button"
                  onClick={onSaveSession}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-evenly-coral text-brand-text hover:bg-evenly-coral-hover transition-all shadow-xs border border-evenly-coral-deep/30 flex items-center gap-1 cursor-pointer active:scale-95"
                  title="Save balanced session to History"
                >
                  <BookmarkCheck className="w-3.5 h-3.5 text-evenly-coral-deep" />
                  Save Session
                </button>
              ) : (
                <span className="text-xs font-semibold text-brand-success flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  All Settled
                </span>
              )}
            </div>

            {/* Right side: Share, CSV, PDF icons (no text) */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              <ShareLogDropdown
                expenses={expenses}
                roommates={roommates}
                transactions={transactions}
                totalSpent={totalSpent}
                sessionName={groupName}
                onNotify={onNotify}
                iconOnly
              />
              <button
                type="button"
                onClick={onExportCSV}
                aria-label="Export CSV"
                title="Export CSV"
                className="p-1.5 sm:p-2 rounded-lg border border-brand-border bg-brand-bg/50 hover:bg-brand-surface-subtle text-emerald-600 dark:text-emerald-400 transition-all active:scale-95 cursor-pointer"
              >
                <BsFiletypeCsv className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onExportPDF}
                aria-label="Export PDF"
                title="Export PDF"
                className="p-1.5 sm:p-2 rounded-lg border border-brand-border bg-brand-bg/50 hover:bg-brand-surface-subtle text-rose-500 dark:text-rose-400 transition-all active:scale-95 cursor-pointer"
              >
                <BsFiletypePdf className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List items or Settled Message */}
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-brand-success">
              <CheckCircle className="h-10 w-10 mb-2 text-brand-success" />
              <p className="text-sm font-bold tracking-tight">All settled up!</p>
              <p className="text-xs text-brand-text-secondary mt-0.5 text-center">
                Everyone is even. Save this session or add more expenses.
              </p>
            </div>
          ) : (
            <div className="max-h-60 sm:max-h-72 overflow-y-auto custom-scrollbar divide-y divide-brand-border/60">
              {transactions.map((t, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between px-3.5 py-3 sm:px-4 sm:py-3.5 hover:bg-brand-bg/40 transition-colors text-xs sm:text-sm"
                >
                  <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 pr-3">
                    <span className="font-semibold text-brand-text truncate">{t.from}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-brand-text-secondary/50 shrink-0" />
                    <span className="font-semibold text-brand-text truncate">{t.to}</span>
                  </div>
                  <span className="font-black text-brand-primary text-sm sm:text-base tracking-tight shrink-0">
                    {formatCurrency(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
