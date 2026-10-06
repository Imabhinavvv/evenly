import { formatCurrency, formatCurrencyDecimal } from './currency';

export async function generateCSV(expenses, transactions, sessionName = null) {
  // Expense Log Section
  let csvContent = sessionName ? `Evenly Expense Log - ${sessionName}\n\n` : "Expense Log\n";
  csvContent += "ID,Date,Description,Total Amount (Rs),Paid By,Split Between,Share Per Person (Rs)\n";

  expenses.forEach((e, idx) => {
    const date = new Date(e.date).toLocaleDateString();
    const desc = `"${e.description.replace(/"/g, '""')}"`;
    const amount = `"${formatCurrency(e.amount)}"`;
    
    // Format Paid By: Name (Amount), ...
    const paidByStr = Object.entries(e.paidBy)
      .filter(([_, amt]) => amt > 0)
      .map(([name, amt]) => `${name} (${formatCurrency(amt)})`)
      .join(', ');
    const paidByEscaped = `"${paidByStr.replace(/"/g, '""')}"`;

    const splitStr = e.splitBetween.join(', ');
    const splitEscaped = `"${splitStr.replace(/"/g, '""')}"`;
    
    const perPerson = e.splitBetween.length > 0 
      ? `"${formatCurrencyDecimal(e.amount / e.splitBetween.length / 100)}"` 
      : '"0.00"';

    csvContent += `${idx + 1},${date},${desc},${amount},${paidByEscaped},${splitEscaped},${perPerson}\n`;
  });

  csvContent += "\nSettlement Summary\n";
  csvContent += "ID,From,To,Amount (Rs)\n";

  transactions.forEach((t, idx) => {
    csvContent += `${idx + 1},${t.from},${t.to},"${formatCurrency(t.amount)}"\n`;
  });

  const filenameDate = new Date().toISOString().split('T')[0];
  const safeFilename = sessionName
    ? `evenly-${sessionName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'session'}.csv`
    : `evenly-summary-${filenameDate}.csv`;

  // On native Android, use Capacitor Filesystem + Share instead of blob/anchor
  const { Capacitor } = await import('@capacitor/core');
  if (Capacitor.isNativePlatform()) {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');

    // Convert CSV string to base64
    const base64Data = btoa(unescape(encodeURIComponent(csvContent)));

    const result = await Filesystem.writeFile({
      path: safeFilename,
      data: base64Data,
      directory: Directory.Cache,
    });

    await Share.share({
      title: safeFilename,
      url: result.uri,
      dialogTitle: 'Save / Share CSV',
    });
    return;
  }

  // Web fallback: blob + anchor click
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", safeFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
