import React, { useMemo } from 'react';
import { calculateDirectDebts, calculateSimplifiedDebts, calculateTotalSpent } from '../utils/settlement';
import { generatePDF } from '../utils/pdfExport';
import { ArrowRight, Activity, Zap, Check, Download, PieChart } from 'lucide-react';
import { formatCurrency } from '../utils/currency';

export default function Dashboard({ expenses, roommates, onExportPDF }) {
  const directDebts = useMemo(() => calculateDirectDebts(expenses, roommates), [expenses, roommates]);
  const simplifiedDebts = useMemo(() => calculateSimplifiedDebts(expenses, roommates), [expenses, roommates]);
  const totalSpent = useMemo(() => calculateTotalSpent(expenses, roommates), [expenses, roommates]);

  const grandTotalSpent = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);

  return (
    <div className="space-y-6">
      {/* Section 2: Final Simplified Settlement */}
      <div className="bg-zinc-900 rounded-2xl p-6 md:p-8 shadow-md border border-zinc-800 text-white relative overflow-hidden">
        {/* Subtle background flair */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Zap size={20} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">Final Settlement</h2>
              <p className="text-sm text-zinc-400">Optimized cash flow instructions</p>
            </div>
          </div>
          
          <button 
            onClick={onExportPDF}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
            <Download size={16} />
            Download PDF
          </button>
        </div>

        {simplifiedDebts.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 relative z-10">
            {simplifiedDebts.map((debt, idx) => (
              <div key={idx} className="flex flex-col p-5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-3 text-sm font-medium text-zinc-400">
                  <span className="text-white">{debt.from}</span>
                  <ArrowRight size={14} className="text-zinc-500" />
                  <span className="text-white">{debt.to}</span>
                </div>
                <div className="text-3xl font-black tracking-tight text-white">
                  {formatCurrency(debt.amount)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 relative z-10">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={24} className="text-emerald-400" />
            </div>
            <p className="text-zinc-400 font-medium">Everyone is settled up!</p>
          </div>
        )}
      </div>

      {/* Section 1: Direct Back-and-Forth Totals */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center">
            <Activity size={20} className="text-zinc-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Direct Balances</h2>
            <p className="text-sm text-zinc-500">Raw totals across all bills</p>
          </div>
        </div>

        {directDebts.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {directDebts.map((debt, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-100 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-700 text-sm">{debt.from}</span>
                  <ArrowRight size={14} className="text-zinc-400" />
                  <span className="font-semibold text-zinc-700 text-sm">{debt.to}</span>
                </div>
                <span className="font-bold text-zinc-900">
                  {formatCurrency(debt.amount)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-zinc-500 text-sm border-2 border-dashed border-zinc-100 rounded-xl">
            No direct debts yet. Add an expense to see balances.
          </div>
        )}
      </div>

      {/* Section 3: Analytics Breakdown */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
            <PieChart size={20} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Total Spent by Person</h2>
            <p className="text-sm text-zinc-500">Cumulative share of all expenses</p>
          </div>
        </div>

        {totalSpent.length > 0 ? (
          <div className="space-y-3">
            {totalSpent.map((t, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-100 rounded-xl">
                <span className="font-semibold text-zinc-700 text-sm">{t.roommate}</span>
                <span className="font-bold text-zinc-900">
                  {formatCurrency(t.amount)}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between p-4 bg-zinc-900 text-white rounded-xl mt-4">
              <span className="font-bold text-sm">Grand Total</span>
              <span className="font-black text-lg">
                {formatCurrency(grandTotalSpent)}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-zinc-500 text-sm border-2 border-dashed border-zinc-100 rounded-xl">
            No spending recorded yet.
          </div>
        )}
      </div>
    </div>
  );
}
