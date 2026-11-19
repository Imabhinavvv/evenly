import { useState, useEffect } from 'react';

/**
 * Hook to manage Light and Dark mode.
 * Automatically adapts to the device display mode in real time.
 */
export function useTheme() {
  const [systemIsDark, setSystemIsDark] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Listen for device display mode changes in real time
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    // Clear any stale manual overrides from previous sessions
    try {
      localStorage.removeItem('es_theme');
    } catch {
      // ignore
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = (e) => {
      setSystemIsDark(e.matches);
    };

    mediaQuery.addEventListener('change', handleMediaChange);
    return () => mediaQuery.removeEventListener('change', handleMediaChange);
  }, []);

  const isDark = systemIsDark;

  // Apply theme class and mobile status bar theme-color to DOM
  useEffect(() => {
    const root = document.documentElement;

    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }

    // Update meta theme-color for Android status bar and browser chrome
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isDark ? '#141316' : '#FFB7B2');
    }
  }, [isDark]);

  return {
    themeMode: 'system',
    isDark,
    systemIsDark,
  };
}
