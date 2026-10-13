// Simulated live match engine (runs fully in the browser). Swap for a real sports API in production.
const TEAMS = [
  ['Mumbai Mavericks', 'Delhi Dynamos', 'MUM', 'DEL'],
  ['Bengal Blazers', 'Chennai Chargers', 'BEN', 'CHE'],
  ['Pune Panthers', 'Jaipur Jets', 'PUN', 'JAI'],
];
const EVENTS = [
  ['hits a three-pointer', 3], ['drives for a layup', 2], ['steals it and fast breaks', 2],
  ['sinks two free throws', 2], ['dunks it home', 2], ['scores off a pick and roll', 2], ['drains a step-back three', 3],
];
const pick = (a) => a[Math.floor(Math.random() * a.length)];
export const fmtClock = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export function createGames() {
  return TEAMS.map(([home, away, hc, ac], i) => ({
    id: `g${i + 1}`,
    home: { name: home, code: hc, score: 40 + i * 3 },
    away: { name: away, code: ac, score: 38 + i * 5 },
    quarter: 2 + (i % 3),
    secs: 312 - i * 60,
    final: false,
    log: [],
    history: [],
  }));
}

export function tick(g) {
  if (g.final) return g;
  const side = Math.random() < 0.5 ? 'home' : 'away';
  const [text, pts] = pick(EVENTS);
  const team = g[side];
  team.score += pts;
  g.secs = Math.max(0, g.secs - (8 + Math.floor(Math.random() * 18)));
  if (g.secs === 0) {
    if (g.quarter >= 4) g.final = true;
    else { g.quarter += 1; g.secs = 720; }
  }
  g.log = [{ t: Date.now() + Math.random(), side, pts, text: `${team.name} ${text}` }, ...g.log].slice(0, 20);
  g.history = [...g.history, g.home.score - g.away.score].slice(-40);
  return g;
}
export const cloneGames = (gs) => gs.map((g) => ({ ...g, home: { ...g.home }, away: { ...g.away }, log: [...g.log], history: [...g.history] }));
