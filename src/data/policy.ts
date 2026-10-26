// Values that are NOT decided yet (web demo v2 data/policy.ts) — WSOP+ tier names and prices, which tier includes
// WSOP TV, what each tier can watch, completion threshold, grace period. Kept in one place so they're easy to swap.
import type { Access } from './types';

/** Content requirement / member level. `free` = no sign-in · `wsopFree` = any GGPass account (WSOP+ Free is automatic). */
export type Tier = 'free' | 'wsopFree' | 'basic' | 'premium';
export type PaidTier = 'basic' | 'premium';
export const TIER_RANK: Record<Tier, number> = { free: 0, wsopFree: 1, basic: 2, premium: 3 };
export const atLeast = (have: Tier, need: Tier) => TIER_RANK[have] >= TIER_RANK[need];

export const TIER_BADGE: Record<Tier, string> = { free: 'Free', wsopFree: 'WSOP+ Free', basic: 'Basic', premium: 'Premium' };
export const TIER_NAME: Record<Exclude<Tier, 'free'>, string> = { wsopFree: 'Free', basic: 'Basic', premium: 'Premium' };
export const tierFull = (t: Exclude<Tier, 'free'>) => `WSOP+ ${TIER_NAME[t]}`;

export const MEMBERSHIP_PRICES: Record<Exclude<Tier, 'free'>, { monthly: string; annual: string }> = {
  wsopFree: { monthly: '$0', annual: '$0' },
  basic: { monthly: '$9.99', annual: '$99.99' },
  premium: { monthly: '$49.99', annual: '$499.99' },
};

/** Which WSOP+ tier includes WSOP TV's paid content (decision pending — switch in Demo Settings). */
export type IncludedFrom = 'basic' | 'premium' | 'split';
export const INCLUDED_FROM_LABEL: Record<IncludedFrom, string> = { basic: 'Basic', premium: 'Premium', split: 'Split (example)' };

/** Tier a piece of content needs. Split: live/delayed broadcasts need Premium; replays, archive and paid clips need Basic. */
export function requiredTier(access: Access, includedFrom: IncludedFrom, live = false): Tier {
  if (access === 'free') return 'free';
  if (access === 'signin') return 'wsopFree';
  if (includedFrom === 'split') return live ? 'premium' : 'basic';
  return includedFrom;
}

/** What each tier gets on WSOP TV, derived from the setting above (for the plan comparison). */
export function tvCoverage(tier: Exclude<Tier, 'free'>, includedFrom: IncludedFrom): string[] {
  if (tier === 'wsopFree') return ['Free highlight clips', 'Selected classics, replays and hands', 'Follow players, reminders, My List'];
  const all = ['Every live table, incl. delayed final tables', 'Full archive of replays', 'Hand-by-hand replays and clips', 'Basic & Pro data overlays, multiview'];
  if (tier === 'premium') return all;
  if (includedFrom === 'basic') return all;
  if (includedFrom === 'split') return ['Full archive of replays', 'Hand-by-hand replays and clips', 'Live tables need Premium'];
  return ['Same WSOP TV access as WSOP+ Free'];
}

/**
 * Presentation build (CEO report), same as the web demo v2: clean artwork, no broadcast-fault feeds
 * (late / interrupted / failing), no planning annotations (Placeholder, Sample, store-policy notes), and no visible
 * Demo Settings entry (long-press the WSOP TV wordmark). Set to false to bring the full planning demo back.
 */
export const PRESENTATION = true;

export const NEXT_PAYMENT_DAYS = 30;
/** Watched share after which a broadcast leaves Continue Watching. */
export const COMPLETE_THRESHOLD = 0.95;
export const GRACE_DAYS = 7;
/** Replay availability window after a broadcast is published, in days. */
export const CATCH_UP_DAYS = 180;
/** Max simultaneous streams per account (assumed policy). */
export const MAX_STREAMS = 2;
/** App-only: seconds of preview before the WSOP+ prompt when a signed-in viewer's tier is too low. */
export const PREVIEW_SECONDS = 10;

export const daysFromNow = (n: number) => Date.now() + n * 86_400_000;

/** Traveling-abroad demo: the viewer's current country, and the events whose rights may not cover it. */
export const TRAVEL_COUNTRY = 'Japan';
export const TRAVEL_UNAVAILABLE_EVENTS = ['lv-hr', 'lv-ladies'];
