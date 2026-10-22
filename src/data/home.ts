// Home content (web demo mock): banners, strip banners, notices, curations, and the built-in home layouts.
import { hoursFrom } from '@/lib/time';

import { T0 } from './schedules';
import type { Banner, ContinueItem, Curation, Member, Notice, StripBanner } from './types';

const at = (h: number) => hoursFrom(T0, h);

export const curations: Curation[] = [
  { id: 'cu-1', title: 'Main Event Replay', vodIds: ['v-01', 'v-11', 'v-05', 'v-06', 'v-10'] },
  { id: 'cu-2', title: 'This Week’s Highlights', vodIds: ['v-12', 'v-08', 'v-09', 'v-07', 'v-03'] },
  { id: 'cu-3', title: 'Relive Las Vegas 2026', vodIds: ['v-15', 'v-18', 'v-16', 'v-17'] },
];

export const ALL_MEMBERS: Member[] = ['guest', 'free', 'basic', 'premium'];
const SIGNED_IN: Member[] = ['free', 'basic', 'premium'];

export const banners: Banner[] = [
  { id: 'bn-1', title: 'Main Event Day 2 is LIVE', subtitle: '2026 WSOP Paradise · Feature Table', cta: 'Watch now', audiences: ALL_MEMBERS, link: { name: 'live', id: 'sc-06' }, hue: 200 },
  { id: 'bn-2', title: 'Go Premium', subtitle: 'Every feature table, ad-free, 1080p+', cta: 'See plans', audiences: ['free'], link: { name: 'paywall' }, hue: 45 },
  { id: 'bn-3', title: 'Day 1B Full Replay', subtitle: 'Catch up before Day 3', cta: 'Watch replay', audiences: ALL_MEMBERS, link: { name: 'vod', id: 'v-01' }, hue: 260 },
  { id: 'bn-4', title: 'Super Circuit Cyprus', subtitle: 'Coming soon · Merit Royal Diamond', cta: 'View schedule', audiences: ALL_MEMBERS, link: { name: 'series', id: 'ser-cyprus' }, hue: 290 },
];

export const stripBanners: StripBanner[] = [
  { id: 'st-guest', audience: 'guest', title: 'Create a free account to follow every table', cta: 'Log in', link: { name: 'tab', tab: 'my' } },
  { id: 'st-free', audience: 'free', title: 'Basic: feature tables in 1080p, fewer ads', cta: 'Upgrade', link: { name: 'paywall' } },
  { id: 'st-basic', audience: 'basic', title: 'Premium unlocks every final table, ad-free', cta: 'Go Premium', link: { name: 'paywall' } },
  { id: 'st-premium', audience: 'premium', title: 'Premium perk: hole-card cam on Main Event Day 3', cta: 'Set reminder', link: { name: 'tab', tab: 'schedule' } },
];

export const notices: Notice[] = [
  {
    id: 'nt-1',
    type: 'Event',
    pinned: true,
    title: 'Main Event Day 2 stream starts 30 min earlier',
    date: at(-10),
    body: 'Due to the field size, Main Event Day 2 coverage on the Feature Table starts 30 minutes earlier than announced. All times in the app are already updated to your time zone.',
    link: { label: 'Open schedule', to: { name: 'tab', tab: 'schedule' } },
  },
  {
    id: 'nt-2',
    type: 'Service',
    title: 'New: Spanish commentary on Feature Table',
    date: at(-50),
    body: 'Spanish commentary is now available on the Feature Table. Switch language from the player with “Switch broadcast”.',
  },
  {
    id: 'nt-3',
    type: 'Maintenance',
    title: 'Scheduled maintenance this Sunday 03:00–05:00 KST',
    date: at(-120),
    body: 'WSOP TV will be unavailable during scheduled maintenance. Live and VOD playback will resume automatically afterwards.',
    attachment: 'maintenance-notice.pdf',
  },
  {
    id: 'nt-4',
    type: 'Service',
    title: 'Premium members: 1080p60 on every final table',
    date: at(-30),
    body: 'Final tables are now streamed in 1080p60 for Premium members on supported devices.',
    audiences: ['premium'],
  },
];

/** Notices a member can see: tier notices only for that tier, pinned first, then newest. */
export const visibleNotices = (member: Member) =>
  notices
    .filter((n) => !n.audiences?.length || n.audiences.includes(member))
    .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.date.localeCompare(a.date));

/** Continue-watching seed. 90%+ watched counts as finished and is hidden. */
export const continueSeed: ContinueItem[] = [
  { vodId: 'v-01', progress: 0.42 },
  { vodId: 'v-08', progress: 0.77 },
  { vodId: 'v-15', progress: 0.12 },
  { vodId: 'v-02', progress: 0.95 },
];

// ---- home layout ---------------------------------------------------------------------------

/** Section types understood by the app (see docs/home-config.md). Unknown types in a remote config are skipped. */
export const SECTION_TYPES = [
  'mainBanner',
  'liveNow',
  'todaySchedule',
  'exclusive',
  'tournaments',
  'stripBanner',
  'curatedVod',
  'popularVod',
  'continueWatching',
  'players',
  'notice',
  'plans',
] as const;
export type SectionType = (typeof SECTION_TYPES)[number];

export interface HomeSection {
  type: SectionType;
  visible: boolean;
  /** Overrides the section heading. */
  title?: string;
  /** Who sees the section. Missing = everyone. */
  audience?: Member[];
  /** curatedVod: which curation to show (defaults to the one whose title matches, else the first). */
  curationId?: string;
  /** liveNow: with zero live broadcasts, show a countdown to the next one or hide the section. */
  emptyMode?: 'countdown' | 'hide';
  /** liveNow: show concurrent viewers on cards. */
  showViewers?: boolean;
}

export type Mode = 'season' | 'offseason';

export interface HomeConfig {
  version: number;
  updatedAt?: string;
  /** Mode the operator recommends. The demo's Season / Off-season setting picks the layout actually shown. */
  mode: Mode;
  layouts: Record<Mode, HomeSection[]>;
}

/** Built-in default: the web demo's season / off-season layouts. Used until (or when) the remote config fails. */
export const DEFAULT_HOME_CONFIG: HomeConfig = {
  version: 1,
  mode: 'season',
  layouts: {
    season: [
      { type: 'mainBanner', visible: true },
      { type: 'liveNow', visible: true, emptyMode: 'countdown', showViewers: true },
      { type: 'todaySchedule', visible: true },
      { type: 'exclusive', visible: true },
      { type: 'tournaments', visible: true },
      { type: 'stripBanner', visible: true },
      { type: 'curatedVod', visible: true, curationId: 'cu-1' },
      { type: 'curatedVod', visible: true, curationId: 'cu-2' },
      { type: 'popularVod', visible: true },
      { type: 'continueWatching', visible: true, audience: SIGNED_IN },
      { type: 'players', visible: true },
      { type: 'notice', visible: true },
      { type: 'plans', visible: false, audience: ['guest', 'free', 'basic'] },
    ],
    offseason: [
      { type: 'mainBanner', visible: true },
      { type: 'exclusive', visible: true },
      { type: 'curatedVod', visible: true, curationId: 'cu-1' },
      { type: 'curatedVod', visible: true, curationId: 'cu-2' },
      { type: 'popularVod', visible: true },
      { type: 'continueWatching', visible: true, audience: SIGNED_IN },
      { type: 'todaySchedule', visible: true },
      { type: 'tournaments', visible: true },
      { type: 'stripBanner', visible: true },
      { type: 'players', visible: true },
      { type: 'notice', visible: true },
      { type: 'liveNow', visible: false, emptyMode: 'hide', showViewers: true },
      { type: 'plans', visible: false, audience: ['guest', 'free', 'basic'] },
    ],
  },
};
