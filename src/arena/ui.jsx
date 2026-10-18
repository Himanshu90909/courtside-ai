import React, { useEffect, useState, useCallback, useRef } from 'react';
import { ago } from './format.js';

// Generic async data hook with loading / error / stale / cache states
export function useData(loader, deps) {
  const [s, setS] = useState({ status: 'loading', data: null, fromCache: false, clientFetchedAt: null, error: null });
  const n = useRef(0);
  const run = useCallback(() => {
    const id = ++n.current;
    setS((x) => ({ ...x, status: x.data ? 'refreshing' : 'loading', error: null }));
    loader().then((r) => { if (id === n.current) setS({ status: 'ready', data: r.data, fromCache: r.fromCache, clientFetchedAt: r.clientFetchedAt, error: r.error || null }); })
      .catch((e) => { if (id === n.current) setS((x) => ({ ...x, status: 'error', error: e.message || 'Request failed' })); });
  }, deps); // eslint-disable-line
  useEffect(() => { run(); }, [run]);
  return [s, run];
}

export const Skeleton = ({ rows = 3, h = 72 }) => (
  <div className="sk-wrap" aria-busy="true" aria-label="Loading">{Array.from({ length: rows }).map((_, i) => <div key={i} className="sk" style={{ height: h }} />)}</div>
);
export const Empty = ({ title, children }) => (<div className="empty"><div className="empty-ico" aria-hidden>∅</div><b>{title}</b>{children && <p>{children}</p>}</div>);
export const ErrorBox = ({ message, onRetry }) => (
  <div className="errbox" role="alert"><b>Could not load this section</b><p>{message}</p>{onRetry && <button className="btn" onClick={onRetry}>Retry</button>}</div>
);

// Honest freshness banner: shows REAL last successful refresh from the backend, and warns when stale or served from device cache.
export function Freshness({ health, fromCache, clientFetchedAt, label = 'Data' }) {
  if (!health) return null;
  const last = health.lastSuccessAt;
  const stale = health.stale || fromCache || health.failing > 0;
  return (
    <div className={`fresh ${stale ? 'warn' : 'ok'}`} role="status">
      <span className="dot" aria-hidden />
      <span>{label}: last successful refresh <b>{last ? ago(last) : 'never'}</b>{last && <span className="mute"> ({new Date(last).toLocaleString()})</span>}</span>
      {health.failing > 0 && <span className="tag bad">{health.failing} source{health.failing > 1 ? 's' : ''} failing</span>}
      {health.stale && <span className="tag bad">STALE: showing the latest stored data</span>}
      {fromCache && <span className="tag bad">Offline: showing copy saved on this device {clientFetchedAt ? ago(clientFetchedAt) : ''}</span>}
    </div>
  );
}

export function Section({ title, hint, action, children }) {
  return (<section className="sec"><header className="sec-h"><div><h2>{title}</h2>{hint && <span className="mute">{hint}</span>}</div>{action}</header>{children}</section>);
}

export const Badge = ({ kind = 'neutral', children }) => <span className={`badge b-${kind}`}>{children}</span>;

export function Pager({ page, pages, onPage }) {
  if (!pages || pages <= 1) return null;
  return (<nav className="pager" aria-label="Pagination"><button className="btn" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button><span>Page {page} of {pages}</span><button className="btn" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</button></nav>);
}

export const Icon = ({ name, size = 18 }) => {
  const p = {
    home: 'M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z', live: 'M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M7.5 7.5a6 6 0 0 0 0 9M16.5 7.5a6 6 0 0 1 0 9M4.5 4.5a10 10 0 0 0 0 15M19.5 4.5a10 10 0 0 1 0 15',
    news: 'M4 5h13v14H5a1 1 0 0 1-1-1zM17 8h3v10a1 1 0 0 1-1 1h-2M7 9h7M7 12h7M7 15h4', edu: 'M12 4L2 9l10 5 10-5zM6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5', gift: 'M4 9h16v4H4zM6 13v7h12v-7M12 9v11M12 9c-2 0-4-1-4-3a2 2 0 0 1 4 0 2 2 0 0 1 4 0c0 2-2 3-4 3z',
    job: 'M4 8h16v11H4zM9 8V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M4 13h16', code: 'M8 8l-4 4 4 4M16 8l4 4-4 4M14 5l-4 14', gov: 'M3 10l9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18', policy: 'M5 4h10l4 4v12H5zM15 4v4h4M8 12h8M8 16h6',
    bookmark: 'M6 4h12v17l-6-4-6 4z', bell: 'M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0', gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12l2-1-1-3-2 .5-1.5-1.5.5-2-3-1-1 2h-2l-1-2-3 1 .5 2L6 8.5 4 8l-1 3 2 1v2l-2 1 1 3 2-.5L7.5 19l-.5 2 3 1 1-2h2l1 2 3-1-.5-2 1.5-1.5 2 .5 1-3-2-1z',
    search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.5-4.5', sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4', moon: 'M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z',
    shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z', flask: 'M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3', ext: 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5', share: 'M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4',
    flag: 'M5 21V4M5 4h11l-2 4 2 4H5', menu: 'M4 6h16M4 12h16M4 18h16', warn: 'M12 3l10 18H2zM12 10v5M12 18v.5',
  }[name] || '';
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={p} /></svg>);
};

export function useDebounced(v, ms = 350) { const [d, setD] = useState(v); useEffect(() => { const t = setTimeout(() => setD(v), ms); return () => clearTimeout(t); }, [v, ms]); return d; }

export async function shareLink(title, url) {
  try { if (navigator.share) { await navigator.share({ title, url }); return 'shared'; } await navigator.clipboard.writeText(url); return 'copied'; } catch { return 'cancelled'; }
}
