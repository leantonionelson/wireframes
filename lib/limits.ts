/* Abuse limits for the open surfaces. Deliberately modest: the annotate
 * endpoint is open to viewers by design, so the goal is stopping scripts
 * and accidents, not building a WAF. In-memory means per-instance on
 * serverless, which is fine for best-effort throttling. */

// Markdown import: a real export of a large project is well under 1 MB.
export const MD_IMPORT_MAX_BYTES = 2 * 1024 * 1024;

// Annotation payload fields (notes, comments) — generous free text.
export const ANNOTATION_TEXT_MAX = 10_000;

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 60; // one op a second, sustained, per client

const hits = new Map<string, number[]>();

/** Sliding-window rate check. Returns true when the caller is over. */
export function overRateLimit(key: string): boolean {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter(t => now - t < WINDOW_MS);
  arr.push(now);
  hits.set(key, arr);
  if (hits.size > 10_000) hits.clear(); // memory backstop, resets counters
  return arr.length > MAX_PER_WINDOW;
}
