/**
 * Defense for user-supplied JSON stored as Mixed documents:
 *  - keys starting with `$` or containing `.`  → MongoDB operator/path injection
 *  - `__proto__` / `constructor` / `prototype` → prototype pollution when the
 *    JSON is re-parsed and merged on clients
 *
 * Payloads containing such keys are rejected outright (not silently mutated),
 * so the client learns its data was malformed.
 */

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const MAX_DEPTH = 24;

export interface SanitizeResult {
  ok: boolean;
  reason?: string;
}

export function checkSafeJson(value: unknown, depth = 0): SanitizeResult {
  if (depth > MAX_DEPTH) {
    return { ok: false, reason: 'Payload nesting too deep' };
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const r = checkSafeJson(item, depth + 1);
      if (!r.ok) return r;
    }
    return { ok: true };
  }

  if (value !== null && typeof value === 'object') {
    for (const key of Object.keys(value as Record<string, unknown>)) {
      if (FORBIDDEN_KEYS.has(key)) {
        return { ok: false, reason: `Forbidden key: ${key}` };
      }
      if (key.startsWith('$')) {
        return { ok: false, reason: `Keys may not start with "$": ${key.slice(0, 40)}` };
      }
      if (key.includes('.')) {
        return { ok: false, reason: `Keys may not contain ".": ${key.slice(0, 40)}` };
      }
      const r = checkSafeJson((value as Record<string, unknown>)[key], depth + 1);
      if (!r.ok) return r;
    }
    return { ok: true };
  }

  return { ok: true };
}
