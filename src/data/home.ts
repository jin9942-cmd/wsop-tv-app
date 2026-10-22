// Home layout (web demo v2 pages/Home.tsx sections). The order and visibility come from the remote home config;
// this file holds the section types and the built-in default (same order as the web demo).
import type { AccountScenario } from './types';

export const SECTION_TYPES = [
  'billboard',
  'channels',
  'continueWatching',
  'myList',
  'comingUp',
  'freeHighlights',
  'followedPlayers',
  'featuredPlayers',
  'archive',
] as const;
export type SectionType = (typeof SECTION_TYPES)[number];

/** Who a section is for: guests, any signed-in account, or a WSOP+ level. */
export type Audience = 'guest' | 'signedIn' | 'wsopFree' | 'basic' | 'premium';

export interface HomeSection {
  type: SectionType;
  visible: boolean;
  /** Overrides the section heading. */
  title?: string;
  /** Who sees the section. Missing = everyone. */
  audience?: Audience[];
}

export type Mode = 'season' | 'offseason';

export interface HomeConfig {
  version: number;
  updatedAt?: string;
  /** Mode the operator recommends. The demo's Season / Off-season setting picks the layout actually shown. */
  mode: Mode;
  layouts: Record<Mode, HomeSection[]>;
}

export const DEFAULT_HOME_CONFIG: HomeConfig = {
  version: 3,
  mode: 'season',
  layouts: {
    // Web demo v2 order.
    season: [
      { type: 'billboard', visible: true },
      { type: 'channels', visible: true },
      { type: 'continueWatching', visible: true },
      { type: 'myList', visible: true },
      { type: 'comingUp', visible: true },
      { type: 'freeHighlights', visible: true },
      { type: 'followedPlayers', visible: true },
      { type: 'featuredPlayers', visible: true },
      { type: 'archive', visible: true },
    ],
    // Between series: replays and classics lead, live rows move down.
    offseason: [
      { type: 'billboard', visible: true },
      { type: 'archive', visible: true },
      { type: 'freeHighlights', visible: true },
      { type: 'continueWatching', visible: true },
      { type: 'myList', visible: true },
      { type: 'channels', visible: true },
      { type: 'featuredPlayers', visible: true },
      { type: 'comingUp', visible: true },
      { type: 'followedPlayers', visible: false },
    ],
  },
};

/** Does a section's audience include this viewer? */
export function audienceIncludes(audience: Audience[] | undefined, scenario: AccountScenario, tier: 'free' | 'wsopFree' | 'basic' | 'premium') {
  if (!audience?.length) return true;
  if (scenario === 'guest') return audience.includes('guest');
  if (audience.includes('signedIn')) return true;
  return tier !== 'free' && audience.includes(tier);
}
