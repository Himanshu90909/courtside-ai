// Rule-based AI commentator with three personas. Optional: plug an OpenAI-compatible key in Settings for live LLM commentary.
import { fmtClock } from './games.js';

export const MODES = [
  { id: 'hype', label: 'Hype', hint: 'Electric play-by-play' },
  { id: 'explain', label: 'Explain it to me', hint: 'Beginner friendly' },
  { id: 'stats', label: 'Stats nerd', hint: 'Numbers first' },
];
const SYSTEM = {
  hype: 'You are an electric, high-energy sports commentator. 2 short sentences.',
  explain: 'You are a patient coach explaining the game to a total beginner. Define jargon. 2-3 short sentences.',
  stats: 'You are a sharp stats analyst. Give one insight with a number. 2 short sentences.',
};

export function ruleCommentary(g, mode = 'hype') {
  const lead = g.home.score - g.away.score;
  const leader = lead >= 0 ? g.home : g.away;
  const diff = Math.abs(lead);
  const last = g.log[0]?.text ?? 'Teams are settling in';
  if (g.final) return `Final buzzer! ${leader.name} take it by ${diff}.`;
  if (mode === 'explain') return `${last}. A basket is worth 1 to 3 points, and ${leader.name} lead by ${diff}, so the other side needs a couple of scoring runs to catch up.`;
  if (mode === 'stats') return `${leader.name} lead by ${diff} in Q${g.quarter}. With ${fmtClock(g.secs)} left, a ${Math.max(1, Math.ceil(diff / 3))}-possession swing ties it.`;
  return diff < 5 ? `WHAT A GAME! ${last}! It is neck and neck, just ${diff} apart!` : `${last}! ${leader.name} are pulling away by ${diff}. Can anyone stop them?`;
}

export function answerQuestion(g, q) {
  const s = q.toLowerCase();
  const l = g.home.score >= g.away.score ? g.home : g.away;
  if (s.includes('who') && (s.includes('win') || s.includes('lead'))) return `${l.name} are leading right now.`;
  if (s.includes('score')) return `${g.home.name} ${g.home.score}, ${g.away.name} ${g.away.score}.`;
  if (s.includes('time') || s.includes('clock')) return `Quarter ${g.quarter}, ${fmtClock(g.secs)} on the clock.`;
  return ruleCommentary(g, 'explain');
}

export async function commentate(g, mode, question, cfg) {
  const rules = () => ({ text: question ? answerQuestion(g, question) : ruleCommentary(g, mode), source: 'rules' });
  if (!cfg?.key) return rules();
  const state = `${g.home.name} ${g.home.score} - ${g.away.score} ${g.away.name}, Q${g.quarter} ${fmtClock(g.secs)}. Recent: ${g.log.slice(0, 5).map((l) => l.text).join('; ')}`;
  try {
    const res = await fetch(`${cfg.base || 'https://api.x.ai/v1'}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.key}` },
      body: JSON.stringify({
        model: cfg.model || 'grok-3-mini', max_tokens: 160,
        messages: [{ role: 'system', content: SYSTEM[mode] }, { role: 'user', content: question ? `Game: ${state}\nViewer asks: ${question}` : `Game: ${state}\nGive commentary.` }],
      }),
    });
    if (!res.ok) throw new Error(res.status);
    const d = await res.json();
    return { text: d.choices[0].message.content.trim(), source: 'llm' };
  } catch { return rules(); }
}
