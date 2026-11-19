/**
 * Offline Receipt Parser
 * Parses recognized text lines to extract Merchant name, Total amount, Currency, and Line items.
 */

const CURRENCY_SYMBOLS = [
  { regex: /(?:₹|Rs\.?|INR)/i, code: 'INR' },
  { regex: /(?:\$|USD)/i, code: 'USD' },
  { regex: /(?:€|EUR)/i, code: 'EUR' },
  { regex: /(?:£|GBP)/i, code: 'GBP' },
  { regex: /(?:¥|JPY)/i, code: 'JPY' },
  { regex: /(?:C\$|CAD)/i, code: 'CAD' },
  { regex: /(?:A\$|AUD)/i, code: 'AUD' },
  { regex: /(?:AED)/i, code: 'AED' },
  { regex: /(?:S\$|SGD)/i, code: 'SGD' },
  { regex: /(?:CHF)/i, code: 'CHF' },
];

const TOTAL_KEYWORDS = [
  /grand\s*total/i,
  /total\s*due/i,
  /amount\s*due/i,
  /balance\s*due/i,
  /net\s*amount/i,
  /final\s*amount/i,
  /bill\s*total/i,
  /total\s*amount/i,
  /total/i,
  /subtotal/i,
  /sub\s*total/i,
  /paid/i,
  /payment/i,
];

const IGNORE_HEADER_WORDS = [
  /welcome/i,
  /receipt/i,
  /tax\s*invoice/i,
  /invoice/i,
  /bill/i,
  /order\s*#/i,
  /table\s*#/i,
  /cashier/i,
  /guest/i,
  /tel/i,
  /phone/i,
  /gstin/i,
  /vat/i,
  /date/i,
  /time/i,
  /server/i,
  /token/i,
];

/**
 * Extracts a numeric value from a string (handles commas, currency signs, decimals).
 */
export function extractAmountFromText(text) {
  if (!text) return null;
  // Match patterns like 1,234.56 or 1234.56 or 1234 or 12,50
  const matches = text.match(/(?:[\d]{1,3}(?:[,\s]\d{3})*|\d+)(?:[.,]\d{2})?/g);
  if (!matches) return null;

  for (const m of matches) {
    const clean = m.replace(/[\s,]/g, '').replace(',', '.');
    const val = parseFloat(clean);
    if (!isNaN(val) && val > 0 && val < 10000000) {
      return val;
    }
  }
  return null;
}

/**
 * Parses full raw text or blocks from ML Kit / Vision OCR.
 *
 * @param {string} fullText - Complete OCR string
 * @param {Array} [blocks] - Optional raw blocks from TextRecognition plugin
 * @returns {Object} { merchant, totalAmount, currency, candidateItems, rawLines }
 */
export function parseReceiptText(fullText = '', _blocks = []) {
  const lines = fullText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return {
      merchant: '',
      totalAmount: null,
      currency: null,
      candidateItems: [],
      rawLines: [],
    };
  }

  // 1. Detect Currency
  let detectedCurrency = null;
  for (const line of lines) {
    for (const { regex, code } of CURRENCY_SYMBOLS) {
      if (regex.test(line)) {
        detectedCurrency = code;
        break;
      }
    }
    if (detectedCurrency) break;
  }

  // 2. Detect Merchant / Title (top-most non-trivial, non-numeric line)
  let merchant = '';
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const line = lines[i];
    // Check if line is purely numbers, dates or symbols
    if (/^[\d\s.,:/#-]+$/.test(line)) continue;
    if (line.length < 3) continue;

    const isIgnored = IGNORE_HEADER_WORDS.some((re) => re.test(line));
    if (!isIgnored) {
      // Clean up common receipt header noise
      merchant = line.replace(/[*~_=#]+/g, '').trim();
      break;
    }
  }

  // 3. Detect Total Amount
  let totalAmount = null;

  // Pass 1: Look for explicit Total keywords
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    for (const keywordRegex of TOTAL_KEYWORDS) {
      if (keywordRegex.test(line)) {
        // Try extracting amount from the same line
        let amt = extractAmountFromText(line.replace(keywordRegex, ''));
        if (amt !== null) {
          totalAmount = amt;
          break;
        }

        // Try extracting amount from the next line if same line didn't have numbers
        if (i + 1 < lines.length) {
          amt = extractAmountFromText(lines[i + 1]);
          if (amt !== null) {
            totalAmount = amt;
            break;
          }
        }
      }
    }
    if (totalAmount !== null) break;
  }

  // Pass 2: If keyword search didn't yield an amount, check the bottom 50% for the largest price
  if (totalAmount === null) {
    const startIdx = Math.floor(lines.length * 0.4);
    let maxVal = 0;
    for (let i = startIdx; i < lines.length; i++) {
      const amt = extractAmountFromText(lines[i]);
      if (amt !== null && amt > maxVal) {
        maxVal = amt;
      }
    }
    if (maxVal > 0) {
      totalAmount = maxVal;
    }
  }

  // 4. Candidate Line Items (e.g. "Item Name 15.00")
  const candidateItems = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const amt = extractAmountFromText(line);
    if (amt !== null && amt > 0) {
      // Get the text part before or around the amount
      const textPart = line.replace(/[\d.,$₹€£¥]+/g, '').trim();
      if (textPart.length >= 2 && !TOTAL_KEYWORDS.some((kw) => kw.test(line))) {
        candidateItems.push({
          title: textPart,
          amount: amt,
          raw: line,
        });
      }
    }
  }

  return {
    merchant: merchant || (candidateItems[0]?.title || 'Receipt Expense'),
    totalAmount: totalAmount !== null ? totalAmount : null,
    currency: detectedCurrency,
    candidateItems: candidateItems.slice(0, 10),
    rawLines: lines,
  };
}
