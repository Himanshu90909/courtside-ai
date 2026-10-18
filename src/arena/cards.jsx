import React, { useState } from 'react';
import { Badge, Icon, shareLink } from './ui.jsx';
import { useSaved, toggleSaved, usePrefs } from './store.js';
import { ago, fmtDate, fmtDay, until, catLabel, countryLabel, CONTENT_LABEL, TYPE_LABEL, STATUS_LABEL, hostOf } from './format.js';

function SaveBtn({ item }) {
  const [saved, setSaved] = useSaved();
  const on = saved.some((x) => x.uid === item.uid);
  return (<button className={`ico-btn ${on ? 'on' : ''}`} aria-pressed={on} aria-label={on ? 'Remove bookmark' : 'Bookmark'} title={on ? 'Saved' : 'Save'} onClick={() => toggleSaved(setSaved, item)}><Icon name="bookmark" /></button>);
}
function ShareBtn({ title, url }) {
  const [msg, setMsg] = useState('');
  return (<button className="ico-btn" aria-label="Share" title={msg || 'Share'} onClick={async () => { const r = await shareLink(title, url); setMsg(r === 'copied' ? 'Link copied' : ''); setTimeout(() => setMsg(''), 1500); }}><Icon name="share" />{msg && <span className="toast-mini">{msg}</span>}</button>);
}

export function NewsCard({ a, compact }) {
  const [prefs] = usePrefs();
  const kind = a.contentType === 'opinion' ? 'warn' : a.contentType === 'analysis' ? 'info' : 'neutral';
  return (
    <article className={`card news ${compact ? 'compact' : ''}`}>
      {!compact && a.imageUrl && <img className="thumb" src={a.imageUrl} alt="" loading="lazy" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
      <div className="news-body">
        <div className="meta-row"><Badge kind="blue">{catLabel(a.category)}</Badge><Badge kind={kind}>{CONTENT_LABEL[a.contentType] || 'Report'}</Badge>{a.coverage > 1 && <Badge kind="neutral">{a.coverage} reports</Badge>}</div>
        <h3><a href={a.articleUrl} target="_blank" rel="noopener noreferrer">{a.title}</a></h3>
        {!compact && a.summary && <p className="sum">{a.summary}</p>}
        <div className="meta"><b>{a.sourceName}</b><span>Published {a.publishedAt ? fmtDate(a.publishedAt, prefs.timezone) : 'unknown'}</span><span>Collected {ago(a.fetchedAt)}</span><span>{countryLabel(a.country)}</span></div>
        {a.related?.length > 0 && !compact && (<details className="related"><summary>Also reported by {a.related.length} other source{a.related.length > 1 ? 's' : ''}</summary><ul>{a.related.slice(0, 5).map((r) => <li key={r.articleUrl}><a href={r.articleUrl} target="_blank" rel="noopener noreferrer">{r.title}</a> <span className="mute">· {r.sourceName}</span></li>)}</ul></details>)}
        <div className="card-actions"><a className="link-ext" href={a.articleUrl} target="_blank" rel="noopener noreferrer">Read on {hostOf(a.articleUrl)} <Icon name="ext" size={14} /></a><span className="grow" /><SaveBtn item={{ uid: a.uid, kind: 'article', title: a.title, url: a.articleUrl, source: a.sourceName }} /><ShareBtn title={a.title} url={a.articleUrl} /></div>
      </div>
    </article>
  );
}

const STATUS_KIND = { open: 'good', closing_soon: 'bad', closed: 'neutral', under_verification: 'warn', unknown: 'neutral' };
export function OppCard({ o, onReport }) {
  const [prefs] = usePrefs();
  const [saved, setSaved] = useSaved();
  const mine = saved.find((x) => x.uid === o.uid);
  const left = until(o.deadline);
  return (
    <article className="card opp">
      <div className="meta-row"><Badge kind="blue">{TYPE_LABEL[o.type] || o.type}</Badge><Badge kind={STATUS_KIND[o.status]}>{STATUS_LABEL[o.status] || o.status}</Badge>{o.remote === 'remote' && <Badge>Remote</Badge>}{o.paid === 'paid' && <Badge kind="good">Paid</Badge>}<Badge kind="neutral">{o.verificationStatus === 'verified' ? 'Verified' : 'Listed by source · not independently verified'}</Badge></div>
      <h3><a href={o.applyUrl} target="_blank" rel="noopener noreferrer">{o.title}</a></h3>
      <div className="org">{o.organization} · {o.location || 'Location unknown'} · {countryLabel(o.country)}</div>
      {o.summary && <p className="sum">{o.summary}</p>}
      <dl className="facts">
        <div><dt>Deadline</dt><dd>{o.deadline ? <>{fmtDay(o.deadline, prefs.timezone)} {left && <span className={`left ${o.status === 'closing_soon' ? 'bad' : ''}`}>({left})</span>}</> : 'Unknown (not provided by source)'}{o.deadline && !o.deadlineVerified && ' · unverified'}</dd></div>
        <div><dt>Compensation</dt><dd>{o.compensation || (o.prize ? `Prize: ${o.prize}` : 'Unknown')}</dd></div>
        <div><dt>Source</dt><dd><a href={o.sourceUrl} target="_blank" rel="noopener noreferrer">{o.sourceName}</a> · collected {ago(o.fetchedAt)}</dd></div>
      </dl>
      {o.tags?.length > 0 && <div className="tags">{o.tags.slice(0, 5).map((t) => <span key={t} className="tag">{t}</span>)}</div>}
      <div className="card-actions">
        <a className="btn primary sm" href={o.applyUrl} target="_blank" rel="noopener noreferrer">Official page <Icon name="ext" size={14} /></a>
        {o.deadline && o.status !== 'closed' && (<label className="remind"><input type="checkbox" checked={!!mine?.remind} onChange={(e) => { const on = e.target.checked; setSaved((cur) => { const has = cur.some((x) => x.uid === o.uid); const base = has ? cur : [{ uid: o.uid, kind: 'opportunity', title: o.title, url: o.applyUrl, deadline: o.deadline, source: o.sourceName, savedAt: new Date().toISOString(), remind: false }, ...cur]; return base.map((x) => (x.uid === o.uid ? { ...x, remind: on } : x)); }); }} /> Remind me</label>)}
        <span className="grow" />
        <SaveBtn item={{ uid: o.uid, kind: 'opportunity', title: o.title, url: o.applyUrl, deadline: o.deadline, source: o.sourceName }} />
        <ShareBtn title={o.title} url={o.applyUrl} />
        {onReport && <button className="ico-btn" aria-label="Report suspicious listing" title="Report" onClick={() => onReport(o)}><Icon name="flag" /></button>}
      </div>
    </article>
  );
}

export function MatchCard({ e }) {
  const [prefs] = usePrefs();
  const live = e.state === 'in', done = e.state === 'post';
  const noScore = !e.awayTeam;
  return (
    <article className={`card match ${live ? 'live' : ''}`}>
      <div className="meta-row"><span className="lg">{e.league}</span>{live ? <Badge kind="bad">LIVE</Badge> : done ? <Badge>Final</Badge> : <Badge kind="info">Upcoming</Badge>}</div>
      {noScore ? (<><h3>{e.name}</h3><div className="mute">{e.statusText || 'Status not provided'}</div></>) : (
        <div className="teams">
          {[['home', e.homeTeam, e.homeScore, e.homeLogo], ['away', e.awayTeam, e.awayScore, e.awayLogo]].map(([k, n, s, logo]) => (
            <div key={k} className="trow">{logo ? <img src={logo} alt="" loading="lazy" referrerPolicy="no-referrer" onError={(ev) => { ev.currentTarget.style.visibility = 'hidden'; }} /> : <span className="logo-ph" />}<span className="tn">{n}</span><b className="ts">{s ?? '–'}</b></div>
          ))}
        </div>)}
      <div className="mstat">{e.statusText}{live && e.clock && e.sport !== 'cricket' && e.sport !== 'tennis' ? ` · ${e.clock}` : ''}</div>
      <div className="meta"><span>{fmtDate(e.startTime, prefs.timezone)}</span>{e.venue && <span>{e.venue}</span>}</div>
      <div className="prov">Provider: {e.provider} · updated {ago(e.fetchedAt)}</div>
    </article>
  );
}
