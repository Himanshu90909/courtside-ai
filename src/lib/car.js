// Top-down car simulator engine: pure functions, no DOM, fully testable.
export const CARS = [
  { id: 'sport', name: 'Apex GT', accel: 260, brake: 420, top: 330, grip: 5.2, turn: 2.6, color: '#ff5d73' },
  { id: 'rally', name: 'Dune Rally', accel: 220, brake: 380, top: 270, grip: 3.4, turn: 2.9, color: '#ff9900' },
  { id: 'ev', name: 'Volt EV', accel: 300, brake: 400, top: 290, grip: 4.6, turn: 2.5, color: '#3ddc97' },
];

// Closed circuit as a rounded oval with a chicane: centerline polyline, road half-width.
export function buildTrack() {
  const pts = [];
  const N = 160;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const r = 1 + 0.06 * Math.sin(3 * a) + 0.04 * Math.cos(2 * a);
    pts.push({ x: Math.cos(a) * 1100 * r, y: Math.sin(a) * 700 * r });
  }
  return { pts, half: 95, length: pts.reduce((s, p, i) => s + Math.hypot(pts[(i + 1) % N].x - p.x, pts[(i + 1) % N].y - p.y), 0) };
}

export function nearest(track, x, y) {
  let best = 0, bd = Infinity;
  track.pts.forEach((p, i) => { const d = (p.x - x) ** 2 + (p.y - y) ** 2; if (d < bd) { bd = d; best = i; } });
  return { idx: best, dist: Math.sqrt(bd) };
}

export function newState(track, car) {
  const p0 = track.pts[0], p1 = track.pts[1];
  return {
    x: p0.x, y: p0.y, heading: Math.atan2(p1.y - p0.y, p1.x - p0.x), vx: 0, vy: 0,
    speed: 0, lap: 0, lapTime: 0, best: null, lastLap: null, checkpoint: 0, offTrack: false, time: 0, car,
    nextIdx: 0, laps: [],
  };
}

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// input: { throttle:0..1, brake:0..1, steer:-1..1 }
export function step(s, input, dt, track) {
  const c = s.car;
  const fx = Math.cos(s.heading), fy = Math.sin(s.heading);
  const fwd = s.vx * fx + s.vy * fy;
  const lat = s.vx * -fy + s.vy * fx;

  const nr = nearest(track, s.x, s.y);
  s.offTrack = nr.dist > track.half;
  const surface = s.offTrack ? 0.6 : 1; // grass is slow and slippery

  let a = input.throttle * c.accel * surface - input.brake * c.brake * Math.sign(fwd || 1) - fwd * 0.35 * (s.offTrack ? 3 : 1) - Math.sign(fwd) * fwd * fwd * 0.0006;
  if (input.brake && Math.abs(fwd) < 6 && !input.throttle) a = -fwd / dt * 0.5;
  let newFwd = clamp(fwd + a * dt, -c.top * 0.3, c.top * surface + (s.offTrack ? 0 : 0));
  // lateral grip: kill sideways velocity, handbrake-like loss at speed
  const newLat = lat * Math.exp(-c.grip * surface * dt);

  // Bicycle-style steering: yaw rate = speed / turnRadius, with the steering angle shrinking as speed rises.
  const sp = Math.abs(newFwd);
  const maxAngle = c.turn * 0.17 / (1 + sp / 120);            // rad of wheel lock; less at speed
  const yaw = (newFwd / 46) * Math.tan(clamp(input.steer, -1, 1) * maxAngle * 3.4);
  const gripLimit = c.grip * surface * 38 / Math.max(sp, 1);   // max yaw rate before tyres give up (understeer)
  s.heading += clamp(yaw, -gripLimit, gripLimit) * dt;
  s.yaw = yaw;

  // Heading changed: re-express velocity in the new body frame. Part of the sideways component survives (slide),
  // decaying with tyre grip, so fast corners drift a little instead of snapping.
  const nfx = Math.cos(s.heading), nfy = Math.sin(s.heading);
  const wFwd = newFwd * 1, wLat = newLat;
  const vx0 = fx * wFwd + -fy * wLat, vy0 = fy * wFwd + fx * wLat;       // world velocity before turning
  const nFwd = vx0 * nfx + vy0 * nfy, nLat = (vx0 * -nfy + vy0 * nfx) * Math.exp(-c.grip * surface * dt);
  s.vx = nfx * nFwd + -nfy * nLat;
  s.vy = nfy * nFwd + nfx * nLat;
  s.x += s.vx * dt; s.y += s.vy * dt;
  s.speed = Math.hypot(s.vx, s.vy);
  s.slip = Math.abs(nLat);
  s.time += dt; s.lapTime += dt;

  // lap logic: must pass through every quarter checkpoint in order
  const n = track.pts.length;
  const target = [Math.floor(n * 0.25), Math.floor(n * 0.5), Math.floor(n * 0.75), 0][s.checkpoint];
  if (Math.hypot(track.pts[target].x - s.x, track.pts[target].y - s.y) < track.half * 1.3) {
    s.checkpoint += 1;
    if (s.checkpoint === 4) {
      s.checkpoint = 0; s.lap += 1;
      s.lastLap = s.lapTime; s.laps.push(s.lapTime);
      if (s.best == null || s.lapTime < s.best) s.best = s.lapTime;
      s.lapTime = 0; s.lapDone = s.time;
    }
  }
  return s;
}

export const fmtTime = (t) => (t == null ? '--:--.---' : `${String(Math.floor(t / 60)).padStart(2, '0')}:${(t % 60).toFixed(3).padStart(6, '0')}`);
export const kmh = (s) => Math.round(s * 0.62);

// Simple AI ghost that follows the centerline for a benchmark lap.
export function aiInput(s, track, lookahead = 7) {
  const { idx } = nearest(track, s.x, s.y);
  const tgt = track.pts[(idx + lookahead) % track.pts.length];
  let da = Math.atan2(tgt.y - s.y, tgt.x - s.x) - s.heading;
  da = Math.atan2(Math.sin(da), Math.cos(da));
  return { throttle: Math.abs(da) > 0.5 ? 0.35 : 0.9, brake: 0, steer: clamp(da * 2.2, -1, 1) };
}
