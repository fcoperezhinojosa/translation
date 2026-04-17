"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileJson, AlertCircle } from "lucide-react";

/**
 * validateFile(file)
 *
 * Asynchronously validates the uploaded file:
 *   1. Must have a .json extension.
 *   2. Must contain parseable JSON.
 *   3. JSON root must be a plain object (not an array or null).
 *
 * Returns { ok: true, data, name } or { ok: false, error: string }.
 */
function validateFile(file) {
  if (!file) return Promise.resolve({ ok: false, error: "No file selected." });

  if (!file.name.endsWith(".json")) {
    return Promise.resolve({
      ok: false,
      error: `"${file.name}" is not a .json file.`,
    });
  }

  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);

        if (typeof data !== "object" || Array.isArray(data) || data === null) {
          resolve({
            ok: false,
            error: "JSON root must be an object — not an array or null.",
          });
        } else if (Object.keys(data).length === 0) {
          resolve({ ok: false, error: "The JSON file is empty." });
        } else {
          resolve({ ok: true, data, name: file.name });
        }
      } catch {
        resolve({ ok: false, error: "File contains invalid JSON." });
      }
    };

    reader.onerror = () =>
      resolve({ ok: false, error: "Could not read the file." });

    reader.readAsText(file);
  });
}

export default function FileUploader({ onLoad }) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const processFile = useCallback(
    async (file) => {
      setError(null);
      const result = await validateFile(file);
      if (!result.ok) {
        setError(result.error);
      } else {
        onLoad(result.data, result.name);
      }
    },
    [onLoad]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragOver(false), []);

  const handleClick = useCallback(() => inputRef.current?.click(), []);

  const handleInputChange = useCallback(
    (e) => {
      const file = e.target.files[0];
      if (file) processFile(file);
      // Reset input so the same file can be re-selected after an error
      e.target.value = "";
    },
    [processFile]
  );

  return (
    <div className="flex flex-col items-center justify-center py-20">
      {/* Dropzone */}
      <motion.div
        animate={{ scale: dragOver ? 1.02 : 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && handleClick()}
        aria-label="Upload JSON file"
        className={`
          flex w-full max-w-md cursor-pointer flex-col items-center gap-5 rounded-2xl
          border-2 border-dashed p-14 text-center outline-none transition-colors duration-150
          ${
            dragOver
              ? "border-zinc-900 bg-zinc-50"
              : "border-zinc-300 bg-white hover:border-zinc-500 hover:bg-zinc-50/60"
          }
        `}
      >
        {/* Icon — animates up on drag-over */}
        <motion.div
          animate={{ y: dragOver ? -5 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-100"
        >
          {dragOver ? (
            <FileJson className="h-7 w-7 text-zinc-900" />
          ) : (
            <Upload className="h-7 w-7 text-zinc-500" />
          )}
        </motion.div>

        <div>
          <p className="text-sm font-semibold text-zinc-900">
            {dragOver ? "Drop to load" : "Drop your JSON file here"}
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            or click to browse · .json files only
          </p>
        </div>

        {/* Example format hint */}
        <pre className="rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-2.5 text-left text-xs text-zinc-400 leading-relaxed">
          {`{\n  "hello": "Hello",\n  "auth.login": "Sign in"\n}`}
        </pre>
      </motion.div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleInputChange}
      />

      {/* Validation error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
