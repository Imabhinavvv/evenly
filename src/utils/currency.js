export const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
  { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
  { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP', zeroDecimal: true },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham', locale: 'ar-AE' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', locale: 'en-SG' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', locale: 'de-CH' },
];

export function getActiveCurrencyCode() {
  try {
    return localStorage.getItem('es_currency') || 'INR';
  } catch {
    return 'INR';
  }
}

export function getActiveCurrency() {
  const code = getActiveCurrencyCode();
  return CURRENCIES.find((c) => c.code === code) || CURRENCIES[0];
}

export function setActiveCurrency(currencyCode) {
  try {
    localStorage.setItem('es_currency', currencyCode);
    window.dispatchEvent(new CustomEvent('currencychange', { detail: { currencyCode } }));
  } catch {
    // Ignore storage errors
  }
}

export function formatCurrency(cents, currencyCode = null) {
  const currency = currencyCode
    ? CURRENCIES.find((c) => c.code === currencyCode) || getActiveCurrency()
    : getActiveCurrency();

  const num = (cents || 0) / 100;
  return new Intl.NumberFormat(currency.locale, {
    style: 'currency',
    currency: currency.code,
    minimumFractionDigits: currency.zeroDecimal ? 0 : 2,
    maximumFractionDigits: currency.zeroDecimal ? 0 : 2,
  }).format(num);
}

export function formatCurrencyDecimal(amount, currencyCode = null) {
  const currency = currencyCode
    ? CURRENCIES.find((c) => c.code === currencyCode) || getActiveCurrency()
    : getActiveCurrency();

  return new Intl.NumberFormat(currency.locale, {
    style: 'currency',
    currency: currency.code,
    minimumFractionDigits: currency.zeroDecimal ? 0 : 2,
    maximumFractionDigits: currency.zeroDecimal ? 0 : 2,
  }).format(amount);
}

export function formatCurrencyForPDF(cents, currencyCode = null) {
  const currency = currencyCode
    ? CURRENCIES.find((c) => c.code === currencyCode) || getActiveCurrency()
    : getActiveCurrency();

  const num = (cents || 0) / 100;
  const formattedString = new Intl.NumberFormat(currency.locale, {
    style: 'decimal',
    minimumFractionDigits: currency.zeroDecimal ? 0 : 2,
    maximumFractionDigits: currency.zeroDecimal ? 0 : 2,
  }).format(num);

  return `${currency.symbol} ${formattedString}`;
}
