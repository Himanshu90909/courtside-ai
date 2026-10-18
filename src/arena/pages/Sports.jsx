import React, { useState } from 'react';
import { getSports } from '../api.js';
import { useData, Skeleton, Empty, ErrorBox, Freshness, Section } from '../ui.jsx';
import { MatchCard } from '../cards.jsx';

const STATES = [['all', 'All'], ['in', 'Live'], ['pre', 'Upcoming'], ['post', 'Results']];
export default function Sports() {
  const [sport, setSport] = useState('all');
  const [league, setLeague] = useState('all');
  const [state, setState] = useState('all');
  const [s, reload] = useData(() => getSports({ sport, leagueKey: league, state }), [sport, league, state]);
  const d = s.data;
  return (
    <>
      <h1 className="page-h">Live Sports</h1>
      <p className="lede">Scores come from the ESPN public data feed. Each card shows the provider and when we last collected it. No score here is simulated.</p>
      {d && <Freshness label="Sports" health={d.health} fromCache={s.fromCache} clientFetchedAt={s.clientFetchedAt} />}
      <div className="filters" role="group" aria-label="Sports filters">
        <label>Sport<select value={sport} onChange={(e) => { setSport(e.target.value); setLeague('all'); }}><option value="all">All sports</option>{d?.sports.map((x) => <option key={x} value={x}>{x}</option>)}</select></label>
        <label>League<select value={league} onChange={(e) => setLeague(e.target.value)}><option value="all">All leagues</option>{d?.leagues.filter((l) => sport === 'all' || l.sport === sport).map((l) => <option key={l.key} value={l.key}>{l.name}</option>)}</select></label>
        <div className="seg" role="tablist">{STATES.map(([k, l]) => <button key={k} role="tab" aria-selected={state === k} className={state === k ? 'on' : ''} onClick={() => setState(k)}>{l}</button>)}</div>
      </div>
      {s.status === 'loading' && <Skeleton rows={4} />}
      {s.status === 'error' && <ErrorBox message={s.error} onRetry={reload} />}
      {d && (d.items.length ? <div className="grid g3">{d.items.map((e) => <MatchCard key={e.uid} e={e} />)}</div> : <Empty title="No matches for these filters">The provider returned nothing for this selection right now.</Empty>)}
      <Section title="Not covered yet" hint="No free data provider is connected for these">
        <p className="mute">Badminton and field hockey have no keyless provider in this build, so no scores are shown for them rather than inventing any. Team and player profiles, standings and match statistics need a richer licensed API and are not available yet.</p>
      </Section>
    </>
  );
}
