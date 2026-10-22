// The one app context: demo settings, member state, reminders, watchlist, watch history, home config, sheets, toasts.
// Memory only, like the web demo: a restart resets the demo.
import { router, type Href } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { continueSeed, DEFAULT_HOME_CONFIG, type HomeConfig, type Mode } from '@/data/home';
import type { ContinueItem, Member, MyListItem, MyListKind, Tier } from '@/data/types';
import { hapticLight } from '@/lib/haptics';
import { fetchHomeConfig, type HomeConfigResult } from '@/lib/homeConfig';
import { notificationsSupported, REMINDER_DELAY_SECONDS, scheduleLiveNow } from '@/lib/notifications';
import type { DisplayTz } from '@/lib/time';

export type Sheet =
  | { kind: 'login'; reason: string; then?: () => void }
  | { kind: 'paywall'; tier: Tier; title: string }
  | { kind: 'demo' };

export interface Toast {
  id: number;
  text: string;
  action?: { label: string; onPress: () => void };
}

export interface HomeConfigState {
  config: HomeConfig;
  source: 'remote' | 'default';
  loading: boolean;
  fetchedAt: number | null;
  error?: string;
}

interface State {
  member: Member;
  mode: Mode;
  noLive: boolean;
  /** Demo clock shift while noLive is on (ms, negative). */
  clockOffset: number;
  tz: DisplayTz;
  /** Schedule ids and channel programme keys (`ch:<id>`) with a reminder. */
  alarms: string[];
  myList: MyListItem[];
  continueList: ContinueItem[];
  recentSearches: string[];
  push: boolean;
  nightPush: boolean;
}

const INITIAL: State = {
  member: 'guest',
  mode: 'season',
  noLive: false,
  clockOffset: 0,
  tz: 'Asia/Seoul',
  alarms: ['sc-13'],
  myList: [
    { kind: 'vod', id: 'v-01', addedAt: Date.now() - 3_600_000 },
    { kind: 'player', id: 'pl-4', addedAt: Date.now() - 7_200_000 },
  ],
  continueList: continueSeed,
  recentSearches: ['Main Event', 'Han'],
  push: true,
  nightPush: false,
};

/** What a reminder needs to schedule the "Live now" notification. */
export interface ReminderTarget {
  key: string;
  title: string;
  /** Route the notification opens. */
  path: string;
}

interface Api extends State {
  set: (patch: Partial<State> | ((s: State) => Partial<State>)) => void;
  home: HomeConfigState;
  refreshHome: () => Promise<void>;
  sheet: Sheet | null;
  openSheet: (s: Sheet) => void;
  closeSheet: () => void;
  toasts: Toast[];
  toast: (text: string, action?: Toast['action']) => void;
  /** Toggles a reminder; turning one on schedules the demo notification. Guests are asked to log in first. */
  toggleReminder: (t: ReminderTarget) => void;
  toggleMyList: (kind: MyListKind, id: string) => boolean;
  inMyList: (kind: MyListKind, id: string) => boolean;
  removeContinue: (vodId: string) => void;
  /** Records watch progress (Continue Watching). */
  recordProgress: (vodId: string, progress: number) => void;
}

const Ctx = createContext<Api | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(INITIAL);
  const [home, setHome] = useState<HomeConfigState>({ config: DEFAULT_HOME_CONFIG, source: 'default', loading: true, fetchedAt: null });
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  const set = useCallback<Api['set']>((patch) => setState((s) => ({ ...s, ...(typeof patch === 'function' ? patch(s) : patch) })), []);

  const toast = useCallback<Api['toast']>((text, action) => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, text, action }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), action ? 6000 : 2800);
  }, []);

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

  const toggleMyList = useCallback(
    (kind: MyListKind, id: string) => {
      const has = state.myList.some((x) => x.kind === kind && x.id === id);
      setState((s) => ({ ...s, myList: has ? s.myList.filter((x) => !(x.kind === kind && x.id === id)) : [{ kind, id, addedAt: Date.now() }, ...s.myList] }));
      return !has;
    },
    [state.myList],
  );

  const toggleReminder = useCallback(
    (t: ReminderTarget) => {
      const on = state.alarms.includes(t.key);
      const apply = () => {
        setState((x) => ({ ...x, alarms: on ? x.alarms.filter((a) => a !== t.key) : [...x.alarms, t.key] }));
        hapticLight();
        if (on) return toast('Reminder removed');
        if (notificationsSupported) {
          scheduleLiveNow(t.title, t.path)
            .then((ok) => toast(ok ? `Reminder set · “Live now” alert in ${REMINDER_DELAY_SECONDS}s (demo)` : 'Reminder set · notifications are off for WSOP TV'))
            .catch(() => toast('Reminder set'));
        } else {
          toast(`Reminder set · “Live now” in ${REMINDER_DELAY_SECONDS}s (demo)`);
          // Web has no local notifications: the same alert arrives as an in-app toast.
          setTimeout(() => toast(`Live now · ${t.title}`, { label: 'Watch', onPress: () => router.push(t.path as Href) }), REMINDER_DELAY_SECONDS * 1000);
        }
      };
      if (state.member === 'guest') {
        setSheet({ kind: 'login', reason: 'Log in to get a reminder when this broadcast starts.', then: apply });
        return;
      }
      apply();
    },
    [state.alarms, state.member, toast],
  );

  const api = useMemo<Api>(
    () => ({
      ...state,
      set,
      home,
      refreshHome,
      sheet,
      openSheet: setSheet,
      closeSheet: () => setSheet(null),
      toasts,
      toast,
      toggleReminder,
      toggleMyList,
      inMyList: (kind, id) => state.myList.some((x) => x.kind === kind && x.id === id),
      removeContinue: (vodId) => set((s) => ({ continueList: s.continueList.filter((c) => c.vodId !== vodId) })),
      recordProgress: (vodId, progress) =>
        set((s) => ({ continueList: [{ vodId, progress }, ...s.continueList.filter((c) => c.vodId !== vodId)] })),
    }),
    [state, set, home, refreshHome, sheet, toasts, toast, toggleReminder, toggleMyList],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('AppProvider missing');
  return ctx;
}

/** Re-renders every `ms` and returns the demo clock (honours "No live broadcasts"). */
export function useNow(ms = 1000) {
  const { noLive, clockOffset } = useApp();
  const [real, setReal] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setReal(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return noLive ? real + clockOffset : real;
}
