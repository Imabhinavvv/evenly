import React from 'react';
import { ShieldCheck, ExternalLink, Camera, Lock } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="space-y-6 text-brand-text">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-xl font-bold">Privacy Policy</h3>
        </div>
        <p className="text-xs sm:text-sm text-brand-text-secondary mb-4">
          Evenly (<code>com.algorithmaliens.evenly</code>), developed by <strong>Algorithm Aliens</strong>, is an offline-first application designed with total user privacy as its core principle.
        </p>

        <div className="bg-evenly-lavender/40 dark:bg-evenly-surface p-4 sm:p-5 rounded-2xl border border-brand-border space-y-2.5">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Lock className="w-4 h-4 text-brand-primary" />
            <span>Zero Tracking &amp; Zero Cloud Storage</span>
          </div>
          <p className="text-xs sm:text-sm text-brand-text-secondary leading-relaxed">
            Evenly does not maintain remote servers or databases. All group details, member rosters, itemized expenses, and debt settlement calculations are processed and saved solely within your device's local sandbox storage.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-bold flex items-center gap-2">
          <Camera className="w-4 h-4 text-evenly-coral-deep" />
          <span>Camera &amp; OCR Data Processing</span>
        </h4>
        <p className="text-xs sm:text-sm text-brand-text-secondary leading-relaxed">
          Camera access is requested only when you scan a physical paper receipt or scan a peer-to-peer transfer QR code. Text recognition is performed 100% on-device via Google ML Kit. Image frames are analyzed in volatile memory and discarded immediately—no photos or videos are ever uploaded or retained.
        </p>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-bold">Data Collection &amp; Third Parties</h4>
        <p className="text-xs sm:text-sm text-brand-text-secondary leading-relaxed">
          We do not collect personal identification, contact books, bank account numbers, or advertising identifiers. We do not integrate third-party analytics trackers, cookies, or advertising networks. PDF and CSV summaries are created directly on-device.
        </p>
      </div>

      <div className="pt-2 border-t border-brand-border/60">
        <p className="text-xs text-brand-text-secondary leading-relaxed mb-3">
          For the complete legal privacy policy hosted on GitHub Pages for Google Play Store compliance, visit:
        </p>
        <a
          href="https://imabhinavvv.github.io/evenly/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-primary hover:underline"
        >
          <span>View Public Hosted Privacy Policy</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
