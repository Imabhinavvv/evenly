import React, { useRef, useEffect, useState } from 'react';
import {
  X,
  Settings,
  Download,
  Upload,
  HardDrive,
  ShieldCheck,
  Globe,
  ChevronDown,
} from 'lucide-react';
import { Button } from './ui/Button';
import { formatCurrency, CURRENCIES, getActiveCurrencyCode, setActiveCurrency } from '../utils/currency';

export default function SettingsSheet({
  isOpen,
  onClose,
  groups = [],
  activeGroupId,
  expenses = [],
  history = [],
  onExportBackup,
  onImportBackupFile,
  isBackupLoading = false,
}) {
  const fileInputRef = useRef(null);
  const [currentCurrency, setCurrentCurrency] = useState(getActiveCurrencyCode);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activeGroup = groups.find((g) => g.id === activeGroupId) || groups[0] || null;
  const grandTotalSpent = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onImportBackupFile) {
      onImportBackupFile(file);
    }
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-[150] flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".evenly,application/octet-stream,application/zip"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Sidebar Panel */}
      <div className="relative z-10 w-full max-w-md bg-evenly-surface border-l border-brand-border shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-brand-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-evenly-coral/20 flex items-center justify-center text-brand-primary">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-brand-text">
                Settings
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-brand-text-secondary hover:text-brand-text hover:bg-brand-bg transition-colors cursor-pointer"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-5">
          {/* Currency Preference Card */}
          <div className="rounded-2xl p-5 bg-brand-bg/60 border border-brand-border space-y-3.5">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-brand-primary" />
              <h3 className="text-sm font-bold text-brand-text">Currency</h3>
            </div>
            <p className="text-xs text-brand-text-secondary">
              Select the default currency used for calculations, balance sheets, and reports.
            </p>

            <div className="relative">
              <select
                value={currentCurrency}
                onChange={(e) => {
                  const newCode = e.target.value;
                  setCurrentCurrency(newCode);
                  setActiveCurrency(newCode);
                }}
                className="w-full bg-evenly-surface border border-brand-border rounded-xl px-3.5 py-2.5 text-xs font-semibold text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary/20 cursor-pointer appearance-none pr-8"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.symbol} {c.code} — {c.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-brand-text-secondary">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* 1. Workspace Backups Card */}
          <div className="rounded-2xl p-5 bg-brand-bg/60 border border-brand-border space-y-4">
            <div>
              <h3 className="text-sm font-bold text-brand-text">
                Workspace Backups
              </h3>
              <p className="text-xs text-brand-text-secondary mt-1">
                Export or restore all groups, expenses, and history.
              </p>
            </div>

            <div className="space-y-3">
              {/* Export Backup */}
              <div className="p-3.5 rounded-xl bg-evenly-surface border border-brand-border/70 space-y-2.5">
                <div>
                  <h4 className="text-xs font-bold text-brand-text">
                    Export Backup
                  </h4>
                  <p className="text-[11px] text-brand-text-secondary mt-0.5">
                    Save a full backup file to your device or cloud.
                  </p>
                </div>

                <Button
                  onClick={onExportBackup}
                  disabled={isBackupLoading}
                  className="w-full bg-evenly-coral text-brand-text hover:bg-evenly-coral-hover font-bold text-xs py-2 rounded-xl border border-evenly-coral-deep/30 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-evenly-coral-deep" />
                  {isBackupLoading ? 'Creating Backup...' : 'Export Backup'}
                </Button>
              </div>

              {/* Import Backup */}
              <div className="p-3.5 rounded-xl bg-evenly-surface border border-brand-border/70 space-y-2.5">
                <div>
                  <h4 className="text-xs font-bold text-brand-text">
                    Import & Restore
                  </h4>
                  <p className="text-[11px] text-brand-text-secondary mt-0.5">
                    Restore or merge an existing .evenly backup.
                  </p>
                </div>

                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isBackupLoading}
                  className="w-full text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-brand-primary" />
                  Select Backup File
                </Button>
              </div>
            </div>
          </div>

          {/* 2. On-Device Storage Card */}
          <div className="rounded-2xl p-5 bg-brand-bg/60 border border-brand-border space-y-3.5">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-brand-primary" />
              <h3 className="text-sm font-bold text-brand-text">
                On-Device Storage
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-evenly-surface border border-brand-border/60">
                <span className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider block">
                  Groups
                </span>
                <span className="text-base font-extrabold text-brand-text mt-0.5 block">
                  {groups.length}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-evenly-surface border border-brand-border/60">
                <span className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider block">
                  Active Group
                </span>
                <span className="text-base font-extrabold text-brand-text mt-0.5 block truncate" title={activeGroup?.name || 'None'}>
                  {activeGroup ? activeGroup.name : 'None'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-evenly-surface border border-brand-border/60">
                <span className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider block">
                  Expenses
                </span>
                <span className="text-base font-extrabold text-brand-text mt-0.5 block">
                  {expenses.length}
                </span>
                <span className="text-[10px] font-bold text-brand-primary block truncate">
                  {formatCurrency(grandTotalSpent)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-evenly-surface border border-brand-border/60">
                <span className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider block">
                  Archived Logs
                </span>
                <span className="text-base font-extrabold text-brand-text mt-0.5 block">
                  {history.length}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 text-[11px] text-brand-text-secondary">
              <ShieldCheck className="w-4 h-4 text-brand-success shrink-0" />
              <span>Stored locally on your device. 100% private.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
