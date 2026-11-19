import React from 'react';

export default function Footer({ onNavigate }) {
  return (
    <footer className="border-t border-brand-border mt-8 py-6 text-center text-sm text-brand-text-secondary">
      <div className="max-w-4xl mx-auto px-4 flex flex-col items-center gap-4">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('about')}
            className="hover:text-evenly-coral-deep transition-colors font-medium cursor-pointer"
          >
            About
          </button>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('terms')}
            className="hover:text-evenly-coral-deep transition-colors font-medium cursor-pointer"
          >
            Terms
          </button>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('privacy')}
            className="hover:text-evenly-coral-deep transition-colors font-medium cursor-pointer"
          >
            Privacy
          </button>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('contact')}
            className="hover:text-evenly-coral-deep transition-colors font-medium cursor-pointer"
          >
            Contact
          </button>
        </div>
        <p className="opacity-60 text-xs">© {new Date().getFullYear()} Evenly. All rights reserved.</p>
      </div>
    </footer>
  );
}
