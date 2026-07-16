// settlement.js
// Exact cents logic using modulo remainder distribution.

export function calculateSettlement(expenses, roommates) {
  let netBalances = {};
  roommates.forEach(r => netBalances[r] = 0);

  expenses.forEach(expense => {
    const { amount, paidBy, splitBetween } = expense;
    if (!splitBetween || splitBetween.length === 0) return;

    // amount is passed in cents directly (Math.round(val * 100))
    const totalCents = amount; 
    
    // Credit people who paid
    Object.entries(paidBy).forEach(([name, paidAmount]) => {
      if (netBalances[name] !== undefined) {
        netBalances[name] += paidAmount;
      }
    });

    // Debit people who split
    const splitCents = Math.floor(totalCents / splitBetween.length);
    const remainder = totalCents % splitBetween.length;

    splitBetween.forEach((name, idx) => {
      const extra = idx < remainder ? 1 : 0;
      if (netBalances[name] !== undefined) {
        netBalances[name] -= (splitCents + extra);
      }
    });
  });

  // Greedy debtor-creditor matching
  let debtors = [];
  let creditors = [];

  Object.keys(netBalances).forEach(name => {
    const b = netBalances[name];
    if (b > 0) creditors.push({ name, amount: b });
    else if (b < 0) debtors.push({ name, amount: Math.abs(b) });
  });

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  let transactions = [];
  let dIndex = 0;
  let cIndex = 0;

  while (dIndex < debtors.length && cIndex < creditors.length) {
    let d = debtors[dIndex];
    let c = creditors[cIndex];

    let settledAmount = Math.min(d.amount, c.amount);

    transactions.push({ from: d.name, to: c.name, amount: settledAmount });

    d.amount -= settledAmount;
    c.amount -= settledAmount;

    if (d.amount === 0) dIndex++;
    if (c.amount === 0) cIndex++;
  }

  return transactions;
}

export function calculateTotalSpent(expenses, roommates) {
  let totals = {};
  roommates.forEach(r => totals[r] = 0);

  expenses.forEach(expense => {
    const { paidBy } = expense;
    if (!paidBy) return;

    Object.entries(paidBy).forEach(([name, paidAmount]) => {
      if (totals[name] !== undefined) {
        totals[name] += paidAmount;
      }
    });
  });

  let result = Object.keys(totals)
    .map(name => ({ name, amount: totals[name] }))
    .filter(person => person.amount > 0);
    
  result.sort((a, b) => b.amount - a.amount);
  return result;
}
