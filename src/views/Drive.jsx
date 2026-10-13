import React, { useEffect, useRef, useState } from 'react';
import { CARS, buildTrack, newState, step, fmtTime, kmh, aiInput, nearest } from '../lib/car.js';

const track = buildTrack();
const BEST_KEY = 'courtside-car-best';

export default function Drive() {
  const cv = useRef(null);
  const keys = useRef({});
  const touch = useRef({ throttle: 0, brake: 0, steer: 0 });
  const [carId, setCarId] = useState('sport');
  const [ghostOn, setGhostOn] = useState(true);
  const [hud, setHud] = useState({ speed: 0, lap: 0, lapTime: 0, best: null, last: null, off: false });
  const [running, setRunning] = useState(true);
  const [pb, setPb] = useState(() => { try { return JSON.parse(localStorage.getItem(BEST_KEY) || '{}'); } catch { return {}; } });
  const sim = useRef({});
  const car = CARS.find((c) => c.id === carId);
  const reset = () => { sim.current.s = newState(track, car); sim.current.g = newState(track, CARS[1]); sim.current.trail = []; };

  useEffect(() => { reset(); }, [carId]); // eslint-disable-line

  useEffect(() => {
    const down = (e) => { if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key) || /^[wasd]$/i.test(e.key)) { keys.current[e.key.toLowerCase()] = true; e.preventDefault(); e.stopPropagation(); } if (e.key.toLowerCase() === 'r') reset(); if (e.key.toLowerCase() === 'p') setRunning((r) => !r); };
    const up = (e) => { delete keys.current[e.key.toLowerCase()]; };
    window.addEventListener('keydown', down, true); window.addEventListener('keyup', up, true);
    return () => { window.removeEventListener('keydown', down, true); window.removeEventListener('keyup', up, true); };
  }, [carId]); // eslint-disable-line

  useEffect(() => {
    const c = cv.current, ctx = c.getContext('2d');
    let raf, last = performance.now(), hudT = 0, shake = 0;
    const fit = () => { const r = c.getBoundingClientRect(); const d = Math.min(window.devicePixelRatio || 1, 2); c.width = r.width * d; c.height = r.height * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
    fit(); const ro = new ResizeObserver(fit); ro.observe(c);

    const inputNow = () => {
      const k = keys.current, t = touch.current;
      const gp = (navigator.getGamepads?.() || [])[0];
      let throttle = (k.arrowup || k.w ? 1 : 0) || t.throttle, brake = (k.arrowdown || k.s || k[' '] ? 1 : 0) || t.brake;
      let steer = (k.arrowright || k.d ? 1 : 0) - (k.arrowleft || k.a ? 1 : 0) || t.steer;
      if (gp) { throttle = Math.max(throttle, gp.buttons[7]?.value || 0); brake = Math.max(brake, gp.buttons[6]?.value || 0); if (Math.abs(gp.axes[0]) > 0.12) steer = gp.axes[0]; }
      return { throttle, brake, steer };
    };

    const draw = () => {
      const W = c.clientWidth, H = c.clientHeight, s = sim.current.s;
      const zoom = Math.max(0.55, Math.min(1.15, 0.95 - s.speed / 900)) * Math.min(W / 900, 1.15);
      ctx.fillStyle = '#12351f'; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(zoom, zoom); ctx.rotate(-s.heading - Math.PI / 2); ctx.translate(-s.x, -s.y);
      // grass texture
      ctx.fillStyle = '#16422a'; for (let gx = -3000; gx < 3000; gx += 220) for (let gy = -2200; gy < 2200; gy += 220) if (((gx + gy) / 220) % 2 === 0) ctx.fillRect(gx, gy, 220, 220);
      const path = () => { ctx.beginPath(); track.pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath(); };
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      path(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = track.half * 2 + 14; ctx.stroke();
      path(); ctx.strokeStyle = '#ff5d73'; ctx.setLineDash([40, 40]); ctx.lineWidth = track.half * 2 + 14; ctx.stroke(); ctx.setLineDash([]);
      path(); ctx.strokeStyle = '#2b2f3f'; ctx.lineWidth = track.half * 2; ctx.stroke();
      path(); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.setLineDash([26, 34]); ctx.lineWidth = 3; ctx.stroke(); ctx.setLineDash([]);
      // start/finish line
      const p0 = track.pts[0], p1 = track.pts[1], an = Math.atan2(p1.y - p0.y, p1.x - p0.x);
      ctx.save(); ctx.translate(p0.x, p0.y); ctx.rotate(an);
      for (let i = -5; i < 5; i++) for (let j = 0; j < 2; j++) { ctx.fillStyle = (i + j) % 2 ? '#fff' : '#111'; ctx.fillRect(j * 14 - 7, i * 12.4, 14, 12.4); }
      ctx.restore();
      // skid trail
      sim.current.trail.forEach((t) => { ctx.fillStyle = `rgba(0,0,0,${t.a})`; ctx.fillRect(t.x - 3, t.y - 3, 6, 6); });
      // cars
      const carDraw = (st, color, alpha = 1) => {
        ctx.save(); ctx.globalAlpha = alpha; ctx.translate(st.x, st.y); ctx.rotate(st.heading);
        ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(-20, -10, 44, 24);
        ctx.fillStyle = '#111'; [[-14, -13], [-14, 9], [11, -13], [11, 9]].forEach(([x, y]) => ctx.fillRect(x, y, 10, 5));
        ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(-22, -10, 46, 20, 7); ctx.fill();
        ctx.fillStyle = 'rgba(15,20,40,.85)'; ctx.fillRect(-4, -7, 13, 14); ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fillRect(21, -8, 3, 4); ctx.fillRect(21, 4, 3, 4);
        ctx.restore();
      };
      if (ghostOn) carDraw(sim.current.g, '#8aa2ff', 0.55);
      carDraw(s, s.car.color);
      ctx.restore();
      if (s.offTrack) { ctx.fillStyle = 'rgba(255,93,115,.12)'; ctx.fillRect(0, 0, W, H); }
      // minimap
      const mw = Math.min(150, W * 0.3), mh = mw * 0.66, mx = W - mw - 12, my = 12, sx = mw / 2900, sy = mh / 1850;
      ctx.fillStyle = 'rgba(10,15,36,.8)'; ctx.fillRect(mx, my, mw, mh);
      ctx.beginPath(); track.pts.forEach((p, i) => { const X = mx + mw / 2 + p.x * sx, Y = my + mh / 2 + p.y * sy; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.closePath(); ctx.strokeStyle = '#7d89c9'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = s.car.color; ctx.beginPath(); ctx.arc(mx + mw / 2 + s.x * sx, my + mh / 2 + s.y * sy, 4, 0, 7); ctx.fill();
      if (ghostOn) { ctx.fillStyle = '#8aa2ff'; ctx.beginPath(); ctx.arc(mx + mw / 2 + sim.current.g.x * sx, my + mh / 2 + sim.current.g.y * sy, 3, 0, 7); ctx.fill(); }
    };

    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const { s, g } = sim.current; if (!s) return;
      if (running) {
        const before = s.lap;
        step(s, inputNow(), dt, track);
        if (ghostOn) step(g, aiInput(g, track), dt, track);
        if (s.slip > 55 && s.speed > 60) { sim.current.trail.push({ x: s.x, y: s.y, a: 0.35 }); if (sim.current.trail.length > 400) sim.current.trail.shift(); }
        sim.current.trail.forEach((t) => (t.a -= dt * 0.04)); sim.current.trail = sim.current.trail.filter((t) => t.a > 0);
        if (s.lap > before && (!pb[s.car.id] || s.lastLap < pb[s.car.id])) { const n = { ...pb, [s.car.id]: s.lastLap }; setPb(n); try { localStorage.setItem(BEST_KEY, JSON.stringify(n)); } catch {} }
      }
      draw();
      hudT += dt; if (hudT > 0.08) { hudT = 0; setHud({ speed: kmh(s.speed), lap: s.lap, lapTime: s.lapTime, best: s.best, last: s.lastLap, off: s.offTrack, cp: s.checkpoint }); }
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [running, ghostOn, carId]); // eslint-disable-line

  const hold = (k, v) => ({
    onPointerDown: (e) => { e.currentTarget.setPointerCapture(e.pointerId); touch.current[k] = v; },
    onPointerUp: () => { touch.current[k] = 0; }, onPointerCancel: () => { touch.current[k] = 0; }, onLostPointerCapture: () => { touch.current[k] = 0; },
  });

  return (
    <div className="grid">
      <section className="hero"><h1>Car Simulator</h1><span className="mute">Drive the circuit. Keyboard: arrows / WASD, Space = brake, R = restart, P = pause. Phone: on-screen pedals. Gamepad and Fire TV controller supported.</span></section>
      <div className="grid g2">
        <section className="card" style={{ padding: 10 }}>
          <div className="drive-wrap">
            <canvas ref={cv} className="drive-cv" aria-label="Car simulator view" />
            <div className="hud">
              <div className="speedo"><b>{hud.speed}</b><span>km/h</span></div>
              <div className="laps"><span>Lap {hud.lap + 1}</span><b className="mono">{fmtTime(hud.lapTime)}</b></div>
              {hud.off && <div className="warn">Off track</div>}
            </div>
            <div className="pad" aria-hidden={false}>
              <div className="pad-l"><button className="padbtn" {...hold('steer', -1)} aria-label="Steer left">◀</button><button className="padbtn" {...hold('steer', 1)} aria-label="Steer right">▶</button></div>
              <div className="pad-r"><button className="padbtn brake" {...hold('brake', 1)} aria-label="Brake">Brake</button><button className="padbtn gas" {...hold('throttle', 1)} aria-label="Accelerate">Gas</button></div>
            </div>
          </div>
        </section>
        <aside className="grid" style={{ alignContent: 'start' }}>
          <section className="card">
            <h3>Garage</h3>
            <div className="chips" style={{ margin: '10px 0' }} role="group" aria-label="Choose car">{CARS.map((c) => <button key={c.id} className="chip" aria-pressed={carId === c.id} onClick={() => setCarId(c.id)}><span style={{ color: c.color }}>●</span> {c.name}</button>)}</div>
            <div className="kpis" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="kpi"><span className="mute">Top speed</span><b>{kmh(car.top)}</b></div>
              <div className="kpi"><span className="mute">Grip</span><b>{car.grip.toFixed(1)}</b></div>
            </div>
          </section>
          <section className="card">
            <h3>Timing</h3>
            <table><tbody>
              <tr><td className="mute">Current</td><td className="mono">{fmtTime(hud.lapTime)}</td></tr>
              <tr><td className="mute">Last lap</td><td className="mono">{fmtTime(hud.last)}</td></tr>
              <tr><td className="mute">Session best</td><td className="mono ok">{fmtTime(hud.best)}</td></tr>
              <tr><td className="mute">Personal best ({car.name})</td><td className="mono">{fmtTime(pb[car.id])}</td></tr>
            </tbody></table>
            <div className="chips" style={{ marginTop: 12 }}>
              <button className="btn primary" onClick={reset}>Restart (R)</button>
              <button className="btn" onClick={() => setRunning(!running)}>{running ? 'Pause (P)' : 'Resume (P)'}</button>
              <button className={`btn ${ghostOn ? 'on' : ''}`} onClick={() => setGhostOn(!ghostOn)}>AI rival {ghostOn ? 'on' : 'off'}</button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
