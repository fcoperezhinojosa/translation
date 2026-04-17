"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, FileJson, Download, FilePlus } from "lucide-react";
import FileUploader from "@/components/FileUploader";
import TranslationTable from "@/components/TranslationTable";
import SearchBar from "@/components/SearchBar";
import GuidanceUploader from "@/components/GuidanceUploader";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { flatten, unflatten, downloadJSON } from "@/lib/jsonHelpers";

export default function HomePage() {
  // ─── Persisted state ────────────────────────────────────────────────────────
  // Flat translations map: { "auth.login": "Login", "hello": "Hello", ... }
  const [translations, setTranslations] = useLocalStorage("jts_translations", null);
  // Original filename — reused when exporting so the download name matches
  const [fileName, setFileName] = useLocalStorage("jts_filename", "translations.json");

  // ─── Reference (guidance) file — session-only, never persisted ─────────────
  // Flat map of the guidance file. null = no guidance loaded.
  const [referenceTranslations, setReferenceTranslations] = useState(null);
  const [referenceFileName, setReferenceFileName] = useState(null);

  // ─── UI state ───────────────────────────────────────────────────────────────
  const [query, setQuery] = useState("");
  // "Synced" badge: shown for 2 seconds after each debounced save
  const [synced, setSynced] = useState(false);

  // Hydration guard: localStorage is only available on the client.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  // Called by FileUploader once the file passes validation
  const handleLoad = useCallback(
    (parsedObject, name) => {
      setTranslations(flatten(parsedObject));
      setFileName(name);
      setQuery("");
    },
    [setTranslations, setFileName]
  );

  // Called by GuidanceUploader — flattens and stores in session state only
  const handleLoadReference = useCallback((parsedObject, name) => {
    setReferenceTranslations(flatten(parsedObject));
    setReferenceFileName(name);
  }, []);

  const handleClearReference = useCallback(() => {
    setReferenceTranslations(null);
    setReferenceFileName(null);
  }, []);

  // Called by TranslationTable on every keystroke — updates state immediately
  const handleChange = useCallback(
    (key, value) => {
      setTranslations((prev) => ({ ...prev, [key]: value }));
    },
    [setTranslations]
  );

  // Ref to hold the "Synced" badge timeout — prevents multiple concurrent timers
  const syncedTimerRef = useRef(null);

  // ─── Filter-freeze while editing ─────────────────────────────────────────────
  // When a search query is active and the user edits a value, the row could
  // unmount mid-edit as the value stops matching the filter. Fix: freeze the
  // set of visible keys while any input is focused, re-apply filter on blur.
  const [frozenKeys, setFrozenKeys] = useState(null);
  const filteredEntriesRef = useRef([]);
  const unfreezeTimerRef = useRef(null);

  const handleFocus = useCallback(() => {
    if (unfreezeTimerRef.current) {
      clearTimeout(unfreezeTimerRef.current);
      unfreezeTimerRef.current = null;
    }
    setFrozenKeys((prev) => {
      if (prev !== null) return prev;
      return new Set(filteredEntriesRef.current.map(([k]) => k));
    });
  }, []);

  const handleBlur = useCallback(() => {
    setSynced(true);
    if (syncedTimerRef.current) clearTimeout(syncedTimerRef.current);
    syncedTimerRef.current = setTimeout(() => setSynced(false), 2000);

    if (unfreezeTimerRef.current) clearTimeout(unfreezeTimerRef.current);
    unfreezeTimerRef.current = setTimeout(() => {
      setFrozenKeys(null);
      unfreezeTimerRef.current = null;
    }, 0);
  }, []);

  // Unflatten the flat map and trigger a browser download.
  // IMPORTANT: only translations (main file) is exported — reference is never included.
  const handleExport = useCallback(() => {
    if (!translations) return;
    downloadJSON(unflatten(translations), fileName);
  }, [translations, fileName]);

  // Reset everything — removes persisted data from localStorage
  const handleReset = useCallback(() => {
    setTranslations(null);
    setFileName("translations.json");
    setReferenceTranslations(null);
    setReferenceFileName(null);
    setQuery("");
  }, [setTranslations, setFileName]);

  // ─── Derived data ────────────────────────────────────────────────────────────

  // Union of keys from main + reference files.
  // Keys in reference but missing from main appear with an empty editable value.
  const allEntries = (() => {
    if (!translations) return [];
    if (!referenceTranslations) return Object.entries(translations);
    const mainKeys = Object.keys(translations);
    const refOnlyKeys = Object.keys(referenceTranslations).filter(
      (k) => !(k in translations)
    );
    return [...mainKeys, ...refOnlyKeys].map((k) => [k, translations[k] ?? ""]);
  })();

  // Search across Key, editable Value, and Reference Value columns
  const filteredEntries = query.trim()
    ? allEntries.filter(([k, v]) => {
        const q = query.toLowerCase();
        const refVal = referenceTranslations?.[k] ?? "";
        return (
          k.toLowerCase().includes(q) ||
          v.toLowerCase().includes(q) ||
          refVal.toLowerCase().includes(q)
        );
      })
    : allEntries;

  filteredEntriesRef.current = filteredEntries;

  // In editing mode (frozenKeys set): render the keys captured at focus time
  // with LIVE values, so rows stay mounted even if the value stops matching the filter.
  const displayedEntries =
    frozenKeys && translations
      ? Array.from(frozenKeys).map((k) => [k, translations[k] ?? ""])
      : filteredEntries;

  const hasTranslations = translations !== null && Object.keys(translations).length > 0;

  // ─── Render ──────────────────────────────────────────────────────────────────
  if (!mounted) return null;

  return (
    <div className="flex min-h-screen flex-col">
      {/* ── Sticky header ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <FileJson className="h-5 w-5 text-zinc-700" />
            <span className="text-sm font-semibold text-zinc-900">
              JSON Translation Studio
            </span>
          </div>

          {/* Right side: Synced badge + action buttons */}
          <div className="flex items-center gap-2.5">
            <AnimatePresence>
              {synced && (
                <motion.span
                  key="synced"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200"
                >
                  <Check className="h-3 w-3" />
                  Saved
                </motion.span>
              )}
            </AnimatePresence>

            {hasTranslations && (
              <>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-200"
                >
                  <FilePlus className="h-3.5 w-3.5" />
                  New file
                </button>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-700"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export JSON
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <AnimatePresence mode="wait">
          {!hasTranslations ? (
            /* ── File upload view ── */
            <motion.div
              key="uploader"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-2 text-center">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                  Translation Editor
                </h1>
                <p className="mt-1 text-sm text-zinc-500">
                  Upload a JSON locale file to start editing inline.
                </p>
              </div>
              <FileUploader onLoad={handleLoad} />
            </motion.div>
          ) : (
            /* ── Table view ── */
            <motion.div
              key="table"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-4"
            >
              {/* Toolbar: search + key counter + guidance file uploader */}
              <div className="flex items-center gap-3">
                <SearchBar value={query} onChange={setQuery} />
                <span className="flex-shrink-0 rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-500">
                  {displayedEntries.length}
                  {displayedEntries.length !== allEntries.length && (
                    <span className="text-zinc-400"> / {allEntries.length}</span>
                  )}{" "}
                  keys
                </span>
                <GuidanceUploader
                  referenceFileName={referenceFileName}
                  onLoad={handleLoadReference}
                  onClear={handleClearReference}
                />
              </div>

              {/* Table */}
              <TranslationTable
                entries={displayedEntries}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                referenceTranslations={referenceTranslations}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-zinc-100 py-4 text-center text-xs text-zinc-400">
        Data is auto-saved to your browser · nothing leaves your device
      </footer>
    </div>
  );
}
