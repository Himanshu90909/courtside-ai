// Client for the CourtSide Arena backend (Base44 function). Handles timeouts, retry with backoff and a local
// stale-cache fallback: if the network call fails we return the last good payload and say so, never pretending it is fresh.
export const API_URL = 'https://lyra-5b0b7385.base44.app/functions/arenaApi';
const CACHE_PREFIX = 'arena:cache:';

async function post(body, timeoutMs = 25000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ctrl.signal });
    if (!r.ok) throw new Error(`Server responded ${r.status}`);
    const j = await r.json();
    if (j.error) throw new Error(j.message || j.error);
    return j;
  } finally { clearTimeout(t); }
}

export async function call(body, { retries = 2 } = {}) {
  const key = CACHE_PREFIX + JSON.stringify(body);
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try {
      const data = await post(body);
      const fetchedByClientAt = new Date().toISOString();
      try { localStorage.setItem(key, JSON.stringify({ data, fetchedByClientAt })); } catch { /* storage full or blocked */ }
      return { data, fromCache: false, clientFetchedAt: fetchedByClientAt };
    } catch (e) {
      lastErr = e;
      if (i < retries) await new Promise((r) => setTimeout(r, 700 * 2 ** i));
    }
  }
  try {
    const c = JSON.parse(localStorage.getItem(key) || 'null');
    if (c) return { data: c.data, fromCache: true, clientFetchedAt: c.fetchedByClientAt, error: lastErr?.message };
  } catch { /* ignore */ }
  throw lastErr || new Error('Network error');
}

export const getHome = () => call({ action: 'home' });
export const getNews = (p) => call({ action: 'news', ...p });
export const getOpps = (p) => call({ action: 'opportunities', ...p });
export const getSports = (p) => call({ action: 'sports', ...p });
export const getStatus = () => call({ action: 'status' });
