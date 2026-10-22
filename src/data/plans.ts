// EXAMPLE POLICY — not final (web demo plans.ts). Joining and billing happen in WSOP+; the app only reads the tier.
import type { Member, Tier } from './types';

export const PLAN_ORDER: Tier[] = ['free', 'basic', 'premium'];

export const TIER_LABEL: Record<Tier, string> = { free: 'Free', basic: 'Basic', premium: 'Premium' };
export const MEMBER_LABEL: Record<Member, string> = { guest: 'Not signed in', free: 'WSOP+ Free', basic: 'WSOP+ Basic', premium: 'WSOP+ Premium' };

export const PLANS: Record<Tier, { name: string; tagline: string; highlights: string[]; price: string }> = {
  free: { name: 'Free', tagline: 'Start watching', highlights: ['Free content only', 'Ads shown', 'Up to 720p'], price: '$0' },
  basic: { name: 'Basic', tagline: 'Feature tables', highlights: ['Up to Basic content', 'Pre-roll ads only', 'Up to 1080p'], price: 'TBD' },
  premium: { name: 'Premium', tagline: 'Every table, every final', highlights: ['All content', 'No ads', '1080p and above'], price: 'TBD' },
};

export const PLAN_ROWS: { label: string; values: Record<Tier, string> }[] = [
  { label: 'Content', values: { free: 'Free content only', basic: 'Up to Basic content', premium: 'All content' } },
  { label: 'Ads', values: { free: 'Ads shown', basic: 'Pre-roll only', premium: 'No ads' } },
  { label: 'Max quality', values: { free: '720p', basic: '1080p', premium: '1080p+' } },
  { label: 'Price', values: { free: '$0', basic: 'TBD', premium: 'TBD' } },
];
