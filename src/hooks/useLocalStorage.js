"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * useLocalStorage(key, initialValue)
 *
 * Drop-in replacement for useState that persists the value in localStorage.
 *
 * - Reads from localStorage once on mount via a lazy initializer.
 * - Writes to localStorage after every state change via useEffect.
 * - When the value is set to null/undefined, the key is removed from storage
 *   (ensures a clean reset rather than storing the string "null").
 * - typeof window guard makes this SSR-safe for Next.js App Router.
 *
 * Returns [value, setValue] — setter accepts both a value and an updater fn.
 */
export function useLocalStorage(key, initialValue) {
  // Lazy initializer: runs once on mount to hydrate from storage.
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // Persist to localStorage whenever the value changes.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (storedValue === null || storedValue === undefined) {
        window.localStorage.removeItem(key);
        console.log(`[useLocalStorage] Removed key "${key}" from localStorage`);
      } else {
        window.localStorage.setItem(key, JSON.stringify(storedValue));
        // Log a snapshot: show first 3 entries so we can verify without flooding the console
        const preview = Object.fromEntries(Object.entries(storedValue).slice(0, 3));
        console.log(`[useLocalStorage] Saved "${key}" → `, preview, `(${Object.keys(storedValue).length} keys total)`);
      }
    } catch (err) {
      console.error(`[useLocalStorage] Failed to write "${key}":`, err);
    }
  }, [key, storedValue]);

  // Mirror useState's setter API: accepts a value or an updater function.
  const setValue = useCallback((value) => {
    setStoredValue((prev) =>
      typeof value === "function" ? value(prev) : value
    );
  }, []);

  return [storedValue, setValue];
}
