// Time zone helpers (web demo v2 lib/time.ts). Every time in the UI goes through these, so changing the zone converts
// everything at once. Zone offsets are computed here instead of with Intl time zones so web and Android (Hermes) agree.

export const VENUE_TZ = 'America/Los_Angeles';

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/** UTC ms of the n-th (1-based, or -1 = last) Sunday of a month at hh:00 UTC. */
function sunday(year: number, month: number, n: number, hourUtc: number) {
  if (n > 0) {
    const first = new Date(Date.UTC(year, month, 1)).getUTCDay();
    return Date.UTC(year, month, 1 + ((7 - first) % 7) + (n - 1) * 7, hourUtc);
  }
  const last = new Date(Date.UTC(year, month + 1, 0));
  return Date.UTC(year, month, last.getUTCDate() - last.getUTCDay(), hourUtc);
}
/** US DST: 2nd Sunday of March 02:00 local → 1st Sunday of November 02:00 local. */
const usDst = (std: number) => (t: number) => {
  const y = new Date(t).getUTCFullYear();
  return t >= sunday(y, 2, 2, 2 - std) && t < sunday(y, 10, 1, 2 - (std + 1));
};
/** EU DST: last Sunday of March 01:00 UTC → last Sunday of October 01:00 UTC. */
const euDst = (t: number) => {
  const y = new Date(t).getUTCFullYear();
  return t >= sunday(y, 2, -1, 1) && t < sunday(y, 9, -1, 1);
};
const never = () => false;

const ZONES: Record<string, { std: number; dst: (t: number) => boolean; abbr: [string, string] }> = {
  'America/Los_Angeles': { std: -8, dst: usDst(-8), abbr: ['PST', 'PDT'] },
  'America/Denver': { std: -7, dst: usDst(-7), abbr: ['MST', 'MDT'] },
  'America/Chicago': { std: -6, dst: usDst(-6), abbr: ['CST', 'CDT'] },
  'America/New_York': { std: -5, dst: usDst(-5), abbr: ['EST', 'EDT'] },
  UTC: { std: 0, dst: never, abbr: ['UTC', 'UTC'] },
  'Europe/London': { std: 0, dst: euDst, abbr: ['GMT', 'BST'] },
  'Europe/Prague': { std: 1, dst: euDst, abbr: ['CET', 'CEST'] },
  'Asia/Seoul': { std: 9, dst: never, abbr: ['KST', 'KST'] },
};

export const TZ_OPTIONS: { tz: string; label: string }[] = [
  { tz: 'America/Los_Angeles', label: 'Pacific (PT)' },
  { tz: 'America/Denver', label: 'Mountain (MT)' },
  { tz: 'America/Chicago', label: 'Central (CT)' },
  { tz: 'America/New_York', label: 'Eastern (ET)' },
  { tz: 'UTC', label: 'UTC' },
  { tz: 'Europe/London', label: 'London' },
  { tz: 'Europe/Prague', label: 'Central Europe' },
  { tz: 'Asia/Seoul', label: 'Seoul' },
];

/** The device's zone when we can convert it, else Seoul. */
export const deviceTz = () => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz && ZONES[tz] ? tz : 'Asia/Seoul';
  } catch {
    return 'Asia/Seoul';
  }
};

const zone = (tz: string) => ZONES[tz] ?? ZONES.UTC;
const ms = (at: string | number) => new Date(at).getTime();

export const offsetMs = (t: number, tz: string) => {
  const z = zone(tz);
  return (z.std + (z.dst(t) ? 1 : 0)) * HOUR;
};

export const tzAbbr = (tz: string, at: string | number = Date.now()) => {
  const z = zone(tz);
  return z.abbr[z.dst(ms(at)) ? 1 : 0];
};

function wall(at: string | number, tz: string) {
  const t = ms(at);
  const d = new Date(t + offsetMs(t, tz));
  return { y: d.getUTCFullYear(), mo: d.getUTCMonth(), d: d.getUTCDate(), wd: d.getUTCDay(), h: d.getUTCHours(), mi: d.getUTCMinutes() };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const pad = (n: number) => String(n).padStart(2, '0');

/** Local wall time → UTC ms (for "noon Las Vegas time"). */
export function zonedToUtc(y: number, mo: number, d: number, h: number, tz: string) {
  const guess = Date.UTC(y, mo, d, h);
  return guess - offsetMs(guess - offsetMs(guess, tz), tz);
}

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
/** Big date label for cards, e.g. "THU, OCT 15". */
export const fmtCardDate = (at: string | number, tz: string) => fmtDate(at, tz).toUpperCase();

/** YYYY-MM-DD in a zone (for grouping by day). */
export const dayKey = (at: string | number, tz: string) => {
  const w = wall(at, tz);
  return `${w.y}-${pad(w.mo + 1)}-${pad(w.d)}`;
};
export const shiftKey = (key: string, n: number) => dayKey(Date.parse(`${key}T12:00:00Z`) + n * DAY, 'UTC');
export const keyParts = (key: string) => {
  const d = new Date(`${key}T12:00:00Z`);
  return { weekday: WEEKDAYS[d.getUTCDay()], day: d.getUTCDate(), month: MONTHS[d.getUTCMonth()] };
};
/** Billing dates always carry the year: "Nov 20, 2026". */
export const fmtBillingDate = (at: number) => {
  const d = new Date(at);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
};

export const countdown = (ms: number) => {
  if (ms <= 0) return '00:00:00';
  const s = Math.floor(ms / 1000);
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
};

/** "in 3h 20m", "in 2 days", "40m ago". */
export const relative = (at: string | number, now = Date.now()) => {
  const diff = ms(at) - now;
  const m = Math.round(Math.abs(diff) / MIN);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  const txt = d >= 2 ? `${d} days` : h >= 1 ? `${h}h${m % 60 ? ` ${m % 60}m` : ''}` : `${m}m`;
  return diff >= 0 ? `in ${txt}` : `${txt} ago`;
};

export { DAY, HOUR, MIN };
