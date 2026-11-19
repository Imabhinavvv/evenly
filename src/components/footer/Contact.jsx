import React from 'react';
import { Mail, Code2, Users } from 'lucide-react';

export default function Contact() {
  return (
    <div className="space-y-8 text-brand-text">
      {/* 1. Get in Touch Section */}
      <div>
        <h3 className="text-xl font-bold mb-2">Get in Touch</h3>
        <p className="evenly-body text-brand-text-secondary">
          Have a question, feedback, or found a bug? We'd love to hear from you.
          Since Evenly is built by a small team, your feedback directly shapes the future of the app.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <a
          href="mailto:abhinavmamidi.mails@gmail.com"
          className="flex items-center gap-4 p-4 rounded-xl border border-brand-border bg-evenly-surface hover:border-evenly-coral hover:shadow-sm transition-all group"
        >
          <div className="w-10 h-10 rounded-full bg-evenly-lavender flex items-center justify-center group-hover:bg-evenly-coral/20 transition-colors shrink-0">
            <Mail size={20} className="text-brand-text-secondary group-hover:text-evenly-coral-deep" />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-sm">Email Support</h4>
            <p className="text-xs text-brand-text-secondary truncate">abhinavmamidi.mails@gmail.com</p>
          </div>
        </a>

        <a
          href="mailto:Thanmaysadguru5912@gmail.com"
          className="flex items-center gap-4 p-4 rounded-xl border border-brand-border bg-evenly-surface hover:border-evenly-coral hover:shadow-sm transition-all group"
        >
          <div className="w-10 h-10 rounded-full bg-evenly-coral/15 flex items-center justify-center group-hover:bg-evenly-coral/25 transition-colors shrink-0">
            <Mail size={20} className="text-brand-text-secondary group-hover:text-evenly-coral-deep" />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-sm">Direct Contact</h4>
            <p className="text-xs text-brand-text-secondary truncate">Thanmaysadguru5912@gmail.com</p>
          </div>
        </a>
      </div>

      {/* 2. Our Team Section */}
      <div className="pt-2">
        <div className="flex items-center gap-2 mb-1">
          <Users className="w-5 h-5 text-evenly-coral-deep" />
          <h3 className="text-xl font-bold">Our Team</h3>
        </div>
        <p className="evenly-body text-brand-text-secondary mb-4">
          Meet the developers building and maintaining Evenly.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Abhinav Mamidi */}
          <div className="p-4 rounded-xl border border-brand-border bg-evenly-surface space-y-3">
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
              className="flex items-center gap-2 text-xs text-brand-text-secondary hover:text-evenly-coral-deep transition-colors break-all pt-1 border-t border-brand-border/60"
            >
              <Mail className="w-3.5 h-3.5 shrink-0" />
              <span>abhinavmamidi.mails@gmail.com</span>
            </a>
          </div>

          {/* Thanmay Sadguru Musa */}
          <div className="p-4 rounded-xl border border-brand-border bg-evenly-surface space-y-3">
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
              className="flex items-center gap-2 text-xs text-brand-text-secondary hover:text-evenly-coral-deep transition-colors break-all pt-1 border-t border-brand-border/60"
            >
              <Mail className="w-3.5 h-3.5 shrink-0" />
              <span>thanmaysadguru.mails@gmail.com</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
