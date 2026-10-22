// Linear channel helpers (web demo v2 features/channels/Channels.tsx): programme media, per-programme access, tags,
// the Home "On the channels now" row and reminders.
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { airing, effectiveKind, KIND_LABEL, programAt, reminderKey, upNext, type Airing, type LinearChannel, type Program } from '@/data/channels';
import { dayById } from '@/data/mock';
import { TRAVEL_UNAVAILABLE_EVENTS } from '@/data/policy';
import { FOOTAGE, STANDBY_POSTER, tableVideo, thumbFor } from '@/lib/media';
import { fmtTime } from '@/lib/time';
import { canWatch, useApp, type AppState } from '@/state/app';
import { colors, radius } from '@/theme';

import { AccessBadge, Corner, Label, StatusBadge, text } from './ui';

/** Stills and footage for a programme (CC poker footage, not WSOP). */
export function mediaFor(p: Program): { poster: number; video: string; start: number } {
  if (p.dayId) {
    const v = tableVideo(0);
    return { poster: thumbFor(`prog:${p.id}`), video: v.url, start: v.start };
  }
  if (p.kind === 'classic') return { poster: thumbFor(`prog:${p.id}`), video: FOOTAGE.ft.url, start: 40 };
  if (p.kind === 'studio') return { poster: thumbFor(`prog:${p.id}`, 'people'), video: FOOTAGE.mtl.url, start: 20 };
  const f = p.seed % 2 ? FOOTAGE.int : FOOTAGE.deal;
  return { poster: thumbFor(`prog:${p.id}`, p.seed % 2 ? 'people' : 'hands'), video: f.url, start: 30 };
}

/** The channel airing with the demo overrides (Featured stream, No live broadcasts). */
export function airingNow(p: Program, s: Pick<AppState, 'streamMode' | 'noLive'>): Airing {
  const a = airing(p, s.streamMode);
  // No live broadcasts: live slots run as encores.
  return s.noLive && a.mode !== 'program' ? { mode: 'program' } : a;
}

/** Rights: programmes carrying event coverage are blacked out where the event has no rights. */
export const blackedOut = (p: Program, s: AppState) => {
  if (!p.dayId) return false;
  const ref = dayById(p.dayId)!;
  return s.regionBlocked || (s.abroad && TRAVEL_UNAVAILABLE_EVENTS.includes(ref.event.id));
};

/** Can this viewer play what's on the channel right now? (Standby highlights are free for everyone.) */
export function watchableNow(ch: LinearChannel, at: number, s: AppState) {
  const p = programAt(ch.id, at);
  if (!p) return false;
  const a = airingNow(p, s);
  if (a.mode === 'standby') return !s.vpnDetected;
  return !blackedOut(p, s) && !s.vpnDetected && canWatch(p.access, s, a.mode === 'onair');
}

/** What's airing: LIVE / DELAYED for live coverage, LATE START / INTERRUPTED while a channel stands by, else the kind. */
export function ProgramTag({ p, a, size = 'sm' }: { p: Program; a: Airing; size?: 'sm' | 'md' }) {
  if (a.mode === 'onair') return <StatusBadge status={a.status} delayMin={a.delayMin || 30} size={size} />;
  if (a.mode === 'standby') return <StatusBadge status={a.reason} size={size} />;
  const k = effectiveKind(p, a);
  const gold = k === 'classic' || k === 'studio';
  return (
    <Label color={gold ? colors.goldStrong : colors.muted} border={gold ? 'rgba(201,169,97,0.5)' : colors.lineStrong}>
      {(p.kind === 'live' ? 'Encore' : KIND_LABEL[k]).toUpperCase()}
    </Label>
  );
}

/** For programmes that haven't aired yet. */
export function FutureTag({ p }: { p: Program }) {
  if (p.kind === 'live')
    return (
      <Label color={colors.live} border="rgba(229,72,77,0.7)" bg="transparent">
        LIVE
      </Label>
    );
  const gold = p.kind === 'classic' || p.kind === 'studio';
  return (
    <Label color={gold ? colors.goldStrong : colors.muted} border={gold ? 'rgba(201,169,97,0.5)' : colors.lineStrong}>
      {KIND_LABEL[p.kind].toUpperCase()}
    </Label>
  );
}

export function useProgramReminder() {
  const { state, toggleReminder } = useApp();
  return {
    isOn: (p: Program) => state.reminders.includes(reminderKey(p)),
    toggle: (p: Program, ch: LinearChannel) =>
      toggleReminder({ key: reminderKey(p), title: `${ch.name} · ${p.title}`, path: `/live?tab=channels&channel=${ch.id}`, setText: `We'll remind you 15 minutes before · ${p.title} on ${ch.name}` }),
  };
}

/** Home: what's on one channel right now. */
export function HomeChannelCard({ ch, now }: { ch: LinearChannel; now: number }) {
  const { state } = useApp();
  const p = programAt(ch.id, now);
  if (!p) return null;
  const a = airingNow(p, state);
  const next = upNext(ch.id, now, 1)[0];
  const pct = Math.min(1, Math.max(0, (now - p.start) / (p.end - p.start)));
  const onAir = a.mode === 'onair';
  return (
    <Pressable onPress={() => router.push({ pathname: '/live', params: { tab: 'channels', channel: ch.id } })} accessibilityRole="button" accessibilityLabel={`Channel ${ch.number}, ${p.title}`}>
      <View style={styles.art}>
        <Image source={a.mode === 'standby' ? STANDBY_POSTER : mediaFor(p).poster} style={[StyleSheet.absoluteFill, a.mode === 'standby' && { opacity: 0.5 }]} contentFit="cover" />
        <View style={styles.shade} />
        <Corner at="tl">
          <Label>{`CH ${ch.number}`}</Label>
          <ProgramTag p={p} a={a} />
        </Corner>
        <Corner at="br" inset={10}>
          <AccessBadge onArt access={p.access} live={onAir} locked={!watchableNow(ch, now, state)} />
        </Corner>
        <View style={styles.bar}>
          <View style={[styles.barFill, { width: `${pct * 100}%`, backgroundColor: onAir ? colors.live : colors.gold }]} />
        </View>
      </View>
      <Text style={text.cardTitle} numberOfLines={1}>
        {p.title}
      </Text>
      <Text style={text.cardMeta} numberOfLines={1}>
        {ch.name} · until {fmtTime(p.end, state.tz)}
      </Text>
      {next && (
        <Text style={text.cardSub} numberOfLines={1}>
          Next {fmtTime(next.start, state.tz)} · {next.title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  art: { aspectRatio: 16 / 9, borderRadius: radius.card, overflow: 'hidden', borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface2 },
  shade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.25)' },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 4, backgroundColor: 'rgba(255,255,255,0.15)' },
  barFill: { height: 4 },
});
