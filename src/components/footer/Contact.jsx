import React from 'react';
import { Mail, Code2 } from 'lucide-react';

export default function Contact() {
  return (
    <div className="space-y-6 text-brand-text">
      {/* Get in Touch Section */}
      <div>
        <h3 className="text-xl font-bold mb-2">Get in Touch</h3>
        <p className="evenly-body text-brand-text-secondary leading-relaxed">
          Have feedback, found a bug, or want to suggest a feature? Connect directly with the team behind Evenly. We review every message, and your input directly shapes the future of the app.
        </p>
      </div>

      {/* Team Member Cards */}
      <div className="grid gap-4 sm:grid-cols-2 pt-1">
        {/* Abhinav Mamidi */}
        <div className="p-4 rounded-xl border border-brand-border bg-evenly-surface space-y-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-evenly-lavender font-extrabold text-sm flex items-center justify-center text-brand-primary shrink-0">
              AM
            </div>
            <div>
              <h4 className="font-bold text-sm text-brand-text">Abhinav Mamidi</h4>
              <span className="text-[11px] font-semibold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-md inline-flex items-center gap-1 mt-0.5">
                <Code2 className="w-3 h-3" /> Developer
              </span>
            </div>
          </div>
          <a
            href="mailto:abhinavmamidi.mails@gmail.com"
            className="flex items-center gap-2 text-xs text-brand-text-secondary hover:text-evenly-coral-deep transition-colors break-all pt-2 border-t border-brand-border/60 group"
          >
            <Mail className="w-3.5 h-3.5 shrink-0 group-hover:text-evenly-coral-deep" />
            <span>abhinavmamidi.mails@gmail.com</span>
          </a>
        </div>

        {/* Thanmay Sadguru Musa */}
        <div className="p-4 rounded-xl border border-brand-border bg-evenly-surface space-y-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-evenly-coral/20 font-extrabold text-sm flex items-center justify-center text-evenly-coral-deep shrink-0">
              TM
            </div>
            <div>
              <h4 className="font-bold text-sm text-brand-text">Thanmay Sadguru Musa</h4>
              <span className="text-[11px] font-semibold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-md inline-flex items-center gap-1 mt-0.5">
                <Code2 className="w-3 h-3" /> Developer
              </span>
            </div>
          </div>
          <a
            href="mailto:thanmaysadguru.mails@gmail.com"
            className="flex items-center gap-2 text-xs text-brand-text-secondary hover:text-evenly-coral-deep transition-colors break-all pt-2 border-t border-brand-border/60 group"
          >
            <Mail className="w-3.5 h-3.5 shrink-0 group-hover:text-evenly-coral-deep" />
            <span>thanmaysadguru.mails@gmail.com</span>
          </a>
        </div>
      </div>
    </div>
  );
}
