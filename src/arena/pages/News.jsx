import React, { useState } from 'react';
import { getNews } from '../api.js';
import { useData, Skeleton, Empty, ErrorBox, Freshness, Pager, useDebounced } from '../ui.jsx';
import { NewsCard } from '../cards.jsx';
import { CATS, COUNTRIES } from '../format.js';

export default function News({ title, category = 'all', blurb, note }) {
  const [q, setQ] = useState(() => { const v = sessionStorage.getItem('arena:q') || ''; sessionStorage.removeItem('arena:q'); return v; });
  const [country, setCountry] = useState('all');
  const [ctype, setCtype] = useState('all');
  const [sort, setSort] = useState('new');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [cat, setCat] = useState(category);
  const dq = useDebounced(q);
  const [s, reload] = useData(() => getNews({ category: cat, q: dq, country, contentType: ctype, sort, from, to, page, limit: 18 }), [cat, dq, country, ctype, sort, from, to, page]);
  const reset = (fn) => (e) => { fn(e.target.value); setPage(1); };
  const d = s.data;
  return (
    <>
      <h1 className="page-h">{title}</h1>
      {blurb && <p className="lede">{blurb}</p>}
      {note && <div className="note" role="note">{note}</div>}
      {d && <Freshness label="News" health={d.health} fromCache={s.fromCache} clientFetchedAt={s.clientFetchedAt} />}
      <div className="filters" role="search">
        <label className="grow">Search<input type="search" value={q} onChange={reset(setQ)} placeholder="Keyword in headline or summary" /></label>
        {category === 'all' && <label>Category<select value={cat} onChange={reset(setCat)}><option value="all">All categories</option>{CATS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select></label>}
        <label>Country<select value={country} onChange={reset(setCountry)}><option value="all">All</option>{Object.entries(COUNTRIES).filter(([k]) => k !== 'EU' && k !== 'GLOBAL').map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        <label>Type<select value={ctype} onChange={reset(setCtype)}><option value="all">Any</option><option value="news">Reports</option><option value="analysis">Analysis</option><option value="opinion">Opinion</option></select></label>
        <label>From<input type="date" value={from} onChange={reset(setFrom)} /></label>
        <label>To<input type="date" value={to} onChange={reset(setTo)} /></label>
        <label>Sort<select value={sort} onChange={reset(setSort)}><option value="new">Newest</option><option value="coverage">Most covered</option></select></label>
      </div>
      {s.status === 'loading' && <Skeleton rows={5} h={110} />}
      {s.status === 'error' && <ErrorBox message={s.error} onRetry={reload} />}
      {d && (<>
        <div className="count" aria-live="polite">{d.total} stor{d.total === 1 ? 'y' : 'ies'}{s.status === 'refreshing' ? ' · updating…' : ''}</div>
        {d.items.length ? <div className="grid g2">{d.items.map((a) => <NewsCard key={a.uid} a={a} />)}</div> : <Empty title="No stories match">Try removing a filter or searching a broader keyword.</Empty>}
        <Pager page={d.page} pages={d.pages} onPage={(p) => { setPage(p); window.scrollTo({ top: 0 }); }} />
      </>)}
    </>
  );
}
