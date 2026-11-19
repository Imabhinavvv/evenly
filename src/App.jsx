import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Receipt, Clock, Settings, LayoutDashboard, ArrowLeft } from 'lucide-react';
import { App as CapApp } from '@capacitor/app';
import { useLocalStorage } from './utils/useLocalStorage';
import { calculateSettlement, calculateTotalSpent } from './utils/settlement';
import { generatePDF } from './utils/pdfExport';
import { generateCSV } from './utils/csvExport';
import { createSessionSnapshot } from './utils/sessionHelper';
import { createBackup, extractBackupFromFile, initBackupExtractor } from './utils/backup';
import { ConfirmModal } from './components/ui/ConfirmModal';
import { Toast } from './components/ui/Toast';

import DashboardTab from './components/DashboardTab';
import SettingsSheet from './components/SettingsSheet';
import GroupManager from './components/GroupManager';
import ExpenseForm from './components/ExpenseForm';
import BalanceDashboard from './components/BalanceDashboard';
import ExpenseLog from './components/ExpenseLog';
import TotalSpent from './components/TotalSpent';
import Footer from './components/Footer';
import SaveSessionModal from './components/SaveSessionModal';
import HistoryPage from './components/HistoryPage';
import RestoreModal from './components/RestoreModal';
import About from './components/footer/About';
import Terms from './components/footer/Terms';
import Privacy from './components/footer/Privacy';
import Contact from './components/footer/Contact';
import { useTheme } from './hooks/useTheme';
import { migrateToGroups } from './utils/groupHelper';

export default function App() {
  useTheme();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Groups and Storage Setup with Migration
  const [groups, setGroups] = useLocalStorage('es_groups', () => {
    let existingRoommates = [];
    let existingExpenses = [];
    let existingHistory = [];
    let existingGroups = [];
    try {
      existingRoommates = JSON.parse(localStorage.getItem('es_roommates') || '[]');
      existingExpenses = JSON.parse(localStorage.getItem('es_expenses') || '[]');
      existingHistory = JSON.parse(localStorage.getItem('es_history') || '[]');
      existingGroups = JSON.parse(localStorage.getItem('es_groups') || '[]');
    } catch {
      // ignore JSON parse error
    }
    return migrateToGroups(existingGroups, existingRoommates, existingExpenses, existingHistory);
  });

  const [activeGroupId, setActiveGroupId] = useLocalStorage('es_active_group_id', null);

  // Resolve safe array of groups (No dummy data or default groups)
  const validGroups = useMemo(() => {
    if (!Array.isArray(groups)) return [];
    // Automatically filter out any legacy dummy Roommates group with 0 expenses
    return groups.filter(
      (g) =>
        !(
          g.id === 'grp_default' &&
          g.name === 'Roommates' &&
          (!g.expenses || g.expenses.length === 0)
        )
    );
  }, [groups]);

  // Persist cleaned groups if dummy data was filtered
  useEffect(() => {
    if (Array.isArray(groups) && validGroups.length !== groups.length) {
      setGroups(validGroups);
    }
  }, [groups, validGroups, setGroups]);

  // Resolve Active Group
  const activeGroup = useMemo(() => {
    return validGroups.find((g) => g.id === activeGroupId) || validGroups[0] || null;
  }, [validGroups, activeGroupId]);

  const roommates = useMemo(() => activeGroup?.members || [], [activeGroup]);
  const expenses = useMemo(() => activeGroup?.expenses || [], [activeGroup]);

  // Compute aggregated history across all groups (newest first)
  const allHistory = useMemo(() => {
    const list = [];
    validGroups.forEach((g) => {
      (g.history || []).forEach((h) => {
        list.push({ ...h, groupId: g.id, groupName: g.name });
      });
    });
    list.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
    return list;
  }, [validGroups]);

  // Keep activeGroupId synced if group gets deleted or updated
  useEffect(() => {
    if (validGroups.length > 0) {
      if (!activeGroupId || !validGroups.some((g) => g.id === activeGroupId)) {
        setActiveGroupId(validGroups[0].id);
      }
    } else if (activeGroupId) {
      setActiveGroupId(null);
    }
  }, [validGroups, activeGroupId, setActiveGroupId]);

  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Backup & Restore State
  const [pendingBackup, setPendingBackup] = useState(null);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [isBackupLoading, setIsBackupLoading] = useState(false);

  // Modals
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveModalSettling, setSaveModalSettling] = useState(false);

  // Currency change listener to re-render all currency displays
  const [, setCurrencyTrigger] = useState(0);
  useEffect(() => {
    const onCurrencyChange = () => setCurrencyTrigger((n) => n + 1);
    window.addEventListener('currencychange', onCurrencyChange);
    return () => window.removeEventListener('currencychange', onCurrencyChange);
  }, []);

  // Back button / gesture navigation handler for Android & Capacitor
  const backHandlerStateRef = useRef({});
  backHandlerStateRef.current = {
    confirmConfig,
    isRestoreModalOpen,
    isSaveModalOpen,
    isSettingsOpen,
    isHistoryOpen,
    editingExpenseId,
    activeTab,
  };

  useEffect(() => {
    let listenerHandle = null;

    const setupBackButton = async () => {
      try {
        listenerHandle = await CapApp.addListener('backButton', () => {
          // 1. Dispatch custom event allowing child components/modals to intercept
          const customBackEvent = new CustomEvent('hardwareBack', { cancelable: true });
          window.dispatchEvent(customBackEvent);
          if (customBackEvent.defaultPrevented) {
            return;
          }

          const state = backHandlerStateRef.current;

          // 2. Close active confirmation modal
          if (state.confirmConfig) {
            setConfirmConfig(null);
            return;
          }

          // 3. Close active restore modal
          if (state.isRestoreModalOpen) {
            setIsRestoreModalOpen(false);
            setPendingBackup(null);
            return;
          }

          // 4. Close active save session modal
          if (state.isSaveModalOpen) {
            setIsSaveModalOpen(false);
            return;
          }

          // 5. Close settings sheet
          if (state.isSettingsOpen) {
            setIsSettingsOpen(false);
            return;
          }

          // 6. Close history page
          if (state.isHistoryOpen) {
            setIsHistoryOpen(false);
            return;
          }

          // 7. Cancel editing mode in expense form
          if (state.editingExpenseId !== null) {
            setEditingExpenseId(null);
            return;
          }

          // 8. Return to dashboard from footer pages
          if (['about', 'terms', 'privacy', 'contact'].includes(state.activeTab)) {
            setActiveTab('dashboard');
            return;
          }

          // 9. Return to dashboard from split tab
          if (state.activeTab === 'split') {
            setActiveTab('dashboard');
            return;
          }

          // 10. If on dashboard with no overlays open, exit to Android home screen
          CapApp.exitApp();
        });
      } catch (err) {
        console.warn('Capacitor backButton listener unavailable:', err);
      }
    };

    setupBackButton();

    return () => {
      if (listenerHandle && typeof listenerHandle.remove === 'function') {
        listenerHandle.remove();
      }
    };
  }, []);

  const transactions = useMemo(() => calculateSettlement(expenses, roommates), [expenses, roommates]);
  const totalSpent = useMemo(() => calculateTotalSpent(expenses, roommates), [expenses, roommates]);

  // 1. Group Actions
  const handleCreateGroup = ({ name, category = 'trip', initialMembers = [] }) => {
    const newGroup = {
      id: `grp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      category,
      members: initialMembers,
      expenses: [],
      history: [],
      createdAt: new Date().toISOString(),
    };
    setGroups((prev) => [...(Array.isArray(prev) ? prev : []), newGroup]);
    setActiveGroupId(newGroup.id);
    setToast({ message: `Group "${newGroup.name}" created!`, type: 'success' });
  };

  const handleUpdateGroupInfo = (groupId, updates) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, ...updates } : g))
    );
    setToast({ message: 'Group updated successfully!', type: 'success' });
  };

  const handleDeleteGroup = (groupId) => {
    const target = groups.find((g) => g.id === groupId);
    if (!target) return;

    setConfirmConfig({
      title: `Delete "${target.name}"?`,
      message: `This will permanently remove "${target.name}", its ${target.expenses?.length || 0} active expenses, and its ${target.history?.length || 0} saved logs. This cannot be undone.`,
      confirmText: 'Yes, Delete Group',
      onConfirm: () => {
        const remaining = groups.filter((g) => g.id !== groupId);
        setGroups(remaining);
        if (activeGroupId === groupId) {
          setActiveGroupId(remaining.length > 0 ? remaining[0].id : null);
        }
        setConfirmConfig(null);
        setToast({ message: `Group "${target.name}" deleted.`, type: 'info' });
      },
    });
  };

  const handleUpdateMembers = (newMembers) => {
    if (!activeGroup) return;
    setGroups((prev) =>
      prev.map((g) => (g.id === activeGroup.id ? { ...g, members: newMembers } : g))
    );
  };

  // 2. Expense Actions for Active Group
  const handleAddExpense = (expense) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === activeGroup.id
          ? { ...g, expenses: [expense, ...(g.expenses || [])] }
          : g
      )
    );
  };

  const handleUpdateExpense = (updatedExpense) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === activeGroup.id
          ? {
              ...g,
              expenses: (g.expenses || []).map((e) =>
                e.id === updatedExpense.id ? updatedExpense : e
              ),
            }
          : g
      )
    );
    setEditingExpenseId(null);
    setToast({ message: 'Expense updated successfully!', type: 'success' });
  };

  const handleDeleteExpense = (id) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === activeGroup.id
          ? { ...g, expenses: (g.expenses || []).filter((e) => e.id !== id) }
          : g
      )
    );
  };

  const handlePromptClearExpenses = () => {
    if (!activeGroup) return;
    const groupTitle = activeGroup.name || 'Group';
    setConfirmConfig({
      title: `Clear "${groupTitle}" Expenses?`,
      message: `This will remove all current expenses from "${groupTitle}". If you want to keep a permanent record in History, click 'Save Log' first. Are you sure you want to clear?`,
      confirmText: 'Yes, Clear All',
      onConfirm: () => {
        setGroups((prev) =>
          prev.map((g) => (g.id === activeGroup.id ? { ...g, expenses: [] } : g))
        );
        setConfirmConfig(null);
        setToast({ message: `Expense log for "${groupTitle}" cleared.`, type: 'success' });
      },
    });
  };

  const handleOpenSaveModal = (isSettling = false) => {
    if (!activeGroup || expenses.length === 0) {
      setToast({ message: 'No expenses to save. Please add some expenses first!', type: 'error' });
      return;
    }
    setSaveModalSettling(isSettling);
    setIsSaveModalOpen(true);
  };

  const handleSaveSession = (sessionName, isSettled) => {
    if (!activeGroup) return;
    const groupTitle = activeGroup.name || 'Group';
    const newSession = createSessionSnapshot({
      name: sessionName,
      expenses,
      roommates,
      groupId: activeGroup.id,
      groupName: groupTitle,
      isSettled,
    });

    setGroups((prev) =>
      prev.map((g) =>
        g.id === activeGroup.id
          ? {
              ...g,
              history: [newSession, ...(g.history || [])],
              expenses: [], // Cleared on active screen after saving to history
            }
          : g
      )
    );

    setIsSaveModalOpen(false);
    setToast({
      message: `Session "${newSession.name}" saved to ${groupTitle} History!`,
      type: 'success',
    });
  };

  // 3. History Actions
  const handleDeleteHistorySession = (session) => {
    setConfirmConfig({
      title: `Delete "${session.name}"?`,
      message: `Are you sure you want to remove "${session.name}" from your History? This cannot be undone.`,
      confirmText: 'Yes, Delete',
      onConfirm: () => {
        setGroups((prev) =>
          prev.map((g) => {
            const hasSession = (g.history || []).some((h) => h.id === session.id);
            if (hasSession || g.id === session.groupId) {
              return {
                ...g,
                history: (g.history || []).filter((h) => h.id !== session.id),
              };
            }
            return g;
          })
        );
        setConfirmConfig(null);
        setToast({ message: `"${session.name}" removed from History.`, type: 'info' });
      },
    });
  };

  const handleRestoreHistorySession = (session) => {
    setConfirmConfig({
      title: `Load "${session.name}"?`,
      message: `This will load the ${session.expenses?.length || 0} expenses from "${session.name}" into the active editor.`,
      confirmText: 'Load into Editor',
      onConfirm: () => {
        const targetGroupId = session.groupId || activeGroup.id;
        setGroups((prev) =>
          prev.map((g) => {
            if (g.id === targetGroupId) {
              const combinedMembers = Array.from(
                new Set([...(g.members || []), ...(session.roommates || [])])
              );
              return {
                ...g,
                members: combinedMembers,
                expenses: session.expenses || [],
              };
            }
            return g;
          })
        );

        if (targetGroupId !== activeGroupId) {
          setActiveGroupId(targetGroupId);
        }

        setConfirmConfig(null);
        setActiveTab('split');
        setToast({
          message: `"${session.name}" loaded into your active screen!`,
          type: 'success',
        });
      },
    });
  };

  const handleExportPDF = () => {
    const groupTitle = activeGroup?.name || 'Group';
    setConfirmConfig({
      title: `Download ${groupTitle} PDF Report?`,
      message: 'Are you sure you want to generate and download your expense report as a PDF?',
      confirmText: 'Download PDF',
      onConfirm: async () => {
        setIsModalLoading(true);
        try {
          await new Promise((resolve) => setTimeout(resolve, 150));
          generatePDF(expenses, roommates, transactions, totalSpent, groupTitle);
          setToast({ message: 'PDF downloaded successfully!', type: 'success' });
        } catch (error) {
          console.error('PDF Generation Error:', error);
          setToast({ message: `Failed to generate PDF: ${error.message}`, type: 'error' });
        } finally {
          setIsModalLoading(false);
          setConfirmConfig(null);
        }
      },
    });
  };

  const handleExportCSV = () => {
    const groupTitle = activeGroup?.name || 'Group';
    setConfirmConfig({
      title: `Download ${groupTitle} CSV Report?`,
      message: 'Are you sure you want to generate and download your expense report as a CSV file?',
      confirmText: 'Download CSV',
      onConfirm: async () => {
        setIsModalLoading(true);
        try {
          await new Promise((resolve) => setTimeout(resolve, 150));
          generateCSV(expenses, transactions, groupTitle);
          setToast({ message: 'CSV downloaded successfully!', type: 'success' });
        } catch (error) {
          console.error(error);
          setToast({ message: 'Failed to generate CSV.', type: 'error' });
        } finally {
          setIsModalLoading(false);
          setConfirmConfig(null);
        }
      },
    });
  };

  // Listen for incoming .evenly file intents (cold start and background taps)
  useEffect(() => {
    const cleanup = initBackupExtractor((backupPayload, fileUri, error) => {
      if (error) {
        setToast({
          message: `Could not open backup: ${error.message}`,
          type: 'error',
        });
        return;
      }
      if (backupPayload) {
        setPendingBackup(backupPayload);
        setIsRestoreModalOpen(true);
      }
    });

    return () => {
      cleanup();
    };
  }, []);

  // Export full backup containing all groups
  const handleExportBackup = async () => {
    setIsBackupLoading(true);
    try {
      const res = await createBackup({
        groups: validGroups,
        activeGroupId,
        roommates,
        expenses,
        history: allHistory,
      });
      setToast({
        message: `Backup saved to ${res.savedLocation || res.fileName}!`,
        type: 'success',
      });
    } catch (err) {
      console.error('Backup creation error:', err);
      setToast({
        message: `Failed to create backup: ${err.message}`,
        type: 'error',
      });
    } finally {
      setIsBackupLoading(false);
    }
  };

  // Import backup from file picker
  const handleImportBackupFile = async (file) => {
    setIsBackupLoading(true);
    try {
      const backup = await extractBackupFromFile(file);
      setPendingBackup(backup);
      setIsRestoreModalOpen(true);
    } catch (err) {
      console.error('Backup import error:', err);
      setToast({
        message: err.message || 'Failed to read backup file.',
        type: 'error',
      });
    } finally {
      setIsBackupLoading(false);
    }
  };

  // Restore backup (Replace or Merge)
  const handleConfirmRestore = (mode) => {
    if (!pendingBackup?.data) return;

    const { data } = pendingBackup;

    if (mode === 'replace') {
      if (Array.isArray(data.groups) && data.groups.length > 0) {
        setGroups(data.groups);
        if (data.activeGroupId) setActiveGroupId(data.activeGroupId);
      } else {
        const migrated = migrateToGroups([], data.roommates, data.expenses, data.history);
        setGroups(migrated);
        setActiveGroupId(migrated[0].id);
      }
      setToast({
        message: 'All groups and data replaced from backup successfully!',
        type: 'success',
      });
    } else if (mode === 'merge') {
      if (Array.isArray(data.groups) && data.groups.length > 0) {
        setGroups((prev) => {
          const existingIds = new Set(prev.map((g) => g.id));
          const newGroups = data.groups.filter((g) => !existingIds.has(g.id));
          const mergedExisting = prev.map((g) => {
            const incoming = data.groups.find((ig) => ig.id === g.id);
            if (!incoming) return g;
            const combinedMembers = Array.from(
              new Set([...g.members, ...(incoming.members || [])])
            );
            const existingExpIds = new Set((g.expenses || []).map((e) => e.id));
            const newExp = (incoming.expenses || []).filter((e) => !existingExpIds.has(e.id));
            const existingHistIds = new Set((g.history || []).map((h) => h.id));
            const newHist = (incoming.history || []).filter((h) => !existingHistIds.has(h.id));
            return {
              ...g,
              members: combinedMembers,
              expenses: [...(g.expenses || []), ...newExp],
              history: [...newHist, ...(g.history || [])],
            };
          });
          return [...mergedExisting, ...newGroups];
        });
      } else {
        // Merge legacy backup into active group
        handleUpdateMembers(Array.from(new Set([...roommates, ...(data.roommates || [])])));
        const existingExpIds = new Set(expenses.map((e) => e.id));
        const newExp = (data.expenses || []).filter((e) => !existingExpIds.has(e.id));
        setGroups((prev) =>
          prev.map((g) =>
            g.id === activeGroup.id ? { ...g, expenses: [...(g.expenses || []), ...newExp] } : g
          )
        );
      }

      setToast({
        message: 'Backup merged with current data successfully!',
        type: 'success',
      });
    }

    setIsRestoreModalOpen(false);
    setPendingBackup(null);
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text font-sans selection:bg-brand-primary/20 selection:text-brand-text pb-6 transition-colors duration-200">

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-evenly-surface border-b border-brand-border shadow-2xs transition-colors duration-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <span className="text-xl sm:text-2xl font-black text-brand-text tracking-tight">
              Evenly
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* History Menu Button (Opens separate page like settings with cross button to exit) */}
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold border border-brand-border bg-evenly-surface hover:border-brand-border-hover hover:bg-evenly-sage/40 transition-all text-brand-text shadow-xs cursor-pointer"
              title="Open Expense History"
            >
              <Clock className="w-4 h-4 text-evenly-coral-deep flex-shrink-0" />
              <span>History</span>
            </button>

            {/* Settings Button (Opens Sidebar Sheet) */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold border border-brand-border bg-evenly-surface hover:border-brand-border-hover hover:bg-evenly-sage/40 transition-all text-brand-text shadow-xs cursor-pointer"
              title="Open Settings & Backups"
            >
              <Settings className="w-4 h-4 text-brand-primary flex-shrink-0" />
              <span className="hidden sm:inline">Settings</span>
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation (Dashboard vs Split) */}
      <div className="max-w-4xl mx-auto px-4 pt-4 sm:pt-6">
        <div className="bg-evenly-surface p-1 rounded-2xl border border-brand-border shadow-xs flex items-center gap-1 sm:gap-2 transition-colors">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-evenly-coral text-brand-text shadow-xs'
                : 'text-brand-text-secondary hover:text-brand-text hover:bg-evenly-sage/40'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-evenly-coral-deep" />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('split')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'split'
                ? 'bg-evenly-coral text-brand-text shadow-xs'
                : 'text-brand-text-secondary hover:text-brand-text hover:bg-evenly-sage/40'
            }`}
          >
            <Receipt className="w-4 h-4 text-evenly-coral-deep" />
            <span>Split</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-5 sm:py-6 space-y-6">
        {editingExpenseId ? (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            <div className="bg-evenly-surface rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-brand-border flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditingExpenseId(null)}
                  className="p-2 rounded-xl border border-brand-border bg-brand-bg hover:bg-evenly-sage/40 text-brand-text transition-colors cursor-pointer"
                  title="Cancel edit"
                  aria-label="Back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-brand-text tracking-tight">
                    Edit Expense
                  </h1>
                  <p className="text-xs text-brand-text-secondary mt-0.5">
                    Modify expense details and contribution splits.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-evenly-surface rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-brand-border">
              <ExpenseForm
                roommates={roommates}
                onAddExpense={handleUpdateExpense}
                initialData={expenses.find(e => e.id === editingExpenseId)}
                onCancel={() => setEditingExpenseId(null)}
              />
            </div>
          </div>
        ) : activeTab === 'split' ? (
          <div className="bg-evenly-surface rounded-2xl sm:rounded-3xl border border-brand-border shadow-xs divide-y divide-brand-border overflow-hidden animate-in fade-in-50 duration-200">
            {/* 1. Groups & Members */}
            <div className="p-5 sm:p-7">
              <GroupManager
                groups={validGroups}
                activeGroupId={activeGroupId}
                onSelectGroup={(id) => setActiveGroupId(id)}
                onCreateGroup={handleCreateGroup}
                onUpdateGroup={handleUpdateGroupInfo}
                onDeleteGroup={handleDeleteGroup}
                onUpdateMembers={handleUpdateMembers}
              />
            </div>

            {/* 2. Add an Expense */}
            <div className="p-5 sm:p-7">
              <ExpenseForm
                roommates={roommates}
                onAddExpense={handleAddExpense}
              />
            </div>

            {/* 3. Who Owes What */}
            <div className="p-5 sm:p-7">
              <BalanceDashboard
                expenses={expenses}
                transactions={transactions}
                roommates={roommates}
                totalSpent={totalSpent}
                groupName={activeGroup?.name || ''}
                onSettleUp={() => handleOpenSaveModal(true)}
                onSaveSession={() => handleOpenSaveModal(false)}
                onExportPDF={handleExportPDF}
                onExportCSV={handleExportCSV}
                onNotify={setToast}
              />
            </div>

            {/* 4. Expense Log */}
            <div className="p-5 sm:p-7">
              <ExpenseLog
                expenses={expenses}
                roommates={roommates}
                onDeleteExpense={handleDeleteExpense}
                onEditExpense={setEditingExpenseId}
                onClearLog={handlePromptClearExpenses}
                onSaveLog={() => handleOpenSaveModal(false)}
                onOpenHistory={() => setIsHistoryOpen(true)}
                historyCount={allHistory.length}
              />
            </div>

            {/* 5. Total Spent by Person */}
            <div className="p-5 sm:p-7">
              <TotalSpent
                expenses={expenses}
                totalSpent={totalSpent}
              />
            </div>
          </div>
        ) : (
          <DashboardTab
            groups={validGroups}
            activeGroupId={activeGroupId}
            onSelectGroup={(id) => setActiveGroupId(id)}
            expenses={expenses}
            roommates={roommates}
            transactions={transactions}
            totalSpent={totalSpent}
            history={allHistory}
            onSwitchToSplit={() => setActiveTab('split')}
          />
        )}
      </main>

      <Footer onNavigate={(p) => setActiveTab(p)} />

      {/* History Page (Opens as a separate page like settings with cross button to exit) */}
      <HistoryPage
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={allHistory}
        groups={validGroups}
        onDeleteSession={handleDeleteHistorySession}
        onRestoreSession={(session) => {
          handleRestoreHistorySession(session);
          setIsHistoryOpen(false);
        }}
        onNotify={setToast}
      />

      {/* Full-Page View for Footer Pages (Occupies entire space like settings) */}
      {['about', 'terms', 'privacy', 'contact'].includes(activeTab) && (
        <div className="fixed inset-0 z-[120] bg-brand-bg flex flex-col h-full overflow-hidden animate-in fade-in-50 duration-200">
          <div className="bg-evenly-surface border-b border-brand-border px-4 sm:px-6 py-4 flex items-center justify-between shrink-0 shadow-2xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className="p-2 rounded-xl border border-brand-border bg-brand-bg hover:bg-evenly-sage/40 text-brand-text transition-colors cursor-pointer"
                title="Back to dashboard"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg sm:text-xl font-black text-brand-text tracking-tight">
                  {activeTab === 'about' && 'About Evenly'}
                  {activeTab === 'terms' && 'Terms of Service'}
                  {activeTab === 'privacy' && 'Privacy Policy'}
                  {activeTab === 'contact' && 'Contact Us'}
                </h1>
                <p className="text-xs text-brand-text-secondary mt-0.5">
                  {activeTab === 'about' && 'Minimalist expense tracking notebook.'}
                  {activeTab === 'terms' && 'Terms and on-device usage conditions.'}
                  {activeTab === 'privacy' && 'Zero tracking and offline privacy policy.'}
                  {activeTab === 'contact' && 'Get in touch with the team.'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 sm:py-8">
            <div className="max-w-3xl mx-auto bg-evenly-surface rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-brand-border shadow-xs">
              {activeTab === 'about' && <About />}
              {activeTab === 'terms' && <Terms />}
              {activeTab === 'privacy' && <Privacy />}
              {activeTab === 'contact' && <Contact />}
            </div>
          </div>
        </div>
      )}

      {/* Settings Sheet Sidebar */}
      <SettingsSheet
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        groups={validGroups}
        activeGroupId={activeGroupId}
        expenses={expenses}
        history={allHistory}
        onExportBackup={handleExportBackup}
        onImportBackupFile={handleImportBackupFile}
        isBackupLoading={isBackupLoading}
      />

      {/* Save Session Modal */}
      <SaveSessionModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSaveSession}
        isSettling={saveModalSettling}
        expenses={expenses}
        roommates={roommates}
        groupName={activeGroup?.name || ''}
      />

      {/* Restore Backup Modal */}
      <RestoreModal
        isOpen={isRestoreModalOpen}
        backupPayload={pendingBackup}
        onClose={() => {
          setIsRestoreModalOpen(false);
          setPendingBackup(null);
        }}
        onConfirmRestore={handleConfirmRestore}
        isLoading={isBackupLoading}
      />

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
