import React from 'react';
import { useSaved, usePrefs } from '../store.js';
import { Empty, Badge, Icon } from '../ui.jsx';
import { fmtDay, until, ago } from '../format.js';

export default function Saved() {
  const [saved, setSaved] = useSaved();
  const [prefs] = usePrefs();
  const remove = (uid) => setSaved((c) => c.filter((x) => x.uid !== uid));
  const toggleRemind = (uid) => setSaved((c) => c.map((x) => (x.uid === uid ? { ...x, remind: !x.remind } : x)));
  return (
    <>
      <h1 className="page-h">Saved items</h1>
      <p className="lede">Stored on this device only. Clearing browser data removes them. Sign-in sync is not enabled in this build.</p>
      {!saved.length ? <Empty title="Nothing saved yet">Use the bookmark icon on any story or listing.</Empty> : (
        <div className="grid g2">{saved.map((x) => {
          const left = until(x.deadline);
          return (<article key={x.uid} className="card"><div className="meta-row"><Badge kind="blue">{x.kind}</Badge>{x.deadline && <Badge kind={left === 'ended' ? 'neutral' : 'warn'}>{left === 'ended' ? 'Closed' : left}</Badge>}</div>
            <h3><a href={x.url} target="_blank" rel="noopener noreferrer">{x.title}</a></h3>
            <div className="meta"><span>{x.source}</span><span>Saved {ago(x.savedAt)}</span>{x.deadline && <span>Deadline {fmtDay(x.deadline, prefs.timezone)}</span>}</div>
            <div className="card-actions">{x.deadline && <label className="remind"><input type="checkbox" checked={!!x.remind} onChange={() => toggleRemind(x.uid)} /> Remind me</label>}<span className="grow" /><button className="ico-btn" aria-label="Remove" onClick={() => remove(x.uid)}><Icon name="flag" /></button></div></article>);
        })}</div>)}
    </>
  );
}
