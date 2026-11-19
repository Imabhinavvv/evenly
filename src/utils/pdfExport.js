import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrencyForPDF } from './currency.js';

/**
 * Builds the jsPDF document instance with "Who Owes What (Quick Summary)" prominently first.
 */
export function buildPDFDocument(expenses, roommates, transactions = [], totalSpent = [], sessionName = null) {
  const doc = new jsPDF();

  const safeFilename = sessionName
    ? `evenly-${sessionName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'session'}.pdf`
    : 'evenly-settlement.pdf';

  // Title header bar
  doc.setFillColor(255, 183, 178); // evenly-coral accent
  doc.rect(14, 12, 4, 18, 'F');

  doc.setFontSize(20);
  doc.setTextColor(41, 37, 36);
  const mainTitle = sessionName ? `Evenly Report — ${sessionName}` : 'Evenly Settlement Report';
  doc.text(mainTitle, 22, 21);

  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`Generated on: ${new Date().toLocaleDateString(undefined, { dateStyle: 'full' })}`, 22, 28);

  let currentY = 38;

  // 1. Who Owes What (Quick Summary) - Positioned First as an executive summary
  doc.setFontSize(15);
  doc.setTextColor(41, 37, 36);
  doc.text('1. Who Owes What (Quick Summary)', 14, currentY);
  currentY += 4;

  if (transactions && transactions.length > 0) {
    const settlementBody = transactions.map(d => [
      d.from,
      d.to,
      formatCurrencyForPDF(d.amount)
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Who Pays (Debtor)', 'To Whom (Creditor)', 'Amount to Settle']],
      body: settlementBody,
      theme: 'striped',
      headStyles: { fillColor: [43, 224, 140], textColor: [20, 30, 20], fontStyle: 'bold' },
      styles: { cellPadding: 3.5, fontSize: 10 }
    });
    currentY = doc.lastAutoTable.finalY + 12;
  } else {
    doc.setFontSize(11);
    doc.setTextColor(76, 175, 80);
    doc.text('All settled up! Everyone is even — no outstanding transfers.', 14, currentY + 6);
    currentY += 16;
  }

  // 2. Total Spent by Person
  if (currentY > 230) { doc.addPage(); currentY = 20; }
  doc.setFontSize(15);
  doc.setTextColor(41, 37, 36);
  doc.text('2. Total Spent by Person', 14, currentY);
  currentY += 4;

  const totalSpentBody = (totalSpent || []).map(t => [
    t.name,
    formatCurrencyForPDF(t.amount)
  ]);

  const grandTotal = (expenses || []).reduce((sum, e) => sum + (e.amount || 0), 0);
  totalSpentBody.push(['Grand Total', formatCurrencyForPDF(grandTotal)]);

  autoTable(doc, {
    startY: currentY,
    head: [['Person', 'Total Contributed / Spent']],
    body: totalSpentBody,
    theme: 'grid',
    headStyles: { fillColor: [91, 107, 255], textColor: [255, 255, 255] },
    footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
    styles: { cellPadding: 3.5, fontSize: 10 },
    didParseCell: function (data) {
      if (data.row.index === totalSpentBody.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [245, 245, 245];
      }
    }
  });

  currentY = doc.lastAutoTable.finalY + 12;

  // 3. Itemized Expense Entries
  if (currentY > 220) { doc.addPage(); currentY = 20; }
  doc.setFontSize(15);
  doc.setTextColor(41, 37, 36);
  doc.text('3. Itemized Expense Log', 14, currentY);
  currentY += 4;

  if (expenses && expenses.length > 0) {
    const expenseBody = expenses.map(e => {
      const date = new Date(e.date).toLocaleDateString();
      const paidBy = Object.entries(e.paidBy || {})
        .filter(([_, amt]) => amt > 0)
        .map(([name, amt]) => `${name} (${formatCurrencyForPDF(amt)})`)
        .join(', ');
      const split = (e.splitBetween || []).join(', ');
      return [
        date,
        e.description,
        formatCurrencyForPDF(e.amount),
        paidBy,
        split
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [['Date', 'Description', 'Total', 'Paid By', 'Split Between']],
      body: expenseBody,
      theme: 'plain',
      headStyles: { fillColor: [41, 37, 36], textColor: 255 },
      styles: { cellPadding: 3, fontSize: 9 }
    });
  } else {
    doc.setFontSize(11);
    doc.setTextColor(120);
    doc.text('No expenses logged.', 14, currentY + 6);
  }

  return { doc, safeFilename };
}

/**
 * Standard PDF Generator / Downloader.
 */
export async function generatePDF(expenses, roommates, transactions, totalSpent, sessionName = null) {
  const { doc, safeFilename } = buildPDFDocument(expenses, roommates, transactions, totalSpent, sessionName);

  const { Capacitor } = await import('@capacitor/core');
  if (Capacitor.isNativePlatform()) {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');

    // Get base64 PDF data
    const pdfBase64 = doc.output('datauristring').split(',')[1];

    // Save to public Documents folder
    const result = await Filesystem.writeFile({
      path: `Evenly/${safeFilename}`,
      data: pdfBase64,
      directory: Directory.Documents,
      recursive: true,
    });

    try {
      await Share.share({
        title: safeFilename,
        url: result.uri,
        dialogTitle: 'Open / Share PDF',
      });
    } catch {
      // File is already saved to Documents/Evenly
    }
    return result.uri;
  } else {
    doc.save(safeFilename);
    return safeFilename;
  }
}
