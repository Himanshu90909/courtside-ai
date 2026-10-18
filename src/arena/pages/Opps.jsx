import React, { useState } from 'react';
import { getOpps } from '../api.js';
import { useData, Skeleton, Empty, ErrorBox, Freshness, Pager, useDebounced, Section } from '../ui.jsx';
import { OppCard } from '../cards.jsx';
import { usePrefs } from '../store.js';

// types: backend `type` values this page shows. `gaps`: things the brief asks for that have NO connected source yet.
export default function Opps({ title, blurb, types, gaps = [], scam = true }) {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [remote, setRemote] = useState('all');
  const [paid, setPaid] = useState('all');
  const [sort, setSort] = useState('deadline');
  const [closed, setClosed] = useState(false);
  const [page, setPage] = useState(1);
  const dq = useDebounced(q);
  const [prefs] = usePrefs();
  const [s, reload] = useData(() => getOpps({ types, q: dq, status, remote, paid, sort, includeClosed: closed, page, limit: 20 }), [dq, status, remote, paid, sort, closed, page, types.join()]);
  const reset = (fn) => (e) => { fn(e.target.value); setPage(1); };
  const d = s.data;
  const report = (o) => { try { const r = JSON.parse(localStorage.getItem('arena:reports') || '[]'); r.push({ uid: o.uid, title: o.title, at: new Date().toISOString() }); localStorage.setItem('arena:reports', JSON.stringify(r)); alert('Thanks. Your report was saved on this device. A shared moderation queue needs sign-in, which is not enabled yet.'); } catch { /* ignore */ } };
  return (
    <>
      <h1 className="page-h">{title}</h1>
      <p className="lede">{blurb}</p>
      {scam && <div className="note warn" role="note"><b>Check before you apply.</b> Listings come from third-party sources and are not independently verified. Use the official page, never pay to apply, and be wary of requests for fees or personal documents.</div>}
      {d && <Freshness label="Opportunities" health={d.health} fromCache={s.fromCache} clientFetchedAt={s.clientFetchedAt} />}
      <div className="filters" role="search">
        <label className="grow">Search<input type="search" value={q} onChange={reset(setQ)} placeholder="Title, organisation or tag" /></label>
        <label>Status<select value={status} onChange={reset(setStatus)}><option value="all">Open and closing</option><option value="open">Open</option><option value="closing_soon">Closing soon</option><option value="unknown">Deadline unknown</option><option value="closed">Closed</option></select></label>
        {!types.every((t) => ['hackathon', 'coding_competition'].includes(t)) && <label>Work mode<select value={remote} onChange={reset(setRemote)}><option value="all">Any</option><option value="remote">Remote</option><option value="onsite">On-site</option></select></label>}
        <label>Pay<select value={paid} onChange={reset(setPaid)}><option value="all">Any</option><option value="paid">Paid (stated)</option><option value="unknown">Not stated</option></select></label>
        <label>Sort<select value={sort} onChange={reset(setSort)}><option value="deadline">Closing date</option><option value="newest">Newest</option></select></label>
        <label className="chk"><input type="checkbox" checked={closed} onChange={(e) => { setClosed(e.target.checked); setPage(1); }} /> Include closed</label>
      </div>
      <div className="mute small">Statuses are calculated from the deadline the source provides, in your timezone ({prefs.timezone}). Listings without a stated deadline show "Deadline unknown".</div>
      {s.status === 'loading' && <Skeleton rows={4} h={160} />}
      {s.status === 'error' && <ErrorBox message={s.error} onRetry={reload} />}
      {d && (<>
        <div className="count" aria-live="polite">{d.total} listing{d.total === 1 ? '' : 's'}</div>
        {d.items.length ? <div className="grid g2">{d.items.map((o) => <OppCard key={o.uid} o={o} onReport={report} />)}</div> : <Empty title="No listings match">Try another status or clear the search.</Empty>}
        <Pager page={d.page} pages={d.pages} onPage={(p) => { setPage(p); window.scrollTo({ top: 0 }); }} />
      </>)}
      {gaps.length > 0 && (<Section title="Not connected yet" hint="Shown honestly rather than filled with made-up listings"><ul className="gaps">{gaps.map((g) => <li key={g}>{g}</li>)}</ul></Section>)}
    </>
  );
}
