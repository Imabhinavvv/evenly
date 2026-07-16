import React from 'react';
import { Trash2, Edit2 } from 'lucide-react';
import { Button } from './ui/Button';
import { formatCurrency } from '../utils/currency';

export default function ExpenseLog({ expenses, onDeleteExpense, onEditExpense }) {
  return (
    <div className="uiverse-card p-6 sm:p-8">
      <h2 className="text-xl font-bold text-brand-text mb-6">4. Expense Log</h2>
      
      {expenses.length === 0 ? (
        <div className="text-center py-12 text-brand-text-secondary border-2 border-dashed border-brand-border rounded-xl bg-transparent font-medium">
          No expenses yet. Add one above!
        </div>
      ) : (
        <div className="space-y-4">
          {expenses.map((e) => (
            <div key={e.id} className="p-5 rounded-xl border border-brand-border bg-white relative group transition-all duration-200 hover:border-brand-border-hover hover:shadow-md hover:scale-[1.02]">
              <div className="flex justify-between items-start mb-3 pr-24">
                <div className="overflow-hidden">
                  <h3 className="font-bold text-brand-text text-lg tracking-tight truncate">{e.description}</h3>
                  <p className="text-xs text-brand-text-secondary/70 font-medium mt-1">
                    {new Date(e.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div className="font-black text-brand-primary text-xl whitespace-nowrap">
                  {formatCurrency(e.amount)}
                </div>
              </div>
              
              <div className="text-sm text-brand-text-secondary/80 mt-4 space-y-1.5 border-t border-brand-border pt-4">
                <p>
                  <span className="font-semibold text-brand-text-secondary">Paid:</span>{' '}
                  {Object.entries(e.paidBy)
                    .filter(([_, amt]) => amt > 0)
                    .map(([name, amt]) => `${name} ${formatCurrency(amt)}`)
                    .join(', ')}
                </p>
                <p>
                  <span className="font-semibold text-brand-text-secondary">Split:</span>{' '}
                  {e.splitBetween.join(', ')}
                </p>
              </div>

              <div className="absolute top-3 right-3 flex items-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all duration-200">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEditExpense(e.id)}
                  className="text-brand-text-secondary hover:text-brand-primary hover:bg-brand-primary/10 mr-1"
                >
                  <Edit2 className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDeleteExpense(e.id)}
                  className="text-brand-text-secondary hover:text-brand-danger hover:bg-brand-danger/10"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
