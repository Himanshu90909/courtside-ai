import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Reads the big tables ONCE and stores slim JSON snapshots in ApiCache so the public API only reads a few small
// records per request. The platform enforces (a) an entity read traffic limit and (b) a per-field size limit
// (between 20KB and 40KB, measured), so each snapshot is trimmed and split into 16KB records: key#0, key#1, ...
// Snapshots are balanced per category/type so every page of the app has enough items, not just the busiest feed.
const CHUNK = 16000;
const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function dbRetry<T>(fn: () => Promise<T>, tries = 6): Promise<T> {
  let last: unknown;
  for (let i = 0; i < tries; i++) { try { return await fn(); } catch (e) { last = e; if (!/rate limit|429|too many|volume limit/i.test(e instanceof Error ? e.message : String(e))) throw e; await pause(1500 * (i + 1)); } }
  throw last instanceof Error ? last : new Error(String(last));
}
const pick = (o: any, keys: string[]) => { const r: any = {}; for (const k of keys) if (o[k] !== undefined && o[k] !== null && o[k] !== '') r[k] = o[k]; return r; };
const cut = (s: unknown, n: number) => (s ? String(s).slice(0, n) : undefined);
// keep the newest `per` items of each group
function balanced<T>(items: T[], groupOf: (x: T) => string, per: number): T[] {
  const m = new Map<string, T[]>(); for (const x of items) { const g = groupOf(x); if (!m.has(g)) m.set(g, []); if (m.get(g)!.length < per) m.get(g)!.push(x); }
  return [...m.values()].flat();
}

async function save(db: any, key: string, obj: unknown, itemCount: number) {
  const payload = JSON.stringify(obj); const builtAt = new Date().toISOString();
  const parts: string[] = []; for (let i = 0; i < payload.length; i += CHUNK) parts.push(payload.slice(i, i + CHUNK));
  const existing: any[] = await dbRetry(() => db.ApiCache.list('-created_date', 500));
  const byKey = new Map(existing.filter((r) => String(r.key).startsWith(key + '#')).map((r) => [r.key, r]));
  for (let i = 0; i < parts.length; i++) {
    const k = `${key}#${i}`; const rec = byKey.get(k); byKey.delete(k);
    const data = { key: k, payload: parts[i], builtAt, itemCount: i === 0 ? itemCount : 0 };
    if (rec) await dbRetry(() => db.ApiCache.update(rec.id, data)); else await dbRetry(() => db.ApiCache.create(data));
    await pause(120);
  }
  for (const stale of byKey.values()) { await dbRetry(() => db.ApiCache.delete(stale.id)); await pause(100); }
  return { key, chunks: parts.length, bytes: payload.length, itemCount };
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req); const db = base44.asServiceRole.entities;
  const b = await req.json().catch(() => ({})); const only: string[] | undefined = b.only;
  const out: any[] = []; const want = (k: string) => !only || only.includes(k);
  try {
    if (want('news')) {
      const rows: any[] = await db.Article.list('-publishedAt', 500);
      const groups = new Map<string, any[]>(); for (const a of rows.filter((x) => !x.hidden)) { const k = a.clusterId || a.uid; if (!groups.has(k)) groups.set(k, []); groups.get(k)!.push(a); }
      let lead: any[] = [];
      for (const g of groups.values()) { g.sort((x, y) => (y.publishedAt || '').localeCompare(x.publishedAt || '')); const a = g[0]; lead.push({ ...pick(a, ['uid', 'category', 'sourceName', 'sourceUrl', 'articleUrl', 'country', 'publishedAt', 'fetchedAt', 'imageUrl', 'contentType']), title: cut(a.title, 130), summary: cut(a.summary, 120), coverage: g.length, related: g.slice(1, 2).map((r) => ({ t: cut(r.title, 80), s: r.sourceName, u: r.articleUrl })) }); }
      lead.sort((x, y) => (y.publishedAt || '').localeCompare(x.publishedAt || ''));
      lead = balanced(lead, (x) => x.category, 22).sort((x, y) => (y.publishedAt || '').localeCompare(x.publishedAt || ''));
      out.push(await save(db, 'news', lead, lead.length));
    }
    if (want('opps')) {
      const rows: any[] = await db.Opportunity.list('-created_date', 700);
      const grp = (o: any) => (['hackathon', 'coding_competition'].includes(o.type) ? 'comp:' + o.type : 'job:' + o.type);
      const keep = balanced(rows.filter((o) => !o.hidden), grp, 45);
      const items = keep.map((o) => ({ ...pick(o, ['uid', 'type', 'sourceName', 'sourceUrl', 'applyUrl', 'country', 'remote', 'paid', 'opensAt', 'deadline', 'deadlineVerified', 'publishedAt', 'fetchedAt', 'verificationStatus']), title: cut(o.title, 100), organization: cut(o.organization, 40), location: cut(o.location, 32), compensation: cut(o.compensation, 32), prize: cut(o.prize, 24), summary: cut(o.summary, 90), tags: (o.tags || []).slice(0, 3) }));
      out.push(await save(db, 'opps', items, items.length));
    }
    if (want('sports')) {
      const rows: any[] = await db.SportsEvent.list('-startTime', 300);
      const rank = (e: any) => (e.state === 'in' ? 0 : e.state === 'pre' ? 1 : 2);
      rows.sort((x, y) => rank(x) - rank(y) || (x.state === 'post' ? y.startTime.localeCompare(x.startTime) : x.startTime.localeCompare(y.startTime)));
      const items = rows.slice(0, 90).map((e) => ({ ...pick(e, ['uid', 'sport', 'leagueKey', 'startTime', 'state', 'clock', 'period', 'homeAbbr', 'homeScore', 'awayAbbr', 'awayScore', 'homeLogo', 'awayLogo', 'fetchedAt']), league: cut(e.league, 28), name: cut(e.name, 70), statusText: cut(e.statusText, 70), homeTeam: cut(e.homeTeam, 30), awayTeam: cut(e.awayTeam, 30), venue: cut(e.venue, 40) }));
      out.push(await save(db, 'sports', { items, provider: 'ESPN public API' }, items.length));
    }
    if (want('status')) {
      const [sources, jobs] = await Promise.all([db.Source.list('key', 200), db.RefreshJob.list('-startedAt', 12)]);
      const status = {
        sources: sources.map((s: any) => ({ ...pick(s, ['key', 'kind', 'enabled', 'lastStatus', 'lastAttemptAt', 'lastSuccessAt', 'consecutiveFailures', 'lastItemCount']), name: cut(s.name, 24), lastError: cut(s.lastError, 70) })),
        jobs: jobs.map((j: any) => ({ ...pick(j, ['job', 'startedAt', 'status', 'sourcesTried', 'sourcesOk', 'itemsFetched', 'itemsNew', 'duplicatesSkipped']), errors: (j.errors || []).slice(0, 2).map((x: string) => cut(x, 60)) })),
      };
      out.push(await save(db, 'status', status, sources.length));
    }
    return Response.json({ ok: true, built: out });
  } catch (e) {
    return Response.json({ ok: false, built: out, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
});
