// Client for the CourtSide Arena backend (Base44 function). Handles timeouts, retry with backoff and a local
// stale-cache fallback: if the network call fails we return the last good payload and say so, never pretending it is fresh.
export const API_URL = 'https://lyra-5b0b7385.base44.app/functions/arenaApi';
const CACHE_PREFIX = 'arena:cache:';

export const GLOBAL_API_URL = 'https://elio-31c3af86.base44.app/functions/courtsideGlobalApi';
const GCACHE_PREFIX = 'arena:gcache:';

async function post(body, timeoutMs = 25000, url = API_URL) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ctrl.signal });
    if (!r.ok) throw new Error(`Server responded ${r.status}`);
    const j = await r.json();
    if (j.error) throw new Error(j.message || j.error);
    return j;
  } finally { clearTimeout(t); }
}

async function callEndpoint(url, cachePrefix, body, { retries = 2 } = {}) {
  const key = cachePrefix + JSON.stringify(body);
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try {
      const data = await post(body, 25000, url);
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

export const call = (body, opts) => callEndpoint(API_URL, CACHE_PREFIX, body, opts);
// Worldwide opportunity sources (jobs, internships, scholarships, fellowships, competitions)
// served by a second, separate backend and merged into the listing pages below.
export const callGlobal = (body, opts) => callEndpoint(GLOBAL_API_URL, GCACHE_PREFIX, body, { retries: 1, ...opts });

const dedupeKey = (o) => `${(o.title || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60)}|${(o.organization || '').toLowerCase().slice(0, 24)}`;
const mergeOpps = (main, extra) => {
  const seen = new Set(main.map(dedupeKey));
  return [...main, ...extra.filter((o) => { const k = dedupeKey(o); if (seen.has(k)) return false; seen.add(k); return true; })];
};
const oppRank = (o) => ({ closing_soon: 0, open: 1, unknown: 2, under_verification: 3, closed: 4 })[o.status] ?? 5;
const sortOpps = (arr, sort) => [...arr].sort((x, y) => sort === 'newest'
  ? (y.publishedAt || y.fetchedAt || '').localeCompare(x.publishedAt || x.fetchedAt || '')
  : oppRank(x) - oppRank(y) || (x.deadline || '9').localeCompare(y.deadline || '9'));
const mergeHealth = (h1, h2) => {
  if (!h2) return h1;
  const latest = [h1?.lastSuccessAt, h2.lastSuccessAt].filter(Boolean).sort().pop() || null;
  const age = latest ? Math.round((Date.now() - new Date(latest).getTime()) / 60000) : null;
  return {
    lastSuccessAt: latest, sources: (h1?.sources || 0) + (h2.sources || 0), enabled: (h1?.enabled || 0) + (h2.enabled || 0),
    failing: (h1?.failing || 0) + (h2.failing || 0), ageMinutes: age,
    stale: (h1?.stale !== false) && h2.stale !== false,
  };
};

// A match marked 'in' whose start time is long past is stale provider data (the feed dropped it
// before reporting a final score). We never show such a match as live: anything older than 6 hours
// is demoted to 'post' so the Live filter and the For You rail stay honest.
const LIVE_MAX_AGE_MS = 6 * 60 * 60 * 1000;
const normalizeEvent = (e) => {
  if (!e || e.state !== 'in') return e;
  const t = e.startTime ? new Date(e.startTime).getTime() : NaN;
  return (isNaN(t) || Date.now() - t > LIVE_MAX_AGE_MS) ? { ...e, state: 'post' } : e;
};
const normalizeEvents = (arr) => (Array.isArray(arr) ? arr.map(normalizeEvent) : arr);

export async function getHome() {
  const [r, g] = await Promise.allSettled([call({ action: 'home' }), callGlobal({ action: 'home' })]);
  if (r.status === 'rejected') throw r.reason;
  const main = r.value;
  if (main.data && Array.isArray(main.data.live)) main.data.live = main.data.live.filter((e) => normalizeEvent(e).state === 'in');
  if (main.data && Array.isArray(main.data.upcoming)) main.data.upcoming = main.data.upcoming.map((e) => (e.state === 'in' ? normalizeEvent(e) : e));
  if (g.status === 'fulfilled' && g.value.data && main.data) {
    const d = main.data; const gd = g.value.data;
    if (Array.isArray(gd.closing)) d.closing = sortOpps(mergeOpps(d.closing || [], gd.closing), 'deadline').slice(0, 8);
    if (Array.isArray(gd.hackathons)) d.hackathons = sortOpps(mergeOpps(d.hackathons || [], gd.hackathons), 'deadline').slice(0, 6);
    if (Array.isArray(gd.jobs)) d.jobs = sortOpps(mergeOpps(d.jobs || [], gd.jobs), 'newest').slice(0, 8);
    if (d.health && d.health.opportunities) d.health.opportunities = mergeHealth(d.health.opportunities, gd.health);
  }
  return main;
}
export async function getSports(p) {
  const r = await call({ action: 'sports', ...p });
  if (r.data && Array.isArray(r.data.items)) r.data.items = normalizeEvents(r.data.items);
  return r;
}
export const getNews = (p) => call({ action: 'news', ...p });
// Listing pages draw from both backends and merge, dedupe and re-sort the results,
// so each page shows every connected source in one ranked list.
export async function getOpps(p) {
  const [r, g] = await Promise.allSettled([call({ action: 'opportunities', ...p }), callGlobal({ action: 'opportunities', ...p })]);
  if (r.status === 'rejected' && g.status === 'rejected') throw r.reason;
  const main = r.status === 'fulfilled' ? r.value : null;
  const glob = g.status === 'fulfilled' ? g.value : null;
  if (!main) return glob;
  if (!glob) return main;
  const limit = p?.limit || 20;
  const items = sortOpps(mergeOpps(main.data.items || [], glob.data.items || []), p?.sort).slice(0, limit);
  return {
    data: {
      items,
      total: (main.data.total || 0) + (glob.data.total || 0) - ((main.data.items || []).length + (glob.data.items || []).length - items.length),
      page: main.data.page || p?.page || 1,
      pages: Math.max(main.data.pages || 1, glob.data.pages || 1),
      health: mergeHealth(main.data.health, glob.data.health),
    },
    fromCache: main.fromCache || glob.fromCache,
    clientFetchedAt: [main.clientFetchedAt, glob.clientFetchedAt].filter(Boolean).sort().pop(),
  };
}

export async function getStatus() {
  const r = await call({ action: 'status' });
  const [g] = await Promise.allSettled([callGlobal({ action: 'status' })]);
  if (g.status === 'fulfilled' && g.value.data) r.data.globalOpps = { sources: g.value.data.sources || [], items: g.value.data.items, builtAt: g.value.data.builtAt };
  return r;
}
