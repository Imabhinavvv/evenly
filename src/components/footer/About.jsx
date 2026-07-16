import React from 'react';

export default function About() {
  return (
    <div className="space-y-6 text-brand-text">
      <div>
        <h3 className="text-xl font-bold mb-2">About Evenly</h3>
        <p className="evenly-body text-brand-text-secondary">
          Evenly is a minimalist, warm, and intuitive digital notebook for tracking personal and shared expenses. 
          Designed with a focus on editorial aesthetics, it helps roommates and friends settle balances seamlessly without the stress.
        </p>
      </div>
      
      <div>
        <h3 className="text-lg font-bold mb-2">Our Mission</h3>
        <p className="evenly-body text-brand-text-secondary">
          We believe that managing money with friends shouldn't feel like a chore. Our mission is to bring transparency, 
          ease, and a touch of joy to shared finances. Whether it's rent, groceries, or a weekend getaway, Evenly ensures 
          everyone is on the same page.
        </p>
      </div>

      <div className="bg-evenly-sage p-6 rounded-xl border border-brand-border mt-8">
        <h4 className="font-bold mb-2">Version</h4>
        <p className="text-brand-text-secondary text-sm">Evenly v1.0.0 (Local)</p>
      </div>
    </div>
  );
}
