import React, { useEffect, useState } from 'react';
import { Icon } from './ui.jsx';
import Boundary from './Boundary.jsx';
import { usePrefs, useSaved } from './store.js';
import Home from './pages/Home.jsx';
import Sports from './pages/Sports.jsx';
import News from './pages/News.jsx';
import Opps from './pages/Opps.jsx';
import Saved from './pages/Saved.jsx';
import Notifications, { useNotifEngine } from './pages/Notifications.jsx';
import Settings from './pages/Settings.jsx';
import Admin from './pages/Admin.jsx';
import Arena from '../views/Arena.jsx';
import Lab from '../views/Lab.jsx';
import Match from '../views/Match.jsx';

const GAPS_EDU = ['University admissions, entrance exam schedules and results: no official feed is connected.', 'Online courses and certifications: no provider is connected.'];
const GAPS_SCH = ['Listings come from third-party opportunity aggregators (ProFellow, Opportunity Desk, Scholarships Corner), not from the funders themselves. Check eligibility and funding details on each official page.', 'Sports scholarships and quota admissions: no source is connected.'];
const GAPS_GOV = ['These listings come from Sarkari Result and Free Job Alert (third-party trackers), not from an official government feed. Always verify form dates, fees and eligibility on the official notification page before applying.'];

// id, label, icon, group, element
const ROUTES = [
  { id: 'home', label: 'Home / For You', icon: 'home', el: (go) => <Home go={go} /> },
  { id: 'sports', label: 'Live Sports', icon: 'live', el: () => <Sports /> },
  { id: 'news', label: 'Latest News', icon: 'news', el: () => <News title="Latest News" blurb="Headlines from BBC, The Guardian, The Hindu and ESPN. Each card links to the original publisher; we show only the feed's short summary." /> },
  { id: 'education', label: 'Education', icon: 'edu', el: () => <News key="edu" title="Education" category="education" blurb="Education news and announcements from publisher feeds." note={GAPS_EDU.join(' ')} /> },
  { id: 'scholarships', label: 'Scholarships', icon: 'gift', el: () => <Opps key="sch" title="Scholarships and fellowships" blurb="Scholarships and fellowships from ProFellow, Opportunity Desk and Scholarships Corner, worldwide. Deadlines and funding are shown only when the source states them." types={['scholarship', 'fellowship', 'other']} gaps={GAPS_SCH} /> },
  { id: 'jobs', label: 'Jobs & Internships', icon: 'job', el: () => <Opps key="jobs" title="Jobs and internships" blurb="Remote and on-site roles from Remotive, Arbeitnow, Jobicy, Himalayas, Remote OK and Working Nomads. Pay and deadline are shown only when the listing states them." types={['job', 'internship', 'remote_job']} gaps={['Sports management, coaching and sports science roles, apprenticeships and athlete trials: no dedicated source is connected.']} /> },
  { id: 'hackathons', label: 'Hackathons & Competitions', icon: 'code', el: () => <Opps key="hack" title="Hackathons and competitions" blurb="Devpost hackathons, CTFtime events, Codeforces contests and Topcoder challenges, with dates and prizes from each platform." types={['hackathon', 'coding_competition']} scam={false} gaps={['Startup challenges and research programs: no source is connected.']} /> },
  { id: 'gov', label: 'Government Opportunities', icon: 'gov', el: () => <Opps key="gov" title="Government opportunities" blurb="Government recruitment, online forms, admissions and schemes from Sarkari Result and Free Job Alert, plus government listings from the worldwide aggregators. Each card links to the official page." types={['government']} gaps={GAPS_GOV} /> },
  { id: 'politics', label: 'Politics & Policy', icon: 'policy', el: () => <News key="pol" title="Politics and policy" category="politics" blurb="Reports and analysis from several publishers. Each story is labelled Report, Analysis or Opinion. Compare coverage across outlets before drawing conclusions." note="Labels come from each publisher's own URL section, not from our own fact-checking. Stories reported by several outlets are grouped together." /> },
  { id: 'saved', label: 'Saved Items', icon: 'bookmark', el: () => <Saved /> },
  { id: 'notifications', label: 'Notifications', icon: 'bell', el: () => <Notifications /> },
  { id: 'settings', label: 'Settings', icon: 'gear', el: () => <Settings /> },
];
const LABS = [
  { id: 'arena', label: 'Match Day Sim', icon: 'live', el: () => <div className="lab-wrap"><div className="note warn" role="note"><b>Demo.</b> Everything in this module is simulated for the Fire TV demo. These are not real matches or scores.</div><Arena /></div> },
  { id: 'lab', label: 'Insight Lab', icon: 'flask', el: () => <div className="lab-wrap"><Lab /></div> },
  { id: 'match', label: 'Entity Match', icon: 'shield', el: () => <div className="lab-wrap"><Match /></div> },
  { id: 'status', label: 'Source Health', icon: 'shield', el: () => <Admin /> },
];
const ALL = [...ROUTES, ...LABS];
const BOTTOM = ['home', 'sports', 'news', 'jobs', 'saved'];

export default function Shell() {
  const [prefs, setPrefs] = usePrefs();
  const [saved] = useSaved();
  const unread = useNotifEngine();
  const [route, setRoute] = useState(() => location.hash.replace(/^#\/?/, '') || 'home');
  const [q, setQ] = useState('');
  const [menu, setMenu] = useState(false);
  useEffect(() => { document.documentElement.dataset.theme = prefs.theme; }, [prefs.theme]);
  useEffect(() => {
    const on = () => { setRoute(location.hash.replace(/^#\/?/, '') || 'home'); setMenu(false); };
    window.addEventListener('hashchange', on); return () => window.removeEventListener('hashchange', on);
  }, []);
  const go = (id) => { location.hash = id; window.scrollTo({ top: 0 }); };
  const cur = ALL.find((r) => r.id === route) || ROUTES[0];
  const submit = (e) => { e.preventDefault(); if (q.trim()) { sessionStorage.setItem('arena:q', q.trim()); go('news'); } };
  const NavBtn = ({ r }) => (<button className={`nav-i ${cur.id === r.id ? 'on' : ''}`} aria-current={cur.id === r.id ? 'page' : undefined} onClick={() => go(r.id)}><Icon name={r.icon} /><span>{r.label}</span>{r.id === 'saved' && saved.length > 0 && <em>{saved.length}</em>}{r.id === 'notifications' && unread > 0 && <em>{unread}</em>}</button>);
  return (
    <div className="shell">
      <aside className={`side ${menu ? 'open' : ''}`} aria-label="Primary">
        <div className="brand"><span className="logo" aria-hidden /><div><b>CourtSide Arena</b><small>One Platform. Every Opportunity. All the Action.</small></div></div>
        <nav>{ROUTES.map((r) => <NavBtn key={r.id} r={r} />)}<div className="nav-h">Labs and status</div>{LABS.map((r) => <NavBtn key={r.id} r={r} />)}</nav>
      </aside>
      <div className="main">
        <header className="topbar">
          <button className="ico-btn only-mobile" aria-label="Menu" onClick={() => setMenu(!menu)}><Icon name="menu" /></button>
          <form onSubmit={submit} className="gsearch" role="search"><Icon name="search" size={16} /><input aria-label="Search news" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search news and stories" /></form>
          <button className="ico-btn" aria-label="Notifications" onClick={() => go('notifications')}><Icon name="bell" />{unread > 0 && <span className="dotbadge">{unread}</span>}</button>
          <button className="ico-btn" aria-label={`Switch to ${prefs.theme === 'dark' ? 'light' : 'dark'} theme`} onClick={() => setPrefs((p) => ({ ...p, theme: p.theme === 'dark' ? 'light' : 'dark' }))}><Icon name={prefs.theme === 'dark' ? 'sun' : 'moon'} /></button>
          <button className="profile" onClick={() => go('settings')} aria-label="Guest profile and settings"><span>G</span><small>Guest</small></button>
        </header>
        <main id="content" tabIndex={-1}><Boundary resetKey={route}>{cur.el(go)}</Boundary></main>
        <footer className="foot">Headlines and summaries belong to their publishers and link back to the source. Scores: ESPN public data. Hackathons: Devpost, CTFtime, Codeforces. Jobs: Remotive, Arbeitnow.</footer>
      </div>
      <nav className="bottom" aria-label="Quick navigation">{BOTTOM.map((id) => { const r = ALL.find((x) => x.id === id); return (<button key={id} className={cur.id === id ? 'on' : ''} aria-current={cur.id === id ? 'page' : undefined} onClick={() => go(id)}><Icon name={r.icon} /><span>{r.label.split(' ')[0].replace('/', '')}</span></button>); })}</nav>
      {menu && <button className="scrim" aria-label="Close menu" onClick={() => setMenu(false)} />}
    </div>
  );
}
