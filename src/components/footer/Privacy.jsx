import React from 'react';

export default function Privacy() {
  return (
    <div className="space-y-6 text-brand-text">
      <div>
        <h3 className="text-xl font-bold mb-2">Privacy Policy</h3>
        <p className="evenly-body text-brand-text-secondary mb-4">
          Your privacy is important to us. This Privacy Policy explains how Evenly handles your information.
        </p>
        
        <div className="bg-evenly-lavender p-5 rounded-xl border border-brand-border space-y-3">
          <h4 className="font-bold">Zero Tracking</h4>
          <p className="text-sm text-brand-text-secondary">
            Because Evenly is a local-first application, we do not track your specific expense data on our servers. 
            All financial entries you create stay on your device.
          </p>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-bold mb-2">Data Collection</h3>
        <p className="evenly-body text-brand-text-secondary">
          We do not collect personal identification information, financial details, or contact lists. 
          The PDF and CSV exports are generated entirely on the client-side within your browser.
        </p>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-2">Third-Party Services</h3>
        <p className="evenly-body text-brand-text-secondary">
          We may use basic analytics (like plausible or Vercel analytics) to understand broad usage patterns (e.g., page views), 
          but these services do not have access to your LocalStorage data.
        </p>
      </div>
    </div>
  );
}
