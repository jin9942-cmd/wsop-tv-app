// Data model (web demo): Tour > Series > Event > Day(Flight) > Schedule(편성) → Live → VOD. Players ↔ VOD is N:M.

/** Content requirement: free = anyone signed in with GGPass, basic / premium = WSOP+ tier. */
export type Tier = 'free' | 'basic' | 'premium';
/** Viewer state: not signed in, or the WSOP+ tier of the GGPass account (Free comes with every account). */
export type Member = 'guest' | Tier;
export type TourId = 'BRACELETS' | 'SUPER CIRCUIT' | 'CIRCUIT';
export type Lang = 'EN' | 'ES' | 'PT';
export type BroadcastType = 'Feature Table' | 'Final Table' | 'Highlight Show';
export type VodType = 'Full Replay' | 'Highlight' | 'Clip' | 'Hand' | 'Interview' | 'Shorts';
export type ScheduleStatus = 'upcoming' | 'live' | 'ended';
export type SeriesPhase = 'ongoing' | 'upcoming' | 'ended';

export interface Series {
  id: string;
  tour: TourId;
  name: string;
  /** YYYY-MM-DD, series-local. */
  start: string;
  end: string;
  venue: string;
  city: string;
  timezone: string;
  hue: number;
}

export interface EventDay {
  id: string;
  label: 'Day 1A' | 'Day 1B' | 'Day 2' | 'Day 3' | 'Final Table';
  date: string;
}

export interface TourEvent {
  id: string;
  seriesId: string;
  number: number;
  name: string;
  buyIn: string;
  days: EventDay[];
}

export interface OutputChannel {
  id: 'CH-01' | 'CH-02' | 'CH-03' | 'CH-04';
  name: string;
}

/** 편성: one broadcast = time slot × output channel. */
export interface Schedule {
  id: string;
  title: string;
  seriesId: string;
  eventId: string;
  dayId: string;
  type: BroadcastType;
  channelId: OutputChannel['id'];
  lang: Lang;
  tier: Tier;
  start: string;
  end: string;
  /** Moved after publication → "Changed". */
  originalStart?: string;
  /** Replay created once the broadcast ends. */
  vodId?: string;
  baseViewers: number;
}

export interface Vod {
  id: string;
  title: string;
  type: VodType;
  seriesId: string;
  eventId?: string;
  tier: Tier;
  durationSec: number;
  views: number;
  publishedAt: string;
  playerIds: string[];
  description: string;
  scheduleId?: string;
}

export interface Player {
  id: string;
  name: string;
  country: string;
  flag: string;
  bracelets: number;
  rings: number;
  earnings: number;
  hue: number;
}

export type AppLink =
  | { name: 'tab'; tab: 'home' | 'live' | 'schedule' | 'vod' | 'my' }
  | { name: 'live'; id: string }
  | { name: 'vod'; id: string }
  | { name: 'series'; id: string }
  | { name: 'paywall' };

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  audiences: Member[];
  link: AppLink;
  hue: number;
}

export interface StripBanner {
  id: string;
  audience: Member;
  title: string;
  cta: string;
  link: AppLink;
}

export type NoticeType = 'Service' | 'Event' | 'Maintenance';
export interface Notice {
  id: string;
  type: NoticeType;
  title: string;
  date: string;
  pinned?: boolean;
  body: string;
  link?: { label: string; to: AppLink };
  attachment?: string;
  /** Tier notice: only these members see it. Empty = everyone. */
  audiences?: Member[];
}

export interface Curation {
  id: string;
  title: string;
  vodIds: string[];
}

/** Watchlist: videos, upcoming live broadcasts, players and tournaments. */
export type MyListKind = 'vod' | 'live' | 'player' | 'series';
export interface MyListItem {
  kind: MyListKind;
  id: string;
  addedAt: number;
}

export interface ContinueItem {
  vodId: string;
  progress: number;
}
