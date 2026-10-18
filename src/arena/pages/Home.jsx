import React from 'react';
import { getHome } from '../api.js';
import { useData, Skeleton, Empty, ErrorBox, Freshness, Section } from '../ui.jsx';
import { NewsCard, OppCard, MatchCard } from '../cards.jsx';
import { usePrefs } from '../store.js';

const more = (go, to, label) => <button className="btn sm" onClick={() => go(to)}>{label}</button>;

export default function Home({ go }) {
  const [prefs] = usePrefs();
  const [s, reload] = useData(() => getHome(), []);
  if (s.status === 'loading') return (<><h1 className="page-h">For You</h1><Skeleton rows={5} /></>);
  if (s.status === 'error') return (<><h1 className="page-h">For You</h1><ErrorBox message={s.error} onRetry={reload} /></>);
  const d = s.data;
  const fav = (prefs.favoriteTeams || []).map((t) => t.toLowerCase());
  const mine = fav.length ? [...d.live, ...d.upcoming, ...d.recent].filter((e) => fav.some((t) => (e.name || '').toLowerCase().includes(t))) : [];
  const sportPref = prefs.sports || [];
  const live = sportPref.length ? [...d.live].sort((a, b) => Number(sportPref.includes(b.sport)) - Number(sportPref.includes(a.sport))) : d.live;
  const interest = prefs.interests || [];
  const sorted = (arr) => (interest.length ? [...arr].sort((a, b) => Number(interest.includes(b.category)) - Number(interest.includes(a.category))) : arr);
  return (
    <>
      <h1 className="page-h">For You</h1>
      <p className="lede">One platform. Every opportunity. All the action. Everything below comes from stored source data, each item links to its original publisher.</p>
      <div className="fresh-stack">
        <Freshness label="News" health={d.health.news} fromCache={s.fromCache} clientFetchedAt={s.clientFetchedAt} />
        <Freshness label="Sports" health={d.health.sports} />
        <Freshness label="Opportunities" health={d.health.opportunities} />
      </div>
      {d.ticker.length > 0 && (
        <div className="ticker" role="region" aria-label="Breaking headlines"><b className="tk-l">LATEST</b>
          <div className="tk-track">{[...d.ticker, ...d.ticker].map((t, i) => <a key={i} href={t.url} target="_blank" rel="noopener noreferrer">{t.title} <span className="mute">· {t.source}</span></a>)}</div>
        </div>)}
      {mine.length > 0 && <Section title="Your teams" hint="Matches mentioning your favourite teams"><div className="grid g3">{mine.slice(0, 6).map((e) => <MatchCard key={e.uid} e={e} />)}</div></Section>}
      <Section title="Live now" action={more(go, 'sports', 'Sports center')}>
        {live.length ? <div className="grid g3">{live.slice(0, 6).map((e) => <MatchCard key={e.uid} e={e} />)}</div> : <Empty title="No live matches right now">Nothing is in play according to the provider. Upcoming fixtures are shown below.</Empty>}
      </Section>
      {d.upcoming.length > 0 && <Section title="Up next"><div className="grid g3">{d.upcoming.slice(0, 3).map((e) => <MatchCard key={e.uid} e={e} />)}</div></Section>}
      <Section title="Worldwide headlines" action={more(go, 'news', 'All news')}>
        {d.headlines.length ? <div className="grid g2">{sorted(d.headlines).slice(0, 6).map((a) => <NewsCard key={a.uid} a={a} />)}</div> : <Empty title="No headlines stored yet" />}
      </Section>
      <Section title="Closing soon" hint="Deadlines taken from the source listing" action={more(go, 'hackathons', 'All competitions')}>
        {d.closing.length ? <div className="grid g2">{d.closing.slice(0, 4).map((o) => <OppCard key={o.uid} o={o} />)}</div> : <Empty title="Nothing closing within 7 days" />}
      </Section>
      <Section title="Upcoming hackathons and competitions" action={more(go, 'hackathons', 'See all')}>
        {d.hackathons.length ? <div className="grid g2">{d.hackathons.slice(0, 4).map((o) => <OppCard key={o.uid} o={o} />)}</div> : <Empty title="No open hackathons found" />}
      </Section>
      <Section title="Jobs and internships" action={more(go, 'jobs', 'Browse jobs')}>
        {d.jobs.length ? <div className="grid g2">{d.jobs.slice(0, 4).map((o) => <OppCard key={o.uid} o={o} />)}</div> : <Empty title="No jobs stored yet" />}
      </Section>
      <div className="grid g2">
        <Section title="Education" action={more(go, 'education', 'More')}>{d.education.length ? d.education.slice(0, 3).map((a) => <NewsCard key={a.uid} a={a} compact />) : <Empty title="No education stories" />}</Section>
        <Section title="Politics and policy" hint="Reports and analysis are labelled" action={more(go, 'politics', 'More')}>{d.politics.length ? d.politics.slice(0, 3).map((a) => <NewsCard key={a.uid} a={a} compact />) : <Empty title="No policy stories" />}</Section>
      </div>
    </>
  );
}
