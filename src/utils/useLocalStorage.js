import { useState, useEffect } from 'react';

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null && item !== 'undefined') {
        const parsed = JSON.parse(item);
        if (parsed !== undefined) {
          return parsed;
        }
      }
      return typeof initialValue === 'function' ? initialValue() : initialValue;
    } catch (error) {
      console.error('Error reading from localStorage', error);
      return typeof initialValue === 'function' ? initialValue() : initialValue;
    }
  });

  useEffect(() => {
    try {
      if (storedValue !== undefined) {
        window.localStorage.setItem(key, JSON.stringify(storedValue));
      }
    } catch (error) {
      console.error('Error writing to localStorage', error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
