import React from 'react';
import { Wallet, Calendar, ArrowLeftRight, List } from 'lucide-react';
import { formatCurrency } from '../utils/currency';
import { useAnimatedCounter } from '../hooks/useAnimatedCounter';

function SummaryCard({ accent, icon: Icon, label, value, sublabel, isCurrency = false }) {
  const numericValue = isCurrency ? Math.round(value / 100) : value;
  const animated = useAnimatedCounter(numericValue);

  return (
    <div className="evenly-note-card evenly-card-lift" data-accent={accent}>
      <div className="flex items-start justify-between gap-4">
        <div
          className="w-11 h-11 rounded-[20px] flex items-center justify-center shrink-0"
          style={{
            background: accent === 'sage' ? 'var(--evenly-sage)'
              : accent === 'lavender' ? 'var(--evenly-lavender)'
              : accent === 'success' ? 'rgba(76, 175, 80, 0.15)'
              : 'rgba(255, 183, 178, 0.35)'
          }}
        >
          <Icon size={20} strokeWidth={1.75} className="text-evenly-text" />
        </div>
        <div className="text-right min-w-0">
          <p className="evenly-label mb-1">{label}</p>
          <p className="text-2xl sm:text-3xl font-semibold tracking-tight text-evenly-text truncate">
            {isCurrency ? formatCurrency(animated * 100) : animated.toLocaleString()}
          </p>
          {sublabel && (
            <p className="text-sm text-evenly-text-secondary mt-1">{sublabel}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SummaryCards({ expenses, transactions, grandTotalSpent }) {
  const now = new Date();
  const thisMonthTotal = expenses
    .filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const pendingTotal = transactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <section aria-label="Summary" className="mb-4">
      <div className="mb-8">
        <p className="evenly-accent-script mb-2">Your calm finance workspace</p>
        <h1 className="evenly-display">Overview</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <SummaryCard
          accent="coral"
          icon={Wallet}
          label="Total expenses"
          value={grandTotalSpent}
          sublabel="All time"
          isCurrency
        />
        <SummaryCard
          accent="lavender"
          icon={Calendar}
          label="This month"
          value={thisMonthTotal}
          sublabel={now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          isCurrency
        />
        <SummaryCard
          accent="success"
          icon={ArrowLeftRight}
          label="Pending settlements"
          value={pendingTotal}
          sublabel={transactions.length === 0 ? 'All settled' : `${transactions.length} transfer${transactions.length !== 1 ? 's' : ''}`}
          isCurrency
        />
        <SummaryCard
          accent="sage"
          icon={List}
          label="Transactions"
          value={expenses.length}
          sublabel="Recent activity"
        />
      </div>
    </section>
  );
}
