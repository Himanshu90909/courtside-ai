import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Public, read-only API. It reads precomputed snapshots (ApiCache, built by buildSnapshots) instead of scanning the
// big tables on every request, because the platform enforces an entity read traffic limit.
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' };
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=30', ...CORS } });
const STALE_NEWS_MIN = 90, STALE_SPORTS_MIN = 30, STALE_OPP_MIN = 24 * 60;
const minutesAgo = (iso?: string | null) => (iso ? Math.round((Date.now() - new Date(iso).getTime()) / 60000) : null);

function oppStatus(o: any) {
  if (o.verificationStatus === 'flagged') return 'under_verification';
  if (!o.deadline) return 'unknown';
  const ms = new Date(o.deadline).getTime() - Date.now();
  if (isNaN(ms)) return 'unknown';
  if (ms < 0) return 'closed';
  if (ms < 7 * 864e5) return 'closing_soon';
  return 'open';
}

// 30s in-memory cache per warm instance: repeated page loads cost zero reads.
const mem = new Map<string, { at: number; v: any }>();
async function snapshot(db: any, key: string): Promise<{ data: any; builtAt: string | null } | null> {
  const hit = mem.get(key); if (hit && Date.now() - hit.at < 30000) return hit.v;
  const rows: any[] = await db.ApiCache.list('created_date', 200);
  const parts = rows.filter((r) => String(r.key).startsWith(key + '#')).sort((a, b) => Number(a.key.split('#')[1]) - Number(b.key.split('#')[1]));
  if (!parts.length) return null;
  const v = { data: JSON.parse(parts.map((p) => p.payload).join('')), builtAt: parts[0].builtAt || null };
  mem.set(key, { at: Date.now(), v }); return v;
}
async function health(db: any, kinds: string[], staleMin: number, builtAt: string | null) {
  const hit = mem.get('src'); let rows: any[];
  if (hit && Date.now() - hit.at < 30000) rows = hit.v; else { rows = await db.Source.list('key', 200); mem.set('src', { at: Date.now(), v: rows }); }
  const all = rows.filter((r) => kinds.includes(r.kind));
  const last = all.map((r) => r.lastSuccessAt).filter(Boolean).sort().pop() || null;
  const age = minutesAgo(last);
  return { lastSuccessAt: last, sources: all.length, enabled: all.filter((r) => r.enabled !== false).length, failing: all.filter((r) => r.lastStatus === 'failed').length, ageMinutes: age, stale: age == null || age > staleMin, snapshotBuiltAt: builtAt, snapshotAgeMinutes: minutesAgo(builtAt) };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  try {
    const base44 = createClientFromRequest(req); const db = base44.asServiceRole.entities;
    const b = await req.json().catch(() => ({}));
    const action = b.action || 'home';

    if (action === 'news') {
      const snap = await snapshot(db, 'news'); if (!snap) return json({ error: 'snapshot_missing', message: 'News snapshot has not been built yet.' }, 503);
      const limit = Math.min(Number(b.limit) || 18, 60), page = Math.max(Number(b.page) || 1, 1);
      let items: any[] = snap.data;
      if (b.category && b.category !== 'all') items = items.filter((a) => a.category === b.category);
      if (b.country && b.country !== 'all') items = items.filter((a) => a.country === b.country);
      if (b.contentType && b.contentType !== 'all') items = items.filter((a) => a.contentType === b.contentType);
      if (b.q) { const q = String(b.q).toLowerCase(); items = items.filter((a) => ((a.title || '') + ' ' + (a.summary || '') + ' ' + (a.sourceName || '')).toLowerCase().includes(q)); }
      if (b.from) items = items.filter((a) => a.publishedAt && a.publishedAt >= b.from);
      if (b.to) items = items.filter((a) => a.publishedAt && a.publishedAt <= b.to + 'T23:59:59Z');
      items = [...items].sort((x, y) => b.sort === 'coverage' ? (y.coverage || 1) - (x.coverage || 1) : (y.publishedAt || '').localeCompare(x.publishedAt || ''));
      const total = items.length;
      const out = items.slice((page - 1) * limit, page * limit).map((a) => ({ ...a, related: (a.related || []).map((r: any) => ({ title: r.t, sourceName: r.s, articleUrl: r.u })) }));
      return json({ items: out, total, page, pages: Math.ceil(total / limit), health: await health(db, ['rss'], STALE_NEWS_MIN, snap.builtAt) });
    }

    if (action === 'opportunities') {
      const snap = await snapshot(db, 'opps'); if (!snap) return json({ error: 'snapshot_missing', message: 'Opportunity snapshot has not been built yet.' }, 503);
      const limit = Math.min(Number(b.limit) || 20, 60), page = Math.max(Number(b.page) || 1, 1);
      let items: any[] = (snap.data as any[]).map((o) => ({ ...o, status: oppStatus(o) })); // status recomputed from the stored deadline at request time
      if (b.types?.length) items = items.filter((o) => b.types.includes(o.type));
      if (b.status && b.status !== 'all') items = items.filter((o) => o.status === b.status); else if (!b.includeClosed) items = items.filter((o) => o.status !== 'closed');
      if (b.remote && b.remote !== 'all') items = items.filter((o) => o.remote === b.remote);
      if (b.paid && b.paid !== 'all') items = items.filter((o) => o.paid === b.paid);
      if (b.q) { const q = String(b.q).toLowerCase(); items = items.filter((o) => ((o.title || '') + ' ' + (o.organization || '') + ' ' + (o.summary || '') + ' ' + (o.tags || []).join(' ')).toLowerCase().includes(q)); }
      const rank = (o: any) => ({ closing_soon: 0, open: 1, unknown: 2, under_verification: 3, closed: 4 } as any)[o.status] ?? 5;
      items.sort((x, y) => b.sort === 'newest' ? (y.publishedAt || y.fetchedAt || '').localeCompare(x.publishedAt || x.fetchedAt || '') : rank(x) - rank(y) || (x.deadline || '9').localeCompare(y.deadline || '9'));
      const total = items.length;
      return json({ items: items.slice((page - 1) * limit, page * limit), total, page, pages: Math.ceil(total / limit), health: await health(db, ['hackathon_api', 'jobs_api'], STALE_OPP_MIN, snap.builtAt) });
    }

    if (action === 'sports') {
      const snap = await snapshot(db, 'sports'); if (!snap) return json({ error: 'snapshot_missing', message: 'Sports snapshot has not been built yet.' }, 503);
      let items: any[] = snap.data.items.map((e: any) => ({ ...e, provider: snap.data.provider }));
      const all = items;
      if (b.sport && b.sport !== 'all') items = items.filter((e) => e.sport === b.sport);
      if (b.leagueKey && b.leagueKey !== 'all') items = items.filter((e) => e.leagueKey === b.leagueKey);
      if (b.state && b.state !== 'all') items = items.filter((e) => e.state === b.state);
      const sports = [...new Set(all.map((r) => r.sport))].sort();
      const leagues = [...new Map(all.map((r) => [r.leagueKey, { key: r.leagueKey, name: r.league, sport: r.sport }])).values()];
      return json({ items: items.slice(0, Number(b.limit) || 90), total: items.length, sports, leagues, health: await health(db, ['sports_api'], STALE_SPORTS_MIN, snap.builtAt) });
    }

    if (action === 'status') {
      const snap = await snapshot(db, 'status'); if (!snap) return json({ error: 'snapshot_missing', message: 'Status snapshot has not been built yet.' }, 503);
      return json({ ...snap.data, snapshotBuiltAt: snap.builtAt });
    }

    if (action === 'home') {
      const [n, o, s] = await Promise.all([snapshot(db, 'news'), snapshot(db, 'opps'), snapshot(db, 'sports')]);
      if (!n || !o || !s) return json({ error: 'snapshot_missing', message: 'Data snapshots have not been built yet.' }, 503);
      const lead: any[] = n.data; const by = (c: string, k: number) => lead.filter((a) => a.category === c).slice(0, k);
      const withStatus: any[] = (o.data as any[]).map((x) => ({ ...x, status: oppStatus(x) }));
      const closing = withStatus.filter((x) => x.status === 'closing_soon').sort((x, y) => x.deadline.localeCompare(y.deadline)).slice(0, 8);
      const hack = withStatus.filter((x) => ['hackathon', 'coding_competition'].includes(x.type) && ['open', 'closing_soon'].includes(x.status)).sort((x, y) => x.deadline.localeCompare(y.deadline)).slice(0, 6);
      const jobs = withStatus.filter((x) => ['job', 'internship', 'remote_job'].includes(x.type)).sort((x, y) => (y.publishedAt || '').localeCompare(x.publishedAt || '')).slice(0, 8);
      const ev: any[] = s.data.items.map((e: any) => ({ ...e, provider: s.data.provider }));
      const live = ev.filter((e) => e.state === 'in').slice(0, 8);
      const upcoming = ev.filter((e) => e.state === 'pre').sort((x, y) => x.startTime.localeCompare(y.startTime)).slice(0, 6);
      const recent = ev.filter((e) => e.state === 'post').sort((x, y) => y.startTime.localeCompare(x.startTime)).slice(0, 6);
      const rel = (a: any) => ({ ...a, related: (a.related || []).map((r: any) => ({ title: r.t, sourceName: r.s, articleUrl: r.u })) });
      const [hn, ho, hs] = await Promise.all([health(db, ['rss'], STALE_NEWS_MIN, n.builtAt), health(db, ['hackathon_api', 'jobs_api'], STALE_OPP_MIN, o.builtAt), health(db, ['sports_api'], STALE_SPORTS_MIN, s.builtAt)]);
      return json({ ticker: lead.slice(0, 10).map((a) => ({ title: a.title, url: a.articleUrl, source: a.sourceName })), headlines: lead.slice(0, 8).map(rel), sports: by('sports', 5).map(rel), education: by('education', 4).map(rel), politics: by('politics', 4).map(rel), business: by('business', 3).map(rel), tech: by('science_tech', 3).map(rel), live, upcoming, recent, closing, hackathons: hack, jobs, health: { news: hn, opportunities: ho, sports: hs } });
    }

    return json({ error: `unknown action: ${action}` }, 400);
  } catch (e) {
    return json({ error: 'internal_error', message: e instanceof Error ? e.message : String(e) }, 500);
  }
});
