// Guest-first local state: preferences, saved items, reminders, in-app notifications.
// Everything is stored on this device only (no account), and can be cleared from Settings.
import { useEffect, useState, useCallback } from 'react';

const read = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } window.dispatchEvent(new CustomEvent('arena-store', { detail: k })); };

export function useStore(key, initial) {
  const [v, setV] = useState(() => read(key, initial));
  useEffect(() => {
    const on = (e) => { if (!e.detail || e.detail === key) setV(read(key, initial)); };
    window.addEventListener('arena-store', on);
    return () => window.removeEventListener('arena-store', on);
  }, [key]); // eslint-disable-line
  const set = useCallback((next) => { const val = typeof next === 'function' ? next(read(key, initial)) : next; write(key, val); setV(val); }, [key]); // eslint-disable-line
  return [v, set];
}

export const DEFAULT_PREFS = { theme: 'dark', country: 'all', language: 'en', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', educationLevel: '', interests: [], sports: [], careerInterests: [], favoriteTeams: [], notify: { matchStart: true, deadlines: true, breakingSports: false, hackathons: true }, quietStart: '22:00', quietEnd: '07:00', saveHistory: true };

export const usePrefs = () => useStore('arena:prefs', DEFAULT_PREFS);
export const useSaved = () => useStore('arena:saved', []);
export const useReadHistory = () => useStore('arena:history', []);
export const useNotifs = () => useStore('arena:notifs', []);

export function toggleSaved(setSaved, item) {
  setSaved((cur) => (cur.some((x) => x.uid === item.uid) ? cur.filter((x) => x.uid !== item.uid) : [{ uid: item.uid, kind: item.kind, title: item.title, url: item.url, deadline: item.deadline || null, source: item.source || '', savedAt: new Date().toISOString(), remind: false }, ...cur]));
}

// Quiet hours: HH:MM strings in the user's configured timezone
export function inQuietHours(prefs, now = new Date()) {
  try {
    const hm = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: prefs.timezone }).format(now);
    const [s, e] = [prefs.quietStart, prefs.quietEnd];
    if (!s || !e || s === e) return false;
    return s < e ? hm >= s && hm < e : hm >= s || hm < e;
  } catch { return false; }
}
