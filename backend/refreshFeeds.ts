import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ---------- source registry (all keyless, official publisher feeds / public APIs) ----------
type Src = { key: string; name: string; kind: string; category: string; url: string; homepage: string; country: string; license: string };
const SOURCES: Src[] = [
  { key: 'bbc-world', name: 'BBC News', kind: 'rss', category: 'world', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', homepage: 'https://www.bbc.com/news', country: 'GB', license: 'BBC RSS terms: headline+link reuse for personal/non-commercial use' },
  { key: 'bbc-education', name: 'BBC News', kind: 'rss', category: 'education', url: 'https://feeds.bbci.co.uk/news/education/rss.xml', homepage: 'https://www.bbc.com/news/education', country: 'GB', license: 'BBC RSS terms' },
  { key: 'bbc-politics', name: 'BBC News', kind: 'rss', category: 'politics', url: 'https://feeds.bbci.co.uk/news/politics/rss.xml', homepage: 'https://www.bbc.com/news/politics', country: 'GB', license: 'BBC RSS terms' },
  { key: 'bbc-tech', name: 'BBC News', kind: 'rss', category: 'science_tech', url: 'https://feeds.bbci.co.uk/news/technology/rss.xml', homepage: 'https://www.bbc.com/news/technology', country: 'GB', license: 'BBC RSS terms' },
  { key: 'bbc-science', name: 'BBC News', kind: 'rss', category: 'science_tech', url: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml', homepage: 'https://www.bbc.com/news/science_and_environment', country: 'GB', license: 'BBC RSS terms' },
  { key: 'bbc-business', name: 'BBC News', kind: 'rss', category: 'business', url: 'https://feeds.bbci.co.uk/news/business/rss.xml', homepage: 'https://www.bbc.com/news/business', country: 'GB', license: 'BBC RSS terms' },
  { key: 'bbc-sport', name: 'BBC Sport', kind: 'rss', category: 'sports', url: 'https://feeds.bbci.co.uk/sport/rss.xml', homepage: 'https://www.bbc.com/sport', country: 'GB', license: 'BBC RSS terms' },
  { key: 'guardian-world', name: 'The Guardian', kind: 'rss', category: 'world', url: 'https://www.theguardian.com/world/rss', homepage: 'https://www.theguardian.com/world', country: 'GB', license: 'Guardian RSS: headline+link, attribution required' },
  { key: 'guardian-politics', name: 'The Guardian', kind: 'rss', category: 'politics', url: 'https://www.theguardian.com/politics/rss', homepage: 'https://www.theguardian.com/politics', country: 'GB', license: 'Guardian RSS' },
  { key: 'guardian-education', name: 'The Guardian', kind: 'rss', category: 'education', url: 'https://www.theguardian.com/education/rss', homepage: 'https://www.theguardian.com/education', country: 'GB', license: 'Guardian RSS' },
  { key: 'guardian-business', name: 'The Guardian', kind: 'rss', category: 'business', url: 'https://www.theguardian.com/business/rss', homepage: 'https://www.theguardian.com/business', country: 'GB', license: 'Guardian RSS' },
  { key: 'guardian-sport', name: 'The Guardian', kind: 'rss', category: 'sports', url: 'https://www.theguardian.com/sport/rss', homepage: 'https://www.theguardian.com/sport', country: 'GB', license: 'Guardian RSS' },
  { key: 'guardian-science', name: 'The Guardian', kind: 'rss', category: 'science_tech', url: 'https://www.theguardian.com/science/rss', homepage: 'https://www.theguardian.com/science', country: 'GB', license: 'Guardian RSS' },
  { key: 'hindu-national', name: 'The Hindu', kind: 'rss', category: 'world', url: 'https://www.thehindu.com/news/national/feeder/default.rss', homepage: 'https://www.thehindu.com/news/national/', country: 'IN', license: 'The Hindu RSS: headline+link' },
  { key: 'hindu-education', name: 'The Hindu', kind: 'rss', category: 'education', url: 'https://www.thehindu.com/education/feeder/default.rss', homepage: 'https://www.thehindu.com/education/', country: 'IN', license: 'The Hindu RSS' },
  { key: 'hindu-sport', name: 'The Hindu', kind: 'rss', category: 'sports', url: 'https://www.thehindu.com/sport/feeder/default.rss', homepage: 'https://www.thehindu.com/sport/', country: 'IN', license: 'The Hindu RSS' },
  { key: 'hindu-business', name: 'The Hindu', kind: 'rss', category: 'business', url: 'https://www.thehindu.com/business/feeder/default.rss', homepage: 'https://www.thehindu.com/business/', country: 'IN', license: 'The Hindu RSS' },
  { key: 'hindu-sci-tech', name: 'The Hindu', kind: 'rss', category: 'science_tech', url: 'https://www.thehindu.com/sci-tech/feeder/default.rss', homepage: 'https://www.thehindu.com/sci-tech/', country: 'IN', license: 'The Hindu RSS' },
  { key: 'espn-news', name: 'ESPN', kind: 'rss', category: 'sports', url: 'https://www.espn.com/espn/rss/news', homepage: 'https://www.espn.com', country: 'US', license: 'ESPN RSS: personal use, link back' },
  { key: 'devpost', name: 'Devpost', kind: 'hackathon_api', category: 'hackathon', url: 'https://devpost.com/api/hackathons?status[]=upcoming&status[]=open', homepage: 'https://devpost.com/hackathons', country: 'GLOBAL', license: 'Devpost public listing; apply on Devpost' },
  { key: 'ctftime', name: 'CTFtime', kind: 'hackathon_api', category: 'coding_competition', url: 'https://ctftime.org/api/v1/events/?limit=40', homepage: 'https://ctftime.org', country: 'GLOBAL', license: 'CTFtime public API' },
  { key: 'codeforces', name: 'Codeforces', kind: 'hackathon_api', category: 'coding_competition', url: 'https://codeforces.com/api/contest.list?gym=false', homepage: 'https://codeforces.com/contests', country: 'GLOBAL', license: 'Codeforces public API' },
  { key: 'remotive', name: 'Remotive', kind: 'jobs_api', category: 'remote_job', url: 'https://remotive.com/api/remote-jobs?limit=60', homepage: 'https://remotive.com', country: 'GLOBAL', license: 'Remotive API: link back to job URL, credit Remotive' },
  { key: 'arbeitnow', name: 'Arbeitnow', kind: 'jobs_api', category: 'job', url: 'https://www.arbeitnow.com/api/job-board-api', homepage: 'https://www.arbeitnow.com', country: 'EU', license: 'Arbeitnow public API' },
];

// ---------- helpers ----------
const strip = (s = '') => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const tag = (x: string, t: string) => { const m = x.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`, 'i')); return m ? m[1] : ''; };
async function sha(s: string) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('').slice(0, 24); }
const normUrl = (u: string) => { try { const x = new URL(u); x.hash = ''; ['utm_source', 'utm_medium', 'utm_campaign', 'at_medium', 'at_campaign', 'ns_source', 'ns_mchannel', 'ns_campaign', 'ns_linkname'].forEach((p) => x.searchParams.delete(p)); return x.toString(); } catch { return u; } };
const STOP = new Set(['the', 'a', 'an', 'of', 'to', 'in', 'on', 'for', 'and', 'as', 'at', 'by', 'is', 'are', 'with', 'after', 'over', 'from', 'says', 'say']);
const titleKey = (t: string) => t.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter((w) => w && !STOP.has(w)).sort().join(' ');
const tokens = (t: string) => new Set(titleKey(t).split(' ').filter((w) => w.length > 2));
const jaccard = (a: Set<string>, b: Set<string>) => { let i = 0; for (const x of a) if (b.has(x)) i++; return i / Math.max(1, a.size + b.size - i); };

async function fetchRetry(url: string, tries = 3, timeoutMs = 12000): Promise<Response> {
  let last: unknown;
  for (let i = 0; i < tries; i++) {
    const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const r = await fetch(url, { signal: ctrl.signal, headers: { 'user-agent': 'CourtSideArena/2.0 (+feed reader; contact via GitHub Himanshu90909)', accept: '*/*' } });
      clearTimeout(t);
      if (r.status === 429 || r.status >= 500) throw new Error(`HTTP ${r.status}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r;
    } catch (e) { clearTimeout(t); last = e; if (i < tries - 1) await new Promise((res) => setTimeout(res, 600 * 2 ** i)); }
  }
  throw last instanceof Error ? last : new Error(String(last));
}

async function dbRetry<T>(fn: () => Promise<T>, tries = 6): Promise<T> {
  let last: unknown;
  for (let i = 0; i < tries; i++) {
    try { return await fn(); } catch (e) {
      last = e; const m = e instanceof Error ? e.message : String(e);
      if (!/rate limit|429|too many/i.test(m)) throw e;
      await new Promise((res) => setTimeout(res, 1200 * (i + 1)));
    }
  }
  throw last instanceof Error ? last : new Error(String(last));
}
const pause = (ms: number) => new Promise((res) => setTimeout(res, ms));

function parseFeed(xml: string) {
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];
  return blocks.map((b) => {
    let link = strip(tag(b, 'link')); if (!link) link = (b.match(/<link[^>]*href="([^"]+)"/i) || [])[1] || '';
    const pub = strip(tag(b, 'pubDate')) || strip(tag(b, 'published')) || strip(tag(b, 'updated')) || strip(tag(b, 'dc:date'));
    const d = pub ? new Date(pub) : null;
    const img = (b.match(/<media:(?:thumbnail|content)[^>]*url="([^"]+)"/i) || [])[1] || (b.match(/<enclosure[^>]*url="([^"]+)"[^>]*type="image/i) || [])[1] || '';
    return { title: strip(tag(b, 'title')), summary: strip(tag(b, 'description') || tag(b, 'summary')).slice(0, 320), link, publishedAt: d && !isNaN(d.getTime()) ? d.toISOString() : null, imageUrl: img };
  }).filter((i) => i.title && i.link && /^https?:/.test(i.link));
}

// light, rule-based labelling only: we never claim anything beyond what the publisher feed/URL says
function contentType(url: string, title: string): string {
  if (/\/(opinion|commentisfree|comment|editorial|views)\b/i.test(url) || /^opinion[:|]/i.test(title)) return 'opinion';
  if (/\/(analysis|explainer|long-read|features?)\b/i.test(url) || /^analysis[:|]/i.test(title)) return 'analysis';
  return 'news';
}

// ---------- ingest: news ----------
async function ingestRss(db: any, src: Src, existing: Map<string, any>, clusters: { id: string; tok: Set<string>; cat: string }[], fetchedAt: string) {
  const res = await fetchRetry(src.url);
  const items = parseFeed(await res.text());
  if (!items.length) throw new Error('feed parsed but contained 0 valid items');
  let added = 0, dup = 0; const batch: any[] = [];
  for (const it of items.slice(0, 40)) {
    const url = normUrl(it.link); const uid = await sha(url);
    if (existing.has(uid)) { dup++; continue; }
    existing.set(uid, true);
    const tk = tokens(it.title); let cid = '';
    for (const c of clusters) { if (c.cat === src.category && jaccard(tk, c.tok) >= 0.6) { cid = c.id; break; } }
    if (!cid) { cid = uid; clusters.push({ id: cid, tok: tk, cat: src.category }); }
    batch.push({ uid, title: it.title, summary: it.summary, category: src.category, sourceKey: src.key, sourceName: src.name, sourceUrl: src.homepage, articleUrl: url, country: src.country, publishedAt: it.publishedAt || undefined, fetchedAt, imageUrl: it.imageUrl || undefined, contentType: contentType(url, it.title), clusterId: cid, titleKey: titleKey(it.title).slice(0, 200), verificationStatus: 'publisher_feed', hidden: false, reportCount: 0 });
    added++;
  }
  for (let i = 0; i < batch.length; i += 20) { await dbRetry(() => db.Article.bulkCreate(batch.slice(i, i + 20))); await pause(350); }
  return { fetched: items.length, added, dup };
}

// ---------- ingest: opportunities ----------
const toIso = (v: unknown) => { if (v == null || v === '') return undefined; const d = new Date(typeof v === 'number' && v < 1e12 ? v * 1000 : (v as string)); return isNaN(d.getTime()) ? undefined : d.toISOString(); };
const parseDevpostEnd = (s: string) => { // "Aug 31 - Oct 23, 2026" or "Oct 23, 2026"
  const m = s.match(/([A-Z][a-z]{2})\s+(\d{1,2})(?:,\s*(\d{4}))?\s*-\s*(?:([A-Z][a-z]{2})\s+)?(\d{1,2}),\s*(\d{4})/);
  if (!m) { const one = s.match(/([A-Z][a-z]{2})\s+(\d{1,2}),\s*(\d{4})/); return one ? toIso(`${one[1]} ${one[2]}, ${one[3]} 23:59:00 UTC`) : undefined; }
  return toIso(`${m[4] || m[1]} ${m[5]}, ${m[6]} 23:59:00 UTC`);
};

async function ingestOpps(db: any, src: Src, existing: Set<string>, fetchedAt: string) {
  const res = await fetchRetry(src.url); const raw = await res.json(); const out: any[] = [];
  if (src.key === 'devpost') {
    for (const h of raw.hackathons || []) {
      const end = parseDevpostEnd(h.submission_period_dates || '');
      out.push({ title: h.title, summary: `Themes: ${(h.themes || []).map((t: any) => t.name).join(', ') || 'not listed'}. ${h.registrations_count ?? 'Unknown'} registered.`, type: 'hackathon', organization: h.organization_name || 'Unknown', applyUrl: h.url, country: 'GLOBAL', location: h.displayed_location?.location || 'Unknown', remote: /online/i.test(h.displayed_location?.location || '') ? 'remote' : 'unknown', paid: 'unknown', tags: (h.themes || []).map((t: any) => t.name), deadline: end, deadlineVerified: !!end, prize: strip(h.prize_amount || '') || undefined, verificationStatus: 'source_listed', publishedAt: undefined, _id: String(h.id) });
    }
  } else if (src.key === 'ctftime') {
    for (const e of raw) out.push({ title: e.title, summary: strip(e.description || '').slice(0, 280), type: 'coding_competition', organization: (e.organizers || []).map((o: any) => o.name).join(', ') || 'Unknown', applyUrl: e.ctftime_url, country: 'GLOBAL', location: e.onsite ? (e.location || 'On-site') : 'Online', remote: e.onsite ? 'onsite' : 'remote', paid: 'unknown', tags: ['CTF', 'security', e.format || ''].filter(Boolean), opensAt: toIso(e.start), deadline: toIso(e.start), deadlineVerified: !!toIso(e.start), verificationStatus: 'source_listed', _id: String(e.id) });
  } else if (src.key === 'codeforces') {
    for (const c of (raw.result || []).filter((c: any) => c.phase === 'BEFORE').slice(0, 20)) {
      const start = toIso(c.startTimeSeconds);
      out.push({ title: c.name, summary: `${c.type} contest, duration ${Math.round((c.durationSeconds || 0) / 60)} min.`, type: 'coding_competition', organization: 'Codeforces', applyUrl: `https://codeforces.com/contests/${c.id}`, country: 'GLOBAL', location: 'Online', remote: 'remote', paid: 'unpaid', tags: ['competitive programming'], opensAt: start, deadline: start, deadlineVerified: !!start, verificationStatus: 'source_listed', _id: String(c.id) });
    }
  } else if (src.key === 'remotive') {
    for (const j of raw.jobs || []) {
      const isIntern = /intern|trainee|apprentice|graduate/i.test(j.title + ' ' + (j.job_type || ''));
      out.push({ title: j.title, summary: strip(j.description || '').slice(0, 300), type: isIntern ? 'internship' : 'remote_job', organization: j.company_name?.trim() || 'Unknown', applyUrl: j.url, country: 'GLOBAL', location: j.candidate_required_location || 'Unknown', remote: 'remote', paid: j.salary ? 'paid' : 'unknown', compensation: j.salary || undefined, tags: (j.tags || []).slice(0, 8), publishedAt: toIso(j.publication_date), deadlineVerified: false, verificationStatus: 'source_listed', _id: String(j.id) });
    }
  } else if (src.key === 'arbeitnow') {
    for (const j of (raw.data || []).slice(0, 80)) {
      const isIntern = /intern|praktik|trainee|werkstudent|apprentice|ausbildung/i.test(j.title + ' ' + (j.job_types || []).join(' '));
      out.push({ title: j.title, summary: strip(j.description || '').slice(0, 300), type: isIntern ? 'internship' : 'job', organization: j.company_name || 'Unknown', applyUrl: j.url, country: 'EU', location: j.location || 'Unknown', remote: j.remote ? 'remote' : 'onsite', paid: 'unknown', tags: (j.tags || []).slice(0, 8), publishedAt: toIso(j.created_at), deadlineVerified: false, verificationStatus: 'source_listed', _id: j.slug });
    }
  }
  let added = 0, dup = 0; const batch: any[] = [];
  for (const o of out) {
    if (!o.title || !o.applyUrl) continue;
    const uid = await sha(`${src.key}|${o._id || o.applyUrl}`); delete o._id;
    if (existing.has(uid)) { dup++; continue; } existing.add(uid);
    batch.push({ ...o, uid, sourceKey: src.key, sourceName: src.name, sourceUrl: src.homepage, fetchedAt, hidden: false, reportCount: 0 }); added++;
  }
  for (let i = 0; i < batch.length; i += 20) { await dbRetry(() => db.Opportunity.bulkCreate(batch.slice(i, i + 20))); await pause(350); }
  return { fetched: out.length, added, dup };
}

// ---------- handler ----------
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const db = base44.asServiceRole.entities;
  const body = await req.json().catch(() => ({}));
  const only: string[] | undefined = body.only;
  const startedAt = new Date().toISOString();
  const job = await db.RefreshJob.create({ job: 'refreshFeeds', startedAt, status: 'running', sourcesTried: 0, sourcesOk: 0, itemsFetched: 0, itemsNew: 0, duplicatesSkipped: 0, errors: [] });

  // make sure every registry source has a DB row (admin can toggle `enabled`)
  const rows: any[] = await db.Source.list('-created_date', 500);
  const byKey = new Map(rows.map((r) => [r.key, r]));
  for (const s of SOURCES) if (!byKey.has(s.key)) byKey.set(s.key, await db.Source.create({ key: s.key, name: s.name, kind: s.kind, category: s.category, url: s.url, homepage: s.homepage, country: s.country, enabled: true, requiresKey: false, lastStatus: 'never', consecutiveFailures: 0, license: s.license }));

  const artRows: any[] = await db.Article.list('-created_date', 2000);
  const existingArt = new Map(artRows.map((a) => [a.uid, true]));
  const clusters = artRows.slice(0, 400).map((a) => ({ id: a.clusterId || a.uid, tok: new Set((a.titleKey || '').split(' ').filter((w: string) => w.length > 2)), cat: a.category }));
  const oppRows: any[] = await db.Opportunity.list('-created_date', 3000);
  const existingOpp = new Set(oppRows.map((o) => o.uid));

  const errors: string[] = []; let tried = 0, ok = 0, fetched = 0, added = 0, dups = 0;
  for (const s of SOURCES) {
    const row = byKey.get(s.key);
    if (row && row.enabled === false) continue;
    if (only && !only.includes(s.key)) continue;
    tried++; const attempt = new Date().toISOString(); await pause(250);
    try {
      const r = s.kind === 'rss' ? await ingestRss(db, s, existingArt as any, clusters, attempt) : await ingestOpps(db, s, existingOpp, attempt);
      ok++; fetched += r.fetched; added += r.added; dups += r.dup;
      await dbRetry(() => db.Source.update(row.id, { lastAttemptAt: attempt, lastSuccessAt: new Date().toISOString(), lastStatus: 'ok', lastError: '', consecutiveFailures: 0, lastItemCount: r.fetched }));
    } catch (e) {
      const msg = `${s.key}: ${e instanceof Error ? e.message : String(e)}`; errors.push(msg);
      await dbRetry(() => db.Source.update(row.id, { lastAttemptAt: attempt, lastStatus: 'failed', lastError: msg.slice(0, 300), consecutiveFailures: (row.consecutiveFailures || 0) + 1 }));
    }
  }
  const status = ok === 0 && tried > 0 ? 'failed' : errors.length ? 'partial' : 'ok';
  await db.RefreshJob.update(job.id, { finishedAt: new Date().toISOString(), status, sourcesTried: tried, sourcesOk: ok, itemsFetched: fetched, itemsNew: added, duplicatesSkipped: dups, errors });
  return Response.json({ status, tried, ok, fetched, added, dups, errors });
});
