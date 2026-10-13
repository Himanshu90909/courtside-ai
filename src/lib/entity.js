// Browser port of the Business Entity Resolution pipeline: normalize -> block -> fuzzy score -> cluster.
const LEGAL = new Set(['inc','incorporated','corp','corporation','co','company','ltd','limited','llc','llp','lp','pvt','private','pc','plc','group','holdings','enterprises','enterprise','industries','industry','the','and','of','for','a','an']);

export function normalizeText(s) {
  if (typeof s !== 'string') return '';
  return s.replace(/&/g, ' and ').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
}
export function tokenize(s, { dropLegal = false, minLen = 2 } = {}) {
  const n = normalizeText(s);
  if (!n) return [];
  return n.split(' ').filter((t) => t.length >= minLen && !(dropLegal && LEGAL.has(t)));
}
export const numericTokens = (s, min = 2) => (typeof s === 'string' ? (s.match(/\d+/g) || []).filter((x) => x.length >= min) : []);

export function tokenSetRatio(a, b) {
  const A = new Set(tokenize(a)), B = new Set(tokenize(b));
  if (!A.size || !B.size) return 0;
  const inter = [...A].filter((x) => B.has(x)).length;
  return (2 * inter) / (A.size + B.size);
}
function lev(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}
export function levRatio(a, b) {
  a = normalizeText(a); b = normalizeText(b);
  if (!a && !b) return 0;
  return 1 - lev(a, b) / Math.max(a.length, b.length);
}

// Blocking: composite keys (country + rare token) keep recall high without an O(n^2) join.
export function blockKeys(r) {
  const words = [...new Set([...tokenize(r.name, { dropLegal: true, minLen: 3 }), ...tokenize(r.address, { dropLegal: true, minLen: 3 })].filter((t) => !/^\d+$/.test(t)))];
  const nums = numericTokens(r.address);
  const keys = new Set();
  for (const w of words.slice(0, 8)) for (const n of nums.slice(0, 4)) keys.add(`${r.country}|${w}+${n}`);
  const top = words.sort((a, b) => b.length - a.length).slice(0, 4);
  for (let i = 0; i < top.length; i++) for (let j = i + 1; j < top.length; j++) keys.add(`${r.country}|${[top[i], top[j]].sort().join('+')}`);
  return [...keys];
}

export function score(a, b) {
  const name = Math.max(tokenSetRatio(a.name, b.name), levRatio(a.name, b.name));
  const addr = Math.max(tokenSetRatio(a.address, b.address), levRatio(a.address, b.address));
  return { name, addr, total: 0.55 * name + 0.45 * addr };
}

export function resolve(records, threshold = 0.72) {
  const buckets = new Map();
  records.forEach((r, i) => blockKeys(r).forEach((k) => { if (!buckets.has(k)) buckets.set(k, []); buckets.get(k).push(i); }));
  const seen = new Set(), pairs = [];
  for (const idx of buckets.values()) {
    for (let x = 0; x < idx.length; x++) for (let y = x + 1; y < idx.length; y++) {
      const i = idx[x], j = idx[y], key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (seen.has(key) || records[i].source === records[j].source) continue;
      seen.add(key);
      const s = score(records[i], records[j]);
      pairs.push({ i, j, ...s, match: s.total >= threshold });
    }
  }
  const parent = records.map((_, i) => i);
  const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  pairs.filter((p) => p.match).forEach((p) => { parent[find(p.i)] = find(p.j); });
  const groups = new Map();
  records.forEach((_, i) => { const r = find(i); if (!groups.has(r)) groups.set(r, []); groups.get(r).push(i); });
  const total = records.length * (records.length - 1) / 2;
  return { pairs: pairs.sort((a, b) => b.total - a.total), clusters: [...groups.values()].filter((g) => g.length > 1), candidateCount: pairs.length, totalPairs: total };
}

export const SAMPLE = [
  { source: 'S1', name: 'Reliance Retail Ltd.', address: '3rd Floor, Court House, Lokmanya Tilak Marg, Mumbai 400002', country: 'IN' },
  { source: 'S2', name: 'Reliance Retail Limited', address: 'Court House 3rd Flr, Lokmanya Tilak Marg, Mumbai 400002', country: 'IN' },
  { source: 'S3', name: 'RELIANCE RETAIL', address: 'Court House, Lokmanya Tilak Marg Mumbai 400 002', country: 'IN' },
  { source: 'S1', name: 'Tata Consultancy Services Pvt Ltd', address: '9 Sir Homi Mody Street, Fort, Mumbai 400001', country: 'IN' },
  { source: 'S2', name: 'TCS Tata Consultancy Services', address: '9, Sir Homi Mody St, Fort, Mumbai 400001', country: 'IN' },
  { source: 'S1', name: 'Amazon Web Services, Inc.', address: '410 Terry Avenue North, Seattle WA 98109', country: 'US' },
  { source: 'S2', name: 'Amazon Web Services Inc', address: '410 Terry Ave N, Seattle, WA 98109', country: 'US' },
  { source: 'S3', name: 'AWS Amazon Web Services LLC', address: '410 Terry Avenue N., Seattle 98109', country: 'US' },
  { source: 'S1', name: 'Blue Dart Express Ltd', address: '33 Dr Charat Singh Colony, Andheri East, Mumbai 400093', country: 'IN' },
  { source: 'S2', name: 'Infosys Limited', address: '44 Electronics City, Hosur Road, Bengaluru 560100', country: 'IN' },
  { source: 'S3', name: 'Infosys Ltd.', address: '44, Electronics City Hosur Rd, Bengaluru 560100', country: 'IN' },
  { source: 'S1', name: 'Café de Paris SARL', address: '12 Rue de Rivoli, Paris 75001', country: 'FR' },
  { source: 'S2', name: 'Cafe de Paris', address: '12 rue de Rivoli 75001 Paris', country: 'FR' },
];
