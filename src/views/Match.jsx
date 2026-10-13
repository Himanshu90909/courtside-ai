import React, { useMemo, useState } from 'react';
import { SAMPLE, resolve, normalizeText } from '../lib/entity.js';

const toText = (rows) => rows.map((r) => [r.source, r.name, r.address, r.country].join(' | ')).join('\n');
const parse = (t) => t.split('\n').map((l) => l.split('|').map((x) => x.trim())).filter((p) => p.length >= 4 && p[1]).map(([source, name, address, country]) => ({ source, name, address, country }));

export default function Match() {
  const [text, setText] = useState(toText(SAMPLE));
  const [th, setTh] = useState(0.72);
  const rows = useMemo(() => parse(text), [text]);
  const res = useMemo(() => resolve(rows, th), [rows, th]);
  const saved = Math.max(0, 100 - (res.candidateCount / Math.max(1, res.totalPairs)) * 100);
  return (
    <div className="grid">
      <section className="hero"><h1>Entity Match</h1><span className="mute">Business entity resolution engine from the Amazon ML Challenge, running live in your browser. Records from different sources are normalized, blocked, fuzzy-scored and clustered into one real-world entity.</span></section>
      <div className="kpis">
        <div className="kpi"><span className="mute">Records</span><b>{rows.length}</b></div>
        <div className="kpi"><span className="mute">Candidate pairs</span><b>{res.candidateCount}</b></div>
        <div className="kpi"><span className="mute">Blocking saved</span><b className="ok">{saved.toFixed(0)}%</b></div>
        <div className="kpi"><span className="mute">Entities merged</span><b>{res.clusters.length}</b></div>
      </div>
      <div className="grid g2">
        <section className="card">
          <div className="row"><h3>Input records</h3><button className="btn" data-focusable onClick={() => setText(toText(SAMPLE))}>Reset sample</button></div>
          <span className="mute" style={{ fontSize: '.8rem' }}>source | business name | address | country (edit freely)</span>
          <textarea value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} aria-label="Records" style={{ marginTop: 8 }} />
          <label className="mute" style={{ display: 'block', marginTop: 12 }}>Match threshold: <b>{th.toFixed(2)}</b></label>
          <input type="range" min="0.4" max="0.95" step="0.01" value={th} onChange={(e) => setTh(Number(e.target.value))} data-focusable style={{ width: '100%' }} aria-label="Match threshold" />
        </section>
        <section className="grid" style={{ alignContent: 'start' }}>
          <div className="card"><h3>Resolved entities</h3>
            <div className="grid" style={{ marginTop: 10 }}>
              {res.clusters.length === 0 && <span className="mute">No matches at this threshold.</span>}
              {res.clusters.map((c, n) => (
                <div key={n} className="cluster">
                  <b>Entity {n + 1} <span className="pill">{c.length} records</span></b>
                  {c.map((i) => <div key={i} className="m"><span className="badge">{rows[i].source}</span><span>{rows[i].name}</span><span className="mute" style={{ fontSize: '.8rem' }}>{rows[i].address}</span></div>)}
                </div>))}
            </div>
          </div>
        </section>
      </div>
      <section className="card"><h3>Scored candidate pairs</h3>
        <div className="tbl"><table><thead><tr><th>Record A</th><th>Record B</th><th>Name</th><th>Address</th><th>Score</th><th>Match</th></tr></thead>
          <tbody>{res.pairs.slice(0, 40).map((p) => (
            <tr key={`${p.i}-${p.j}`}><td>{rows[p.i].name}</td><td>{rows[p.j].name}</td><td>{p.name.toFixed(2)}</td><td>{p.addr.toFixed(2)}</td>
              <td style={{ minWidth: 110 }}><div className="bar"><i style={{ width: `${p.total * 100}%` }} /></div>{p.total.toFixed(2)}</td>
              <td className={p.match ? 'ok' : 'mute'}>{p.match ? 'Same entity' : 'Different'}</td></tr>))}</tbody></table></div>
        <p className="mute" style={{ fontSize: '.82rem' }}>Normalization example: “{rows[0] ? rows[0].name : ''}” becomes “{rows[0] ? normalizeText(rows[0].name) : ''}”.</p>
      </section>
    </div>
  );
}
