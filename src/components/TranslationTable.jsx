"use client";

import { memo, useCallback } from "react";

/**
 * TranslationRow — single editable row.
 *
 * Fully controlled: value comes from parent, onChange fires on every keystroke.
 * React.memo ensures only the changed row re-renders per keystroke.
 * When hasReference is true, renders a read-only reference column between Key and Value.
 */
const TranslationRow = memo(function TranslationRow({
  rowKey,
  value,
  referenceValue,
  hasReference,
  onChange,
  onFocus,
  onBlur,
  isEven,
}) {
  const handleChange = useCallback(
    (e) => onChange(rowKey, e.target.value),
    [rowKey, onChange]
  );

  return (
    <tr
      className={`transition-colors ${
        isEven ? "bg-zinc-50/60" : "bg-white"
      } hover:bg-blue-50/30`}
    >
      {/* Key — read-only monospace badge */}
      <td className="w-[22%] px-4 py-2.5 align-middle">
        <span className="inline-block max-w-full break-all rounded border border-zinc-200 bg-zinc-100 px-2 py-1 font-mono text-xs text-zinc-600 select-all">
          {rowKey}
        </span>
      </td>

      {/* Reference Value — read-only, zinc-100 bg, only when guidance file is loaded */}
      {hasReference && (
        <td className="w-[35%] border-l border-zinc-100 bg-zinc-50 px-4 py-2 align-middle">
          {referenceValue !== undefined && referenceValue !== "" ? (
            <span className="block w-full break-words px-2 py-1.5 text-sm leading-snug text-zinc-400 select-text">
              {referenceValue}
            </span>
          ) : (
            <span className="block px-2 py-1.5 text-sm text-zinc-300 select-none">—</span>
          )}
        </td>
      )}

      {/* Editable Value — fires onChange on every keystroke */}
      <td className="px-4 py-2 align-middle">
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={onFocus}
          onBlur={onBlur}
          aria-label={`Value for ${rowKey}`}
          className="w-full rounded-md bg-transparent px-2 py-1.5 text-sm text-zinc-800 outline-none ring-0 transition-all hover:bg-zinc-100/70 focus:bg-white focus:ring-2 focus:ring-zinc-900/15"
        />
      </td>
    </tr>
  );
});

export default function TranslationTable({
  entries,
  onChange,
  onFocus,
  onBlur,
  referenceTranslations,
}) {
  const hasReference = referenceTranslations !== null && referenceTranslations !== undefined;

  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-zinc-200 bg-white py-16 text-sm text-zinc-400">
        No keys match your search.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <table className="w-full border-collapse text-left">
        <thead className="border-b border-zinc-200 bg-white">
          <tr>
            <th className="w-[22%] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Key
            </th>
            {hasReference && (
              <th className="w-[35%] border-l border-zinc-100 bg-zinc-50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Reference
              </th>
            )}
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Value
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {entries.map(([key, value], i) => (
            <TranslationRow
              key={key}
              rowKey={key}
              value={value}
              referenceValue={hasReference ? referenceTranslations[key] : undefined}
              hasReference={hasReference}
              onChange={onChange}
              onFocus={onFocus}
              onBlur={onBlur}
              isEven={i % 2 === 0}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
