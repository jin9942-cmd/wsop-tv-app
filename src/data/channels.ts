// Linear channels (web demo v2 data/channels.ts) — 24/7 programmed channels next to the tournament Live view.
// Live tournament coverage is slotted in while it's on air; the rest of the day is filled with a studio show,
// highlight shows, replays and classics, so a channel never goes dark.
// Access per programme: studio, highlight and classic programmes are free for everyone; live and replay programmes
// keep the tier of the broadcast / video they carry.
import { schedules, T0 } from './schedules';
import type { Schedule, Tier } from './types';
import { vodById } from './vods';

export type ProgramKind = 'live' | 'replay' | 'studio' | 'highlights' | 'classic';
/** `open` = free to watch without signing in. */
export type ProgramAccess = 'open' | Tier;

export interface LinearChannel {
  id: string;
  number: number;
  name: string;
  short: string;
  tagline: string;
  lang: 'EN' | 'ES';
  hue: number;
  /** Free 24/7 channel (FAST). */
  free?: boolean;
}

export interface Program {
  id: string;
  channelId: string;
  kind: ProgramKind;
  title: string;
  subtitle: string;
  /** ms epoch */
  start: number;
  end: number;
  access: ProgramAccess;
  /** Live programmes carry a broadcast. */
  scheduleId?: string;
  /** Replays and classics carry a video. */
  vodId?: string;
  /** Live coverage that was already running when the slot began. */
  joined?: boolean;
}

export const channels: LinearChannel[] = [
  { id: 'wsop1', number: 1, name: 'WSOP TV 1', short: 'WSOP 1', tagline: 'Main Event & feature tables · English', lang: 'EN', hue: 40 },
  { id: 'wsop2', number: 2, name: 'WSOP TV 2', short: 'WSOP 2', tagline: 'Final tables & side events · English', lang: 'EN', hue: 210 },
  { id: 'wsop-es', number: 3, name: 'WSOP Español', short: 'WSOP ES', tagline: 'Main Event en español', lang: 'ES', hue: 0 },
  { id: 'classics', number: 4, name: 'WSOP Classics', short: 'Classics', tagline: 'Final tables & best hands, 24/7 · free', lang: 'EN', hue: 150, free: true },
];

export const channelById = (id?: string) => channels.find((c) => c.id === id);

export const KIND_LABEL: Record<ProgramKind, string> = { live: 'Live', replay: 'Replay', studio: 'Studio', highlights: 'Highlights', classic: 'Classic' };

const M = 60_000;
const H = 60 * M;
const SLOT = 30 * M;
/** The guide covers 12 hours back and 36 hours ahead of app start. */
export const GUIDE_START = Math.floor((T0 - 12 * H) / SLOT) * SLOT;
export const GUIDE_END = GUIDE_START + 48 * H;

/** Output channels each linear channel carries live. Studio / highlight shows (CH-04) air on WSOP TV 1. */
const CARRIAGE: Record<string, Schedule['channelId'][]> = {
  wsop1: ['CH-01', 'CH-04'],
  wsop2: ['CH-03'],
  'wsop-es': ['CH-02'],
  classics: [],
};

type Filler = Omit<Program, 'id' | 'channelId' | 'start' | 'end'> & { min: number };

const replay = (vodId: string, min: number, title?: string, subtitle = 'Replay · edited for TV'): Filler => {
  const v = vodById(vodId)!;
  return { kind: 'replay', title: title ?? v.title.replace(' — Full Replay', ''), subtitle, access: v.tier, vodId, min };
};
const studio = (title: string, subtitle: string, min: number): Filler => ({ kind: 'studio', title, subtitle, access: 'open', min });
const highlights = (title: string, subtitle: string, min: number, vodId?: string): Filler => ({ kind: 'highlights', title, subtitle, access: 'open', vodId, min });
const classic = (vodId: string, min: number): Filler => {
  const v = vodById(vodId)!;
  return { kind: 'classic', title: v.title, subtitle: 'Classic · edited for TV', access: 'open', vodId, min };
};

const FILLERS: Record<string, Filler[]> = {
  wsop1: [
    studio('The Rail · Final Table Preview', 'Studio show · stacks, storylines and picks', 60),
    replay('v-01', 120, 'Main Event · Day 1B Encore'),
    highlights('Hand of the Day', 'The biggest pots of the last 24 hours', 30, 'v-06'),
    replay('v-11', 120),
    highlights('Bracelet Moments', 'Every winning hand of the week', 30, 'v-09'),
  ],
  wsop2: [
    replay('v-02', 120),
    highlights('High Roller Hands', 'Six-figure pots, cut down to the action', 30, 'v-08'),
    replay('v-03', 120),
    studio('The Rail · Side Event Recap', 'Studio show · results from every table', 60),
  ],
  'wsop-es': [
    studio('La Mesa · Previa de la mesa final', 'Programa de estudio en español', 60),
    replay('v-04', 120, 'PLO · Mesa final (repetición)', 'Repetición · comentarios en español'),
    highlights('Lo mejor del día', 'Las manos más grandes, en español', 30, 'v-12'),
  ],
  classics: [
    classic('v-15', 120),
    highlights('Greatest Bluffs', 'Ten of the boldest bluffs ever filmed', 30, 'v-18'),
    classic('v-13', 120),
    highlights('Bad Beat Hall of Fame', 'One-outers, runner-runners and the stories behind them', 30, 'v-14'),
    classic('v-16', 60),
  ],
};

function build(ch: LinearChannel): Program[] {
  const pool = FILLERS[ch.id];
  const out: Program[] = [];
  let cursor = GUIDE_START;
  let fi = ch.number * 2;
  let n = 0;
  const push = (p: Omit<Program, 'id' | 'channelId'>) => out.push({ ...p, id: `${ch.id}-${n++}`, channelId: ch.id });
  // Fill a gap with the channel's rotation; a leftover under 15 minutes is absorbed by the last programme.
  const fill = (to: number) => {
    const aligned = Math.ceil(cursor / SLOT) * SLOT;
    if (aligned > cursor && aligned <= to) {
      if (aligned - cursor >= 10 * M || !out.length)
        push({ kind: 'highlights', title: ch.lang === 'ES' ? 'A continuación' : 'Coming Up', subtitle: ch.lang === 'ES' ? 'Pausa corta · lo que viene en el canal' : "Short break · what's next on the channel", access: 'open', start: cursor, end: aligned });
      else out[out.length - 1].end = aligned;
      cursor = aligned;
    }
    while (cursor < to) {
      const { min, ...f } = pool[fi++ % pool.length];
      let end = Math.min(to, cursor + min * M);
      if (to - end < 15 * M) end = to;
      push({ ...f, start: cursor, end });
      cursor = end;
    }
  };
  const carried = schedules
    .filter((s) => CARRIAGE[ch.id].includes(s.channelId))
    .sort((a, b) => a.start.localeCompare(b.start));
  for (const s of carried) {
    const a = Date.parse(s.start);
    const b = Date.parse(s.end);
    if (b <= cursor || a >= GUIDE_END) continue;
    if (a > cursor) fill(a);
    const start = Math.max(cursor, a);
    const joined = start > a;
    const show = s.type === 'Highlight Show';
    push({
      kind: show ? 'highlights' : 'live',
      title: s.title,
      subtitle: show ? 'Highlight show' : ch.lang === 'ES' ? 'En directo · comentarios en español' : joined ? 'Live coverage · joined in progress' : 'Live coverage from the feature table',
      // Studio / highlight shows are free on the channel; live coverage keeps the broadcast's tier.
      access: show ? 'open' : s.tier,
      scheduleId: s.id,
      joined,
      start,
      end: b,
    });
    cursor = b;
  }
  fill(GUIDE_END);
  return out;
}

export const programs: Program[] = channels.flatMap(build);

export const programsFor = (channelId: string) => programs.filter((p) => p.channelId === channelId);
export const programAt = (channelId: string, at: number) => programsFor(channelId).find((p) => p.start <= at && at < p.end);
export const upNext = (channelId: string, at: number, n = 5) => programsFor(channelId).filter((p) => p.start > at).slice(0, n);
export const programById = (id?: string) => programs.find((p) => p.id === id);

/** Reminder key for a channel programme (kept with broadcast reminders). */
export const programReminderKey = (p: Program) => `ch:${p.id}`;
