// Tours, series and bracelet events (web demo mock). Dates are relative to today so a series is always running.
import { dayRel } from '@/lib/time';

import type { EventDay, Series, TourEvent } from './types';

const NASSAU = 'America/Nassau';
const NICOSIA = 'Asia/Nicosia';
const LA = 'America/Los_Angeles';

export const tours = ['BRACELETS', 'SUPER CIRCUIT', 'CIRCUIT'] as const;

export const series: Series[] = [
  { id: 'ser-paradise', tour: 'BRACELETS', name: '2026 WSOP Paradise', start: dayRel(-5, NASSAU), end: dayRel(10, NASSAU), venue: 'Baha Mar Resort', city: 'Nassau, Bahamas', timezone: NASSAU, hue: 200 },
  { id: 'ser-cyprus', tour: 'SUPER CIRCUIT', name: '2026 WSOP Super Circuit Cyprus', start: dayRel(20, NICOSIA), end: dayRel(31, NICOSIA), venue: 'Merit Royal Diamond', city: 'Kyrenia, Cyprus', timezone: NICOSIA, hue: 280 },
  { id: 'ser-la', tour: 'CIRCUIT', name: '2026 WSOP Circuit Los Angeles', start: dayRel(-45, LA), end: dayRel(-34, LA), venue: 'The Commerce Casino', city: 'Los Angeles, CA', timezone: LA, hue: 20 },
  { id: 'ser-vegas', tour: 'BRACELETS', name: '2026 WSOP Las Vegas', start: dayRel(-125, LA), end: dayRel(-77, LA), venue: 'Horseshoe & Paris', city: 'Las Vegas, NV', timezone: LA, hue: 45 },
];

type DayLabel = EventDay['label'];
const days = (prefix: string, tz: string, offsets: [DayLabel, number][]): EventDay[] =>
  offsets.map(([label, n]) => ({ id: `${prefix}-${label.replace(/\s/g, '').toLowerCase()}`, label, date: dayRel(n, tz) }));

export const events: TourEvent[] = [
  // Paradise (ongoing)
  { id: 'ev-p8', seriesId: 'ser-paradise', number: 8, name: 'Mystery Bounty', buyIn: '$1,000', days: days('ev-p8', NASSAU, [['Day 1A', -4], ['Day 1B', -3], ['Day 2', -1], ['Final Table', 0]]) },
  { id: 'ev-p10', seriesId: 'ser-paradise', number: 10, name: 'NLH High Roller', buyIn: '$25,000', days: days('ev-p10', NASSAU, [['Day 1A', -2], ['Day 2', -1], ['Final Table', 0]]) },
  { id: 'ev-p11', seriesId: 'ser-paradise', number: 11, name: 'Pot-Limit Omaha', buyIn: '$5,000', days: days('ev-p11', NASSAU, [['Day 1A', -3], ['Day 2', -1], ['Final Table', 0]]) },
  { id: 'ev-p12', seriesId: 'ser-paradise', number: 12, name: 'Ladies Championship', buyIn: '$1,000', days: days('ev-p12', NASSAU, [['Day 1A', -1], ['Final Table', 0]]) },
  { id: 'ev-p13', seriesId: 'ser-paradise', number: 13, name: 'Main Event', buyIn: '$3,000', days: days('ev-p13', NASSAU, [['Day 1A', -2], ['Day 1B', -1], ['Day 2', 0], ['Day 3', 1], ['Final Table', 2]]) },
  { id: 'ev-p14', seriesId: 'ser-paradise', number: 14, name: 'Mini Main Event', buyIn: '$600', days: days('ev-p14', NASSAU, [['Day 1A', 0], ['Day 1B', 1], ['Day 2', 2], ['Final Table', 3]]) },
  // Super Circuit Cyprus (upcoming)
  { id: 'ev-c1', seriesId: 'ser-cyprus', number: 1, name: 'Opener NLH', buyIn: '€550', days: days('ev-c1', NICOSIA, [['Day 1A', 20], ['Day 2', 21], ['Final Table', 22]]) },
  { id: 'ev-c5', seriesId: 'ser-cyprus', number: 5, name: 'PLO Championship', buyIn: '€2,200', days: days('ev-c5', NICOSIA, [['Day 1A', 23], ['Final Table', 24]]) },
  { id: 'ev-c9', seriesId: 'ser-cyprus', number: 9, name: 'Super High Roller', buyIn: '€50,000', days: days('ev-c9', NICOSIA, [['Day 1A', 26], ['Final Table', 27]]) },
  { id: 'ev-c12', seriesId: 'ser-cyprus', number: 12, name: 'Main Event', buyIn: '€5,300', days: days('ev-c12', NICOSIA, [['Day 1A', 27], ['Day 1B', 28], ['Day 2', 29], ['Final Table', 31]]) },
  // Circuit LA (ended)
  { id: 'ev-l1', seriesId: 'ser-la', number: 1, name: 'Circuit Opener', buyIn: '$400', days: days('ev-l1', LA, [['Day 1A', -45], ['Final Table', -44]]) },
  { id: 'ev-l6', seriesId: 'ser-la', number: 6, name: 'PLO Bounty', buyIn: '$600', days: days('ev-l6', LA, [['Day 1A', -41], ['Final Table', -40]]) },
  { id: 'ev-l10', seriesId: 'ser-la', number: 10, name: 'Main Event Ring', buyIn: '$1,700', days: days('ev-l10', LA, [['Day 1A', -38], ['Day 1B', -37], ['Day 2', -36], ['Final Table', -35]]) },
  { id: 'ev-l12', seriesId: 'ser-la', number: 12, name: 'High Roller Ring', buyIn: '$5,000', days: days('ev-l12', LA, [['Day 1A', -35], ['Final Table', -34]]) },
  // Las Vegas (ended)
  { id: 'ev-v1', seriesId: 'ser-vegas', number: 1, name: 'Mystery Millions', buyIn: '$1,000', days: days('ev-v1', LA, [['Day 1A', -125], ['Final Table', -121]]) },
  { id: 'ev-v45', seriesId: 'ser-vegas', number: 45, name: 'Poker Players Championship', buyIn: '$50,000', days: days('ev-v45', LA, [['Day 1A', -100], ['Final Table', -96]]) },
  { id: 'ev-v76', seriesId: 'ser-vegas', number: 76, name: 'NLH Main Event', buyIn: '$10,000', days: days('ev-v76', LA, [['Day 1A', -95], ['Day 2', -90], ['Final Table', -77]]) },
  { id: 'ev-v80', seriesId: 'ser-vegas', number: 80, name: 'Tournament of Champions', buyIn: 'Freeroll', days: days('ev-v80', LA, [['Day 1A', -80], ['Final Table', -79]]) },
];

export const seriesById = (id: string) => series.find((x) => x.id === id);
export const eventById = (id?: string) => events.find((x) => x.id === id);
