import React, { useState, useMemo } from 'react';
import {
  X,
  Clock,
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  Trash2,
  RotateCcw,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Users,
  Search,
  Receipt,
  PieChart,
  Scale
} from 'lucide-react';
import { Button } from './ui/Button';
import { formatCurrency } from '../utils/currency';
import { generatePDF } from '../utils/pdfExport';
import { generateCSV } from '../utils/csvExport';

export default function HistoryModal({
  isOpen,
  onClose,
  history = [],
  onDeleteSession,
  onRestoreSession,
}) {
  const [expandedId, setExpandedId] = useState(history[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'settled', 'saved'

  // Update expandedId if history changes and nothing is selected
  React.useEffect(() => {
    if (history.length > 0 && !expandedId) {
      setExpandedId(history[0].id);
    }
  }, [history, expandedId]);

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.roommates?.some((r) => r.toLowerCase().includes(searchQuery.toLowerCase())) ||
        new Date(item.savedAt).toLocaleDateString().includes(searchQuery);

      if (!matchesSearch) return false;

      if (filterType === 'settled') return item.isSettled;
      if (filterType === 'saved') return !item.isSettled;
      return true;
    });
  }, [history, searchQuery, filterType]);

  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-2.5 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-brand-text/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-4xl w-full my-auto relative z-10 flex flex-col max-h-[92vh] border border-brand-border modal-animate-in overflow-hidden">
        {/* Sticky Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md z-20 px-4 sm:px-6 py-4 sm:py-5 border-b border-brand-border flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-evenly-coral/20 flex items-center justify-center text-evenly-coral-deep shadow-sm flex-shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-2xl font-black text-brand-text tracking-tight">
                  Expense History
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-bold bg-evenly-sage text-brand-text border border-brand-border">
                  {history.length} {history.length === 1 ? 'Log' : 'Logs'}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-brand-text-secondary mt-0.5">
                Saved logs with settlement debts, expenses & spending breakdowns
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-brand-text-secondary hover:text-brand-text hover:bg-evenly-sage transition-colors ml-2"
            aria-label="Close"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        {history.length > 0 && (
          <div className="px-4 sm:px-6 py-3 bg-evenly-bg border-b border-brand-border flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-secondary/60" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search logs (e.g. July, Alice)..."
                className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-xl border border-brand-border bg-white text-brand-text focus:outline-none focus:border-evenly-coral focus:ring-2 focus:ring-evenly-coral/20 transition-all"
              />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  filterType === 'all'
                    ? 'bg-brand-text text-white'
                    : 'text-brand-text-secondary hover:bg-white border border-brand-border/60 sm:border-transparent'
                }`}
              >
                All ({history.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('settled')}
                className={`px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  filterType === 'settled'
                    ? 'bg-brand-success text-white'
                    : 'text-brand-text-secondary hover:bg-white border border-brand-border/60 sm:border-transparent'
                }`}
              >
                Settled ({history.filter((h) => h.isSettled).length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('saved')}
                className={`px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  filterType === 'saved'
                    ? 'bg-evenly-coral-deep text-white'
                    : 'text-brand-text-secondary hover:bg-white border border-brand-border/60 sm:border-transparent'
                }`}
              >
                Logs ({history.filter((h) => !h.isSettled).length})
              </button>
            </div>
          </div>
        )}

        {/* Modal Body / Sessions List */}
        <div className="p-3 sm:p-6 overflow-y-auto custom-scrollbar space-y-3 sm:space-y-4 flex-1">
          {history.length === 0 ? (
            <div className="text-center py-12 sm:py-16 px-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-evenly-sage flex items-center justify-center mx-auto mb-4 text-brand-text-secondary/70">
                <Clock className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-brand-text mb-1">
                No Saved Logs Yet
              </h3>
              <p className="text-xs sm:text-sm text-brand-text-secondary max-w-md mx-auto mb-6 leading-relaxed">
                When you finish entering a month's expenses (e.g. July or August), click{' '}
                <span className="font-semibold text-brand-text">"Save Log"</span> in the Expense
                Log or <span className="font-semibold text-brand-text">"Settle Up"</span>. It will
                archive the entire session and the 3 sections right here.
              </p>
              <Button onClick={onClose} variant="secondary" size="sm">
                Return to Screen
              </Button>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-10 text-brand-text-secondary border-2 border-dashed border-brand-border rounded-xl text-xs sm:text-sm">
              No saved logs match "{searchQuery}".
            </div>
          ) : (
            filteredHistory.map((session) => {
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
                <div
                  key={session.id}
                  className={`border rounded-xl sm:rounded-2xl transition-all duration-200 overflow-hidden ${
                    isExpanded
                      ? 'border-brand-primary/40 bg-white shadow-md ring-1 ring-brand-primary/10'
                      : 'border-brand-border bg-white hover:border-brand-border-hover hover:shadow-sm'
                  }`}
                >
                  {/* Session Card Header */}
                  <div
                    onClick={() => toggleExpand(session.id)}
                    className="p-3.5 sm:p-5 cursor-pointer flex flex-col gap-3 select-none hover:bg-evenly-bg/40 transition-colors"
                  >
                    {/* Top Row: Title, Badges, and Prominent Individual Delete Icon */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <button
                          type="button"
                          className="p-1 rounded-md text-brand-text-secondary hover:text-brand-text hover:bg-evenly-sage transition-colors flex-shrink-0"
                          aria-label="Toggle details"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-brand-primary" />
                          ) : (
                            <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
                          )}
                        </button>

                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          <h3 className="font-extrabold text-brand-text text-base sm:text-lg tracking-tight truncate">
                            {session.name}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold flex-shrink-0 ${
                              session.isSettled
                                ? 'bg-brand-success/15 text-brand-success border border-brand-success/30'
                                : 'bg-evenly-lavender text-brand-text border border-brand-border'
                            }`}
                          >
                            {session.isSettled ? 'Settled' : 'Saved Log'}
                          </span>
                        </div>
                      </div>

                      {/* Individual Delete Icon Button on each card */}
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, session)}
                        className="p-1.5 sm:p-2 rounded-xl text-brand-text-secondary hover:text-brand-danger hover:bg-red-50 border border-transparent hover:border-red-200 transition-all flex-shrink-0 flex items-center justify-center"
                        title={`Delete "${session.name}"`}
                        aria-label={`Delete ${session.name}`}
                      >
                        <Trash2 className="w-4 h-4 text-brand-danger" />
                      </button>
                    </div>

                    {/* Metadata Row: Date, Expense Count, Roommates */}
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] sm:text-xs text-brand-text-secondary/80 pl-6 sm:pl-8">
                      <span className="flex items-center gap-1 font-medium">
                        <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                        {formattedDate} {formattedTime}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-medium">
                        <Receipt className="w-3.5 h-3.5 flex-shrink-0" />
                        {session.expenses.length}{' '}
                        {session.expenses.length === 1 ? 'expense' : 'expenses'}
                      </span>
                      {session.roommates?.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-medium truncate max-w-[220px]">
                            <Users className="w-3.5 h-3.5 flex-shrink-0" />
                            {session.roommates.join(', ')}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Bottom Row: Total and Quick Action Buttons */}
                    <div className="flex flex-col xs:flex-row sm:flex-row sm:items-center justify-between gap-2.5 pt-2.5 border-t border-brand-border/60 pl-6 sm:pl-8">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider">
                          Total:
                        </span>
                        <span className="font-black text-brand-primary text-base sm:text-lg">
                          {formatCurrency(session.grandTotal)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 flex-wrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleExportCSV(e, session)}
                          className="h-7 sm:h-8 px-2 text-[11px] sm:text-xs text-brand-text-secondary hover:text-brand-text"
                          title="Export CSV for this session"
                        >
                          <FileText className="w-3.5 h-3.5 mr-1" />
                          CSV
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleExportPDF(e, session)}
                          className="h-7 sm:h-8 px-2 text-[11px] sm:text-xs text-brand-text-secondary hover:text-brand-text"
                          title="Download PDF report for this session"
                        >
                          <Download className="w-3.5 h-3.5 mr-1" />
                          PDF
                        </Button>
                        {onRestoreSession && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleRestore(e, session)}
                            className="h-7 sm:h-8 px-2 text-[11px] sm:text-xs text-brand-text-secondary hover:text-brand-primary"
                            title="Restore this session into active editor"
                          >
                            <RotateCcw className="w-3.5 h-3.5 mr-1" />
                            Restore
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpand(session.id)}
                          className="h-7 sm:h-8 px-2 text-[11px] sm:text-xs text-brand-primary font-bold hover:bg-brand-primary/10"
                        >
                          {isExpanded ? 'Hide Details' : 'View 3 Sections'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded 3 Sections */}
                  {isExpanded && (
                    <div className="border-t border-brand-border bg-evenly-bg/30 p-3 sm:p-6 space-y-4 sm:space-y-6 animate-in fade-in duration-150">
                      {/* Section 3: Who Owes What */}
                      <div className="bg-white rounded-xl border border-brand-border p-3.5 sm:p-5 shadow-xs">
                        <div className="flex items-center gap-2 mb-3 sm:mb-4">
                          <Scale className="w-4 h-4 sm:w-5 sm:h-5 text-brand-primary flex-shrink-0" />
                          <h4 className="text-sm sm:text-base font-bold text-brand-text">
                            3. Who Owes What ({session.name})
                          </h4>
                        </div>

                        {session.transactions.length === 0 ? (
                          <div className="flex items-center justify-center gap-2 py-5 text-brand-success bg-brand-success/5 rounded-xl border border-brand-success/20 px-3 text-center">
                            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                            <span className="font-semibold text-xs sm:text-sm">
                              All settled up! No outstanding debts for this session.
                            </span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                            {session.transactions.map((t, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-3 rounded-xl border border-brand-border bg-evenly-bg/50 shadow-2xs gap-2"
                              >
                                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-brand-text truncate min-w-0">
                                  <span className="truncate">{t.from}</span>
                                  <ArrowRight className="h-3.5 w-3.5 text-brand-text-secondary/60 flex-shrink-0" />
                                  <span className="truncate">{t.to}</span>
                                </div>
                                <span className="font-extrabold text-brand-primary text-sm sm:text-base flex-shrink-0">
                                  {formatCurrency(t.amount)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Section 4: Expense Log */}
                      <div className="bg-white rounded-xl border border-brand-border p-3.5 sm:p-5 shadow-xs">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                          <div className="flex items-center gap-2">
                            <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-brand-primary flex-shrink-0" />
                            <h4 className="text-sm sm:text-base font-bold text-brand-text">
                              4. Expense Log ({session.name})
                            </h4>
                          </div>
                          <span className="text-[11px] sm:text-xs font-semibold text-brand-text-secondary">
                            {session.expenses.length} {session.expenses.length === 1 ? 'item' : 'items'}
                          </span>
                        </div>

                        {session.expenses.length === 0 ? (
                          <div className="text-center py-5 text-brand-text-secondary text-xs sm:text-sm">
                            No expenses recorded in this session.
                          </div>
                        ) : (
                          <div className="space-y-2.5 sm:space-y-3">
                            {session.expenses.map((e) => (
                              <div
                                key={e.id}
                                className="p-3 sm:p-3.5 rounded-xl border border-brand-border bg-evenly-bg/40 text-xs sm:text-sm"
                              >
                                <div className="flex justify-between items-start mb-2 gap-2">
                                  <div className="min-w-0">
                                    <h5 className="font-bold text-brand-text break-words">
                                      {e.description}
                                    </h5>
                                    <p className="text-[10px] sm:text-xs text-brand-text-secondary/70">
                                      {new Date(e.date).toLocaleDateString(undefined, {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                      })}
                                    </p>
                                  </div>
                                  <div className="font-black text-brand-primary text-sm sm:text-base flex-shrink-0">
                                    {formatCurrency(e.amount)}
                                  </div>
                                </div>

                                <div className="text-[11px] sm:text-xs text-brand-text-secondary space-y-1 pt-2 border-t border-brand-border/60">
                                  <p className="break-words">
                                    <span className="font-semibold text-brand-text">Paid:</span>{' '}
                                    {Object.entries(e.paidBy || {})
                                      .filter(([_, amt]) => amt > 0)
                                      .map(([name, amt]) => `${name} ${formatCurrency(amt)}`)
                                      .join(', ') || 'None'}
                                  </p>
                                  <p className="break-words">
                                    <span className="font-semibold text-brand-text">Split:</span>{' '}
                                    {e.splitBetween?.join(', ') || 'All'}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Section 5: Total Spent by Person */}
                      <div className="bg-white rounded-xl border border-brand-border p-3.5 sm:p-5 shadow-xs">
                        <div className="flex items-center gap-2 mb-3 sm:mb-4">
                          <PieChart className="w-4 h-4 sm:w-5 sm:h-5 text-brand-primary flex-shrink-0" />
                          <h4 className="text-sm sm:text-base font-bold text-brand-text">
                            5. Total Spent by Person ({session.name})
                          </h4>
                        </div>

                        <div className="space-y-2">
                          {session.totalSpent.map((t, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between items-center p-2.5 sm:p-3 rounded-lg bg-evenly-bg/50 border border-brand-border/50 text-xs sm:text-sm"
                            >
                              <span className="font-semibold text-brand-text truncate pr-2">
                                {t.name}
                              </span>
                              <span className="font-bold text-brand-primary flex-shrink-0">
                                {formatCurrency(t.amount)}
                              </span>
                            </div>
                          ))}

                          <div className="flex items-center justify-between p-3 sm:p-3.5 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary rounded-xl mt-3">
                            <span className="font-bold text-[11px] sm:text-xs uppercase tracking-wider">
                              Session Grand Total
                            </span>
                            <span className="font-black text-base sm:text-lg">
                              {formatCurrency(session.grandTotal)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-brand-border/60">
                        {/* Individual Delete Action inside breakdown */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDelete(e, session)}
                          className="h-8 px-2.5 text-xs text-brand-danger hover:bg-red-50 hover:text-brand-danger"
                          title="Delete this saved log"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          Delete Log
                        </Button>

                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => handleExportCSV(e, session)}
                            className="h-8 px-2.5 text-xs"
                          >
                            <FileText className="w-3.5 h-3.5 mr-1" />
                            CSV
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => handleExportPDF(e, session)}
                            className="h-8 px-2.5 text-xs"
                          >
                            <Download className="w-3.5 h-3.5 mr-1" />
                            PDF
                          </Button>
                          {onRestoreSession && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={(e) => handleRestore(e, session)}
                              className="h-8 px-2.5 text-xs"
                            >
                              <RotateCcw className="w-3.5 h-3.5 mr-1" />
                              Load to Screen
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-white px-4 sm:px-6 py-3 sm:py-4 border-t border-brand-border flex items-center justify-between">
          <p className="text-[10px] sm:text-xs text-brand-text-secondary">
            Saved logs are kept in your browser storage.
          </p>
          <Button onClick={onClose} variant="secondary" size="sm">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
