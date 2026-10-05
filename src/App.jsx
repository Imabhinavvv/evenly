import React, { useMemo, useState } from 'react';
import { Receipt, Clock } from 'lucide-react';
import { useLocalStorage } from './utils/useLocalStorage';
import { calculateSettlement, calculateTotalSpent } from './utils/settlement';
import { generatePDF } from './utils/pdfExport';
import { generateCSV } from './utils/csvExport';
import { formatCurrency } from './utils/currency';
import { createSessionSnapshot } from './utils/sessionHelper';
import { ConfirmModal } from './components/ui/ConfirmModal';
import { Toast } from './components/ui/Toast';

import RoommateManager from './components/RoommateManager';
import ExpenseForm from './components/ExpenseForm';
import BalanceDashboard from './components/BalanceDashboard';
import ExpenseLog from './components/ExpenseLog';
import TotalSpent from './components/TotalSpent';
import Footer from './components/Footer';
import SaveSessionModal from './components/SaveSessionModal';
import HistoryModal from './components/HistoryModal';

export default function App() {
  const [roommates, setRoommates] = useLocalStorage('es_roommates', []);
  const [expenses, setExpenses] = useLocalStorage('es_expenses', []);
  const [history, setHistory] = useLocalStorage('es_history', []);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Modals
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveModalSettling, setSaveModalSettling] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const transactions = useMemo(() => calculateSettlement(expenses, roommates), [expenses, roommates]);
  const totalSpent = useMemo(() => calculateTotalSpent(expenses, roommates), [expenses, roommates]);
  const grandTotalSpent = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);

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

  // Clear expense log on demand
  const handlePromptClearExpenses = () => {
    setConfirmConfig({
      title: "Clear Expense Log?",
      message: "This will remove all current expenses from the screen. If you want to keep a permanent record in History, click 'Save Log' first. Are you sure you want to clear?",
      confirmText: "Yes, Clear All",
      onConfirm: () => {
        setExpenses([]);
        setConfirmConfig(null);
        setToast({ message: 'Expense log cleared.', type: 'success' });
      }
    });
  };

  // Open Save / Settle Session Modal
  const handleOpenSaveModal = (isSettling = false) => {
    if (expenses.length === 0) {
      setToast({ message: 'No expenses to save. Please add some expenses first!', type: 'error' });
      return;
    }
    setSaveModalSettling(isSettling);
    setIsSaveModalOpen(true);
  };

  // Save session snapshot into History and clear current active log
  const handleSaveSession = (sessionName, isSettled) => {
    const newSession = createSessionSnapshot({
      name: sessionName,
      expenses,
      roommates,
      isSettled,
    });

    setHistory([newSession, ...history]);
    setExpenses([]); // Cleared on main screen as requested
    setIsSaveModalOpen(false);

    setToast({
      message: `Session "${newSession.name}" saved to History and log cleared!`,
      type: 'success',
    });
  };

  // Delete a session from History
  const handleDeleteHistorySession = (session) => {
    setConfirmConfig({
      title: `Delete "${session.name}"?`,
      message: `Are you sure you want to remove "${session.name}" from your History? This cannot be undone.`,
      confirmText: "Yes, Delete",
      onConfirm: () => {
        setHistory(history.filter(h => h.id !== session.id));
        setConfirmConfig(null);
        setToast({ message: `"${session.name}" removed from History.`, type: 'info' });
      }
    });
  };

  // Restore a session from History to active editor
  const handleRestoreHistorySession = (session) => {
    setConfirmConfig({
      title: `Load "${session.name}"?`,
      message: `This will load the ${session.expenses.length} expenses from "${session.name}" into your active editor. Any unsaved current expenses will be replaced.`,
      confirmText: "Load into Editor",
      onConfirm: () => {
        // Merge roommates so active list includes all who participated
        const combinedRoommates = Array.from(new Set([...roommates, ...(session.roommates || [])]));
        setRoommates(combinedRoommates);
        setExpenses(session.expenses || []);
        setConfirmConfig(null);
        setIsHistoryModalOpen(false);
        setToast({
          message: `"${session.name}" loaded into your active screen!`,
          type: 'success',
        });
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

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text font-sans selection:bg-brand-primary/20 selection:text-brand-text pb-16 transition-colors duration-200">

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-brand-border shadow-2xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-evenly-coral flex items-center justify-center shadow-xs flex-shrink-0">
              <Receipt size={22} className="text-white sm:w-6 sm:h-6" strokeWidth={2.0} />
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold bg-clip-text bg-gradient-to-r from-evenly-coral to-evenly-coral-deep">
              Evenly
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* History Menu Button */}
            <button
              onClick={() => setIsHistoryModalOpen(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold border border-brand-border bg-white hover:border-brand-border-hover hover:bg-evenly-sage/40 transition-all text-brand-text shadow-xs cursor-pointer"
              title="Open Expense History"
            >
              <Clock className="w-4 h-4 text-evenly-coral-deep flex-shrink-0" />
              <span>History</span>
              {history.length > 0 && (
                <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-black bg-evenly-coral/50 text-brand-text rounded-full">
                  {history.length}
                </span>
              )}
            </button>

            {/* Total Spent Display */}
            <div className="flex flex-col items-end border-l border-brand-border pl-2.5 sm:pl-4">
              <span className="text-[9px] sm:text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider">
                Total Spent
              </span>
              <span className="font-bold text-brand-text text-base sm:text-lg leading-none mt-0.5">
                {formatCurrency(grandTotalSpent)}
              </span>
            </div>
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
          onSettleUp={() => handleOpenSaveModal(true)}
          onSaveSession={() => handleOpenSaveModal(false)}
          onExportPDF={handleExportPDF}
          onExportCSV={handleExportCSV}
        />

        <ExpenseLog
          expenses={expenses}
          onDeleteExpense={handleDeleteExpense}
          onEditExpense={setEditingExpenseId}
          onClearLog={handlePromptClearExpenses}
          onSaveLog={() => handleOpenSaveModal(false)}
          onOpenHistory={() => setIsHistoryModalOpen(true)}
          historyCount={history.length}
        />

        <TotalSpent
          expenses={expenses}
          totalSpent={totalSpent}
        />

      </main>

      <Footer />

      {/* Save Session Modal */}
      <SaveSessionModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSaveSession}
        isSettling={saveModalSettling}
        expenses={expenses}
        roommates={roommates}
      />

      {/* History Modal */}
      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        history={history}
        onDeleteSession={handleDeleteHistorySession}
        onRestoreSession={handleRestoreHistorySession}
      />

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
