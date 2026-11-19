import JSZip from 'jszip';
import { Capacitor } from '@capacitor/core';
import QRCode from 'qrcode';
import jsQR from 'jsqr';

/**
 * Compactly encodes an Evenly log into a minimal string for QR codes.
 *
 * @param {Object} log - { name, roommates, expenses }
 * @returns {string} Compact JSON string
 */
export function encodeLogToQR(log = {}) {
  const roommates = Array.isArray(log.roommates) ? log.roommates : [];
  const expenses = Array.isArray(log.expenses) ? log.expenses : [];
  const isSettled = Boolean(log.isSettled);

  const compact = {
    t: 'el', // Evenly Log
    v: 1,
    n: (log.name || 'Expense Log').trim(),
    m: roommates,
    e: expenses.map((exp) => [
      exp.description || '',
      Number(exp.amount) || 0,
      exp.paidBy || {},
      Array.isArray(exp.splitBetween) ? exp.splitBetween : [],
      exp.date ? String(exp.date).slice(0, 10) : '',
    ]),
  };

  if (isSettled) {
    compact.s = 1;
  }

  return JSON.stringify(compact);
}

/**
 * Decodes a compact QR string back into a standard Evenly log object.
 *
 * @param {string} rawText
 * @returns {Object} { name, roommates, expenses, grandTotal }
 */
export function decodeLogFromQR(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Invalid QR code data.');
  }

  let data;
  try {
    data = JSON.parse(rawText.trim());
  } catch {
    throw new Error('QR code is not a valid Evenly log.');
  }

  if (!data || data.t !== 'el') {
    throw new Error('QR code is not an Evenly log format.');
  }

  const roommates = Array.isArray(data.m) ? data.m : [];
  const rawExpenses = Array.isArray(data.e) ? data.e : [];

  const now = new Date();
  const expenses = rawExpenses.map((t, idx) => {
    const desc = t[0] || 'Expense';
    const amount = Number(t[1]) || 0;
    const paidBy = (t[2] && typeof t[2] === 'object') ? t[2] : {};
    const splitBetween = Array.isArray(t[3]) && t[3].length > 0 ? t[3] : [...roommates];
    const dateStr = t[4] ? new Date(t[4]).toISOString() : now.toISOString();

    return {
      id: `imp_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      description: desc,
      amount,
      paidBy,
      splitBetween,
      date: dateStr,
    };
  });

  const grandTotal = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  return {
    name: data.n || 'Imported Log',
    roommates,
    expenses,
    grandTotal,
    isSettled: Boolean(data.s),
  };
}

/**
 * Generates a clean QR code data URL from log data.
 *
 * @param {Object} log
 * @returns {Promise<{ dataUrl: string, length: number, isTooLarge: boolean }>}
 */
export async function generateLogQRDataUrl(log) {
  const encoded = encodeLogToQR(log);
  const length = encoded.length;

  // Practical QR capacity threshold for standard phone cameras: ~1600 characters
  if (length > 1600) {
    return {
      dataUrl: null,
      length,
      isTooLarge: true,
    };
  }

  const dataUrl = await QRCode.toDataURL(encoded, {
    errorCorrectionLevel: 'L',
    margin: 2,
    width: 320,
    color: {
      dark: '#141316',
      light: '#FFFFFF',
    },
  });

  return {
    dataUrl,
    length,
    isTooLarge: false,
  };
}

/**
 * Scans image pixel data for an Evenly QR code using jsQR.
 *
 * @param {ImageData} imageData
 * @returns {Object|null} Decoded log object or null
 */
export function scanImageDataForQR(imageData) {
  if (!imageData || !imageData.data) return null;
  const result = jsQR(imageData.data, imageData.width, imageData.height);
  if (!result || !result.data) return null;

  try {
    return decodeLogFromQR(result.data);
  } catch {
    return null;
  }
}

/**
 * Packages a single log into a .evenly file.
 *
 * @param {Object} log - { name, roommates, expenses }
 * @returns {Promise<{ zip: JSZip, fileName: string }>}
 */
export async function createSingleLogPackage(log) {
  const zip = new JSZip();

  const safeRoommates = Array.isArray(log.roommates) ? log.roommates : [];
  const safeExpenses = Array.isArray(log.expenses) ? log.expenses : [];
  const grandTotal = safeExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const manifest = {
    app: 'evenly',
    version: 1,
    type: 'SINGLE_LOG',
    timestamp: new Date().toISOString(),
    meta: {
      name: log.name || 'Expense Log',
      roommatesCount: safeRoommates.length,
      expensesCount: safeExpenses.length,
      grandTotal,
      isSettled: Boolean(log.isSettled),
    },
  };
  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  const data = {
    type: 'SINGLE_LOG',
    log: {
      name: log.name || 'Expense Log',
      roommates: safeRoommates,
      expenses: safeExpenses,
      grandTotal,
      isSettled: Boolean(log.isSettled),
      exportedAt: new Date().toISOString(),
    },
  };
  zip.file('data.json', JSON.stringify(data, null, 2));

  const baseName = (log.name || 'log')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .slice(0, 30);
  const fileName = `evenly_log_${baseName}.evenly`;

  return { zip, fileName, grandTotal };
}

/**
 * Exports and shares a single log as a .evenly file.
 * Uses Capacitor Share on native mobile (Quick Share, Bluetooth, messaging) or downloads on web.
 *
 * @param {Object} log
 * @returns {Promise<{ success: boolean, fileName: string }>}
 */
export async function shareSingleLogFile(log) {
  const { zip, fileName } = await createSingleLogPackage(log);

  if (Capacitor.isNativePlatform()) {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');

    const base64Zip = await zip.generateAsync({
      type: 'base64',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    // Write to cache directory for native share intent
    const fileResult = await Filesystem.writeFile({
      path: fileName,
      data: base64Zip,
      directory: Directory.Cache,
    });

    await Share.share({
      title: `Evenly Log: ${log.name || 'Expense Log'}`,
      text: `Evenly Log: "${log.name || 'Expense Log'}" (${log.expenses?.length || 0} expenses). Tap to open in Evenly.`,
      url: fileResult.uri,
      dialogTitle: 'Share Evenly Log',
    });

    return { success: true, fileName };
  } else {
    // Browser download
    const blob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    return { success: true, fileName };
  }
}
