import React from 'react';
import { ExternalLink } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="space-y-5 text-brand-text">
      <div>
        <h3 className="text-xl font-bold mb-1">Privacy Policy</h3>
        <p className="text-xs sm:text-sm text-brand-text-secondary">
          Evenly (<code>com.algorithmaliens.evenly</code>) by <strong>Algorithm Aliens</strong>
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-brand-bg/50 border border-brand-border space-y-2">
        <h4 className="font-bold text-xs uppercase tracking-wider text-brand-primary">100% Offline &amp; Private</h4>
        <p className="text-xs sm:text-sm text-brand-text-secondary leading-relaxed">
          Evenly has no accounts, no cloud servers, and no trackers. All group names, members, expenses, and calculation history stay strictly in your device's local storage.
        </p>
      </div>

      <div className="space-y-1.5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-brand-text-secondary">Camera &amp; Permissions</h4>
        <p className="text-xs sm:text-sm text-brand-text-secondary leading-relaxed">
          Camera permission is only used when you scan a paper receipt or scan a QR code. Text recognition runs 100% on-device via Google ML Kit; camera frames are processed in memory and immediately discarded.
        </p>
      </div>

      <div className="space-y-1.5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-brand-text-secondary">No Analytics or Ads</h4>
        <p className="text-xs sm:text-sm text-brand-text-secondary leading-relaxed">
          We do not collect personal info, contacts, or financial account details. There are no advertising SDKs, tracking cookies, or third-party analytics.
        </p>
      </div>

      <div className="pt-2 border-t border-brand-border/60">
        <a
          href="https://imabhinavvv.github.io/evenly/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-primary hover:underline"
        >
          <span>Read Full Web Privacy Policy</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
