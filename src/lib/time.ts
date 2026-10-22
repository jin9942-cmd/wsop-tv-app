// Time helpers (ported from the web demo's lib/time.ts). All stored times are UTC ISO strings.
// Zone offsets are computed here instead of with Intl time zones so web and Android (Hermes) format identically.

export const DISPLAY_TZ = ['Asia/Seoul', 'America/Los_Angeles'] as const;
export type DisplayTz = (typeof DISPLAY_TZ)[number];

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/** UTC ms of the n-th (1-based, or -1 = last) Sunday of a month at hh:00 UTC. */
function sunday(year: number, month: number, n: number, hourUtc: number) {
  if (n > 0) {
    const first = new Date(Date.UTC(year, month, 1)).getUTCDay();
    const day = 1 + ((7 - first) % 7) + (n - 1) * 7;
    return Date.UTC(year, month, day, hourUtc);
  }
  const lastDate = new Date(Date.UTC(year, month + 1, 0));
  return Date.UTC(year, month, lastDate.getUTCDate() - lastDate.getUTCDay(), hourUtc);
}

/** US DST: 2nd Sunday of March 02:00 local → 1st Sunday of November 02:00 local. */
const usDst = (t: number, std: number) => {
  const y = new Date(t).getUTCFullYear();
  return t >= sunday(y, 2, 2, 2 - std) && t < sunday(y, 10, 1, 2 - (std + 1));
};
/** EU DST: last Sunday of March 01:00 UTC → last Sunday of October 01:00 UTC. */
const euDst = (t: number) => {
  const y = new Date(t).getUTCFullYear();
  return t >= sunday(y, 2, -1, 1) && t < sunday(y, 9, -1, 1);
};

const ZONES: Record<string, { std: number; dst: (t: number) => boolean; abbr: [string, string] }> = {
  'Asia/Seoul': { std: 9, dst: () => false, abbr: ['KST', 'KST'] },
  'America/Los_Angeles': { std: -8, dst: (t) => usDst(t, -8), abbr: ['PST', 'PDT'] },
  'America/Nassau': { std: -5, dst: (t) => usDst(t, -5), abbr: ['EST', 'EDT'] },
  'Asia/Nicosia': { std: 2, dst: euDst, abbr: ['EET', 'EEST'] },
  UTC: { std: 0, dst: () => false, abbr: ['UTC', 'UTC'] },
};

const zone = (tz: string) => ZONES[tz] ?? ZONES.UTC;

/** Offset of a zone from UTC at an instant, in ms. */
export function offsetMs(t: number, tz: string) {
  const z = zone(tz);
  return (z.std + (z.dst(t) ? 1 : 0)) * HOUR;
}

export const tzAbbr = (tz: string, at: string | number = Date.now()) => {
  const t = new Date(at).getTime();
  const z = zone(tz);
  return z.abbr[z.dst(t) ? 1 : 0];
};

export const tzCity = (tz: string) => (tz.split('/')[1] ?? tz).replace('_', ' ');

/** Wall-clock parts of an instant in a zone. */
function wall(at: string | number, tz: string) {
  const t = new Date(at).getTime();
  const d = new Date(t + offsetMs(t, tz));
  return { y: d.getUTCFullYear(), mo: d.getUTCMonth(), d: d.getUTCDate(), wd: d.getUTCDay(), h: d.getUTCHours(), mi: d.getUTCMinutes() };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const pad = (n: number) => String(n).padStart(2, '0');

export const hoursFrom = (base: number, h: number) => new Date(base + h * HOUR).toISOString();

/** YYYY-MM-DD of an instant in a zone. */
export const dateKey = (at: string | number, tz: string) => {
  const w = wall(at, tz);
  return `${w.y}-${pad(w.mo + 1)}-${pad(w.d)}`;
};

export function addDays(key: string, n: number) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** Today's date (series-local calendar) shifted by n days. */
export const dayRel = (n: number, tz: string) => addDays(dateKey(Date.now(), tz), n);

/** "7:30 PM" */
export const fmtTime = (at: string | number, tz: string) => {
  const w = wall(at, tz);
  return `${w.h % 12 || 12}:${pad(w.mi)} ${w.h < 12 ? 'AM' : 'PM'}`;
};

/** "Wed, Oct 21" */
export const fmtDate = (at: string | number, tz: string) => {
  const w = wall(at, tz);
  return `${WEEKDAYS[w.wd]}, ${MONTHS[w.mo]} ${w.d}`;
};

export const fmtDateTime = (at: string | number, tz: string) => `${fmtDate(at, tz)} · ${fmtTime(at, tz)}`;

/** Calendar date label for a YYYY-MM-DD key: "Wed, Oct 21". */
export const fmtKey = (key: string) => fmtDate(`${key}T12:00:00Z`, 'UTC');

/** "Oct 21" for a YYYY-MM-DD key. */
export const fmtShortKey = (key: string) => {
  const [, m, d] = key.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}`;
};

export const fmtSeriesDates = (a: string, b: string) => `${fmtShortKey(a)} – ${fmtShortKey(b)}`;

export function fmtDuration(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export function fmtCountdown(ms: number) {
  if (ms <= 0) return '00:00:00';
  const s = Math.floor(ms / 1000);
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

/** "18.4K" */
export const fmtCount = (n: number) => (n >= 1e6 ? `${trim(n / 1e6)}M` : n >= 1e3 ? `${trim(n / 1e3)}K` : String(n));
const trim = (x: number) => (x >= 100 ? Math.round(x).toString() : x.toFixed(1).replace(/\.0$/, ''));

/** "$8,420,000" */
export const fmtMoney = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;

/** "in 3h 20m" / "40m ago" */
export const relative = (at: string | number, now = Date.now()) => {
  const ms = new Date(at).getTime() - now;
  const m = Math.round(Math.abs(ms) / MIN);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  const txt = d >= 2 ? `${d} days` : h >= 1 ? `${h}h${m % 60 ? ` ${m % 60}m` : ''}` : `${m}m`;
  return ms >= 0 ? `in ${txt}` : `${txt} ago`;
};

export { DAY, HOUR, MIN };
