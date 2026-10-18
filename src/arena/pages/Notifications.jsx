import React, { useEffect } from 'react';
import { useNotifs, useSaved, usePrefs, inQuietHours } from '../store.js';
import { getHome } from '../api.js';
import { Empty, Badge } from '../ui.jsx';
import { ago, until } from '../format.js';

// In-app notifications only. They are generated on this device from your own saved deadlines and favourite teams,
// de-duplicated by a key, and held back during your quiet hours. No email or push is sent.
export function useNotifEngine() {
  const [notifs, setNotifs] = useNotifs();
  const [saved] = useSaved();
  const [prefs] = usePrefs();
  useEffect(() => {
    let dead = false;
    (async () => {
      if (inQuietHours(prefs)) return;
      const add = [];
      const have = new Set(notifs.map((n) => n.key));
      if (prefs.notify?.deadlines) {
        for (const x of saved) {
          if (!x.remind || !x.deadline) continue;
          const ms = new Date(x.deadline).getTime() - Date.now();
          if (ms > 0 && ms < 72 * 36e5) { const key = `dl:${x.uid}:${x.deadline.slice(0, 10)}`; if (!have.has(key)) add.push({ key, kind: 'deadline', title: `Closing: ${x.title}`, body: until(x.deadline), url: x.url, at: new Date().toISOString(), read: false }); }
        }
      }
      if (prefs.notify?.matchStart && (prefs.favoriteTeams || []).length) {
        try {
          const { data } = await getHome();
          for (const e of [...data.live, ...data.upcoming]) {
            const hit = prefs.favoriteTeams.some((t) => (e.name || '').toLowerCase().includes(t.toLowerCase()));
            const soon = e.state === 'in' || (new Date(e.startTime).getTime() - Date.now() < 36e5 && new Date(e.startTime).getTime() > Date.now());
            const key = `m:${e.uid}:${e.state}`;
            if (hit && soon && !have.has(key)) add.push({ key, kind: 'match', title: e.state === 'in' ? `Live now: ${e.name}` : `Starting within the hour: ${e.name}`, body: e.statusText || '', url: e.detailUrl, at: new Date().toISOString(), read: false });
          }
        } catch { /* offline: skip silently, nothing is invented */ }
      }
      if (!dead && add.length) setNotifs((cur) => [...add, ...cur].slice(0, 100));
    })();
    return () => { dead = true; };
  }, [saved.length, prefs.favoriteTeams?.join(), prefs.notify?.deadlines, prefs.notify?.matchStart]); // eslint-disable-line
  return notifs.filter((n) => !n.read).length;
}

export default function Notifications() {
  const [notifs, setNotifs] = useNotifs();
  const [prefs] = usePrefs();
  return (
    <>
      <h1 className="page-h">Notifications</h1>
      <p className="lede">In-app only. Alerts are created on this device from the reminders you set and the teams you follow. Email and push alerts are not configured.</p>
      {inQuietHours(prefs) && <div className="note">Quiet hours are active ({prefs.quietStart} to {prefs.quietEnd}, {prefs.timezone}). New alerts are paused.</div>}
      <div className="card-actions"><button className="btn sm" onClick={() => setNotifs((c) => c.map((n) => ({ ...n, read: true })))}>Mark all read</button><button className="btn sm" onClick={() => setNotifs([])}>Clear all</button></div>
      {!notifs.length ? <Empty title="No notifications">Turn on "Remind me" for a saved listing, or add favourite teams in Settings.</Empty> : (
        <ul className="notif-list">{notifs.map((n) => (<li key={n.key} className={n.read ? '' : 'unread'}><Badge kind={n.kind === 'deadline' ? 'warn' : 'blue'}>{n.kind}</Badge> <a href={n.url || '#'} target="_blank" rel="noopener noreferrer" onClick={() => setNotifs((c) => c.map((x) => (x.key === n.key ? { ...x, read: true } : x)))}>{n.title}</a> <span className="mute">{n.body} · {ago(n.at)}</span></li>))}</ul>)}
    </>
  );
}
