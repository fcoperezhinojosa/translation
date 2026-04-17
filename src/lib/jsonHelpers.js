/**
 * flatten(obj, prefix)
 *
 * Converts a nested JSON object into a flat key-value map using dot notation.
 *
 *   { "auth": { "login": "Login", "logout": "Logout" } }
 *     → { "auth.login": "Login", "auth.logout": "Logout" }
 *
 * Leaf values are coerced to strings because all inputs are <input type="text">.
 * Arrays are treated as leaf values (flattening arrays is lossy for translation files).
 */
export function flatten(obj, prefix = "") {
  return Object.keys(obj).reduce((acc, key) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];

    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      // Recurse into nested object
      Object.assign(acc, flatten(value, fullKey));
    } else {
      // Leaf: coerce to string for input compatibility; null → empty string
      acc[fullKey] = value === null ? "" : String(value);
    }

    return acc;
  }, {});
}

/**
 * unflatten(flat)
 *
 * Reverses flatten(). Converts a dot-notation flat map back to a nested object.
 *
 *   { "auth.login": "Login", "auth.logout": "Logout" }
 *     → { "auth": { "login": "Login", "logout": "Logout" } }
 *
 * Splits each key on "." and walks/creates nested objects as needed.
 */
export function unflatten(flat) {
  const result = {};

  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split(".");
    let cursor = result;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      // Create intermediate object if missing or if a leaf was already written here
      if (cursor[part] === undefined || typeof cursor[part] !== "object") {
        cursor[part] = {};
      }
      cursor = cursor[part];
    }

    cursor[parts[parts.length - 1]] = value;
  }

  return result;
}

/**
 * downloadJSON(obj, filename)
 *
 * Serializes `obj` to JSON with 2-space indentation, triggers a browser
 * download via a temporary Blob URL, then revokes it to free memory.
 */
export function downloadJSON(obj, filename = "translations.json") {
  const json = JSON.stringify(obj, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
