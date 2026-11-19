/**
 * Offline Receipt Parser
 * Parses recognized text lines and ML Kit spatial blocks to extract:
 * Merchant name, Total amount, Currency, and Line items.
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

const HIGH_PRIORITY_TOTAL_KEYWORDS = [
  /grand\s*total/i,
  /total\s*amount\s*payable/i,
  /total\s*payable/i,
  /net\s*payable/i,
  /net\s*amount/i,
  /amount\s*payable/i,
  /final\s*amount/i,
  /bill\s*total/i,
  /total\s*due/i,
  /amount\s*due/i,
  /balance\s*due/i,
  /invoice\s*total/i,
];

const MEDIUM_PRIORITY_TOTAL_KEYWORDS = [
  /total\s*amount/i,
  /\btotal\s*[:=-]/i,
  /\btotal\s+(?:rs|₹|\$|€|£)?\s*[\d,]/i,
  /^total\b/i,
  /\btotal\b/i,
];

const DISALLOWED_TOTAL_TERMS = [
  /total\s*(?:items?|qty|quantity|count|pcs|savings?|saved|discount)/i,
  /tax\s*total/i,
  /total\s*tax/i,
  /sub\s*total/i,
  /subtotal/i,
  /cash\s*tendered/i,
  /tendered/i,
  /change/i,
];

const NON_ITEM_KEYWORDS = [
  /welcome/i,
  /thank\s*you/i,
  /visit\s*again/i,
  /tax\s*invoice/i,
  /invoice/i,
  /bill\s*of\s*supply/i,
  /cash\s*memo/i,
  /receipt/i,
  /order/i,
  /table/i,
  /token/i,
  /store\s*#/i,
  /floor/i,
  /cashier/i,
  /server/i,
  /guest/i,
  /tel/i,
  /phone/i,
  /mob/i,
  /call\b/i,
  /contact\b/i,
  /gstin/i,
  /gst\s*no/i,
  /fssai/i,
  /vat/i,
  /date/i,
  /time/i,
  /pin\s*code/i,
  /pincode/i,
  /pin\s*:\s*\d+/i,
  /sub\s*total/i,
  /subtotal/i,
  /grand\s*total/i,
  /total/i,
  /payable/i,
  /amount\s*due/i,
  /balance\s*due/i,
  /cgst/i,
  /sgst/i,
  /igst/i,
  /tax/i,
  /round\s*off/i,
  /discount/i,
  /tendered/i,
  /change\s*due/i,
  /change\b/i,
  /paid\s*via/i,
  /upi/i,
  /card/i,
  /auth/i,
];

/**
 * Extracts candidate monetary price from text line.
 * Searches right-to-left to pick the final price rather than leading quantity or line number.
 */
export function extractLinePrice(text) {
  if (!text) return null;

  // 1. Currency-prefixed number: e.g. ₹580.00, Rs. 240, $15.99
  const currencyMatch = text.match(/(?:₹|Rs\.?|\$|€|£|AED|CAD|AUD)\s*([\d,]+(?:\.\d{1,2})?)/i);
  if (currencyMatch) {
    const val = parseFloat(currencyMatch[1].replace(/,/g, ''));
    if (!isNaN(val) && val > 0 && val < 10000000) return val;
  }

  // 2. Number with /- suffix (common Indian notation): e.g. 450/-
  const slashMatch = text.match(/([\d,]+(?:\.\d{1,2})?)\s*\/-/);
  if (slashMatch) {
    const val = parseFloat(slashMatch[1].replace(/,/g, ''));
    if (!isNaN(val) && val > 0 && val < 10000000) return val;
  }

  // 3. Right-most 2-decimal number: e.g. 240.00 or 1,250.50
  const decimalMatches = Array.from(text.matchAll(/(?:\b|\s)([\d]{1,3}(?:,\d{3})*|\d+)\.(\d{2})\b/g));
  if (decimalMatches.length > 0) {
    const last = decimalMatches[decimalMatches.length - 1];
    const clean = (last[1] + '.' + last[2]).replace(/,/g, '');
    const val = parseFloat(clean);
    if (!isNaN(val) && val > 0 && val < 10000000) return val;
  }

  // 4. Fallback right-most integer (safely ignoring years 2020-2035, pin codes, and phone numbers)
  const numMatches = Array.from(text.matchAll(/\b([\d]{1,3}(?:,\d{3})+|\d+)\b/g));
  if (numMatches.length > 0) {
    for (let i = numMatches.length - 1; i >= 0; i--) {
      const raw = numMatches[i][1].replace(/,/g, '');
      const val = parseFloat(raw);
      if (raw.length === 4 && val >= 2020 && val <= 2035) continue;
      if (raw.length >= 6) continue;
      if (val > 0 && val < 10000000) return val;
    }
  }

  return null;
}

/**
 * Parses full raw text or blocks from ML Kit / Vision OCR.
 *
 * @param {string} fullText - Complete OCR string
 * @param {Array} [_blocks] - Optional raw blocks from TextRecognition plugin
 * @returns {Object} { merchant, totalAmount, currency, candidateItems, rawLines }
 */
export function parseReceiptText(fullText = '', _blocks = []) {
  let lines = [];

  // 1. Spatially reconstruct lines if blocks with bounding boxes are present
  if (Array.isArray(_blocks) && _blocks.length > 0) {
    const rawLines = [];
    _blocks.forEach((block) => {
      (block.lines || []).forEach((line) => {
        if (line && line.text && line.text.trim()) {
          rawLines.push({
            text: line.text.trim(),
            bbox: line.boundingBox || { top: 0, left: 0, bottom: 0, right: 0 },
          });
        }
      });
    });

    if (rawLines.length > 0) {
      rawLines.sort((a, b) => a.bbox.top - b.bbox.top);

      const rows = [];
      let currentRow = [rawLines[0]];

      for (let i = 1; i < rawLines.length; i++) {
        const item = rawLines[i];
        const last = currentRow[currentRow.length - 1];
        const height = Math.max(15, (last.bbox.bottom - last.bbox.top) || 20);

        if (Math.abs(item.bbox.top - last.bbox.top) <= height * 0.6) {
          currentRow.push(item);
        } else {
          rows.push(currentRow);
          currentRow = [item];
        }
      }
      if (currentRow.length > 0) rows.push(currentRow);

      lines = rows.map((r) => {
        r.sort((a, b) => a.bbox.left - b.bbox.left);
        return r.map((it) => it.text).join('   ');
      });
    }
  }

  // Fallback to splitting plain text by newline
  if (lines.length === 0) {
    lines = fullText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
  }

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

  // 2. Detect Merchant / Title (top 6 lines, non-empty, non-trivial)
  let merchant = '';
  for (let i = 0; i < Math.min(lines.length, 6); i++) {
    const line = lines[i];
    if (/^[\d\s.,:/#*=-]+$/.test(line)) continue;
    if (line.length < 3) continue;

    const isNonMerchant = NON_ITEM_KEYWORDS.some((re) => re.test(line));
    if (!isNonMerchant) {
      merchant = line.replace(/[*~_=#-]+/g, ' ').replace(/\s+/g, ' ').trim();
      break;
    }
  }

  // 3. Detect Total Amount
  let totalAmount = null;

  // Pass 1: High priority keywords (bottom-up)
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    if (DISALLOWED_TOTAL_TERMS.some((re) => re.test(line))) continue;

    if (HIGH_PRIORITY_TOTAL_KEYWORDS.some((re) => re.test(line))) {
      const amt = extractLinePrice(line);
      if (amt !== null) {
        totalAmount = amt;
        break;
      }
      if (i + 1 < lines.length) {
        const nextAmt = extractLinePrice(lines[i + 1]);
        if (nextAmt !== null) {
          totalAmount = nextAmt;
          break;
        }
      }
    }
  }

  // Pass 2: Medium priority keywords
  if (totalAmount === null) {
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      if (DISALLOWED_TOTAL_TERMS.some((re) => re.test(line))) continue;

      if (MEDIUM_PRIORITY_TOTAL_KEYWORDS.some((re) => re.test(line))) {
        const amt = extractLinePrice(line);
        if (amt !== null) {
          totalAmount = amt;
          break;
        }
        if (i + 1 < lines.length) {
          const nextAmt = extractLinePrice(lines[i + 1]);
          if (nextAmt !== null) {
            totalAmount = nextAmt;
            break;
          }
        }
      }
    }
  }

  // Pass 3: Bottom 50% largest monetary amount (safely excluding dates/phones)
  if (totalAmount === null) {
    const startIdx = Math.floor(lines.length * 0.5);
    let maxVal = 0;
    for (let i = startIdx; i < lines.length; i++) {
      const line = lines[i];
      if (DISALLOWED_TOTAL_TERMS.some((re) => re.test(line))) continue;
      const amt = extractLinePrice(line);
      if (amt !== null && amt > maxVal) {
        maxVal = amt;
      }
    }
    if (maxVal > 0) totalAmount = maxVal;
  }

  // 4. Candidate Line Items
  const candidateItems = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (NON_ITEM_KEYWORDS.some((re) => re.test(line))) continue;
    if (DISALLOWED_TOTAL_TERMS.some((re) => re.test(line))) continue;

    const amt = extractLinePrice(line);
    if (amt !== null && amt > 0) {
      let title = line
        .replace(/^(?:\d+[\s*x.-]+|[•*-]\s*)/i, '')
        .replace(/(?:₹|Rs\.?|\$|€|£|AED|CAD|AUD)\s*[\d,]+(?:\.\d{1,2})?|\b[\d,]+(?:\.\d{1,2})?\s*\/-|\b[\d,]+\.\d{2}\b/gi, '')
        .replace(/[*~_=#-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (title.length >= 2 && !/^[\d\s.,]+$/.test(title)) {
        candidateItems.push({
          title,
          amount: amt,
          raw: line,
        });
      }
    }
  }

  return {
    merchant: merchant || (candidateItems[0]?.title || 'Receipt Expense'),
    totalAmount,
    currency: detectedCurrency,
    candidateItems: candidateItems.slice(0, 10),
    rawLines: lines,
  };
}
