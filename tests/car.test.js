import test from 'node:test';
import assert from 'node:assert/strict';
import { CARS, buildTrack, newState, step, aiInput, nearest } from '../src/lib/car.js';

const track = buildTrack();
const run = (s, input, secs, dt = 1 / 60) => { for (let t = 0; t < secs; t += dt) step(s, typeof input === 'function' ? input(s) : input, dt, track); return s; };

test('car accelerates and respects top speed', () => {
  const s = newState(track, CARS[0]);
  run(s, { throttle: 1, brake: 0, steer: 0 }, 3);
  assert.ok(s.speed > 100, 'gained speed');
  run(s, (st) => aiInput(st, track), 20);
  assert.ok(s.speed <= CARS[0].top + 1, 'capped at top speed');
});
test('braking slows the car down', () => {
  const s = newState(track, CARS[0]);
  run(s, { throttle: 1, brake: 0, steer: 0 }, 2.5);
  const v = s.speed; run(s, { throttle: 0, brake: 1, steer: 0 }, 1.5);
  assert.ok(s.speed < v * 0.6);
});
test('steering changes heading only when moving', () => {
  const still = newState(track, CARS[0]); const h = still.heading;
  run(still, { throttle: 0, brake: 0, steer: 1 }, 1); assert.equal(still.heading, h);
  const mv = newState(track, CARS[0]); run(mv, { throttle: 1, brake: 0, steer: 0 }, 1.5);
  const h2 = mv.heading; run(mv, { throttle: 1, brake: 0, steer: 1 }, 0.5); assert.ok(mv.heading > h2);
});
test('driving off the track is flagged and slower than on track', () => {
  const s = newState(track, CARS[0]); s.x += 400; s.y += 400; s.heading = 0;
  run(s, { throttle: 1, brake: 0, steer: 0 }, 0.1);
  assert.equal(s.offTrack, true);
  const on = newState(track, CARS[0]); const off = newState(track, CARS[0]);
  off.x = track.pts[0].x + 300; off.y = track.pts[0].y + 300; off.heading = on.heading;
  run(on, (st) => aiInput(st, track), 3); run(off, { throttle: 1, brake: 0, steer: 0 }, 3);
  assert.ok(off.speed < on.speed, 'grass slower');
});
test('AI driver completes a lap with checkpoints and records lap time', () => {
  for (const car of CARS) {
    const s = newState(track, car);
    run(s, (st) => aiInput(st, track), 140);
    assert.ok(s.lap >= 1, `${car.name} finished a lap (lap=${s.lap})`);
    assert.ok(s.best > 10 && s.best < 140, `${car.name} lap time ${s.best}`);
  }
});
test('nearest finds centerline point', () => { const p = track.pts[10]; assert.equal(nearest(track, p.x, p.y).idx, 10); });
