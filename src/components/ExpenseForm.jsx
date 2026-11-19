import React, { useState, useEffect } from 'react';
import { Camera, Sparkles, Loader2, X, AlertCircle } from 'lucide-react';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Checkbox } from './ui/Checkbox';
import { formatCurrencyDecimal, getActiveCurrency } from '../utils/currency';
import { isReceiptScanSupported, scanReceipt } from '../utils/ocrService';

export default function ExpenseForm({ roommates, onAddExpense, initialData, onCancel }) {
  const [description, setDescription] = useState(initialData ? initialData.description : '');
  const [total, setTotal] = useState(initialData ? (initialData.amount / 100).toString() : '');
  const [activeCurrency, setActiveCurrencyState] = useState(getActiveCurrency);

  // Receipt OCR State
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [detectedItems, setDetectedItems] = useState([]);
  const [isBetaModalOpen, setIsBetaModalOpen] = useState(false);
  const [dontShowBetaAgain, setDontShowBetaAgain] = useState(false);

  useEffect(() => {
    const onCurrencyChange = () => setActiveCurrencyState(getActiveCurrency());
    window.addEventListener('currencychange', onCurrencyChange);
    return () => window.removeEventListener('currencychange', onCurrencyChange);
  }, []);

  // Back button listener for dismissing detected receipt items and beta modal
  useEffect(() => {
    if (!isBetaModalOpen && detectedItems.length === 0) return;
    const handleBack = (e) => {
      e.preventDefault();
      if (isBetaModalOpen) {
        setIsBetaModalOpen(false);
      } else if (detectedItems.length > 0) {
        setDetectedItems([]);
      }
    };
    window.addEventListener('hardwareBack', handleBack);
    return () => window.removeEventListener('hardwareBack', handleBack);
  }, [isBetaModalOpen, detectedItems]);

  const [paidBy, setPaidBy] = useState(() => {
    if (initialData && initialData.paidBy) {
      const init = {};
      roommates.forEach(r => {
        init[r] = initialData.paidBy[r] ? (initialData.paidBy[r] / 100).toString() : '';
      });
      return init;
    }
    return {};
  });
  const [splitBetween, setSplitBetween] = useState(initialData ? initialData.splitBetween : []);

  // Initialize paidBy and splitBetween when roommates change
  useEffect(() => {
    if (initialData) return;
    setSplitBetween(prev => prev.filter(r => roommates.includes(r)));
    setPaidBy(prev => {
      const next = {};
      roommates.forEach(r => {
        next[r] = prev[r] || '';
      });
      return next;
    });
  }, [roommates, initialData]);

  const parsedTotal = parseFloat(total) || 0;
  const isAmountExceeded = parsedTotal > 10000000;
  const isAmountValid = parsedTotal > 0 && !isAmountExceeded;

  let paidSum = 0;
  Object.values(paidBy).forEach(val => {
    paidSum += parseFloat(val) || 0;
  });

  const diff = Math.round((parsedTotal - paidSum) * 100) / 100;
  const isBalanced = isAmountValid && Math.abs(diff) < 0.005;

  const handlePaidChange = (name, val) => {
    if (val === '') {
      setPaidBy(prev => ({ ...prev, [name]: val }));
      return;
    }

    const newVal = parseFloat(val) || 0;
    
    let otherSum = 0;
    Object.entries(paidBy).forEach(([person, amount]) => {
      if (person !== name) {
        otherSum += parseFloat(amount) || 0;
      }
    });

    // If the new value causes the total to exceed the expense total, clamp it
    if (newVal + otherSum > parsedTotal && parsedTotal > 0) {
      const maxAllowed = Math.max(0, parsedTotal - otherSum);
      // Round to 2 decimal places to avoid floating point precision issues
      const roundedMax = Math.round(maxAllowed * 100) / 100;
      setPaidBy(prev => ({ 
        ...prev, 
        [name]: roundedMax > 0 ? roundedMax.toString() : '' 
      }));
      return;
    }

    setPaidBy(prev => ({ ...prev, [name]: val }));
  };

  const toggleSplit = (name) => {
    if (splitBetween.includes(name)) {
      setSplitBetween(splitBetween.filter(r => r !== name));
    } else {
      setSplitBetween([...splitBetween, name]);
    }
  };

  const toggleSelectAll = () => {
    if (splitBetween.length === roommates.length) {
      setSplitBetween([]);
    } else {
      setSplitBetween([...roommates]);
    }
  };

  const handleClickScanButton = () => {
    try {
      const isDismissed = localStorage.getItem('es_dismiss_ocr_beta') === 'true';
      if (isDismissed) {
        startScanProcess();
      } else {
        setIsBetaModalOpen(true);
      }
    } catch {
      setIsBetaModalOpen(true);
    }
  };

  const handleConfirmBetaScan = () => {
    if (dontShowBetaAgain) {
      try {
        localStorage.setItem('es_dismiss_ocr_beta', 'true');
      } catch {
        // ignore
      }
    }
    setIsBetaModalOpen(false);
    startScanProcess();
  };

  const startScanProcess = async () => {
    setScanError(null);
    setScanStatus(null);
    setIsScanning(true);
    try {
      const result = await scanReceipt();
      if (result.cancelled) {
        return;
      }
      if (!result.success) {
        setScanError(result.error || 'Could not parse receipt text.');
        return;
      }

      const { merchant, totalAmount, candidateItems } = result.parsed;
      if (merchant) {
        setDescription(merchant);
      }
      if (totalAmount !== null && totalAmount > 0) {
        setTotal(totalAmount.toString());
      }
      if (candidateItems && candidateItems.length > 0) {
        setDetectedItems(candidateItems);
      }
      setScanStatus('Receipt recognized! Please verify the amount and description.');
    } catch (err) {
      setScanError(err.message || 'Failed to scan receipt image.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!description.trim() || !isAmountValid || !isBalanced || splitBetween.length === 0) return;

    const paidByClean = {};
    Object.entries(paidBy).forEach(([name, val]) => {
      const amount = Math.round((parseFloat(val) || 0) * 100);
      if (amount > 0) paidByClean[name] = amount;
    });

    const newExpense = {
      id: initialData ? initialData.id : Date.now().toString(),
      description: description.trim(),
      amount: Math.round(parsedTotal * 100),
      paidBy: paidByClean,
      splitBetween: splitBetween,
      date: initialData ? initialData.date : new Date().toISOString()
    };

    onAddExpense(newExpense);

    if (!initialData) {
      // Reset only if not editing
      setDescription('');
      setTotal('');
      setPaidBy(roommates.reduce((acc, r) => ({ ...acc, [r]: '' }), {}));
      setSplitBetween(roommates);
      setDetectedItems([]);
      setScanStatus(null);
      setScanError(null);
    }
  };

  const isValidToSubmit = description.trim() && isAmountValid && isBalanced && splitBetween.length > 0;

  if (roommates.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-brand-text mb-0">2. Add an Expense</h2>
          <p className="text-xs text-brand-text-secondary mt-1">
            Record a shared bill and split the cost amongst group members
          </p>
        </div>
        <div className="p-8 text-center text-xs sm:text-sm text-brand-text-secondary border-dashed border border-brand-border rounded-2xl bg-brand-bg/40">
          Create a group and add members above to start logging expenses.
        </div>
      </div>
    );
  }

  return (
    <div className={initialData ? "" : "space-y-6"}>
      {/* Beta Feature Notice Modal */}
      {isBetaModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 transition-opacity backdrop-blur-xs"
            onClick={() => setIsBetaModalOpen(false)}
            aria-hidden="true"
          />

          <div className="bg-evenly-surface rounded-2xl sm:rounded-3xl shadow-2xl max-w-md w-full relative z-10 p-6 sm:p-7 border border-brand-border modal-animate-in space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-evenly-coral flex items-center justify-center text-white shrink-0 shadow-xs">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-brand-text">
                      Receipt Scanner
                    </h3>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                      Beta
                    </span>
                  </div>
                  <p className="text-xs text-brand-text-secondary mt-0.5">
                    100% on-device private text recognition
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsBetaModalOpen(false)}
                className="p-1.5 rounded-lg text-brand-text-secondary hover:text-brand-text hover:bg-brand-bg transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Disclaimer & Explanation */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>Beta Feature Notice</span>
              </div>
              <p className="leading-relaxed">
                Receipt scanning is currently in Beta and runs locally on your device.
                Because lighting, crumpled thermal paper, and varied receipt layouts can impact recognition, accuracy may vary.
              </p>
            </div>

            {/* Best Practice Tips */}
            <div className="space-y-2 text-xs text-brand-text-secondary">
              <span className="font-bold text-brand-text block">Tips for Best Results:</span>
              <ul className="space-y-1.5 pl-1">
                <li className="flex items-start gap-2">
                  <span className="text-brand-primary">☀️</span>
                  <span>Ensure bright, even lighting and lay the receipt flat.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-primary">✂️</span>
                  <span>Use the cropping tool to tightly frame the printed bill items and total.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-primary">✏️</span>
                  <span>Always review and verify extracted amounts before saving.</span>
                </li>
              </ul>
            </div>

            {/* Checkbox Don't show again */}
            <label className="flex items-center gap-2.5 pt-1 text-xs text-brand-text-secondary cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dontShowBetaAgain}
                onChange={(e) => setDontShowBetaAgain(e.target.checked)}
                className="rounded border-brand-border text-brand-primary focus:ring-brand-primary/20 w-4 h-4 cursor-pointer"
              />
              <span>Don't show this notice again</span>
            </label>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                className="flex-1 py-2 text-xs font-bold"
                onClick={() => setIsBetaModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1 py-2 text-xs font-bold bg-evenly-coral hover:bg-evenly-coral-hover text-brand-text border border-evenly-coral-deep/30 flex items-center justify-center gap-1.5"
                onClick={handleConfirmBetaScan}
              >
                <Camera className="w-3.5 h-3.5 text-evenly-coral-deep" />
                <span>Continue to Scan</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {!initialData ? (
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-brand-text mb-0">2. Add an Expense</h2>
            <p className="text-xs text-brand-text-secondary mt-1">
              Record a shared bill and split the cost amongst group members
            </p>
          </div>

          {isReceiptScanSupported() && (
            <button
              type="button"
              onClick={handleClickScanButton}
              disabled={isScanning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-evenly-coral-deep/30 bg-evenly-coral hover:bg-evenly-coral-hover text-brand-text shadow-2xs transition-all cursor-pointer disabled:opacity-60 flex-shrink-0"
              title="Scan Receipt with Camera or Photo Library"
            >
              {isScanning ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-evenly-coral-deep" />
              ) : (
                <Camera className="w-3.5 h-3.5 text-evenly-coral-deep" />
              )}
              <span>{isScanning ? 'Scanning...' : 'Scan Receipt'}</span>
            </button>
          )}
        </div>
      ) : (
        isReceiptScanSupported() && (
          <div className="flex justify-end pb-2">
            <button
              type="button"
              onClick={handleClickScanButton}
              disabled={isScanning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-evenly-coral-deep/30 bg-evenly-coral hover:bg-evenly-coral-hover text-brand-text shadow-2xs transition-all cursor-pointer disabled:opacity-60"
            >
              {isScanning ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-evenly-coral-deep" />
              ) : (
                <Camera className="w-3.5 h-3.5 text-evenly-coral-deep" />
              )}
              <span>{isScanning ? 'Scanning...' : 'Scan Receipt'}</span>
            </button>
          </div>
        )
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {scanStatus && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-brand-success/10 border border-brand-success/20 text-xs text-brand-success font-medium">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>{scanStatus}</span>
          </div>
        )}

        {scanError && (
          <div className="p-2.5 rounded-xl bg-brand-danger/10 border border-brand-danger/20 text-xs text-brand-danger font-medium">
            {scanError}
          </div>
        )}

        {detectedItems.length > 0 && (
          <div className="p-3 rounded-xl bg-evenly-surface border border-brand-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-brand-text">
                Detected Items (tap to adopt description & amount):
              </span>
              <button
                type="button"
                onClick={() => setDetectedItems([])}
                className="text-[11px] text-brand-text-secondary hover:text-brand-text cursor-pointer flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Dismiss
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {detectedItems.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setDescription(item.title);
                    setTotal(item.amount.toString());
                  }}
                  className="text-xs px-2.5 py-1 rounded-lg bg-brand-bg border border-brand-border hover:border-brand-primary/40 hover:text-brand-primary transition-colors cursor-pointer text-left"
                >
                  <span className="font-medium text-brand-text">{item.title}</span>
                  <span className="ml-1.5 text-brand-primary font-bold">
                    {formatCurrencyDecimal(item.amount, activeCurrency.code)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-brand-text-secondary">Description</label>
            <Input
              type="text"
              placeholder="e.g. Electricity Bill"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-brand-text-secondary">Total Amount ({activeCurrency.symbol})</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="10000000"
              placeholder="0.00"
              value={total}
              onChange={e => setTotal(e.target.value)}
              className={isAmountExceeded ? "border-brand-danger focus-visible:ring-brand-danger" : ""}
            />
            {isAmountExceeded && (
              <p className="text-brand-danger text-xs font-medium mt-1">
                Expense amount cannot exceed {activeCurrency.symbol}10,000,000.
              </p>
            )}
          </div>
        </div>

        <div 
          className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
            isAmountValid ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-6 mt-6 border-t border-brand-border">
            {/* Paid By */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg text-brand-text">Paid By</h3>
                {isBalanced ? (
                  <span className="text-xs font-semibold text-brand-success bg-brand-success/10 border border-brand-success/20 px-3 py-1 rounded-full shadow-sm">
                    ✓ Balanced
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-brand-warning bg-brand-warning/10 border border-brand-warning/20 px-3 py-1 rounded-full shadow-sm">
                    {diff > 0 ? `${formatCurrencyDecimal(diff)} remaining` : `${formatCurrencyDecimal(Math.abs(diff))} over`}
                  </span>
                )}
              </div>
              
              <div className="space-y-3">
                {roommates.map(name => (
                  <div key={name} className="flex items-center gap-4">
                    <span className="text-sm font-medium text-brand-text w-24 truncate">{name}</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={paidBy[name] || ''}
                      onChange={e => handlePaidChange(name, e.target.value)}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Split Between */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg text-brand-text">Split Between</h3>
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-xs font-semibold text-brand-primary hover:text-brand-primary-hover transition-colors"
                >
                  {splitBetween.length === roommates.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="space-y-3">
                {roommates.map(name => (
                  <label key={name} className="flex items-center gap-3 cursor-pointer group">
                    <Checkbox
                      checked={splitBetween.includes(name)}
                      onCheckedChange={() => toggleSplit(name)}
                    />
                    <span className="text-sm font-medium text-brand-text">{name}</span>
                  </label>
                ))}
              </div>

              {splitBetween.length > 0 && (
                <div className="mt-6 p-4 bg-brand-primary/5 rounded-xl text-sm text-brand-primary font-semibold border border-brand-primary/10 shadow-sm transition-all">
                  Each person's share: {formatCurrencyDecimal(parsedTotal / splitBetween.length)}
                </div>
              )}
            </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-12 text-base"
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            className="flex-1 h-12 text-base"
            disabled={!isValidToSubmit}
          >
            {initialData ? 'Update Expense' : 'Add Expense'}
          </Button>
        </div>
      </form>
    </div>
  );
}
