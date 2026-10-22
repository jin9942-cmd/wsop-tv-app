// VOD and players (web demo mock). Fictional players and results.
import { hoursFrom } from '@/lib/time';

import { T0 } from './schedules';
import type { Player, Vod } from './types';

const at = (h: number) => hoursFrom(T0, h);

export const players: Player[] = [
  { id: 'pl-1', name: 'Mateo Valcourt', country: 'France', flag: '🇫🇷', bracelets: 3, rings: 5, earnings: 8_420_000, hue: 210 },
  { id: 'pl-2', name: 'Yuna Kagami', country: 'Japan', flag: '🇯🇵', bracelets: 2, rings: 1, earnings: 5_130_000, hue: 330 },
  { id: 'pl-3', name: 'Diego Albarrán', country: 'Mexico', flag: '🇲🇽', bracelets: 1, rings: 7, earnings: 3_960_000, hue: 140 },
  { id: 'pl-4', name: 'Seo-yeon Han', country: 'South Korea', flag: '🇰🇷', bracelets: 2, rings: 2, earnings: 6_270_000, hue: 270 },
  { id: 'pl-5', name: 'Callum Breck', country: 'United Kingdom', flag: '🇬🇧', bracelets: 0, rings: 4, earnings: 1_480_000, hue: 20 },
  { id: 'pl-6', name: 'Ines Duarte-Lindqvist', country: 'Portugal', flag: '🇵🇹', bracelets: 1, rings: 0, earnings: 2_210_000, hue: 170 },
  { id: 'pl-7', name: 'Noah Whitfield', country: 'United States', flag: '🇺🇸', bracelets: 4, rings: 9, earnings: 11_900_000, hue: 0 },
  { id: 'pl-8', name: 'Arash Teymouri', country: 'Canada', flag: '🇨🇦', bracelets: 0, rings: 2, earnings: 690_000, hue: 50 },
  { id: 'pl-9', name: 'Lucía Ferrante', country: 'Argentina', flag: '🇦🇷', bracelets: 1, rings: 3, earnings: 2_840_000, hue: 190 },
];

export const vods: Vod[] = [
  // replays created from ended broadcasts
  { id: 'v-01', title: 'Main Event Day 1B — Full Replay', type: 'Full Replay', seriesId: 'ser-paradise', eventId: 'ev-p13', tier: 'basic', durationSec: 21_600, views: 48_200, publishedAt: at(-20), playerIds: ['pl-1', 'pl-4', 'pl-7'], description: 'Six hours from the Day 1B feature table.', scheduleId: 'sc-01' },
  { id: 'v-02', title: 'High Roller Day 2 — Full Replay', type: 'Full Replay', seriesId: 'ser-paradise', eventId: 'ev-p10', tier: 'premium', durationSec: 18_000, views: 21_900, publishedAt: at(-20), playerIds: ['pl-2', 'pl-7'], description: 'The bubble and the race to the final table.', scheduleId: 'sc-02' },
  { id: 'v-03', title: 'Mystery Bounty Final Table — Full Replay', type: 'Full Replay', seriesId: 'ser-paradise', eventId: 'ev-p8', tier: 'basic', durationSec: 10_800, views: 9_300, publishedAt: at(-3.5), playerIds: ['pl-3', 'pl-5', 'pl-9'], description: 'Every mystery envelope opened at the final table.', scheduleId: 'sc-03' },
  { id: 'v-04', title: 'PLO Final Table (Español) — Full Replay', type: 'Full Replay', seriesId: 'ser-paradise', eventId: 'ev-p11', tier: 'basic', durationSec: 10_800, views: 4_100, publishedAt: at(-2.5), playerIds: ['pl-3', 'pl-9'], description: 'Spanish-language commentary of the PLO final.', scheduleId: 'sc-04' },
  { id: 'v-05', title: 'Paradise Daily — Day 1B Recap', type: 'Highlight', seriesId: 'ser-paradise', eventId: 'ev-p13', tier: 'free', durationSec: 1_440, views: 61_000, publishedAt: at(-3.8), playerIds: ['pl-1', 'pl-6'], description: 'The day in 24 minutes.', scheduleId: 'sc-05' },
  // highlights / clips / hands / interviews
  { id: 'v-06', title: 'Quads vs Full House on Day 1A', type: 'Hand', seriesId: 'ser-paradise', eventId: 'ev-p13', tier: 'free', durationSec: 214, views: 132_000, publishedAt: at(-40), playerIds: ['pl-7', 'pl-5'], description: 'The cooler everyone is talking about.' },
  { id: 'v-07', title: 'Kagami’s River Hero Call', type: 'Hand', seriesId: 'ser-paradise', eventId: 'ev-p10', tier: 'basic', durationSec: 186, views: 88_400, publishedAt: at(-19), playerIds: ['pl-2', 'pl-1'], description: 'Third pair, all the chips.' },
  { id: 'v-08', title: 'High Roller Day 2 Highlights', type: 'Highlight', seriesId: 'ser-paradise', eventId: 'ev-p10', tier: 'free', durationSec: 912, views: 54_300, publishedAt: at(-18), playerIds: ['pl-2', 'pl-7', 'pl-4'], description: 'Best hands of the day.' },
  { id: 'v-09', title: 'Bounty Reveal at the Final Table', type: 'Clip', seriesId: 'ser-paradise', eventId: 'ev-p8', tier: 'free', durationSec: 96, views: 201_000, publishedAt: at(-3), playerIds: ['pl-5'], description: 'The top mystery prize is found.' },
  { id: 'v-10', title: 'Seo-yeon Han on Leading Day 1A', type: 'Interview', seriesId: 'ser-paradise', eventId: 'ev-p13', tier: 'free', durationSec: 340, views: 23_600, publishedAt: at(-30), playerIds: ['pl-4'], description: 'Post-day interview.' },
  { id: 'v-11', title: 'Main Event Day 1A — Full Replay', type: 'Full Replay', seriesId: 'ser-paradise', eventId: 'ev-p13', tier: 'premium', durationSec: 23_400, views: 39_800, publishedAt: at(-44), playerIds: ['pl-4', 'pl-7', 'pl-5'], description: 'Day 1A feature table.' },
  { id: 'v-12', title: 'This Week in Paradise', type: 'Highlight', seriesId: 'ser-paradise', tier: 'free', durationSec: 1_800, views: 77_000, publishedAt: at(-48), playerIds: ['pl-1', 'pl-2', 'pl-7'], description: 'Weekly round-up show.' },
  { id: 'v-13', title: 'Circuit LA Main Event — Final Table', type: 'Full Replay', seriesId: 'ser-la', eventId: 'ev-l10', tier: 'basic', durationSec: 25_200, views: 31_200, publishedAt: at(-24 * 34), playerIds: ['pl-3', 'pl-8'], description: 'Ring event final table.' },
  { id: 'v-14', title: 'Circuit LA High Roller — Winning Hand', type: 'Hand', seriesId: 'ser-la', eventId: 'ev-l12', tier: 'free', durationSec: 150, views: 18_900, publishedAt: at(-24 * 33), playerIds: ['pl-8'], description: 'Ring-clinching hand.' },
  { id: 'v-15', title: 'Las Vegas Main Event — Final Table', type: 'Full Replay', seriesId: 'ser-vegas', eventId: 'ev-v76', tier: 'premium', durationSec: 36_000, views: 410_000, publishedAt: at(-24 * 76), playerIds: ['pl-7', 'pl-1', 'pl-4', 'pl-6'], description: 'The biggest final table of the year.' },
  { id: 'v-16', title: 'Players Championship — Heads-up', type: 'Clip', seriesId: 'ser-vegas', eventId: 'ev-v45', tier: 'basic', durationSec: 1_260, views: 96_000, publishedAt: at(-24 * 95), playerIds: ['pl-2', 'pl-7'], description: 'Mixed-game heads-up for the bracelet.' },
  { id: 'v-17', title: 'Whitfield: “Four bracelets, one goal”', type: 'Interview', seriesId: 'ser-vegas', eventId: 'ev-v76', tier: 'free', durationSec: 420, views: 64_000, publishedAt: at(-24 * 75), playerIds: ['pl-7'], description: 'Champion interview.' },
  { id: 'v-18', title: 'Las Vegas 2026 — Top 10 Hands', type: 'Highlight', seriesId: 'ser-vegas', tier: 'basic', durationSec: 1_380, views: 152_000, publishedAt: at(-24 * 70), playerIds: ['pl-1', 'pl-2', 'pl-3', 'pl-7'], description: 'Countdown of the summer’s best hands.' },
  // shorts (9:16)
  { id: 'v-19', title: 'The fold of the year?', type: 'Shorts', seriesId: 'ser-paradise', eventId: 'ev-p13', tier: 'free', durationSec: 42, views: 512_000, publishedAt: at(-6), playerIds: ['pl-5'], description: '' },
  { id: 'v-20', title: 'Final table bounty moment', type: 'Shorts', seriesId: 'ser-paradise', eventId: 'ev-p8', tier: 'free', durationSec: 31, views: 388_000, publishedAt: at(-3), playerIds: ['pl-5'], description: '' },
  { id: 'v-21', title: 'Rail goes wild', type: 'Shorts', seriesId: 'ser-paradise', eventId: 'ev-p10', tier: 'free', durationSec: 27, views: 140_000, publishedAt: at(-18), playerIds: ['pl-2'], description: '' },
  { id: 'v-22', title: 'Day 2 in 30 seconds', type: 'Shorts', seriesId: 'ser-paradise', eventId: 'ev-p13', tier: 'free', durationSec: 30, views: 92_000, publishedAt: at(-22), playerIds: [], description: '' },
  { id: 'v-23', title: 'Bracelet ceremony', type: 'Shorts', seriesId: 'ser-vegas', eventId: 'ev-v76', tier: 'free', durationSec: 45, views: 260_000, publishedAt: at(-24 * 76), playerIds: ['pl-7'], description: '' },
  { id: 'v-24', title: 'Premium cam: player view', type: 'Shorts', seriesId: 'ser-paradise', eventId: 'ev-p13', tier: 'premium', durationSec: 58, views: 33_000, publishedAt: at(-8), playerIds: ['pl-1'], description: '' },
];

export const vodById = (id?: string) => vods.find((x) => x.id === id);
export const playerById = (id?: string) => players.find((x) => x.id === id);

export const popularSearches = ['Main Event', 'Mystery Bounty', 'Seo-yeon Han', 'Final Table', 'Paradise'];

/** Mock key-moment metadata for long-form videos. */
export function keyMoments(v: Vod): { t: number; label: string; tag: string }[] {
  if (v.type !== 'Full Replay' && v.type !== 'Highlight') return [];
  const names = v.playerIds.map((id) => playerById(id)?.name).filter((n): n is string => !!n);
  const t = (f: number) => Math.round(v.durationSec * f);
  return [
    { t: t(0.03), label: 'Broadcast opens · table introductions', tag: 'Table' },
    { t: t(0.21), label: names[0] ? `Player spotlight · ${names[0]}` : 'Player spotlight', tag: 'Player' },
    { t: t(0.47), label: 'Key hand of the day', tag: 'Hand' },
    { t: t(0.7), label: names[1] ? `Turning point · ${names[1]}` : 'Turning point', tag: 'Key moment' },
    { t: t(0.92), label: 'Closing moments & interview', tag: 'Interview' },
  ];
}
