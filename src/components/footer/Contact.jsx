import React from 'react';
import { Mail, Globe } from 'lucide-react';

export default function Contact() {
  return (
    <div className="space-y-8 text-brand-text">
      <div>
        <h3 className="text-xl font-bold mb-2">Get in Touch</h3>
        <p className="evenly-body text-brand-text-secondary">
          Have a question, feedback, or found a bug? We'd love to hear from you.
          Since Evenly is built by a small team, your feedback directly shapes the future of the app.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <a href="mailto:hello@evenly.app" className="flex items-center gap-4 p-4 rounded-xl border border-brand-border bg-white hover:border-evenly-coral hover:shadow-sm transition-all group">
          <div className="w-10 h-10 rounded-full bg-evenly-lavender flex items-center justify-center group-hover:bg-evenly-coral/20 transition-colors">
            <Mail size={20} className="text-brand-text-secondary group-hover:text-evenly-coral-deep" />
          </div>
          <div>
            <h4 className="font-bold text-sm">Email Us</h4>
            <p className="text-xs text-brand-text-secondary">abhinavmamidi.mails@gmail.com</p>
          </div>
        </a>

        <a href="https://evenly.abhinavvv.space" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-xl border border-brand-border bg-white hover:border-evenly-coral hover:shadow-sm transition-all group">
          <div className="w-10 h-10 rounded-full bg-evenly-sage flex items-center justify-center group-hover:bg-evenly-coral/20 transition-colors">
            <Globe size={20} className="text-brand-text-secondary group-hover:text-evenly-coral-deep" />
          </div>
          <div>
            <h4 className="font-bold text-sm">Website</h4>
            <p className="text-xs text-brand-text-secondary">evenly.abhinavvv.space</p>
          </div>
        </a>
      </div>
    </div>
  );
}
