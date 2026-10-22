// Cards and rows shared by Home, Live, Schedule, VOD and detail screens (web demo Home.tsx exports).
import { router } from 'expo-router';
import type { ReactElement } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { seriesById } from '@/data/series';
import type { MyListKind, Schedule, Vod } from '@/data/types';
import { accessFor, eventLabel, isExclusive, phaseOf, seriesHue, statusOf, viewersOf } from '@/lib/access';
import { fmtCount, fmtDuration, fmtSeriesDates, fmtTime } from '@/lib/time';
import { useApp } from '@/state/app';
import { colors, radius, space, type } from '@/theme';

import { Art, Avatar, Corner, Icon, LiveBadge, LockBadge, Pill, TierBadge } from './ui';

export const CARD_W = 236;
export const CARD_W_SM = 168;

/** Horizontal row of cards (FlatList keeps long rows cheap). */
export function HRow<T>({ data, render, keyOf, width = CARD_W }: { data: T[]; render: (item: T, index: number) => ReactElement; keyOf: (item: T) => string; width?: number }) {
  return (
    <FlatList
      horizontal
      data={data}
      keyExtractor={keyOf}
      renderItem={({ item, index }) => <View style={{ width }}>{render(item, index)}</View>}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: space.gutter, gap: 12 }}
      initialNumToRender={4}
      windowSize={5}
    />
  );
}

export function LiveCard({ s, now, viewers = true }: { s: Schedule; now: number; viewers?: boolean }) {
  const { member } = useApp();
  const locked = member !== 'guest' && accessFor(member, s.tier) !== 'ok';
  return (
    <Pressable onPress={() => router.push({ pathname: '/live/[id]', params: { id: s.id } })} accessibilityRole="button" accessibilityLabel={`${s.title}, live`}>
      <Art hue={seriesHue(s.seriesId) + (s.lang === 'ES' ? 30 : 0)}>
        <Corner at="tl">
          <LiveBadge />
          {isExclusive(s) && <Pill>Only on WSOP TV</Pill>}
        </Corner>
        <Corner at="tr">
          <TierBadge tier={s.tier} />
        </Corner>
        {viewers && (
          <Corner at="bl">
            <Pill>{`${fmtCount(viewersOf(s, now))} watching`}</Pill>
          </Corner>
        )}
        {locked && (
          <Corner at="br">
            <LockBadge />
          </Corner>
        )}
      </Art>
      <Text style={styles.title} numberOfLines={2}>
        {s.title}
      </Text>
      <Text style={styles.meta} numberOfLines={1}>
        {eventLabel(s)} · {s.lang}
      </Text>
    </Pressable>
  );
}

export function VodCard({ v }: { v: Vod }) {
  const { member } = useApp();
  const locked = member !== 'guest' && accessFor(member, v.tier) !== 'ok';
  return (
    <Pressable onPress={() => router.push({ pathname: '/vod/[id]', params: { id: v.id } })} accessibilityRole="button" accessibilityLabel={v.title}>
      <Art hue={seriesHue(v.seriesId) + 20}>
        {locked && (
          <Corner at="tl">
            <LockBadge />
          </Corner>
        )}
        <Corner at="tr">
          <TierBadge tier={v.tier} />
        </Corner>
        <Corner at="br">
          <Pill>{fmtDuration(v.durationSec)}</Pill>
        </Corner>
      </Art>
      <Text style={styles.title} numberOfLines={2}>
        {v.title}
      </Text>
      <Text style={styles.meta}>{v.type}</Text>
    </Pressable>
  );
}

export function SeriesCard({ id, now }: { id: string; now: number }) {
  const x = seriesById(id);
  if (!x) return null;
  const phase = phaseOf(x, now);
  return (
    <Pressable onPress={() => router.push({ pathname: '/tournaments/[id]', params: { id: x.id } })} accessibilityRole="button" accessibilityLabel={x.name}>
      <Art hue={x.hue} ratio={16 / 10}>
        <Corner at="tl">
          <Pill>{x.tour}</Pill>
        </Corner>
        {phase === 'ongoing' && (
          <Corner at="tr">
            <Pill>● On now</Pill>
          </Corner>
        )}
      </Art>
      <Text style={styles.title} numberOfLines={1}>
        {x.name}
      </Text>
      <Text style={styles.meta} numberOfLines={1}>
        {fmtSeriesDates(x.start, x.end)} · {x.venue}
      </Text>
    </Pressable>
  );
}

export function PlayerChip({ id, name, hue, sub, size = 64 }: { id: string; name: string; hue: number; sub?: string; size?: number }) {
  return (
    <Pressable onPress={() => router.push({ pathname: '/player/[id]', params: { id } })} accessibilityRole="button" accessibilityLabel={name} style={styles.playerChip}>
      <Avatar name={name} hue={hue} size={size} />
      <Text style={[styles.title, { textAlign: 'center' }]} numberOfLines={2}>
        {name}
      </Text>
      {sub && (
        <Text style={[styles.meta, { textAlign: 'center' }]} numberOfLines={1}>
          {sub}
        </Text>
      )}
    </Pressable>
  );
}

/** Schedule row: Upcoming → reminder, LIVE → player, Ended → replay (web demo ScheduleRow). */
export function ScheduleRow({ s, now }: { s: Schedule; now: number }) {
  const { tz, alarms, toggleReminder } = useApp();
  const status = statusOf(s, now);
  const on = alarms.includes(s.id);
  const open = () => {
    if (status === 'ended' && s.vodId) router.push({ pathname: '/vod/[id]', params: { id: s.vodId } });
    else if (status !== 'ended') router.push({ pathname: '/live/[id]', params: { id: s.id } });
  };
  return (
    <View style={[styles.schedRow, status === 'ended' && { opacity: 0.6 }]}>
      <Pressable style={styles.schedMain} onPress={open} accessibilityRole="button" accessibilityLabel={`${fmtTime(s.start, tz)} ${s.title}`}>
        <View style={styles.schedTime}>
          <Text style={[type.h3, type.tnum, { fontSize: 14 }]}>{fmtTime(s.start, tz)}</Text>
          {s.originalStart && status === 'upcoming' && <Text style={styles.changed}>Changed</Text>}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.schedTitle} numberOfLines={2}>
            {isExclusive(s) && <Text style={{ color: colors.gold }}>● </Text>}
            {s.title}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {eventLabel(s)} · {s.channelId} · {s.lang}
          </Text>
        </View>
        {status === 'live' && <LiveBadge />}
        {status === 'ended' && <Text style={styles.replay}>{s.vodId ? 'Replay' : 'Ended'}</Text>}
      </Pressable>
      {status === 'upcoming' && (
        <Pressable
          onPress={() => toggleReminder({ key: s.id, title: s.title, path: `/live/${s.id}?reminder=1` })}
          accessibilityRole="button"
          accessibilityState={{ selected: on }}
          accessibilityLabel={on ? 'Remove reminder' : 'Set reminder'}
          style={[styles.remind, on && styles.remindOn]}>
          <Icon name={on ? 'bellOn' : 'bell'} size={15} color={on ? colors.ink : colors.muted} />
          <Text style={[styles.remindText, on && { color: colors.ink }]}>{on ? 'Set' : 'Remind'}</Text>
        </Pressable>
      )}
    </View>
  );
}

const LIST_LABEL: Record<MyListKind, { add: string; saved: string }> = {
  vod: { add: 'Watchlist', saved: 'In Watchlist' },
  live: { add: 'Watchlist', saved: 'In Watchlist' },
  player: { add: 'Follow', saved: 'Following' },
  series: { add: 'Save', saved: 'Saved' },
};

/** Watchlist toggle on detail screens. Guests log in first, then the item is saved. */
export function MyListButton({ kind, id }: { kind: MyListKind; id: string }) {
  const { member, inMyList, toggleMyList, openSheet, toast } = useApp();
  const saved = inMyList(kind, id);
  const toggle = () => {
    if (member === 'guest') {
      return openSheet({
        kind: 'login',
        reason: 'Log in to save videos, live broadcasts, players and tournaments to your Watchlist.',
        then: () => {
          toggleMyList(kind, id);
          toast('Added to Watchlist');
        },
      });
    }
    toast(toggleMyList(kind, id) ? 'Added to Watchlist' : 'Removed from Watchlist');
  };
  return (
    <Pressable onPress={toggle} accessibilityRole="button" accessibilityState={{ selected: saved }} style={[styles.listBtn, saved && styles.listBtnOn]}>
      <Icon name={kind === 'player' || kind === 'series' ? (saved ? 'star' : 'starOutline') : saved ? 'check' : 'add'} size={16} color={saved ? colors.goldStrong : colors.text} />
      <Text style={[styles.listBtnText, saved && { color: colors.goldStrong }]}>{saved ? LIST_LABEL[kind].saved : LIST_LABEL[kind].add}</Text>
    </Pressable>
  );
}

export const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 13.5, fontWeight: '700', marginTop: 8, lineHeight: 18 },
  meta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  playerChip: { alignItems: 'center', width: 96 },
  schedRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.gutter, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line, gap: 10 },
  schedMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
  schedTime: { width: 72 },
  schedTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  changed: { color: colors.delayed, fontSize: 10.5, fontWeight: '800', marginTop: 2 },
  replay: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  remind: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 34, paddingHorizontal: 10, borderRadius: 17, borderWidth: 1, borderColor: colors.lineStrong },
  remindOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  remindText: { color: colors.muted, fontSize: 12, fontWeight: '800' },
  listBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 38, paddingHorizontal: 14, borderRadius: radius.button, borderWidth: 1, borderColor: colors.lineStrong, alignSelf: 'flex-start' },
  listBtnOn: { borderColor: colors.gold, backgroundColor: colors.goldDim },
  listBtnText: { color: colors.text, fontSize: 13, fontWeight: '700' },
});
