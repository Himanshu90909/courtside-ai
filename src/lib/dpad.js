// Spatial D-pad navigation for TV remotes (Fire TV remote sends arrow keys + Enter).
// Any element with [data-focusable] participates. Arrow keys move to the nearest one in that direction.
import { useEffect } from 'react';

function center(el) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

export function pickNext(current, candidates, dir) {
  const c = center(current);
  let best = null;
  let bestScore = Infinity;
  for (const el of candidates) {
    if (el === current) continue;
    const p = center(el);
    const dx = p.x - c.x;
    const dy = p.y - c.y;
    const inDir =
      (dir === 'ArrowRight' && dx > 4) ||
      (dir === 'ArrowLeft' && dx < -4) ||
      (dir === 'ArrowDown' && dy > 4) ||
      (dir === 'ArrowUp' && dy < -4);
    if (!inDir) continue;
    const horizontal = dir === 'ArrowLeft' || dir === 'ArrowRight';
    const main = horizontal ? Math.abs(dx) : Math.abs(dy);
    const cross = horizontal ? Math.abs(dy) : Math.abs(dx);
    const score = main + cross * 2.5; // penalise drifting off-axis
    if (score < bestScore) { best = el; bestScore = score; }
  }
  return best;
}

export function useDpad() {
  useEffect(() => {
    const onKey = (e) => {
      if (!e.key.startsWith('Arrow')) return;
      if (location.hash === '#drive' && !e.target.closest?.('.tabs,.nav-bottom')) return; // arrows drive the car
      const all = [...document.querySelectorAll('[data-focusable]')];
      if (!all.length) return;
      const cur = document.activeElement?.hasAttribute?.('data-focusable') ? document.activeElement : null;
      if (!cur) { all[0].focus(); e.preventDefault(); return; }
      const next = pickNext(cur, all, e.key);
      if (next) { next.focus(); e.preventDefault(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
