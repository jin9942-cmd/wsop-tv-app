// Access rules and broadcast status (web demo selectors.ts).
import type { ProgramAccess } from '@/data/channels';
import { seriesById, eventById } from '@/data/series';
import type { Member, Schedule, ScheduleStatus, Series, SeriesPhase, Tier } from '@/data/types';

import { dateKey } from './time';

const RANK: Record<Member, number> = { guest: 0, free: 1, basic: 2, premium: 3 };

export type Access = 'ok' | 'login' | 'preview';

/** Guest → GGPass login sheet; tier too low → 10-second preview, then the WSOP+ subscribe sheet. */
export function accessFor(member: Member, tier: Tier): Access {
  if (member === 'guest') return 'login';
  return RANK[member] >= RANK[tier] ? 'ok' : 'preview';
}

/** Channel programmes: studio / highlights / classics are open to everyone. */
export const accessForProgram = (member: Member, access: ProgramAccess): Access => (access === 'open' ? 'ok' : accessFor(member, access));

export const PREVIEW_SECONDS = 10;

const MIN = 60_000;

/**
 * Demo clock. "No live broadcasts" moves the clock back to a moment before today's first broadcast,
 * so every screen (home, schedule, Live) agrees that nothing is on air yet.
 */
export function demoNow(noLive: boolean, list: Schedule[], real = Date.now()): number {
  if (!noLive) return real;
  let t = real;
  for (let i = 0; i < 20; i++) {
    const live = list.filter((x) => Date.parse(x.start) <= t && t < Date.parse(x.end));
    if (!live.length) return t;
    t = Math.min(...live.map((x) => Date.parse(x.start))) - 45 * MIN;
  }
  return t;
}

/** Clock shift for "No live broadcasts", taken once when it is switched on so the demo clock keeps running. */
export const noLiveOffset = (list: Schedule[], real = Date.now()) => demoNow(true, list, real) - real;

export function statusOf(s: Schedule, now: number): ScheduleStatus {
  const a = Date.parse(s.start);
  const b = Date.parse(s.end);
  return now < a ? 'upcoming' : now < b ? 'live' : 'ended';
}

/** Simulated concurrent viewers: base ± a slow wobble. */
export function viewersOf(s: Schedule, now: number) {
  const base = s.baseViewers || 2400;
  return Math.round(base * (1 + 0.04 * Math.sin(now / 9000 + base)));
}

export const liveNow = (list: Schedule[], now: number) => list.filter((s) => statusOf(s, now) === 'live').sort((a, b) => viewersOf(b, now) - viewersOf(a, now));

export const nextUpcoming = (list: Schedule[], now: number) =>
  list.filter((s) => statusOf(s, now) === 'upcoming').sort((a, b) => a.start.localeCompare(b.start))[0];

export const schedulesOnDay = (list: Schedule[], key: string, tz: string) =>
  list.filter((s) => dateKey(s.start, tz) === key).sort((a, b) => a.start.localeCompare(b.start) || a.channelId.localeCompare(b.channelId));

/** Final tables stream only on WSOP TV; feature tables are also on YouTube. */
export const isExclusive = (s: Pick<Schedule, 'type'>) => s.type === 'Final Table';

export function phaseOf(se: Series, now: number): SeriesPhase {
  const today = dateKey(now, se.timezone);
  return today < se.start ? 'upcoming' : today > se.end ? 'ended' : 'ongoing';
}

export function eventLabel(s: { eventId?: string; dayId?: string }) {
  const ev = eventById(s.eventId);
  if (!ev) return '';
  const day = s.dayId ? ev.days.find((d) => d.id === s.dayId)?.label : undefined;
  return `${ev.name}${day ? ` · ${day}` : ''}`;
}

export const seriesHue = (id: string) => seriesById(id)?.hue ?? 200;
