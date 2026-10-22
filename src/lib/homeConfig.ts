// Remote home configuration: section order and visibility, read at app start and on pull-to-refresh.
// Schema: docs/home-config.md. Anything invalid falls back to the built-in default.
import { DEFAULT_HOME_CONFIG, SECTION_TYPES, type HomeConfig, type HomeSection, type Mode, type SectionType } from '@/data/home';
import type { Member } from '@/data/types';

export const HOME_CONFIG_URL = process.env.EXPO_PUBLIC_HOME_CONFIG_URL;

const MEMBERS: Member[] = ['guest', 'free', 'basic', 'premium'];
/** Older audience names (first draft of home-config.json) mapped to member states. */
const AUDIENCE_ALIASES: Record<string, Member[]> = {
  member: ['free'],
  subscriber: ['basic', 'premium'],
  signedIn: ['free', 'basic', 'premium'],
};

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

function parseAudience(x: unknown): Member[] | undefined {
  if (!Array.isArray(x)) return undefined;
  const out = new Set<Member>();
  for (const a of x) {
    if (typeof a !== 'string') continue;
    if ((MEMBERS as string[]).includes(a)) out.add(a as Member);
    AUDIENCE_ALIASES[a]?.forEach((m) => out.add(m));
  }
  return [...out];
}

function parseSection(x: unknown): HomeSection | null {
  if (!isObj(x) || typeof x.type !== 'string' || !(SECTION_TYPES as readonly string[]).includes(x.type)) return null;
  return {
    type: x.type as SectionType,
    visible: x.visible !== false,
    title: typeof x.title === 'string' && x.title.trim() ? x.title : undefined,
    audience: parseAudience(x.audience),
    curationId: typeof x.curationId === 'string' ? x.curationId : undefined,
    emptyMode: x.emptyMode === 'hide' || x.emptyMode === 'countdown' ? x.emptyMode : undefined,
    showViewers: typeof x.showViewers === 'boolean' ? x.showViewers : undefined,
  };
}

/** Validates a config document. Unknown section types are dropped; a layout with no valid section keeps the default. */
export function parseHomeConfig(json: unknown): HomeConfig | null {
  if (!isObj(json) || !isObj(json.layouts)) return null;
  const layouts = {} as Record<Mode, HomeSection[]>;
  for (const mode of ['season', 'offseason'] as Mode[]) {
    const raw = json.layouts[mode];
    const parsed = Array.isArray(raw) ? raw.map(parseSection).filter((s): s is HomeSection => !!s) : [];
    layouts[mode] = parsed.length ? parsed : DEFAULT_HOME_CONFIG.layouts[mode];
  }
  return {
    version: typeof json.version === 'number' ? json.version : 1,
    updatedAt: typeof json.updatedAt === 'string' ? json.updatedAt : undefined,
    mode: json.mode === 'offseason' ? 'offseason' : 'season',
    layouts,
  };
}

export type HomeConfigResult = { config: HomeConfig; source: 'remote' } | { config: HomeConfig; source: 'default'; error: string };

const TIMEOUT_MS = 6000;

export async function fetchHomeConfig(): Promise<HomeConfigResult> {
  if (!HOME_CONFIG_URL) return { config: DEFAULT_HOME_CONFIG, source: 'default', error: 'EXPO_PUBLIC_HOME_CONFIG_URL is not set' };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    // Cache-buster so an edited file shows up on the next refresh even behind a CDN.
    const sep = HOME_CONFIG_URL.includes('?') ? '&' : '?';
    const res = await fetch(`${HOME_CONFIG_URL}${sep}t=${Date.now()}`, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const config = parseHomeConfig(await res.json());
    if (!config) throw new Error('Invalid home config');
    return { config, source: 'remote' };
  } catch (e) {
    return { config: DEFAULT_HOME_CONFIG, source: 'default', error: e instanceof Error ? e.message : String(e) };
  } finally {
    clearTimeout(timer);
  }
}
