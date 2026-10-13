import React, { useEffect, useState } from 'react';
import { useDpad } from './lib/dpad.js';
import Arena from './views/Arena.jsx';
import Lab from './views/Lab.jsx';
import Match from './views/Match.jsx';
import Drive from './views/Drive.jsx';
import About from './views/About.jsx';

const TABS = [
  { id: 'arena', label: 'Live Arena', C: Arena },
  { id: 'lab', label: 'Insight Lab', C: Lab },
  { id: 'match', label: 'Entity Match', C: Match },
  { id: 'drive', label: 'Car Sim', C: Drive },
  { id: 'about', label: 'How it works', C: About },
];

export default function App() {
  useDpad();
  const [tab, setTab] = useState(() => (location.hash.slice(1) || 'arena'));
  useEffect(() => {
    const on = () => setTab(location.hash.slice(1) || 'arena');
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  const go = (id) => { setTab(id); history.replaceState(null, '', `#${id}`); window.scrollTo({ top: 0 }); };
  const View = (TABS.find((t) => t.id === tab) || TABS[0]).C;
  const nav = (cls) => TABS.map((t) => (
    <button key={t.id} className="tab" role="tab" aria-selected={tab === t.id} data-focusable onClick={() => go(t.id)}>{t.label}</button>
  ));
  return (
    <div className="app">
      <header className="top">
        <div className="brand"><span className="logo"><i /></span>CourtSide Arena</div>
        <nav className="tabs" role="tablist" aria-label="Sections">{nav()}</nav>
        <span className="pill">Fire TV + Alexa+ ready</span>
      </header>
      <main><View go={go} /></main>
      <nav className="nav-bottom" role="tablist" aria-label="Sections">{nav()}</nav>
      <footer>Built for the Build, Ship, Shape: Amazon Developer Hackathon · Himanshu Suthar</footer>
    </div>
  );
}
