import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrencyForPDF } from './currency';

export async function generatePDF(expenses, roommates, transactions, totalSpent, sessionName = null) {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(20);
  const mainTitle = sessionName ? `Evenly Report — ${sessionName}` : 'Evenly Settlement Report';
  doc.text(mainTitle, 14, 22);

  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

  let currentY = 40;

  // 1. Total Spent Analytics
  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text('Total Spent by Person', 14, currentY);
  currentY += 5;

  const totalSpentBody = totalSpent.map(t => [
    t.name,
    formatCurrencyForPDF(t.amount)
  ]);

  const grandTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
  totalSpentBody.push(['Grand Total', formatCurrencyForPDF(grandTotal)]);

  autoTable(doc, {
    startY: currentY,
    head: [['Person', 'Total Spent (Share of Expenses)']],
    body: totalSpentBody,
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229] }, // indigo-600
    footStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0], fontStyle: 'bold' },
    didParseCell: function (data) {
      if (data.row.index === totalSpentBody.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [240, 240, 240];
      }
    }
  });

  currentY = doc.lastAutoTable.finalY + 15;

  // 2. Finalized Settlement
  if (currentY > 250) { doc.addPage(); currentY = 20; }
  doc.setFontSize(16);
  doc.text('Finalized Settlement (Who Owes What)', 14, currentY);
  currentY += 5;

  if (transactions.length > 0) {
    const settlementBody = transactions.map(d => [
      d.from,
      d.to,
      formatCurrencyForPDF(d.amount)
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Who Pays', 'To Whom', 'Amount']],
      body: settlementBody,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] } // emerald-500
    });
    currentY = doc.lastAutoTable.finalY + 15;
  } else {
    doc.setFontSize(12);
    doc.text('Everyone is settled up!', 14, currentY + 5);
    currentY += 15;
  }

  // 3. All Expense Entries
  if (currentY > 250) { doc.addPage(); currentY = 20; }
  doc.setFontSize(16);
  doc.text('All Expense Entries', 14, currentY);
  currentY += 5;

  if (expenses.length > 0) {
    const expenseBody = expenses.map(e => {
      const date = new Date(e.date).toLocaleDateString();
      const paidBy = Object.entries(e.paidBy)
        .filter(([_, amt]) => amt > 0)
        .map(([name, amt]) => `${name} (${formatCurrencyForPDF(amt)})`)
        .join(', ');
      const split = e.splitBetween.join(', ');
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
      headStyles: { fillColor: [52, 73, 94], textColor: 255 },
      styles: { cellPadding: 3, fontSize: 10 }
    });
  } else {
    doc.setFontSize(12);
    doc.text('No expenses logged.', 14, currentY + 5);
  }

  // Save PDF — platform-aware
  const safeFilename = sessionName
    ? `evenly-${sessionName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'session'}.pdf`
    : 'evenly-settlement.pdf';

  const { Capacitor } = await import('@capacitor/core');
  if (Capacitor.isNativePlatform()) {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');

    // Get base64 PDF data (strip the data URI prefix)
    const pdfBase64 = doc.output('datauristring').split(',')[1];

    // Save to public Documents folder so the file is easy to find
    const result = await Filesystem.writeFile({
      path: `Evenly/${safeFilename}`,
      data: pdfBase64,
      directory: Directory.Documents,
      recursive: true,           // create the Evenly/ sub-folder if needed
    });

    // Show native alert with save location before opening share sheet
    window.alert(`✅ PDF saved!\n\nLocation: Documents/Evenly/${safeFilename}\n\nYou can also share or open it with the options below.`);

    await Share.share({
      title: safeFilename,
      url: result.uri,
      dialogTitle: 'Open / Share PDF',
    });
    return result.uri;
  } else {
    doc.save(safeFilename);
  }
}
