/**
 * Stale-while-revalidate cache backed by localStorage.
 *
 * - get(key): returns { data, timestamp, isStale } or null
 * - set(key, data): stores data with current timestamp
 * - clear(key): removes a cached entry
 * - clearAll(): removes all LWYL cache entries
 * - isStale(key, maxAgeMs): checks if cache is older than maxAge (default 5 minutes)
 *
 * All keys are prefixed with `lwyl_cache_` to avoid collisions.
 */

const PREFIX = 'lwyl_cache_';
const DEFAULT_MAX_AGE = 5 * 60 * 1000; // 5 minutes

function prefixed(key) {
  return `${PREFIX}${key}`;
}

function get(key, maxAgeMs = DEFAULT_MAX_AGE) {
  try {
    const raw = localStorage.getItem(prefixed(key));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.data || !parsed.timestamp) return null;
    const age = Date.now() - parsed.timestamp;
    return {
      data: parsed.data,
      timestamp: parsed.timestamp,
      isStale: age > maxAgeMs,
    };
  } catch {
    return null;
  }
}

function set(key, data) {
  try {
    const entry = JSON.stringify({ data, timestamp: Date.now() });
    localStorage.setItem(prefixed(key), entry);
  } catch {
    // localStorage full or unavailable (private browsing) — silently ignore
  }
}

function clear(key) {
  try {
    localStorage.removeItem(prefixed(key));
  } catch {
    // ignore
  }
}

function clearAll() {
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) keys.push(k);
    }
    keys.forEach(k => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}

function isStale(key, maxAgeMs = DEFAULT_MAX_AGE) {
  const entry = get(key, maxAgeMs);
  if (!entry) return true;
  return entry.isStale;
}

export const cache = { get, set, clear, clearAll, isStale };
