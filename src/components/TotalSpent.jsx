import React from 'react';
import { formatCurrency } from '../utils/currency';

export default function TotalSpent({ expenses, totalSpent }) {
  if (expenses.length === 0) return null;

  const grandTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="uiverse-card p-6 sm:p-8">
      <h2 className="text-xl font-bold text-brand-text mb-6">5. Total Spent by Person</h2>
      
      <div className="space-y-4">
        {totalSpent.map((t, idx) => (
          <div key={idx} className="flex justify-between items-center p-3 sm:p-4 rounded-xl bg-brand-bg/50 border border-brand-border/50 hover:border-brand-border transition-colors">
            <span className="font-semibold text-brand-text truncate pr-4">{t.name}</span>
            <span className="font-bold text-brand-primary whitespace-nowrap">
              {formatCurrency(t.amount)}
            </span>
          </div>
        ))}
        
        <div className="flex items-center justify-between p-6 bg-brand-primary/5 border border-brand-primary/20 text-brand-primary rounded-xl mt-6 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.01]">
          <span className="font-bold text-base uppercase tracking-wider">Grand Total</span>
          <span className="font-black text-2xl tracking-tight">
            {formatCurrency(grandTotal)}
          </span>
        </div>
      </div>
    </div>
  );
}
