import React, { useMemo, useState, useEffect } from 'react';
import { Receipt } from 'lucide-react';
import { useLocalStorage } from './utils/useLocalStorage';
import { calculateSettlement, calculateTotalSpent } from './utils/settlement';
import { generatePDF } from './utils/pdfExport';
import { generateCSV } from './utils/csvExport';
import { formatCurrency } from './utils/currency';
import { ConfirmModal } from './components/ui/ConfirmModal';
import { Toast } from './components/ui/Toast';

import RoommateManager from './components/RoommateManager';
import ExpenseForm from './components/ExpenseForm';
import BalanceDashboard from './components/BalanceDashboard';
import ExpenseLog from './components/ExpenseLog';
import TotalSpent from './components/TotalSpent';
import Loader from './components/ui/Loader';

export default function App() {
  const [isSiteLoading, setIsSiteLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSiteLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);
  const [roommates, setRoommates] = useLocalStorage('es_roommates', []);
  const [expenses, setExpenses] = useLocalStorage('es_expenses', []);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const transactions = useMemo(() => calculateSettlement(expenses, roommates), [expenses, roommates]);
  const totalSpent = useMemo(() => calculateTotalSpent(expenses, roommates), [expenses, roommates]);
  const grandTotalSpent = totalSpent.reduce((sum, t) => sum + t.amount, 0);

  const handleAddExpense = (expense) => {
    setExpenses([expense, ...expenses]);
  };

  const handleUpdateExpense = (updatedExpense) => {
    setExpenses(expenses.map(e => e.id === updatedExpense.id ? updatedExpense : e));
    setEditingExpenseId(null);
    setToast({ message: 'Expense updated successfully!', type: 'success' });
  };

  const handleDeleteExpense = (id) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  const handleSettleUp = () => {
    setConfirmConfig({
      title: "Settle Expenses?",
      message: "This action will mark the selected expenses as settled. You can still view them later, but they will no longer appear as pending. Do you want to continue?",
      confirmText: "Yes, Settle",
      onConfirm: () => {
        setExpenses([]);
        setConfirmConfig(null);
        setToast({ message: 'Expenses settled successfully.', type: 'success' });
      }
    });
  };

  const handleExportPDF = () => {
    setConfirmConfig({
      title: "Download Expense Report?",
      message: "Are you sure you want to generate and download your expense report as a PDF?",
      confirmText: "Download PDF",
      onConfirm: async () => {
        setIsModalLoading(true);
        try {
          await new Promise(resolve => setTimeout(resolve, 150));
          generatePDF(expenses, roommates, transactions, totalSpent);
          setToast({ message: 'PDF downloaded successfully!', type: 'success' });
        } catch (error) {
          console.error('PDF Generation Error:', error);
          setToast({ message: `Failed to generate PDF: ${error.message}`, type: 'error' });
        } finally {
          setIsModalLoading(false);
          setConfirmConfig(null);
        }
      }
    });
  };

  const handleExportCSV = () => {
    setConfirmConfig({
      title: "Download CSV Report?",
      message: "Are you sure you want to generate and download your expense report as a CSV file?",
      confirmText: "Download CSV",
      onConfirm: async () => {
        setIsModalLoading(true);
        try {
          await new Promise(resolve => setTimeout(resolve, 150));
          generateCSV(expenses, transactions);
          setToast({ message: 'CSV downloaded successfully!', type: 'success' });
        } catch (error) {
          console.error(error);
          setToast({ message: 'Failed to generate CSV.', type: 'error' });
        } finally {
          setIsModalLoading(false);
          setConfirmConfig(null);
        }
      }
    });
  };

  if (isSiteLoading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text font-sans selection:bg-brand-primary/20 selection:text-brand-text pb-16 transition-colors duration-200">
      
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-brand-border shadow-sm">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-primary flex items-center justify-center shadow-sm">
              <Receipt size={20} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="font-extrabold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand-primary to-indigo-500" style={{ fontFamily: "'Outfit', sans-serif" }}>Evenly</span>
          </div>
          
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider">Total Spent</span>
            <span className="font-bold text-brand-text text-lg leading-none mt-0.5">
              {formatCurrency(grandTotalSpent)}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        
        <RoommateManager 
          roommates={roommates} 
          setRoommates={setRoommates} 
        />
        
        <ExpenseForm 
          roommates={roommates} 
          onAddExpense={handleAddExpense} 
        />
        
        <BalanceDashboard 
          expenses={expenses} 
          transactions={transactions} 
          onSettleUp={handleSettleUp}
          onExportPDF={handleExportPDF}
          onExportCSV={handleExportCSV}
        />
        
        <ExpenseLog 
          expenses={expenses} 
          onDeleteExpense={handleDeleteExpense} 
          onEditExpense={setEditingExpenseId}
        />
        
        <TotalSpent 
          expenses={expenses} 
          totalSpent={totalSpent} 
        />

      </main>

      {/* Edit Expense Modal */}
      {editingExpenseId && (
        <div className="fixed inset-0 z-[100] bg-brand-text/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full my-8 relative max-h-[90vh] flex flex-col">
            <div className="sticky top-0 bg-white z-10 pb-4 pt-6 px-6 sm:px-8 border-b border-brand-border rounded-t-2xl">
              <h2 className="text-xl font-bold text-brand-text">Edit Expense</h2>
            </div>
            <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar">
              <ExpenseForm
                roommates={roommates}
                onAddExpense={handleUpdateExpense}
                initialData={expenses.find(e => e.id === editingExpenseId)}
                onCancel={() => setEditingExpenseId(null)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={!!confirmConfig}
        title={confirmConfig?.title}
        message={confirmConfig?.message}
        confirmText={confirmConfig?.confirmText}
        onConfirm={confirmConfig?.onConfirm}
        onCancel={() => setConfirmConfig(null)}
        isLoading={isModalLoading}
      />

      {/* Toast Notification */}
      <Toast 
        message={toast?.message} 
        type={toast?.type} 
        onClose={() => setToast(null)} 
      />
    </div>
  );
}
