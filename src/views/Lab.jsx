import React, { useMemo, useState } from 'react';
import runs from '../data/runs.json';

function md(src) {
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  const out = []; let list = false;
  for (const line of src.split('\n')) {
    if (/^- /.test(line)) { if (!list) { out.push('<ul>'); list = true; } out.push(`<li>${inline(line.slice(2))}</li>`); continue; }
    if (list) { out.push('</ul>'); list = false; }
    if (/^### /.test(line)) out.push(`<h3>${inline(line.slice(4))}</h3>`);
    else if (/^## /.test(line)) out.push(`<h2>${inline(line.slice(3))}</h2>`);
    else if (/^# /.test(line)) out.push(`<h1>${inline(line.slice(2))}</h1>`);
    else if (/^> /.test(line)) out.push(`<blockquote>${inline(line.slice(2))}</blockquote>`);
    else if (line.trim()) out.push(`<p>${inline(line)}</p>`);
  }
  if (list) out.push('</ul>');
  return out.join('');
}
const short = (v) => { const s = JSON.stringify(v); return s.length > 220 ? s.slice(0, 220) + '…' : s; };

export default function Lab() {
  const keys = Object.keys(runs);
  const [k, setK] = useState(keys[0]);
  const [open, setOpen] = useState(null);
  const run = runs[k];
  const html = useMemo(() => md(run.memo), [run]);
  const srm = k === 'srm';
  return (
    <div className="grid">
      <section className="hero"><h1>Insight Lab</h1><span className="mute">A multi-agent A/B test analyst. Planner, Analyst, Writer and Verifier agents call deterministic stats tools; a hard auditor rejects any number that is not traceable to a tool output.</span></section>
      <div className="chips" role="group" aria-label="Experiments">
        {keys.map((x) => <button key={x} className="chip" data-focusable aria-pressed={k === x} onClick={() => { setK(x); setOpen(null); }}>{runs[x].title}</button>)}
      </div>
      <div className="kpis">
        <div className="kpi"><span className="mute">Audit</span><b className={run.audit.passed ? 'ok' : 'bad'}>{run.audit.passed ? 'Passed' : 'Failed'}</b></div>
        <div className="kpi"><span className="mute">Tool calls</span><b>{run.ledger.length}</b></div>
        <div className="kpi"><span className="mute">Randomization</span><b className={srm ? 'bad' : 'ok'}>{srm ? 'SRM alarm' : 'Healthy'}</b></div>
        <div className="kpi"><span className="mute">Dataset</span><b style={{ fontSize: '1rem' }}>{run.blurb.split('.')[0]}</b></div>
      </div>
      <div className="grid g2">
        <article className="card memo"><div dangerouslySetInnerHTML={{ __html: html }} /></article>
        <aside className="card">
          <h3>Agent tool ledger</h3><span className="mute">Every number in the memo traces to a row here.</span>
          <div className="steps" style={{ marginTop: 10 }}>
            {run.ledger.map((e) => (
              <div key={e.seq} className="step">
                <span className="badge">{e.seq}</span>
                <div><b>{e.tool}</b> <span className="mute">· {e.agent}</span>
                  {open === e.seq && <pre className="mono" style={{ whiteSpace: 'pre-wrap', fontSize: '.72rem', color: '#bcd0ff' }}>{JSON.stringify(e.result, null, 2)}</pre>}
                  {open !== e.seq && <div className="mute mono" style={{ fontSize: '.72rem', wordBreak: 'break-all' }}>{short(e.result)}</div>}
                </div>
                <button className="btn" data-focusable onClick={() => setOpen(open === e.seq ? null : e.seq)}>{open === e.seq ? 'Hide' : 'View'}</button>
              </div>))}
          </div>
        </aside>
      </div>
    </div>
  );
}
