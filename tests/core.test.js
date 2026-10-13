import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve, SAMPLE, normalizeText, tokenSetRatio } from '../src/lib/entity.js';
import { createGames, tick } from '../src/lib/games.js';
import { ruleCommentary } from '../src/lib/commentator.js';
import { handleAlexa } from '../src/lib/alexa.js';

test('normalize strips punctuation and case', () => assert.equal(normalizeText('Reliance Retail Ltd.'), 'reliance retail ltd'));
test('token set ratio is symmetric-ish and bounded', () => { const r = tokenSetRatio('Amazon Web Services Inc', 'Amazon Web Services LLC'); assert.ok(r > 0.5 && r <= 1); });
test('entity resolution merges known duplicates and keeps others apart', () => {
  const r = resolve(SAMPLE, 0.72);
  const names = r.clusters.map((c) => c.map((i) => SAMPLE[i].name));
  assert.ok(names.some((c) => c.some((n) => /Reliance/.test(n)) && c.length >= 3), 'Reliance trio merged');
  assert.ok(names.some((c) => c.some((n) => /Infosys/.test(n)) && c.length === 2), 'Infosys pair merged');
  assert.ok(!names.some((c) => c.some((n) => /Reliance/.test(n)) && c.some((n) => /Infosys/.test(n))), 'no cross-entity merge');
  assert.ok(r.candidateCount < r.totalPairs, 'blocking prunes pairs');
});
test('game tick advances score and log', () => { const g = createGames()[0]; const before = g.home.score + g.away.score; tick(g); assert.ok(g.home.score + g.away.score > before); assert.equal(g.log.length, 1); });
test('commentator covers all modes', () => { const g = createGames()[0]; tick(g); for (const m of ['hype', 'explain', 'stats']) assert.ok(ruleCommentary(g, m).length > 10); });
test('alexa score + switch intents', () => {
  const games = createGames(); let sel = 'g1';
  const ctx = { games, selectedId: 'g1', select: (id) => (sel = id), explain: () => 'x' };
  assert.match(handleAlexa({ request: { type: 'IntentRequest', intent: { name: 'ScoreIntent' } } }, ctx).response.outputSpeech.text, /Mumbai Mavericks/);
  handleAlexa({ request: { type: 'IntentRequest', intent: { name: 'SwitchGameIntent', slots: { number: { value: '2' } } } } }, ctx);
  assert.equal(sel, 'g2');
});
