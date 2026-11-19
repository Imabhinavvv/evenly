import { buildPDFDocument } from './pdfExport.js';
import { formatCurrency } from './currency.js';
import { Capacitor } from '@capacitor/core';

/**
 * Formats a clean, readable text summary highlighting "Who Owes What".
 */
export function formatSettlementSummary(expenses = [], transactions = [], sessionName = null) {
  const title = sessionName ? `Evenly Settlement Report — ${sessionName}` : 'Evenly Settlement Report';
  const grandTotal = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  let text = `${title}\n`;
  text += `Date: ${new Date().toLocaleDateString(undefined, { dateStyle: 'medium' })}\n`;
  text += `Total Expenses: ${formatCurrency(grandTotal)}\n\n`;
  text += `Who Owes What (Summary):\n`;

  if (!transactions || transactions.length === 0) {
    text += `Everyone is all settled up. No transfers needed.\n`;
  } else {
    transactions.forEach((t) => {
      text += `• ${t.from} owes ${t.to}: ${formatCurrency(t.amount)}\n`;
    });
  }

  text += `\nShared via Evenly`;
  return text;
}

/**
 * Shares the log and PDF to a selected app (WhatsApp, Email, Telegram, SMS, System, or Clipboard).
 *
 * @param {Object} options
 * @param {string} options.app - 'whatsapp' | 'email' | 'telegram' | 'sms' | 'system' | 'copy'
 * @param {Array} options.expenses
 * @param {Array} options.roommates
 * @param {Array} options.transactions
 * @param {Array} options.totalSpent
 * @param {string} [options.sessionName]
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function shareLogViaApp({
  app,
  expenses = [],
  roommates = [],
  transactions = [],
  totalSpent = [],
  sessionName = null,
}) {
  const { doc, safeFilename } = buildPDFDocument(
    expenses,
    roommates,
    transactions,
    totalSpent,
    sessionName
  );

  const textSummary = formatSettlementSummary(expenses, transactions, sessionName);
  const subject = sessionName ? `Evenly Report — ${sessionName}` : 'Evenly Settlement Report';

  // 1. Copy Summary to Clipboard
  if (app === 'copy') {
    try {
      await navigator.clipboard.writeText(textSummary);
      return { success: true, message: 'Who owes what summary copied to clipboard!' };
    } catch {
      return { success: false, message: 'Could not access clipboard.' };
    }
  }

  // 2. Native Capacitor Android Handling (PDF + Text passed to target application)
  if (Capacitor.isNativePlatform()) {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');

    const pdfBase64 = doc.output('datauristring').split(',')[1];

    // Save to Cache so Android apps can easily read it via fileprovider
    const savedFile = await Filesystem.writeFile({
      path: safeFilename,
      data: pdfBase64,
      directory: Directory.Cache,
    });

    // Also persist a copy to Documents/Evenly
    try {
      await Filesystem.writeFile({
        path: `Evenly/${safeFilename}`,
        data: pdfBase64,
        directory: Directory.Documents,
        recursive: true,
      });
    } catch (docErr) {
      console.warn('Could not save duplicate to Documents/Evenly:', docErr);
    }

    // Call native Share sheet
    try {
      await Share.share({
        title: safeFilename,
        text: textSummary,
        url: savedFile.uri,
        dialogTitle: 'Share Report',
      });

      return {
        success: true,
        message: 'Report ready to share!',
      };
    } catch {
      return {
        success: true,
        message: '',
      };
    }
  }

  // 3. Web / Desktop Browser Handling
  switch (app) {
    case 'whatsapp': {
      doc.save(safeFilename);
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(textSummary)}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
      return {
        success: true,
        message: 'PDF downloaded! WhatsApp opened with your settlement summary.',
      };
    }

    case 'email': {
      doc.save(safeFilename);
      const emailBody = `${textSummary}\n\n(Attached: ${safeFilename})`;
      const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
      window.location.href = mailtoUrl;
      return {
        success: true,
        message: 'PDF downloaded! Email composer opened with your summary.',
      };
    }

    case 'telegram': {
      doc.save(safeFilename);
      const tgUrl = `https://t.me/share/url?text=${encodeURIComponent(textSummary)}`;
      window.open(tgUrl, '_blank', 'noopener,noreferrer');
      return {
        success: true,
        message: 'PDF downloaded! Telegram opened with your settlement summary.',
      };
    }

    case 'sms': {
      const smsUrl = `sms:?body=${encodeURIComponent(textSummary)}`;
      window.location.href = smsUrl;
      return {
        success: true,
        message: 'SMS composer opened with your settlement summary.',
      };
    }

    case 'system':
    default: {
      const pdfBlob = doc.output('blob');
      const pdfFile = new File([pdfBlob], safeFilename, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        try {
          await navigator.share({
            title: subject,
            text: textSummary,
            files: [pdfFile],
          });
          return { success: true, message: 'PDF shared successfully!' };
        } catch (err) {
          if (err.name !== 'AbortError') {
            doc.save(safeFilename);
            return { success: true, message: 'PDF downloaded!' };
          }
          return { success: false, message: 'Share canceled.' };
        }
      } else {
        doc.save(safeFilename);
        if (navigator.share) {
          try {
            await navigator.share({
              title: subject,
              text: textSummary,
            });
          } catch {
            // Ignore cancel
          }
        }
        return { success: true, message: 'PDF downloaded successfully!' };
      }
    }
  }
}
