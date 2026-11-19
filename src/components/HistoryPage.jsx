import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Clock,
  ChevronDown,
  ChevronUp,
  Trash2,
  RotateCcw,
  ArrowRight,
  CheckCircle2,
  Search,
  Receipt,
  PieChart,
  Scale,
} from 'lucide-react';
import { BsFiletypeCsv, BsFiletypePdf } from 'react-icons/bs';
import { formatCurrency } from '../utils/currency';
import { generatePDF } from '../utils/pdfExport';
import { generateCSV } from '../utils/csvExport';
import ShareLogDropdown from './ShareLogDropdown';

export default function HistoryPage({
  isOpen = true,
  onClose,
  onBack,
  history = [],
  groups = [],
  onDeleteSession,
  onRestoreSession,
  onNotify,
}) {
  const handleClose = onClose || onBack;
  // Initialize once on mount with the first session if present, but do not force open on re-renders
  const [expandedId, setExpandedId] = useState(() => history[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'settled', 'saved'
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('all');

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && handleClose) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.groupName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.roommates?.some((r) => r.toLowerCase().includes(searchQuery.toLowerCase())) ||
        new Date(item.savedAt).toLocaleDateString().includes(searchQuery);

      if (!matchesSearch) return false;

      if (filterType === 'settled' && !item.isSettled) return false;
      if (filterType === 'saved' && item.isSettled) return false;

      if (selectedGroupFilter !== 'all') {
        const matchesGrp = item.groupId === selectedGroupFilter || item.groupName === selectedGroupFilter;
        if (!matchesGrp) return false;
      }

      return true;
    });
  }, [history, searchQuery, filterType, selectedGroupFilter]);

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleExportPDF = (e, session) => {
    e.stopPropagation();
    generatePDF(
      session.expenses,
      session.roommates,
      session.transactions,
      session.totalSpent,
      session.name
    );
  };

  const handleExportCSV = (e, session) => {
    e.stopPropagation();
    generateCSV(session.expenses, session.transactions, session.name);
  };

  const handleRestore = (e, session) => {
    e.stopPropagation();
    onRestoreSession(session);
  };

  const handleDelete = (e, session) => {
    e.stopPropagation();
    onDeleteSession(session);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[140] bg-brand-bg flex flex-col h-full overflow-hidden animate-in fade-in-50 duration-200">
      {/* Page Header (Sticky Top with Cross button to exit) */}
      <div className="bg-evenly-surface border-b border-brand-border px-4 sm:px-6 py-4 flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-evenly-coral/15 border border-brand-border/60 flex items-center justify-center text-evenly-coral-deep shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-brand-text tracking-tight">
              Expense History
            </h1>
            <p className="text-xs text-brand-text-secondary mt-0.5">
              Archived settlement sessions and past logs.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClose}
          className="p-2 rounded-xl border border-brand-border bg-brand-bg hover:bg-evenly-sage/40 text-brand-text transition-colors cursor-pointer"
          title="Close History"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Filter & Search Bar */}
          {history.length > 0 && (
            <div className="bg-evenly-surface rounded-2xl p-4 border border-brand-border flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between shadow-2xs">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-secondary/60" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search logs by name or member..."
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-brand-border bg-brand-bg text-brand-text focus:outline-none focus:border-evenly-coral transition-all"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                {groups.length > 1 && (
                  <select
                    value={selectedGroupFilter}
                    onChange={(e) => setSelectedGroupFilter(e.target.value)}
                    className="py-1.5 px-3 rounded-xl border border-brand-border bg-brand-bg text-brand-text text-xs font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Groups</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                )}

                <div className="flex rounded-xl bg-brand-bg p-1 border border-brand-border/80">
                  <button
                    type="button"
                    onClick={() => setFilterType('all')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      filterType === 'all'
                        ? 'bg-evenly-surface text-brand-text shadow-2xs'
                        : 'text-brand-text-secondary hover:text-brand-text'
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('settled')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      filterType === 'settled'
                        ? 'bg-evenly-surface text-brand-text shadow-2xs'
                        : 'text-brand-text-secondary hover:text-brand-text'
                    }`}
                  >
                    Settled
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('saved')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      filterType === 'saved'
                        ? 'bg-evenly-surface text-brand-text shadow-2xs'
                        : 'text-brand-text-secondary hover:text-brand-text'
                    }`}
                  >
                    Saved
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main List Container */}
          <div>
            {history.length === 0 ? (
              <div className="bg-evenly-surface rounded-3xl p-10 sm:p-14 border border-brand-border text-center shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-evenly-coral/15 flex items-center justify-center mx-auto mb-4 text-evenly-coral-deep">
                  <Clock className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-brand-text mb-1">
                  No Saved Logs Yet
                </h3>
                <p className="text-xs sm:text-sm text-brand-text-secondary max-w-sm mx-auto leading-relaxed">
                  Saved and settled sessions will appear here.
                </p>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="bg-evenly-surface rounded-2xl p-8 border border-brand-border text-center text-xs sm:text-sm text-brand-text-secondary shadow-2xs">
                No saved logs match "{searchQuery}".
              </div>
            ) : (
              /* Single big container with section breaks for each log item */
              <div className="bg-evenly-surface rounded-2xl sm:rounded-3xl border border-brand-border shadow-xs divide-y divide-brand-border overflow-hidden">
                {filteredHistory.map((session) => {
                  const isExpanded = expandedId === session.id;
                  const formattedDate = new Date(session.savedAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });
                  const formattedTime = new Date(session.savedAt).toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div key={session.id} className="transition-colors">
                      {/* Top Bar item (logo, log_name with time below it, and collapse/expand icon) */}
                      <div
                        onClick={() => toggleExpand(session.id)}
                        className="p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer hover:bg-brand-bg/40 transition-colors select-none"
                      >
                        {/* Left: Logo & log_name with time below it */}
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-brand-surface-subtle border border-brand-border flex items-center justify-center text-brand-text shrink-0">
                            {session.isSettled ? (
                              <CheckCircle2 className="w-5 h-5 text-brand-success" />
                            ) : (
                              <Clock className="w-5 h-5 text-evenly-coral-deep" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <h3 className="text-sm sm:text-base font-bold text-brand-text truncate">
                              {session.name}
                            </h3>
                            <p className="text-xs text-brand-text-secondary mt-0.5 truncate">
                              {formattedDate} at {formattedTime}
                            </p>
                          </div>
                        </div>

                        {/* Right: Collapse/Expand Icon */}
                        <div className="p-1.5 rounded-lg text-brand-text-secondary hover:text-brand-text shrink-0">
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </div>
                      </div>

                      {/* Section Break and Expanded Content */}
                      {isExpanded && (
                        <div className="border-t border-brand-border/60 p-4 sm:p-6 space-y-4 bg-brand-bg/30">
                          {/* Summary Card with Top Bar and counts on left, Total on bottom */}
                          <div className="p-4 sm:p-5 bg-evenly-surface border border-brand-border/80 rounded-xl space-y-3 shadow-2xs">
                            {/* Card Top Bar */}
                            <div className="flex items-center justify-between pb-3 border-b border-brand-border/60">
                              {/* Left side: Load to screen */}
                              <button
                                type="button"
                                onClick={(e) => handleRestore(e, session)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-brand-primary text-white hover:bg-brand-primary-hover active:scale-95 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                                title="Load session to active screen"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Load to screen</span>
                              </button>

                              {/* Right side: Share, CSV, PDF, Delete (ONLY ICONS) */}
                              <div className="flex items-center gap-1 sm:gap-1.5">
                                <ShareLogDropdown
                                  expenses={session.expenses}
                                  roommates={session.roommates}
                                  transactions={session.transactions}
                                  totalSpent={session.totalSpent}
                                  sessionName={session.name}
                                  onNotify={onNotify}
                                  iconOnly
                                />
                                <button
                                  type="button"
                                  onClick={(e) => handleExportCSV(e, session)}
                                  aria-label="Export CSV"
                                  title="Export CSV"
                                  className="p-1.5 sm:p-2 rounded-lg border border-brand-border bg-brand-bg/50 hover:bg-brand-surface-subtle text-emerald-600 dark:text-emerald-400 transition-all active:scale-95 cursor-pointer"
                                >
                                  <BsFiletypeCsv className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleExportPDF(e, session)}
                                  aria-label="Export PDF"
                                  title="Export PDF"
                                  className="p-1.5 sm:p-2 rounded-lg border border-brand-border bg-brand-bg/50 hover:bg-brand-surface-subtle text-rose-500 dark:text-rose-400 transition-all active:scale-95 cursor-pointer"
                                >
                                  <BsFiletypePdf className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleDelete(e, session)}
                                  aria-label="Delete Session"
                                  title="Delete Session"
                                  className="p-1.5 sm:p-2 rounded-lg border border-brand-border bg-brand-bg/50 hover:bg-red-50 dark:hover:bg-red-950/30 text-brand-danger transition-all active:scale-95 cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Card content: number of members and expenses on left, Total on bottom of it */}
                            <div className="pt-1">
                              <p className="text-xs font-semibold text-brand-text">
                                {session.roommates?.length || 0} {session.roommates?.length === 1 ? 'member' : 'members'} • {session.expenses?.length || 0} {session.expenses?.length === 1 ? 'expense' : 'expenses'}
                                {session.groupName && (
                                  <span className="text-brand-text-secondary font-normal ml-1">
                                    ({session.groupName})
                                  </span>
                                )}
                              </p>
                              <div className="mt-3">
                                <span className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider block">
                                  Total
                                </span>
                                <span className="text-xl sm:text-2xl font-black text-brand-primary tracking-tight">
                                  {formatCurrency(session.grandTotal)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Settlement Debts Section */}
                          <div className="rounded-xl p-4 bg-evenly-surface border border-brand-border/70 space-y-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-brand-text uppercase tracking-wider">
                              <Scale className="w-4 h-4 text-evenly-coral-deep" />
                              <span>Who Owes What</span>
                            </div>

                            {session.transactions?.length === 0 ? (
                              <p className="text-xs text-brand-text-secondary">
                                Everyone was even. No debts were outstanding.
                              </p>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {session.transactions?.map((t, idx) => (
                                  <div
                                    key={idx}
                                    className="p-2.5 rounded-lg bg-brand-bg border border-brand-border/60 flex items-center justify-between text-xs font-semibold"
                                  >
                                    <div className="flex items-center gap-1.5 truncate">
                                      <span className="text-brand-danger font-bold">{t.from}</span>
                                      <ArrowRight className="w-3.5 h-3.5 text-brand-text-secondary/50" />
                                      <span className="text-brand-success font-bold">{t.to}</span>
                                    </div>
                                    <span className="font-black text-brand-primary">
                                      {formatCurrency(t.amount)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Member Contributions */}
                          <div className="rounded-xl p-4 bg-evenly-surface border border-brand-border/70 space-y-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-brand-text uppercase tracking-wider">
                              <PieChart className="w-4 h-4 text-emerald-600" />
                              <span>Total Spent by Person</span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {session.totalSpent?.map((p, idx) => (
                                <div
                                  key={idx}
                                  className="p-2.5 rounded-lg bg-brand-bg border border-brand-border/60 flex items-center justify-between text-xs"
                                >
                                  <span className="font-semibold text-brand-text truncate">{p.name}</span>
                                  <span className="font-bold text-brand-primary">{formatCurrency(p.amount)}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Expenses List */}
                          <div className="rounded-xl p-4 bg-evenly-surface border border-brand-border/70 space-y-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-brand-text uppercase tracking-wider">
                              <Receipt className="w-4 h-4 text-brand-primary" />
                              <span>Expenses ({session.expenses?.length || 0})</span>
                            </div>

                            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                              {session.expenses?.map((e) => (
                                <div
                                  key={e.id}
                                  className="p-2 rounded-lg bg-brand-bg flex items-center justify-between text-xs"
                                >
                                  <div className="min-w-0">
                                    <span className="font-semibold text-brand-text truncate block">{e.description}</span>
                                    <span className="text-[10px] text-brand-text-secondary">
                                      Paid by {e.payer} • {new Date(e.date).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <span className="font-bold text-brand-text shrink-0">{formatCurrency(e.amount)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
