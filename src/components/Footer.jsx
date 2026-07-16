import React, { useState } from 'react';
import { PageModal } from './ui/PageModal';
import About from './footer/About';
import Terms from './footer/Terms';
import Privacy from './footer/Privacy';
import Contact from './footer/Contact';

export default function Footer() {
  const [activePage, setActivePage] = useState(null);

  const openPage = (pageName) => {
    setActivePage(pageName);
  };

  const closePage = () => {
    setActivePage(null);
  };

  const renderContent = () => {
    switch (activePage) {
      case 'About': return <About />;
      case 'Terms of Service': return <Terms />;
      case 'Privacy Policy': return <Privacy />;
      case 'Contact Us': return <Contact />;
      default: return null;
    }
  };

  return (
    <footer className="border-t border-brand-border mt-12 py-8 text-center text-sm text-brand-text-secondary pb-24">
      <div className="max-w-4xl mx-auto px-4 flex flex-col items-center gap-4">
        <div className="flex items-center gap-6">
          <button onClick={() => openPage('About')} className="hover:text-evenly-coral-deep transition-colors font-medium">About</button>
          <button onClick={() => openPage('Terms of Service')} className="hover:text-evenly-coral-deep transition-colors font-medium">Terms</button>
          <button onClick={() => openPage('Privacy Policy')} className="hover:text-evenly-coral-deep transition-colors font-medium">Privacy</button>
          <button onClick={() => openPage('Contact Us')} className="hover:text-evenly-coral-deep transition-colors font-medium">Contact</button>
        </div>
        <p className="opacity-60">© {new Date().getFullYear()} Evenly. All rights reserved.</p>
      </div>

      <PageModal
        isOpen={!!activePage}
        onClose={closePage}
        title={activePage}
      >
        {renderContent()}
      </PageModal>
    </footer>
  );
}
