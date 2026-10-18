import React from 'react';
import { usePrefs, DEFAULT_PREFS, useSaved, useNotifs, useReadHistory } from '../store.js';
import { CATS, COUNTRIES } from '../format.js';

const SPORTS = ['basketball', 'football', 'cricket', 'tennis', 'hockey', 'volleyball', 'rugby', 'baseball', 'american football', 'golf', 'mma', 'motorsport'];
const EDU = ['', 'High school', 'Undergraduate', 'Postgraduate', 'PhD / research', 'Working professional'];
const Check = ({ list, value, onChange, label }) => (<label className="chk"><input type="checkbox" checked={list.includes(value)} onChange={(e) => onChange(e.target.checked ? [...list, value] : list.filter((x) => x !== value))} /> {label || value}</label>);
const csv = (s) => s.split(',').map((x) => x.trim()).filter(Boolean);

export default function Settings() {
  const [p, setP] = usePrefs();
  const [, setSaved] = useSaved(); const [, setN] = useNotifs(); const [, setH] = useReadHistory();
  const set = (k, v) => setP((c) => ({ ...c, [k]: v }));
  const setNotify = (k, v) => setP((c) => ({ ...c, notify: { ...c.notify, [k]: v } }));
  const clearAll = () => { if (!confirm('Delete saved items, notifications, history and preferences from this device?')) return; setSaved([]); setN([]); setH([]); setP(DEFAULT_PREFS); localStorage.removeItem('arena:reports'); };
  return (
    <>
      <h1 className="page-h">Settings</h1>
      <p className="lede">Guest mode: everything below is stored in this browser only. There are no accounts, so nothing is sent to a server.</p>
      <div className="grid g2">
        <section className="card form"><h3>Region and language</h3>
          <label>Country<select value={p.country} onChange={(e) => set('country', e.target.value)}><option value="all">Worldwide</option>{Object.entries(COUNTRIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
          <label>Timezone<input value={p.timezone} onChange={(e) => set('timezone', e.target.value)} /></label>
          <label>Language<select value={p.language} onChange={(e) => set('language', e.target.value)}><option value="en">English</option></select></label>
          <p className="mute small">Sources are published in English. Translating summaries needs an AI service that is not connected, so other languages are not offered yet.</p>
          <label>Education level<select value={p.educationLevel} onChange={(e) => set('educationLevel', e.target.value)}>{EDU.map((x) => <option key={x} value={x}>{x || 'Not set'}</option>)}</select></label>
        </section>
        <section className="card form"><h3>Interests</h3>
          <div className="chips">{CATS.map((c) => <Check key={c.id} list={p.interests} value={c.id} label={c.label} onChange={(v) => set('interests', v)} />)}</div>
          <h3>Preferred sports</h3><div className="chips">{SPORTS.map((s) => <Check key={s} list={p.sports} value={s} onChange={(v) => set('sports', v)} />)}</div>
          <label>Favourite teams (comma separated)<input value={(p.favoriteTeams || []).join(', ')} onChange={(e) => set('favoriteTeams', csv(e.target.value))} placeholder="Lakers, Arsenal, Mumbai Indians" /></label>
          <label>Career interests (comma separated)<input value={(p.careerInterests || []).join(', ')} onChange={(e) => set('careerInterests', csv(e.target.value))} placeholder="AI, sports analytics" /></label>
        </section>
        <section className="card form"><h3>In-app notifications</h3>
          {[['matchStart', 'Match start for favourite teams'], ['deadlines', 'Deadlines for saved items with a reminder'], ['breakingSports', 'Breaking sports news (not available yet)'], ['hackathons', 'New hackathon announcements (not available yet)']].map(([k, l]) => <label key={k} className="chk"><input type="checkbox" checked={!!p.notify?.[k]} onChange={(e) => setNotify(k, e.target.checked)} /> {l}</label>)}
          <div className="two"><label>Quiet from<input type="time" value={p.quietStart} onChange={(e) => set('quietStart', e.target.value)} /></label><label>Quiet until<input type="time" value={p.quietEnd} onChange={(e) => set('quietEnd', e.target.value)} /></label></div>
        </section>
        <section className="card form"><h3>Privacy</h3>
          <label className="chk"><input type="checkbox" checked={!!p.saveHistory} onChange={(e) => set('saveHistory', e.target.checked)} /> Keep reading history on this device</label>
          <button className="btn danger" onClick={clearAll}>Delete all data on this device</button>
          <p className="mute small">Account sign-in, cross-device sync, email and push alerts need services that are not set up for this app.</p>
        </section>
      </div>
    </>
  );
}
