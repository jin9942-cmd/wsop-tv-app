// Home billboard (web demo v2 components/Billboard.tsx): the featured stream with real CC footage, its status and
// actions, then the "On air now" band (every table feed on air).
import { useEvent, useEventListener } from 'expo';
import { router } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { HERO_DAY_ID, HERO_EXPECTED_START, dayById, events, seriesById } from '@/data/mock';
import { isBroadcasting, isOnAir } from '@/lib/broadcast';
import { count } from '@/lib/format';
import { PRESENTATION } from '@/data/policy';
import { FOOTAGE, FOOTAGE_NOTE, HERO_POSTER } from '@/lib/media';
import { VENUE_TZ, countdown, fmtTime } from '@/lib/time';
import { useApp, useTick } from '@/state/app';
import { colors, space, type } from '@/theme';

import { OnAirCard, SwipeRow, watchHref } from './cards';
import { BraceletIcon, Button, StatusBadge } from './ui';

export function Billboard() {
  const { state, status } = useApp();
  const now = useTick(1000);
  const hero = dayById(HERO_DAY_ID)!;
  const st = status(hero.day);
  const live = isBroadcasting(st);
  const next = events
    .flatMap((e) => e.days.map((d) => ({ e, d })))
    .filter((x) => status(x.d) === 'upcoming')
    .sort((a, b) => a.d.start.localeCompare(b.d.start))[0];
  const ev = live ? hero.event : next.e;
  const day = live ? hero.day : next.d;
  const se = seriesById(ev.seriesId);

  return (
    <View>
      <View style={styles.hero}>
        <HeroFootage />
        {/* Web demo v2: dark from the left behind the text, and from the bottom into the page. */}
        <LinearGradient colors={['rgba(11,12,14,0.94)', 'rgba(11,12,14,0.86)', 'rgba(11,12,14,0.4)', 'transparent']} locations={[0, 0.28, 0.48, 0.64]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
        <LinearGradient colors={['transparent', 'rgba(11,12,14,0.6)', colors.bg]} locations={[0.4, 0.85, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />
        <View style={styles.heroText}>
          {/* Presentation build: no status badge (DELAYED) or "Featured now" label above the title. */}
          {!PRESENTATION && (
            <View style={styles.inline}>
              <StatusBadge status={live ? st : 'upcoming'} />
              <Text style={[type.label, { color: 'rgba(242,242,243,0.9)' }]}>{live ? 'Featured now' : 'No live tournaments right now · up next'}</Text>
            </View>
          )}
          <Text style={[styles.title, PRESENTATION && { marginTop: 0 }]}>{ev.name}</Text>
          <View style={[styles.inline, { flexWrap: 'wrap', rowGap: 2 }]}>
            <Text style={styles.meta}>{se.name}</Text>
            <Text style={styles.dot}>·</Text>
            <BraceletIcon size={14} />
            <Text style={styles.meta}>Event #{ev.number}</Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.meta}>{day.label}</Text>
            {live && ev.remaining > 0 && (
              <>
                <Text style={styles.dot}>·</Text>
                <Text style={[styles.meta, type.tnum]}>{count(ev.remaining)} players left</Text>
              </>
            )}
          </View>
          {!live && (
            <Text style={[styles.meta, { marginTop: 8, lineHeight: 21, fontWeight: '500' }]}>
              Starts in {countdown(Date.parse(day.start) - now)} — {fmtTime(day.start, state.tz)} your time, {fmtTime(day.start, VENUE_TZ)} in Las Vegas.
            </Text>
          )}
          {st === 'late' && <Text style={[type.small, { color: colors.delayed, marginTop: 6 }]}>Coverage is starting late — now expected around {fmtTime(HERO_EXPECTED_START, state.tz)} your time.</Text>}
          {st === 'interrupted' && <Text style={[type.small, { color: colors.live, marginTop: 6 }]}>The broadcast is temporarily off air and resumes automatically.</Text>}
          <View style={[styles.inline, { marginTop: 20, gap: 12 }]}>
            <Button variant="primary" size="lg" icon="play" title={live ? (isOnAir(st) ? 'Watch live' : 'Open broadcast') : 'Preview & remind me'} onPress={() => router.push(watchHref(day.id))} />
            <Pressable onPress={() => router.push({ pathname: '/events/[id]', params: { id: ev.id } })} accessibilityRole="button" style={styles.ghostBtn}>
              <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15 }}>Key hands</Text>
            </Pressable>
          </View>
        </View>
        {/* Presentation build: the footage credit moves to the footer. */}
        {!PRESENTATION && <Text style={styles.credit}>{FOOTAGE_NOTE}</Text>}
      </View>
      <OnAirBand />
    </View>
  );
}

/** Muted looping footage behind the billboard (poster first, video on top once it plays). */
function HeroFootage() {
  const player = useVideoPlayer(FOOTAGE.ft.url, (p) => {
    p.muted = true;
    p.loop = true;
  });
  // Start the footage once it has loaded (browsers ignore play() before that).
  const started = useRef(false);
  useEventListener(player, 'statusChange', ({ status }) => {
    if (status !== 'readyToPlay' || started.current) return;
    started.current = true;
    player.seekBy(110);
    player.play();
  });
  // The poster stays on top until the footage is actually playing (no black frame while it loads).
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
      {!isPlaying && <Image source={HERO_POSTER} style={StyleSheet.absoluteFill} contentFit="cover" />}
    </View>
  );
}

/** Every table of every on-air day, main tables first. */
function OnAirBand() {
  const { status } = useApp();
  const days = events.flatMap((e) => e.days.map((d) => ({ e, d }))).filter(({ d }) => isBroadcasting(status(d)));
  const feeds = days.flatMap(({ e, d }) => d.tables.map((t, i) => ({ e, d, t, i })));
  // Presentation build: one card per on-air broadcast (its main feed); other feeds are picked on the watch screen.
  const ordered = PRESENTATION ? feeds.filter((c) => c.i === 0) : [...feeds.filter((c) => c.i === 0), ...feeds.filter((c) => c.i > 0)];
  return (
    <View style={styles.band}>
      <Text style={[type.label, { color: 'rgba(242,242,243,0.8)', marginBottom: 12, paddingHorizontal: space.gutter }]}>{ordered.length ? 'On air now' : 'Schedule'}</Text>
      {ordered.length ? (
        <SwipeRow data={ordered} keyOf={(x) => x.t.id} render={({ e, d, i }) => <OnAirCard e={e} d={d} tableIndex={i} />} width={200} />
      ) : (
        <Pressable onPress={() => router.navigate('/schedule')} accessibilityRole="link" style={{ paddingHorizontal: space.gutter }}>
          <Text style={{ color: colors.gold, fontWeight: '700' }}>Nothing on air — open the schedule →</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { minHeight: 480, justifyContent: 'flex-end', overflow: 'hidden' },
  heroText: { paddingHorizontal: space.gutter, paddingTop: 64, paddingBottom: 40 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { color: colors.text, fontSize: 40, lineHeight: 42, fontWeight: '900', letterSpacing: -0.8, marginTop: 16, textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 8 },
  meta: { color: 'rgba(242,242,243,0.85)', fontSize: 14, fontWeight: '700' },
  dot: { color: colors.subtle },
  ghostBtn: { minHeight: 48, paddingHorizontal: 24, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  credit: { position: 'absolute', right: 12, bottom: 6, left: 12, textAlign: 'right', color: 'rgba(255,255,255,0.45)', fontSize: 10 },
  band: { paddingVertical: 20, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.line, backgroundColor: 'rgba(19,20,24,0.6)' },
});
