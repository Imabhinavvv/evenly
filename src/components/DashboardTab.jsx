import React, { useMemo } from 'react';
import {
  Calendar,
  ArrowLeftRight,
  List,
  PieChart,
  Users,
  ArrowRight,
  CheckCircle2,
  PlusCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Button } from './ui/Button';
import { formatCurrency } from '../utils/currency';
import { useAnimatedCounter } from '../hooks/useAnimatedCounter';
import { getExpenseVisual } from '../utils/expenseVisuals';
import { getGroupCategoryMeta } from '../utils/groupHelper';

const CATEGORY_COLORS = {
  Home: '#10B981',
  Shopping: '#8B5CF6',
  Food: '#FF8A80',
  Utilities: '#F59E0B',
  Transport: '#3B82F6',
  Health: '#EC4899',
  Dining: '#F97316',
  Gifts: '#A855F7',
  Bills: '#6366F1',
  General: '#14B8A6',
};

function MetricCard({ icon: Icon, label, value, sublabel, accent = 'coral', isCurrency = false }) {
  const numericValue = isCurrency ? Math.round(value / 100) : value;
  const animated = useAnimatedCounter(numericValue);

  const bgStyles = {
    coral: 'bg-evenly-coral/25 text-evenly-coral-deep border-evenly-coral/30',
    sage: 'bg-evenly-sage/60 text-emerald-700 dark:text-emerald-400 border-evenly-sage',
    lavender: 'bg-evenly-lavender text-purple-700 dark:text-purple-300 border-evenly-lavender',
    success: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50',
  };

  return (
    <div className="bg-evenly-surface rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-brand-border shadow-xs hover:border-brand-border-hover transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border shrink-0 ${bgStyles[accent]}`}>
          <Icon className="w-5 h-5" strokeWidth={2.2} />
        </div>
        <div className="text-right min-w-0">
          <p className="text-[11px] sm:text-xs font-bold text-brand-text-secondary uppercase tracking-wider mb-1">
            {label}
          </p>
          <p className="text-2xl sm:text-3xl font-black text-brand-text tracking-tight truncate">
            {isCurrency ? formatCurrency(animated * 100) : animated.toLocaleString()}
          </p>
          {sublabel && (
            <p className="text-[11px] sm:text-xs text-brand-text-secondary font-medium mt-1 truncate">
              {sublabel}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardTab({
  groups = [],
  activeGroupId,
  onSelectGroup,
  expenses = [],
  roommates = [],
  transactions = [],
  totalSpent = [],
  history = [],
  onSwitchToSplit,
}) {
  const activeGroup = groups.find((g) => g.id === activeGroupId) || groups[0] || null;
  const activeMeta = getGroupCategoryMeta(activeGroup?.category);
  const ActiveCategoryIcon = activeMeta.icon;

  const currentMonthLabel = useMemo(
    () => new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
    []
  );

  const grandTotalSpent = useMemo(
    () => expenses.reduce((sum, e) => sum + (e.amount || 0), 0),
    [expenses]
  );
  const animatedGrandTotal = useAnimatedCounter(Math.round(grandTotalSpent / 100));

  const thisMonthTotal = useMemo(() => {
    const today = new Date();
    const currMonth = today.getMonth();
    const currYear = today.getFullYear();
    return expenses
      .filter((e) => {
        if (!e.date) return false;
        const d = new Date(e.date);
        return d.getMonth() === currMonth && d.getFullYear() === currYear;
      })
      .reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [expenses]);

  const pendingSettlementTotal = useMemo(
    () => transactions.reduce((sum, t) => sum + (t.amount || 0), 0),
    [transactions]
  );

  // Category Aggregation
  const categoryBreakdown = useMemo(() => {
    const map = {};
    expenses.forEach((e) => {
      const visual = getExpenseVisual(e.description || '');
      const catLabel = visual.label || 'General';

      if (!map[catLabel]) {
        map[catLabel] = {
          label: catLabel,
          icon: visual.icon,
          color: CATEGORY_COLORS[catLabel] || '#6B7280',
          total: 0,
          count: 0,
        };
      }
      map[catLabel].total += e.amount || 0;
      map[catLabel].count += 1;
    });

    const list = Object.values(map);
    list.sort((a, b) => b.total - a.total);
    return list;
  }, [expenses]);

  return (
    <div className="bg-evenly-surface rounded-2xl sm:rounded-3xl border border-brand-border shadow-xs divide-y divide-brand-border overflow-hidden animate-in fade-in-50 duration-200">
      {/* 0. Group Quick Selector Header */}
      <div className="p-5 sm:p-7">
        {!activeGroup || groups.length === 0 ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-black text-brand-text">
                No Groups Created Yet
              </h2>
              <p className="text-xs text-brand-text-secondary mt-0.5">
                Create a group to start adding members and splitting expenses.
              </p>
            </div>
            <Button onClick={onSwitchToSplit} size="sm" className="self-start sm:self-auto font-bold">
              Create a Group
            </Button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-evenly-coral/15 border border-brand-border/60 flex items-center justify-center text-brand-primary shrink-0">
                {ActiveCategoryIcon && <ActiveCategoryIcon className="w-5 h-5" />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-brand-text truncate">
                    {activeGroup.name}
                  </h2>
                  <span className="text-xs text-brand-text-secondary font-medium">
                    • {activeMeta.label}
                  </span>
                </div>
                <p className="text-xs text-brand-text-secondary mt-0.5">
                  {roommates.length} {roommates.length === 1 ? 'member' : 'members'} • {expenses.length} {expenses.length === 1 ? 'active expense' : 'active expenses'}
                </p>
              </div>
            </div>

            {groups.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
                {groups.map((grp) => {
                  const isSelected = grp.id === activeGroupId;
                  const meta = getGroupCategoryMeta(grp.category);
                  const GrpIcon = meta.icon;
                  return (
                    <button
                      key={grp.id}
                      type="button"
                      onClick={() => onSelectGroup && onSelectGroup(grp.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border ${
                        isSelected
                          ? 'bg-evenly-coral text-brand-text border-evenly-coral-deep/50 shadow-2xs'
                          : 'bg-brand-bg text-brand-text-secondary hover:text-brand-text hover:bg-evenly-surface border-brand-border/60'
                      }`}
                    >
                      {GrpIcon && <GrpIcon className="w-3.5 h-3.5 shrink-0" />}
                      <span className="truncate max-w-[110px]">{grp.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 1. Dedicated Total Spent Hero */}
      <div className="p-5 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] sm:text-xs font-black text-brand-text-secondary uppercase tracking-wider block">
              Total Spent
            </span>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-brand-text tracking-tight">
                {formatCurrency(animatedGrandTotal * 100)}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-brand-text-secondary font-medium">
              {expenses.length === 0 ? (
                <span>No active expenses in this group.</span>
              ) : (
                <>
                  Across <span className="font-bold text-brand-text">{expenses.length}</span> {expenses.length === 1 ? 'expense' : 'expenses'} • <span className="font-bold text-brand-text">{formatCurrency(thisMonthTotal)}</span> this month
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            {expenses.length > 0 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onSwitchToSplit}
                className="text-xs font-bold"
              >
                View in Split
                <ArrowRight className="w-3.5 h-3.5 ml-1 text-evenly-coral-deep" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={onSwitchToSplit}
                className="bg-brand-primary text-white hover:bg-brand-primary/90 text-xs font-bold"
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1" />
                Add Expense
              </Button>
            )}
          </div>
        </div>

        {/* Member contribution preview chips if expenses exist */}
        {totalSpent.length > 0 && expenses.length > 0 && (
          <div className="mt-4 pt-4 border-t border-brand-border/60 flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
            <span className="text-[11px] font-bold text-brand-text-secondary uppercase tracking-wider shrink-0 mr-1">
              Spent by:
            </span>
            {totalSpent.map((person) => (
              <div
                key={person.name}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-brand-bg border border-brand-border/70 text-xs shrink-0"
              >
                <span className="font-semibold text-brand-text truncate max-w-[90px]">{person.name}</span>
                <span className="font-black text-brand-primary">{formatCurrency(person.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Secondary Metrics Grid */}
      <div className="p-5 sm:p-7 bg-brand-bg/30">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
          <MetricCard
            accent="lavender"
            icon={Calendar}
            label="This Month"
            value={thisMonthTotal}
            sublabel={currentMonthLabel}
            isCurrency
          />
          <MetricCard
            accent={transactions.length > 0 ? 'coral' : 'success'}
            icon={ArrowLeftRight}
            label="Pending Debts"
            value={pendingSettlementTotal}
            sublabel={transactions.length === 0 ? 'All settled' : `${transactions.length} transfer${transactions.length !== 1 ? 's' : ''}`}
            isCurrency
          />
          <MetricCard
            accent="sage"
            icon={List}
            label="Logs & History"
            value={expenses.length + history.length}
            sublabel={`${history.length} archived ${history.length === 1 ? 'session' : 'sessions'}`}
          />
        </div>
      </div>

      {/* 3. Visual Charts & Breakdowns OR Empty State */}
      <div className="p-5 sm:p-7">
        {expenses.length === 0 ? (
          /* Empty State */
          <div className="py-8 sm:py-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-evenly-coral/20 flex items-center justify-center mx-auto mb-4 text-evenly-coral-deep shadow-2xs">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-lg sm:text-xl font-black text-brand-text mb-1">
              No Expenses Logged Yet
            </h3>
            <p className="text-xs sm:text-sm text-brand-text-secondary max-w-sm mx-auto mb-5 leading-relaxed">
              Add members and log shared bills in the Split tab.
            </p>
            <Button
              size="sm"
              onClick={onSwitchToSplit}
              className="inline-flex items-center gap-1.5 bg-brand-primary text-white hover:bg-brand-primary/90 font-bold px-5 py-2 rounded-xl shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Go to Split Tab
            </Button>
          </div>
        ) : (
          /* Visual Charts & Breakdowns */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Visual 1: Category Spending Distribution */}
            <div className="bg-brand-bg/40 rounded-2xl p-5 sm:p-6 border border-brand-border/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-evenly-lavender flex items-center justify-center text-purple-700">
                      <PieChart className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-brand-text">
                        Spending by Category
                      </h3>
                      <p className="text-xs text-brand-text-secondary">
                        Spending breakdown by category.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Segmented Stacked Progress Bar */}
                {grandTotalSpent > 0 && (
                  <div className="w-full h-3.5 rounded-full overflow-hidden flex bg-stone-100 dark:bg-stone-800/80 p-0.5 border border-brand-border/60 mb-6">
                    {categoryBreakdown.map((cat) => {
                      const pct = Math.max(2, Math.round((cat.total / grandTotalSpent) * 100));
                      return (
                        <div
                          key={cat.label}
                          style={{ width: `${pct}%`, backgroundColor: cat.color }}
                          className="h-full rounded-full transition-all duration-300 first:rounded-l-full last:rounded-r-full"
                          title={`${cat.label}: ${pct}% (${formatCurrency(cat.total)})`}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Category Breakdown Rows */}
                <div className="space-y-3 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                  {categoryBreakdown.map((cat) => {
                    const Icon = cat.icon;
                    const pct = grandTotalSpent > 0 ? Math.round((cat.total / grandTotalSpent) * 100) : 0;
                    return (
                      <div
                        key={cat.label}
                        className="p-3 rounded-2xl bg-evenly-surface border border-brand-border/60 flex items-center justify-between gap-3 hover:border-brand-border transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
                            style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-bold text-brand-text truncate">
                              {cat.label}
                            </p>
                            <p className="text-[10px] text-brand-text-secondary font-medium">
                              {cat.count} {cat.count === 1 ? 'transaction' : 'transactions'}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-xs sm:text-sm font-black text-brand-text">
                            {formatCurrency(cat.total)}
                          </p>
                          <p className="text-[10px] font-bold text-brand-text-secondary">
                            {pct}% of total
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Visual 2: Member Contribution & Spending Share */}
            <div className="bg-brand-bg/40 rounded-2xl p-5 sm:p-6 border border-brand-border/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-evenly-sage flex items-center justify-center text-emerald-700">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-brand-text">
                        Member Contributions
                      </h3>
                      <p className="text-xs text-brand-text-secondary">
                        Individual spending contributions.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Roommate Share Bars */}
                <div className="space-y-4 pt-2">
                  {totalSpent.length === 0 ? (
                    <p className="text-xs text-brand-text-secondary italic text-center py-8">
                      No contributions recorded yet.
                    </p>
                  ) : (
                    totalSpent.map((person, idx) => {
                      const pct = grandTotalSpent > 0 ? Math.round((person.amount / grandTotalSpent) * 100) : 0;
                      const isTopContributor = idx === 0 && person.amount > 0;

                      return (
                        <div key={person.name} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-brand-text">{person.name}</span>
                              {isTopContributor && (
                                <span className="text-[10px] font-bold text-evenly-coral-deep">
                                  (Top Spender)
                                </span>
                              )}
                            </div>
                            <span className="font-extrabold text-brand-text">
                              {formatCurrency(person.amount)} ({pct}%)
                            </span>
                          </div>

                          {/* Visual Progress Bar */}
                          <div className="w-full h-2.5 rounded-full bg-evenly-surface border border-brand-border/60 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-brand-primary transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Quick Settle Status Summary */}
              <div className="mt-6 pt-4 border-t border-brand-border/60 flex items-center justify-between">
                <span className="text-xs font-semibold text-brand-text-secondary">
                  Settlement Status
                </span>
                {transactions.length === 0 ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-success">
                    <CheckCircle2 className="w-4 h-4" />
                    All Settled Up
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                    <ArrowLeftRight className="w-4 h-4" />
                    {transactions.length} {transactions.length === 1 ? 'transfer' : 'transfers'} pending
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Visual 3: Who Owes What Quick Flow Cards (if pending) */}
      {transactions.length > 0 && (
        <div className="p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-200">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-brand-text">
                  Settlement Flow
                </h3>
                <p className="text-xs text-brand-text-secondary">
                  Suggested debt settlement transfers.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={onSwitchToSplit}
              className="self-start sm:self-auto text-xs font-bold"
            >
              Open Split Screen
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {transactions.map((t, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-brand-bg/60 border border-brand-border flex items-center justify-between gap-3 hover:border-brand-border-hover transition-all"
              >
                <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-brand-text truncate">
                  <span className="text-brand-danger font-bold truncate">{t.from}</span>
                  <ArrowRight className="w-4 h-4 text-brand-text-secondary/50 shrink-0" />
                  <span className="text-emerald-600 font-bold truncate">{t.to}</span>
                </div>
                <span className="text-sm sm:text-base font-black text-brand-primary shrink-0">
                  {formatCurrency(t.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Visual 4: Historical Sessions Snapshot */}
      {history.length > 0 && (
        <div className="p-5 sm:p-7">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-evenly-coral/20 flex items-center justify-center text-evenly-coral-deep">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-brand-text">
                  Past Saved Sessions
                </h3>
                <p className="text-xs text-brand-text-secondary">
                  Past settlement snapshots.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {history.slice(0, 6).map((session) => (
              <div
                key={session.id}
                className="p-4 rounded-xl bg-brand-bg/50 border border-brand-border/60 flex flex-col justify-between hover:border-brand-border transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <h4 className="text-xs sm:text-sm font-bold text-brand-text truncate">
                      {session.name}
                    </h4>
                    <span className="text-[11px] font-semibold text-brand-text-secondary">
                      {session.isSettled ? 'Settled' : 'Saved'}
                    </span>
                  </div>
                  <p className="text-[11px] text-brand-text-secondary">
                    {new Date(session.savedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })} • {session.expenses?.length || 0} items
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-brand-border/40 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-brand-text-secondary uppercase">
                    Grand Total
                  </span>
                  <span className="text-sm font-black text-brand-text">
                    {formatCurrency(session.grandTotal)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
