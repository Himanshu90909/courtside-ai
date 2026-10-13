import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createGames, tick, cloneGames, fmtClock } from '../lib/games.js';
import { MODES, commentate } from '../lib/commentator.js';
import { INTENTS, handleAlexa } from '../lib/alexa.js';

const speak = (t) => { if ('speechSynthesis' in window) { speechSynthesis.cancel(); speechSynthesis.speak(new SpeechSynthesisUtterance(t)); } };

function Spark({ data }) {
  if (data.length < 2) return <svg className="spark" />;
  const max = Math.max(10, ...data.map(Math.abs));
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 100},${35 - (v / max) * 30}`).join(' ');
  return (<svg className="spark" viewBox="0 0 100 70" preserveAspectRatio="none" aria-label="Lead trend">
    <line x1="0" y1="35" x2="100" y2="35" stroke="#26305c" strokeWidth=".6" />
    <polyline points={pts} fill="none" stroke="#ff9900" strokeWidth="1.6" vectorEffect="non-scaling-stroke" /></svg>);
}

export default function Arena() {
  const [games, setGames] = useState(createGames);
  const [sel, setSel] = useState('g1');
  const [mode, setMode] = useState('hype');
  const [voice, setVoice] = useState(false);
  const [feed, setFeed] = useState([]);
  const [q, setQ] = useState('');
  const [llm, setLlm] = useState(() => ({ key: '', base: 'https://api.x.ai/v1', model: 'grok-3-mini' }));
  const [alexa, setAlexa] = useState(null);
  const [speed, setSpeed] = useState(2500);
  const lastT = useRef(0);
  const ref = useRef({ mode, voice, llm });
  ref.current = { mode, voice, llm };

  useEffect(() => {
    const id = setInterval(() => setGames((gs) => { const n = cloneGames(gs); n.forEach(tick); return n; }), speed);
    return () => clearInterval(id);
  }, [speed]);

  const game = games.find((g) => g.id === sel);
  const say = useCallback((text, source, label) => {
    setFeed((f) => [{ id: Math.random(), text, source, label }, ...f].slice(0, 8));
    if (ref.current.voice) speak(text);
  }, []);

  useEffect(() => {
    const t = game?.log[0]?.t;
    if (!t || t === lastT.current) return;
    lastT.current = t;
    commentate(game, ref.current.mode, null, ref.current.llm).then((c) => say(c.text, c.source));
  }, [game, say]);

  const pick = (id) => { setSel(id); lastT.current = 0; setFeed([]); };
  const ask = (text) => { if (!text.trim()) return; commentate(game, 'explain', text, llm).then((c) => say(c.text, c.source, `You: ${text}`)); setQ(''); };
  const runAlexa = (i) => {
    const out = handleAlexa({ request: i.request }, {
      games, selectedId: sel, select: pick,
      explain: (g) => commentate(g, 'explain', null, null) && `${g.log[0]?.text ?? 'Teams settle in'}. ${g.home.score > g.away.score ? g.home.name : g.away.name} lead, and each basket is worth 1 to 3 points.`,
    });
    setAlexa({ utterance: i.utterance, req: i.request, res: out });
    if (voice) speak(out.response.outputSpeech.text);
  };
  const lead = game.home.score - game.away.score;

  return (
    <div className="grid">
      <section className="hero"><h1>Live Arena</h1><span className="mute">Navigate with arrow keys / Fire TV remote, or tap. AI commentary reacts to every play.</span></section>
      <div className="rail" role="list">
        {games.map((g, i) => (
          <button key={g.id} className="gamecard" data-focusable aria-pressed={g.id === sel} onClick={() => pick(g.id)} role="listitem">
            <div className="row"><span className="pill live">{g.final ? 'FINAL' : 'LIVE'}</span><span className="mute mono">Game {i + 1} · Q{g.quarter} {fmtClock(g.secs)}</span></div>
            <div className="teams">
              <div className="row team"><span>{g.home.name}</span><b>{g.home.score}</b></div>
              <div className="row team"><span>{g.away.name}</span><b>{g.away.score}</b></div>
            </div>
          </button>
        ))}
      </div>

      <div className="grid g2">
        <section className="card">
          <div className="stage">
            <div><div className="name">{game.home.name}</div><div className="score">{game.home.score}</div></div>
            <div className="mute mono">Q{game.quarter}<br />{fmtClock(game.secs)}</div>
            <div><div className="name">{game.away.name}</div><div className="score">{game.away.score}</div></div>
          </div>
          <div className="mute" style={{ textAlign: 'center', margin: '4px 0' }}>{lead === 0 ? 'Tied game' : `${lead > 0 ? game.home.name : game.away.name} lead by ${Math.abs(lead)}`}</div>
          <Spark data={game.history} />
          <div className="chips" style={{ margin: '12px 0' }} role="group" aria-label="Commentator style">
            {MODES.map((m) => <button key={m.id} className="chip" data-focusable aria-pressed={mode === m.id} onClick={() => setMode(m.id)} title={m.hint}>{m.label}</button>)}
            <button className={`btn ${voice ? 'on' : ''}`} data-focusable onClick={() => { setVoice(!voice); if (voice) speechSynthesis?.cancel(); }}>{voice ? 'Voice on' : 'Voice off'}</button>
          </div>
          <div className="feed" aria-live="polite">
            {feed.length === 0 && <div className="bubble mute">Waiting for the next play…</div>}
            {feed.map((f) => <div key={f.id} className="bubble">{f.label && <b>{f.label}{'\n'}</b>}{f.text}<small>{f.source === 'llm' ? 'AI model' : 'Rule-based commentator'}</small></div>)}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); ask(q); }} style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <input type="text" data-focusable value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask the game: who is winning?" aria-label="Ask the game" style={{ flex: 1, minWidth: 180 }} />
            <button className="btn primary" data-focusable>Ask</button>
          </form>
          <div className="chips" style={{ marginTop: 8 }}>{['Who is winning?', "What's the score?", 'How much time is left?'].map((s) => <button key={s} className="chip" data-focusable onClick={() => ask(s)}>{s}</button>)}</div>
        </section>

        <aside className="grid" style={{ alignContent: 'start' }}>
          <section className="card alexa">
            <div className="row"><h3>Alexa+ voice</h3><div className="ring" aria-hidden /></div>
            <span className="mute">Same JSON contract as the real skill endpoint. Tap an utterance.</span>
            <div className="say" style={{ flexDirection: 'column' }}>{INTENTS.map((i) => <button key={i.utterance} className="btn" data-focusable style={{ textAlign: 'left' }} onClick={() => runAlexa(i)}>“{i.utterance}”</button>)}</div>
            {alexa && <><div className="bubble"><b>Alexa:</b> {alexa.res.response.outputSpeech.text}</div><pre>{JSON.stringify({ request: alexa.req, response: alexa.res.response }, null, 2)}</pre></>}
          </section>
          <section className="card">
            <h3>Settings</h3>
            <label className="mute" style={{ fontSize: '.8rem' }}>Sim speed</label>
            <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))} data-focusable><option value={4000}>Relaxed</option><option value={2500}>Normal</option><option value={1200}>Fast</option></select>
            <details style={{ marginTop: 10 }}><summary className="mute" style={{ cursor: 'pointer' }}>Optional: real LLM commentary</summary>
              <div className="grid" style={{ marginTop: 8 }}>
                <input type="password" placeholder="API key (kept in memory only)" value={llm.key} onChange={(e) => setLlm({ ...llm, key: e.target.value })} aria-label="API key" />
                <input type="text" value={llm.base} onChange={(e) => setLlm({ ...llm, base: e.target.value })} aria-label="Base URL" />
                <input type="text" value={llm.model} onChange={(e) => setLlm({ ...llm, model: e.target.value })} aria-label="Model" />
              </div></details>
          </section>
        </aside>
      </div>
    </div>
  );
}
