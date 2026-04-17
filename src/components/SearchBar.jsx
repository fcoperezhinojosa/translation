"use client";

import { Search, X } from "lucide-react";
import { useCallback } from "react";

/**
 * SearchBar — controlled search input.
 * Filtering logic lives in page.js; this component is purely presentational.
 */
export default function SearchBar({ value, onChange }) {
  const handleClear = useCallback(() => onChange(""), [onChange]);

  return (
    <div className="relative flex-1">
      {/* Search icon — pointer-events-none so clicks fall through to the input */}
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search keys and values…"
        className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-9 text-sm text-zinc-800 outline-none transition-shadow focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 placeholder:text-zinc-400"
      />

      {/* Clear button — only visible when there is a query */}
      {value && (
        <button
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors hover:text-zinc-700"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
