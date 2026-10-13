// Alexa+ intent simulator: same JSON request/response contract as a real custom skill endpoint.
import { fmtClock } from './games.js';
export const INTENTS = [
  { utterance: 'Alexa, ask CourtSide for the score', request: { type: 'IntentRequest', intent: { name: 'ScoreIntent' } } },
  { utterance: 'Alexa, tell CourtSide to switch to game two', request: { type: 'IntentRequest', intent: { name: 'SwitchGameIntent', slots: { number: { value: '2' } } } } },
  { utterance: 'Alexa, ask CourtSide to explain the game', request: { type: 'IntentRequest', intent: { name: 'ExplainIntent' } } },
  { utterance: 'Alexa, ask CourtSide how much time is left', request: { type: 'IntentRequest', intent: { name: 'ClockIntent' } } },
];
export function handleAlexa(body, { games, selectedId, select, explain }) {
  const reply = (text) => ({ version: '1.0', response: { outputSpeech: { type: 'PlainText', text }, shouldEndSession: false } });
  const game = games.find((g) => g.id === selectedId) ?? games[0];
  const r = body.request;
  if (r.type === 'LaunchRequest') return reply('Welcome to CourtSide. Ask for the score, or say switch to game two.');
  switch (r.intent?.name) {
    case 'ScoreIntent': return reply(`${game.home.name} ${game.home.score}, ${game.away.name} ${game.away.score}.`);
    case 'ClockIntent': return reply(`Quarter ${game.quarter}, ${fmtClock(game.secs)} left.`);
    case 'SwitchGameIntent': {
      const n = Math.min(Math.max(Number(r.intent.slots?.number?.value) || 1, 1), games.length);
      const t = games[n - 1]; select(t.id);
      return reply(`Switching to ${t.home.name} versus ${t.away.name}.`);
    }
    case 'ExplainIntent': return reply(explain(game));
    default: return reply('Try asking for the score, or say explain the game.');
  }
}
