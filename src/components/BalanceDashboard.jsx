import React from 'react';
import { ArrowRight, CheckCircle, Download, FileText, BookmarkCheck } from 'lucide-react';
import { Button } from './ui/Button';
import { formatCurrency } from '../utils/currency';

export default function BalanceDashboard({
  expenses,
  transactions,
  onSettleUp,
  onSaveSession,
  onExportPDF,
  onExportCSV,
}) {
  if (expenses.length === 0) return null;

  return (
    <div className="uiverse-card p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <h2 className="text-xl font-bold text-brand-text mb-0">3. Who Owes What</h2>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={onExportCSV}>
            <FileText className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={onExportPDF}>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          {transactions.length > 0 ? (
            <Button
              size="sm"
              onClick={onSettleUp}
              className="bg-brand-success text-white hover:bg-brand-success/90 hover:-translate-y-0.5 transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] border border-brand-success/50 font-bold"
              title="Settle debts and save session to History"
            >
              Settle Up
            </Button>
          ) : (
            onSaveSession && (
              <Button
                size="sm"
                onClick={onSaveSession}
                className="bg-evenly-coral text-brand-text hover:bg-evenly-coral-hover font-bold shadow-xs border border-evenly-coral-deep/30"
                title="Save this balanced session to History"
              >
                <BookmarkCheck className="h-4 w-4 mr-1.5 text-evenly-coral-deep" />
                Save Session
              </Button>
            )
          )}
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-brand-success">
          <CheckCircle className="h-16 w-16 mb-4 opacity-80 drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
          <p className="text-xl font-semibold tracking-tight">All settled up!</p>
          <p className="text-xs text-brand-text-secondary mt-1">
            Everyone is even. You can save this session to History or start entering next month's expenses.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {transactions.map((t, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-5 rounded-xl border border-brand-border bg-white hover:border-brand-border-hover transition-all duration-200 shadow-sm hover:shadow-md hover:scale-[1.01]"
            >
              <div className="flex items-center gap-3">
                <span className="font-semibold text-brand-text-secondary">{t.from}</span>
                <ArrowRight className="h-5 w-5 text-brand-text-secondary/50" />
                <span className="font-semibold text-brand-text-secondary">{t.to}</span>
              </div>
              <span className="font-black text-brand-primary text-xl tracking-tight">
                {formatCurrency(t.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
