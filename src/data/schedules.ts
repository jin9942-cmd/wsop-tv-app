// 편성 (web demo mock). Times are relative to app start so there is always something live today.
import { hoursFrom } from '@/lib/time';

import type { OutputChannel, Schedule } from './types';

const HALF_HOUR = 30 * 60_000;
/** App start rounded down to the half hour: the anchor for every relative slot. */
export const T0 = Math.floor(Date.now() / HALF_HOUR) * HALF_HOUR;
const at = (h: number) => hoursFrom(T0, h);

export const outputChannels: OutputChannel[] = [
  { id: 'CH-01', name: 'Feature EN' },
  { id: 'CH-02', name: 'Feature ES' },
  { id: 'CH-03', name: 'Final Table' },
  { id: 'CH-04', name: 'Studio / Highlights' },
];

const S = (s: Omit<Schedule, 'baseViewers'> & { baseViewers?: number }): Schedule => ({ baseViewers: 0, ...s });

/** Today has 3 live slots, several upcoming and ended (with replays), plus yesterday / tomorrow / the day after. */
export const schedules: Schedule[] = [
  // yesterday
  S({ id: 'sc-01', title: 'Main Event Day 1B — Feature Table', seriesId: 'ser-paradise', eventId: 'ev-p13', dayId: 'ev-p13-day1b', type: 'Feature Table', channelId: 'CH-01', lang: 'EN', tier: 'basic', start: at(-27), end: at(-21), vodId: 'v-01' }),
  S({ id: 'sc-02', title: 'High Roller Day 2 — Feature Table', seriesId: 'ser-paradise', eventId: 'ev-p10', dayId: 'ev-p10-day2', type: 'Feature Table', channelId: 'CH-03', lang: 'EN', tier: 'premium', start: at(-26), end: at(-21), vodId: 'v-02' }),
  // today — ended
  S({ id: 'sc-03', title: 'Mystery Bounty Final Table', seriesId: 'ser-paradise', eventId: 'ev-p8', dayId: 'ev-p8-finaltable', type: 'Final Table', channelId: 'CH-03', lang: 'EN', tier: 'basic', start: at(-7), end: at(-4), vodId: 'v-03' }),
  S({ id: 'sc-04', title: 'PLO Final Table (Español)', seriesId: 'ser-paradise', eventId: 'ev-p11', dayId: 'ev-p11-finaltable', type: 'Final Table', channelId: 'CH-02', lang: 'ES', tier: 'basic', start: at(-6), end: at(-3), vodId: 'v-04' }),
  S({ id: 'sc-05', title: 'Paradise Daily — Day 1B Recap', seriesId: 'ser-paradise', eventId: 'ev-p13', dayId: 'ev-p13-day1b', type: 'Highlight Show', channelId: 'CH-04', lang: 'EN', tier: 'free', start: at(-5), end: at(-4), vodId: 'v-05' }),
  // today — live (same event, different table / language)
  S({ id: 'sc-06', title: 'Main Event Day 2 — Feature Table', seriesId: 'ser-paradise', eventId: 'ev-p13', dayId: 'ev-p13-day2', type: 'Feature Table', channelId: 'CH-01', lang: 'EN', tier: 'premium', start: at(-2), end: at(3), baseViewers: 18400 }),
  S({ id: 'sc-07', title: 'Main Event Day 2 — Feature Table', seriesId: 'ser-paradise', eventId: 'ev-p13', dayId: 'ev-p13-day2', type: 'Feature Table', channelId: 'CH-02', lang: 'ES', tier: 'basic', start: at(-2), end: at(3), baseViewers: 6200 }),
  S({ id: 'sc-08', title: 'High Roller Final Table', seriesId: 'ser-paradise', eventId: 'ev-p10', dayId: 'ev-p10-finaltable', type: 'Final Table', channelId: 'CH-03', lang: 'EN', tier: 'free', start: at(-1), end: at(2.5), baseViewers: 9100 }),
  // today — upcoming
  S({ id: 'sc-09', title: 'Ladies Championship Final Table', seriesId: 'ser-paradise', eventId: 'ev-p12', dayId: 'ev-p12-finaltable', type: 'Final Table', channelId: 'CH-03', lang: 'EN', tier: 'basic', start: at(3), end: at(7) }),
  S({ id: 'sc-10', title: 'Paradise Daily — Main Event Day 2 Recap', seriesId: 'ser-paradise', eventId: 'ev-p13', dayId: 'ev-p13-day2', type: 'Highlight Show', channelId: 'CH-04', lang: 'EN', tier: 'free', start: at(3.5), end: at(4.5) }),
  S({ id: 'sc-11', title: 'Mini Main Day 1A — Feature Table', seriesId: 'ser-paradise', eventId: 'ev-p14', dayId: 'ev-p14-day1a', type: 'Feature Table', channelId: 'CH-01', lang: 'EN', tier: 'basic', start: at(4), end: at(9), originalStart: at(3) }),
  S({ id: 'sc-12', title: 'Mini Main Day 1A — Feature Table', seriesId: 'ser-paradise', eventId: 'ev-p14', dayId: 'ev-p14-day1a', type: 'Feature Table', channelId: 'CH-02', lang: 'ES', tier: 'basic', start: at(4), end: at(9) }),
  // tomorrow
  S({ id: 'sc-13', title: 'Main Event Day 3 — Feature Table', seriesId: 'ser-paradise', eventId: 'ev-p13', dayId: 'ev-p13-day3', type: 'Feature Table', channelId: 'CH-01', lang: 'EN', tier: 'premium', start: at(22), end: at(29) }),
  S({ id: 'sc-14', title: 'Main Event Day 3 — Feature Table', seriesId: 'ser-paradise', eventId: 'ev-p13', dayId: 'ev-p13-day3', type: 'Feature Table', channelId: 'CH-02', lang: 'ES', tier: 'basic', start: at(22), end: at(29) }),
  S({ id: 'sc-15', title: 'Mini Main Day 1B — Feature Table', seriesId: 'ser-paradise', eventId: 'ev-p14', dayId: 'ev-p14-day1b', type: 'Feature Table', channelId: 'CH-03', lang: 'PT', tier: 'basic', start: at(23), end: at(28) }),
  S({ id: 'sc-16', title: 'Paradise Daily — Day 3 Preview', seriesId: 'ser-paradise', eventId: 'ev-p13', dayId: 'ev-p13-day3', type: 'Highlight Show', channelId: 'CH-04', lang: 'EN', tier: 'free', start: at(21), end: at(22) }),
  // the day after
  S({ id: 'sc-17', title: 'Main Event Final Table', seriesId: 'ser-paradise', eventId: 'ev-p13', dayId: 'ev-p13-finaltable', type: 'Final Table', channelId: 'CH-01', lang: 'EN', tier: 'premium', start: at(46), end: at(53) }),
  S({ id: 'sc-18', title: 'Main Event Final Table', seriesId: 'ser-paradise', eventId: 'ev-p13', dayId: 'ev-p13-finaltable', type: 'Final Table', channelId: 'CH-02', lang: 'ES', tier: 'premium', start: at(46), end: at(53) }),
  S({ id: 'sc-19', title: 'Mini Main Day 2 — Feature Table', seriesId: 'ser-paradise', eventId: 'ev-p14', dayId: 'ev-p14-day2', type: 'Feature Table', channelId: 'CH-03', lang: 'EN', tier: 'basic', start: at(47), end: at(52) }),
];

export const scheduleById = (id?: string) => schedules.find((x) => x.id === id);
