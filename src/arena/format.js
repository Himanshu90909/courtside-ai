export const CATS = [
  { id: 'sports', label: 'Sports' }, { id: 'education', label: 'Education' }, { id: 'politics', label: 'Politics & Policy' },
  { id: 'science_tech', label: 'Science & Tech' }, { id: 'business', label: 'Business & Economy' }, { id: 'world', label: 'World Affairs' },
];
export const catLabel = (id) => CATS.find((c) => c.id === id)?.label || id;
export const COUNTRIES = { GB: 'United Kingdom', IN: 'India', US: 'United States', EU: 'Europe', GLOBAL: 'Global' };
export const countryLabel = (c) => COUNTRIES[c] || c || 'Unknown';
export const TYPE_LABEL = { job: 'Job', internship: 'Internship', remote_job: 'Remote job', hackathon: 'Hackathon', coding_competition: 'Competition', scholarship: 'Scholarship', fellowship: 'Fellowship', government: 'Government', research: 'Research', trial: 'Trial', course: 'Course', other: 'Opportunity' };
export const STATUS_LABEL = { open: 'Open', closing_soon: 'Closing soon', closed: 'Closed', under_verification: 'Under verification', unknown: 'Deadline unknown' };
export const CONTENT_LABEL = { news: 'Report', official: 'Official', analysis: 'Analysis', opinion: 'Opinion', unknown: 'Unclassified' };

export function ago(iso, now = Date.now()) {
  if (!iso) return 'unknown';
  const m = Math.round((now - new Date(iso).getTime()) / 60000);
  if (isNaN(m)) return 'unknown';
  if (m < 1) return 'just now'; if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60); if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24); return `${d} d ago`;
}
export function fmtDate(iso, tz) {
  if (!iso) return 'Unknown';
  try { return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short', timeZone: tz }).format(new Date(iso)); } catch { return iso; }
}
export function fmtDay(iso, tz) {
  if (!iso) return 'Unknown';
  try { return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: tz }).format(new Date(iso)); } catch { return iso; }
}
export function until(iso, now = Date.now()) {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - now; if (isNaN(ms)) return null;
  if (ms < 0) return 'ended';
  const h = Math.floor(ms / 36e5); if (h < 1) return `${Math.max(1, Math.floor(ms / 6e4))} min left`;
  if (h < 48) return `${h} h left`; return `${Math.floor(h / 24)} days left`;
}
export function hostOf(u) { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } }
