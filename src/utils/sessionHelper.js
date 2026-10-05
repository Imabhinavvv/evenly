import { calculateSettlement, calculateTotalSpent } from './settlement.js';

/**
 * Generates a clean, intelligent default session name based on expense dates or current date.
 * E.g., "July 2026 Log", "August 2026 Settlement", etc.
 */
export function getDefaultSessionName(expenses = [], isSettling = false) {
  let targetDate = new Date();

  if (expenses && expenses.length > 0) {
    // Find the most frequent or newest expense date
    const validDates = expenses
      .map(e => (e.date ? new Date(e.date) : null))
      .filter(d => d && !isNaN(d.getTime()));

    if (validDates.length > 0) {
      // Sort newest first
      validDates.sort((a, b) => b - a);
      targetDate = validDates[0];
    }
  }

  const month = targetDate.toLocaleDateString('en-US', { month: 'long' });
  const year = targetDate.getFullYear();
  const suffix = isSettling ? 'Settlement' : 'Log';

  return `${month} ${year} ${suffix}`;
}

/**
 * Creates an immutable snapshot of an expense calculating session.
 * Stores Section 3 (settlement debts), Section 4 (expenses), Section 5 (total spent per person),
 * and metadata (id, name, savedAt, isSettled, roommates, grandTotal).
 */
export function createSessionSnapshot({ name, expenses, roommates, isSettled = false }) {
  const cleanName = (name && name.trim()) ? name.trim() : getDefaultSessionName(expenses, isSettled);
  const now = new Date();

  const safeExpenses = Array.isArray(expenses) ? JSON.parse(JSON.stringify(expenses)) : [];
  const safeRoommates = Array.isArray(roommates) ? [...roommates] : [];

  const transactions = calculateSettlement(safeExpenses, safeRoommates);
  const totalSpent = calculateTotalSpent(safeExpenses, safeRoommates);
  const grandTotal = safeExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  return {
    id: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    name: cleanName,
    savedAt: now.toISOString(),
    isSettled: Boolean(isSettled),
    roommates: safeRoommates,
    expenses: safeExpenses,
    transactions,
    totalSpent,
    grandTotal,
  };
}
