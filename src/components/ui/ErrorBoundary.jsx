import React from 'react';
import { AlertTriangle, RotateCcw, Trash2 } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Evenly caught error in ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.error('Failed to clear storage:', e);
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-brand-bg flex items-center justify-center p-6 text-brand-text font-sans">
          <div className="max-w-md w-full bg-evenly-surface rounded-3xl p-8 border border-brand-border shadow-md text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div>
              <h1 className="text-2xl font-black text-brand-text">Something went wrong</h1>
              <p className="text-sm text-brand-text-secondary mt-2">
                Evenly encountered an unexpected issue while loading. You can try refreshing or resetting the app state.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 bg-stone-50 rounded-xl text-left border border-stone-200/80 text-xs text-stone-600 font-mono break-all max-h-32 overflow-y-auto">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold bg-evenly-coral text-brand-text hover:bg-evenly-coral-deep/30 transition-all cursor-pointer shadow-xs"
              >
                <RotateCcw className="w-4 h-4" />
                Reload App
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold border border-brand-border text-brand-text-secondary hover:text-rose-600 hover:border-rose-200 transition-all cursor-pointer"
                title="Clear local storage cache"
              >
                <Trash2 className="w-4 h-4" />
                Reset Data
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
