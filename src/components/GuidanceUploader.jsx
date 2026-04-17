"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, X, AlertCircle } from "lucide-react";

const COACH_DISMISSED_KEY = "jts_coachmark_dismissed";

function validateFile(file) {
  if (!file) return Promise.resolve({ ok: false, error: "No file selected." });
  if (!file.name.endsWith(".json")) {
    return Promise.resolve({ ok: false, error: `"${file.name}" is not a .json file.` });
  }
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (typeof data !== "object" || Array.isArray(data) || data === null) {
          resolve({ ok: false, error: "JSON root must be an object." });
        } else if (Object.keys(data).length === 0) {
          resolve({ ok: false, error: "The JSON file is empty." });
        } else {
          resolve({ ok: true, data, name: file.name });
        }
      } catch {
        resolve({ ok: false, error: "File contains invalid JSON." });
      }
    };
    reader.onerror = () => resolve({ ok: false, error: "Could not read the file." });
    reader.readAsText(file);
  });
}

export default function GuidanceUploader({ referenceFileName, onLoad, onClear }) {
  const inputRef = useRef(null);
  const [error, setError] = useState(null);
  // Persist dismissal in localStorage so the coach mark stays gone after refresh
  const [coachDismissed, setCoachDismissed] = useState(true); // start hidden to avoid flash
  useEffect(() => {
    setCoachDismissed(!!localStorage.getItem(COACH_DISMISSED_KEY));
  }, []);

  const dismissCoach = useCallback(() => {
    localStorage.setItem(COACH_DISMISSED_KEY, "1");
    setCoachDismissed(true);
  }, []);

  const processFile = useCallback(
    async (file) => {
      setError(null);
      const result = await validateFile(file);
      if (!result.ok) setError(result.error);
      else {
        dismissCoach();
        onLoad(result.data, result.name);
      }
    },
    [onLoad, dismissCoach]
  );

  const handleClick = useCallback(() => inputRef.current?.click(), []);

  const handleInputChange = useCallback(
    (e) => {
      const file = e.target.files[0];
      if (file) processFile(file);
      e.target.value = "";
    },
    [processFile]
  );

  return (
    <div className="flex flex-col items-end">
      {referenceFileName ? (
        /* ── Loaded state ── */
        <div className="flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-xs font-medium text-violet-700">
          <BookOpen className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="max-w-[140px] truncate">{referenceFileName}</span>
          <button
            onClick={onClear}
            aria-label="Remove guidance file"
            className="ml-0.5 text-violet-400 transition-colors hover:text-violet-800"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        /* ── Button + coach mark tooltip ── */
        <div className="relative">
          {/* Trigger button */}
          <motion.button
            onClick={handleClick}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-1.5 rounded-lg border border-violet-200 bg-white px-3 py-1.5 text-xs font-medium text-violet-700 shadow-sm transition-colors hover:border-violet-300 hover:bg-violet-50"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Add guidance file
          </motion.button>

          {/* Coach mark tooltip — dark zinc-900, arrow pointing up at the button */}
          <AnimatePresence>
            {!coachDismissed && (
              <motion.div
                key="coach"
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute right-0 top-[calc(100%+10px)] z-30 w-64 rounded-xl bg-zinc-900 p-4 shadow-2xl"
              >
                {/* Arrow pointing up toward the button — right-aligned to sit under it */}
                <div className="absolute -top-[7px] right-5 h-3.5 w-3.5 rotate-45 rounded-tl-sm bg-zinc-900" />

                {/* Header row: title + close */}
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold leading-snug text-white">
                    Add Reference Context
                  </p>
                  <button
                    onClick={dismissCoach}
                    aria-label="Dismiss tip"
                    className="mt-px flex-shrink-0 text-zinc-500 transition-colors hover:text-zinc-200"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Body */}
                <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                  Upload a second JSON to see it side-by-side. This file is for
                  guidance only and won&apos;t be modified.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleInputChange}
      />

      <AnimatePresence>
        {error && (
          <motion.div
            key="err"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="mt-1.5 flex items-center gap-1 text-xs text-red-600"
          >
            <AlertCircle className="h-3 w-3 flex-shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
