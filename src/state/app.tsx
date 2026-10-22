// Global demo state (web demo v2 state/app.tsx) plus the app-only parts: Demo Settings, remote home config,
// sheets, toasts and reminder notifications. Memory only, like the web demo: a restart resets the demo.
import { router, type Href } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { DEFAULT_HOME_CONFIG, type HomeConfig, type Mode } from '@/data/home';
import { HERO_DAY_ID } from '@/data/mock';
import { atLeast, requiredTier, type IncludedFrom, type PaidTier, type Tier } from '@/data/policy';
import type { Access, AccountScenario, AudioTrack, Day, OverlayLevel, StreamStatus } from '@/data/types';
import { isBroadcasting } from '@/lib/broadcast';
import { hapticLight } from '@/lib/haptics';
import { fetchHomeConfig, type HomeConfigResult } from '@/lib/homeConfig';
import { notificationsSupported, REMINDER_DELAY_SECONDS, scheduleLiveNow } from '@/lib/notifications';
import { deviceTz } from '@/lib/time';

export interface Device {
  id: string;
  name: string;
  kind: 'web' | 'mobile' | 'tv';
  lastActive: string;
  current?: boolean;
  streaming?: boolean;
}

export type ListKind = 'event' | 'day' | 'archive' | 'hand';
export interface ListItem {
  kind: ListKind;
  id: string;
  addedAt: number;
}

export interface AppState {
  scenario: AccountScenario;
  /** Demo override for the hero broadcast (Main Event Final Table). */
  streamMode: Exclude<StreamStatus, 'upcoming'>;
  regionBlocked: boolean;
  vpnDetected: boolean;
  abroad: boolean;
  abroadDismissed: boolean;
  tz: string;
  spoilerFree: boolean;
  overlayDefault: OverlayLevel;
  audioDefault: AudioTrack;
  ccDefault: boolean;
  notifyLiveStart: boolean;
  notifyFollowed: boolean;
  followed: Record<string, { notify: boolean }>;
  reminders: string[];
  devices: Device[];
  /** Day id → seconds watched. */
  progress: Record<string, number>;
  paidTier: PaidTier;
  includedFrom: IncludedFrom;
  /** Mock of WSOP+'s own record: set when the WSOP+ page completes; WSOP TV re-reads it on return. */
  wsopPlusRecord: PaidTier | null;
  paymentResult: 'success' | 'fail' | 'cancel';
  revealed: string[];
  recentSearches: string[];
  myList: ListItem[];
  // ---- app-only Demo Settings ----
  /** Season / off-season home layout. */
  mode: Mode;
  /** No live broadcasts: everything on air is treated as ended. */
  noLive: boolean;
}

const INITIAL: AppState = {
  scenario: 'guest',
  streamMode: 'delayed',
  regionBlocked: false,
  vpnDetected: false,
  abroad: false,
  abroadDismissed: false,
  tz: deviceTz(),
  spoilerFree: false,
  overlayDefault: 'basic',
  audioDefault: 'en',
  ccDefault: false,
  notifyLiveStart: true,
  notifyFollowed: true,
  followed: { p04: { notify: true } },
  reminders: [],
  devices: [
    { id: 'd1', name: 'Pixel 8 (this device)', kind: 'mobile', lastActive: 'Active now', current: true },
    { id: 'd2', name: 'Chrome on macOS', kind: 'web', lastActive: '2 hours ago', streaming: true },
    { id: 'd3', name: 'Living Room Apple TV', kind: 'tv', lastActive: 'Yesterday', streaming: true },
    { id: 'd4', name: 'iPhone 15', kind: 'mobile', lastActive: '3 days ago' },
  ],
  progress: { 'lv-main-day3': 0.62 * 660 * 60, 'lv-mm-finaltable': 0.31 * 480 * 60, 'lv-main-day2': 0.88 * 660 * 60 },
  paidTier: 'basic',
  includedFrom: 'basic',
  wsopPlusRecord: null,
  paymentResult: 'success',
  revealed: [],
  recentSearches: ['Han', 'final table', 'bluff'],
  myList: [],
  mode: 'season',
  noLive: false,
};

export type Gate = 'ok' | 'login' | 'plans' | 'link' | 'restricted' | 'devices' | 'expired';

/** The viewer's WSOP+ level as WSOP TV reads it. A payment issue keeps the tier; an ended membership falls back to Free. */
export function memberTier(s: Pick<AppState, 'scenario' | 'paidTier'>): Tier {
  switch (s.scenario) {
    case 'guest':
    case 'restricted':
      return 'free';
    case 'free':
    case 'expired':
      return 'wsopFree';
    case 'basic':
    case 'premium':
      return s.scenario;
    default:
      return s.paidTier;
  }
}

/** The one access check: play when the member's tier ≥ the content's required tier (free < WSOP+ Free < Basic < Premium). */
export function gateForAccess(access: Access, s: Pick<AppState, 'scenario' | 'paidTier' | 'includedFrom'>, live = false): Gate {
  const need = requiredTier(access, s.includedFrom, live);
  if (need === 'free') return 'ok';
  if (s.scenario === 'guest') return 'login';
  if (s.scenario === 'restricted') return 'restricted';
  if (need === 'wsopFree') return 'ok';
  if (s.scenario === 'unlinked') return 'link';
  if (s.scenario === 'deviceLimit') return 'devices';
  if (s.scenario === 'expired') return 'expired';
  return atLeast(memberTier(s), need) ? 'ok' : 'plans';
}

export const canWatch = (access: Access, s: Pick<AppState, 'scenario' | 'paidTier' | 'includedFrom'>, live = false) => gateForAccess(access, s, live) === 'ok';

/** A day's status with the demo overrides: the hero broadcast follows Featured stream; No live ends everything on air. */
export function dayStatusOf(d: Pick<Day, 'id' | 'status'>, s: Pick<AppState, 'streamMode' | 'noLive'>): StreamStatus {
  const st = d.id === HERO_DAY_ID ? s.streamMode : d.status;
  return s.noLive && isBroadcasting(st) ? 'vod' : st;
}

export interface Toast {
  id: number;
  text: string;
  action?: { label: string; onPress: () => void };
}

export interface MenuAction {
  label: string;
  icon: 'plus' | 'close' | 'check';
  onSelect: () => void;
}

export type Sheet =
  | { kind: 'login'; reason: string }
  | { kind: 'plans'; required: Tier; title: string; returnTo: string }
  | { kind: 'menu'; title: string; actions: MenuAction[] }
  | { kind: 'demo' };

export interface HomeConfigState {
  config: HomeConfig;
  source: 'remote' | 'default';
  loading: boolean;
  fetchedAt: number | null;
  error?: string;
}

/** What a reminder needs to schedule the "Live now" notification. */
export interface ReminderTarget {
  key: string;
  title: string;
  /** Route the notification opens. */
  path: string;
  /** Toast shown when the reminder is set (web demo wording). */
  setText: string;
}

interface Api {
  state: AppState;
  set: (patch: Partial<AppState> | ((s: AppState) => Partial<AppState>)) => void;
  signedIn: boolean;
  isRevealed: (key: string) => boolean;
  reveal: (key: string) => void;
  status: (d: Pick<Day, 'id' | 'status'>) => StreamStatus;
  toasts: Toast[];
  toast: (text: string, action?: Toast['action']) => void;
  sheet: Sheet | null;
  openSheet: (s: Sheet) => void;
  closeSheet: () => void;
  /** Login prompt; `then` runs after the GGPASS round-trip (e.g. finish a My List save). */
  requireLogin: (reason: string, then?: () => void) => void;
  /** Called by the GGPASS mock when the viewer allows access. */
  completeLogin: () => void;
  toggleReminder: (t: ReminderTarget) => void;
  home: HomeConfigState;
  refreshHome: () => Promise<void>;
}

const Ctx = createContext<Api | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(INITIAL);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [home, setHome] = useState<HomeConfigState>({ config: DEFAULT_HOME_CONFIG, source: 'default', loading: true, fetchedAt: null });
  const toastId = useRef(0);
  const pendingLogin = useRef<(() => void) | null>(null);

  // Turning spoiler-free back on hides anything revealed earlier.
  const set = useCallback<Api['set']>(
    (patch) =>
      setState((s) => {
        const next = { ...s, ...(typeof patch === 'function' ? patch(s) : patch) };
        return next.spoilerFree && !s.spoilerFree ? { ...next, revealed: [] } : next;
      }),
    [],
  );

  const toast = useCallback<Api['toast']>((text, action) => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, text, action }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), action ? 6000 : 2800);
  }, []);

  const requireLogin = useCallback<Api['requireLogin']>((reason, then) => {
    pendingLogin.current = then ?? null;
    setSheet({ kind: 'login', reason });
  }, []);

  const completeLogin = useCallback(() => {
    // Every GGPass account comes with WSOP+ Free; paid tiers are joined in WSOP+.
    setState((s) => ({ ...s, scenario: s.scenario === 'guest' ? 'free' : s.scenario }));
    toast('Signed in with GGPASS');
    const then = pendingLogin.current;
    pendingLogin.current = null;
    then?.();
  }, [toast]);

  const applyHome = useCallback((r: HomeConfigResult) => {
    setHome((h) => {
      if (r.source === 'remote') return { config: r.config, source: 'remote', loading: false, fetchedAt: Date.now() };
      // A failed refresh keeps the last remote config this session; at start-up it means the built-in default.
      if (h.source === 'remote') return { ...h, loading: false, error: r.error };
      return { config: r.config, source: 'default', loading: false, fetchedAt: h.fetchedAt, error: r.error };
    });
  }, []);

  const refreshHome = useCallback(async () => {
    setHome((h) => ({ ...h, loading: true }));
    applyHome(await fetchHomeConfig());
  }, [applyHome]);

  // App start: read the remote home config once (state starts as loading).
  useEffect(() => {
    fetchHomeConfig().then(applyHome);
  }, [applyHome]);

  const signedIn = state.scenario !== 'guest';

  const toggleReminder = useCallback(
    (t: ReminderTarget) => {
      if (!signedIn) return requireLogin('Sign in to set reminders.');
      const on = state.reminders.includes(t.key);
      setState((s) => ({ ...s, reminders: on ? s.reminders.filter((r) => r !== t.key) : [...s.reminders, t.key] }));
      hapticLight();
      if (on) return toast('Reminder removed');
      toast(t.setText);
      // App-only demo: the "Live now" alert arrives 10 seconds later (local notification; an in-app toast on web).
      if (notificationsSupported) scheduleLiveNow(t.title, t.path).catch(() => {});
      else setTimeout(() => toast(`Live now · ${t.title}`, { label: 'Watch', onPress: () => router.push(t.path as Href) }), REMINDER_DELAY_SECONDS * 1000);
    },
    [signedIn, state.reminders, requireLogin, toast],
  );

  const api = useMemo<Api>(
    () => ({
      state,
      set,
      signedIn,
      isRevealed: (key) => !state.spoilerFree || state.revealed.includes(key),
      reveal: (key) => set((s) => ({ revealed: [...s.revealed, key] })),
      status: (d) => dayStatusOf(d, state),
      toasts,
      toast,
      sheet,
      openSheet: setSheet,
      closeSheet: () => setSheet(null),
      requireLogin,
      completeLogin,
      toggleReminder,
      home,
      refreshHome,
    }),
    [state, set, signedIn, toasts, toast, sheet, requireLogin, completeLogin, toggleReminder, home, refreshHome],
  );
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('AppProvider missing');
  return ctx;
}

/** Re-render every `ms` (countdowns and live clocks). */
export function useTick(ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}
