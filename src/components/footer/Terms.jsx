import React from 'react';

export default function Terms() {
  return (
    <div className="space-y-6 text-brand-text">
      <div>
        <h3 className="text-xl font-bold mb-2">Terms of Service</h3>
        <p className="evenly-body text-brand-text-secondary">
          Welcome to Evenly! By using our digital notebook, you agree to these Terms of Service. 
          Please read them carefully before using our application to manage your shared expenses.
        </p>
      </div>
      
      <div>
        <h3 className="text-lg font-bold mb-2">1. Local Storage & Data</h3>
        <p className="evenly-body text-brand-text-secondary">
          Evenly currently operates as a local-first application. All your data (expenses, roommates, balances) 
          is stored directly in your browser's LocalStorage. If you clear your browser data or use a different device, 
          your information will not be synchronized or recoverable unless exported manually.
        </p>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-2">2. Acceptable Use</h3>
        <p className="evenly-body text-brand-text-secondary">
          You agree to use Evenly for personal, non-commercial purposes. Evenly is a tool to help you track expenses, 
          but it is not a financial institution, bank, or payment processor. We are not responsible for uncollected debts 
          or disputes between roommates.
        </p>
      </div>
    </div>
  );
}
