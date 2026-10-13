import React from 'react';
export default function About({ go }) {
  const items = [
    ['Live Arena', 'Fire TV sports companion. Multi-game rail with D-pad spatial navigation, a three-persona AI commentator, voice output, an Ask-the-game box and a faithful Alexa+ intent simulator.', 'arena'],
    ['Insight Lab', 'Agentic analytics. Four agents plan, compute, write and verify an experiment decision memo. A deterministic auditor blocks untraceable numbers and unsafe causal claims; a sample-ratio-mismatch guard refuses broken experiments.', 'lab'],
    ['Car Simulator', 'Top-down driving sim with arcade physics: tyre grip, off-track penalty, lap timing with checkpoints, an AI rival, three cars with different handling, keyboard, touch pedals and gamepad support.', 'drive'],
    ['Entity Match', 'Production-style entity resolution from the Amazon ML Challenge: normalization, composite-key blocking to avoid quadratic joins, fuzzy scoring and union-find clustering.', 'match'],
  ];
  return (
    <div className="grid">
      <section className="hero"><h1>One platform, four products in one app</h1><span className="mute">CourtSide Arena merges four projects into a single responsive app that works on a Fire TV remote, a phone and a desktop.</span></section>
      <div className="grid g3">{items.map(([t, d, id]) => <div key={t} className="card"><h3>{t}</h3><p className="mute" style={{ lineHeight: 1.5 }}>{d}</p><button className="btn primary" data-focusable onClick={() => go(id)}>Open</button></div>)}</div>
      <section className="card"><h3>Architecture</h3>
        <pre className="mono" style={{ fontSize: '.8rem', color: '#bcd0ff' }}>{`Fire TV / phone / desktop  (React + D-pad focus engine, responsive)
   |-- Live Arena     game engine -> commentator (rules or any OpenAI-compatible LLM) -> TTS
   |                  Alexa+ intents (Score / Switch / Explain / Clock)
   |-- Insight Lab    Planner -> Analyst -> Writer -> Verifier  +  deterministic auditor
   '-- Entity Match   normalize -> block -> score -> cluster`}</pre>
        <p className="mute">Honest limits: game data is simulated, Insight Lab shows recorded runs of the Python agent, and Alexa+ runs through a local simulator rather than the Alexa cloud. The Python agent and the full 12GB-scale entity pipeline live in their own repos.</p>
      </section>
    </div>
  );
}
