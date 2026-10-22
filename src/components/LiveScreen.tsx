// Live (web demo v2 pages/Live.tsx): tournament strip on top, the player, and the event's streams; a replay day opens
// the replay screen instead (breadcrumb, broadcast days as episodes). Used by the Live tab and by /watch/[dayId].
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { dayById, events, finalTableSeats, seriesById } from '@/data/mock';
import type { Access, Day, StreamStatus, TableFeed, TourEvent } from '@/data/types';
import { isBroadcasting, isOnAir, shortEvent, tableDelay, tableStatus } from '@/lib/broadcast';
import { VENUE_TZ, fmtDate, fmtTime, tzAbbr } from '@/lib/time';
import { gateForAccess, useApp } from '@/state/app';
import { colors, radius, space, type } from '@/theme';

import { watchHref } from './cards';
import { WatchView } from './player/WatchView';
import { AccessBadge, Label, StatusBadge } from './ui';

type Entry = { e: TourEvent; d: Day; status: StreamStatus };

export function LiveScreen({ dayId, clipId, autoPlay }: { dayId?: string; clipId?: string | null; autoPlay?: boolean }) {
  const { status: statusOf } = useApp();
  const [eventId, setEventId] = useState<string | null>(null);
  const [tableId, setTableId] = useState<string | undefined>(undefined);

  // One entry per event: its on-air day, else its next upcoming day, else its last day.
  const entries: Entry[] = useMemo(() => {
    const list = events.map((e) => {
      const d = e.days.find((x) => isBroadcasting(statusOf(x))) ?? e.days.find((x) => statusOf(x) === 'upcoming') ?? e.days[e.days.length - 1];
      return { e, d, status: statusOf(d) };
    });
    const rank = (s: StreamStatus) => (isBroadcasting(s) ? 0 : s === 'upcoming' ? 1 : 2);
    return list.sort((a, b) => rank(a.status) - rank(b.status) || (rank(a.status) === 2 ? b.d.start.localeCompare(a.d.start) : a.d.start.localeCompare(b.d.start)));
  }, [statusOf]);

  // A specific day (from /watch/[dayId]) wins; otherwise the picked chip, else the first entry.
  const forced = dayId ? dayById(dayId) : undefined;
  const selected: Entry = forced ? { e: forced.event, d: forced.day, status: statusOf(forced.day) } : (entries.find((x) => x.e.id === eventId) ?? entries[0]);
  const tableIdx = Math.max(0, selected.d.tables.findIndex((t) => t.id === tableId));
  const pick = (x: Entry) => (dayId ? router.replace(watchHref(x.d.id)) : (setEventId(x.e.id), setTableId(undefined)));

  // Replays get their own screen: no live strip or stream list — the event's episodes instead.
  if (selected.status === 'vod' && !autoPlay) {
    const se = seriesById(selected.e.seriesId);
    return (
      <View>
        <View style={styles.crumbBar}>
          <View style={styles.crumbs}>
            <Text style={styles.crumb} onPress={() => router.push('/archive')}>
              Archive
            </Text>
            <Text style={styles.crumbSep}>›</Text>
            <Text style={styles.crumb} onPress={() => router.push('/events')}>
              {se.name}
            </Text>
            <Text style={styles.crumbSep}>›</Text>
            <Text style={[styles.crumb, { color: colors.text, fontWeight: '700' }]} onPress={() => router.push({ pathname: '/events/[id]', params: { id: selected.e.id } })}>
              #{selected.e.number} {shortEvent(selected.e.name)}
            </Text>
          </View>
          <Pressable onPress={() => router.navigate('/live')} accessibilityRole="link" style={styles.inline}>
            <View style={[styles.dot, { backgroundColor: colors.live }]} />
            <Text style={[type.small, { fontWeight: '700' }]}>What&apos;s live now →</Text>
          </Pressable>
        </View>
        <WatchView key={`${selected.d.id}:${clipId ?? ''}`} dayId={selected.d.id} clipId={clipId} variant="vod" tableId={selected.d.tables[tableIdx].id} onTable={setTableId} asideTop={<Episodes e={selected.e} current={selected.d.id} />} />
      </View>
    );
  }

  return (
    <View>
      <View style={styles.strip}>
        <View style={styles.stripHead}>
          <Text style={[type.label, { color: 'rgba(242,242,243,0.8)' }]}>Tournaments</Text>
          <Text style={[type.small, { fontWeight: '700' }]} onPress={() => router.navigate('/schedule')}>
            Schedule →
          </Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: space.gutter }} accessibilityRole="tablist">
          {entries
            .map((x) => (forced && x.e.id === forced.event.id ? { e: forced.event, d: forced.day, status: statusOf(forced.day) } : x))
            .map((x) => (
              <TournamentChip key={x.e.id} x={x} on={x.e.id === selected.e.id} onPress={() => pick(x)} />
            ))}
        </ScrollView>
      </View>
      <WatchView
        key={`${selected.d.id}:${clipId ?? ''}`}
        dayId={selected.d.id}
        clipId={clipId}
        variant="live"
        autoPlay={autoPlay}
        tableId={selected.d.tables[tableIdx].id}
        onTable={setTableId}
        asideTop={
          <View>
            <Text style={[type.label, { color: 'rgba(242,242,243,0.8)', marginBottom: 12 }]}>Streams · {selected.d.tables.length}</Text>
            <View style={{ gap: 10 }}>
              {selected.d.tables.map((t, i) => (
                <StreamCard key={t.id} x={selected} t={t} i={i} on={i === tableIdx} onPress={() => setTableId(t.id)} />
              ))}
            </View>
          </View>
        }
      />
    </View>
  );
}

function TournamentChip({ x, on, onPress }: { x: Entry; on: boolean; onPress: () => void }) {
  const { d, e, status } = x;
  const delay = Math.max(0, ...d.tables.map((t) => tableDelay(t, status)));
  const sub = isBroadcasting(status)
    ? `${d.tables.length} stream${d.tables.length > 1 ? 's' : ''}${delay ? ` · ${delay}m delay` : ''}`
    : status === 'upcoming'
      ? `${fmtDate(d.start, VENUE_TZ)} · ${fmtTime(d.start, VENUE_TZ)} ${tzAbbr(VENUE_TZ, d.start)}`
      : 'Coverage ended';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: on }}
      style={[styles.chip, on && (isOnAir(status) ? { borderColor: 'rgba(229,72,77,0.8)', backgroundColor: 'rgba(229,72,77,0.1)' } : { borderColor: colors.gold, backgroundColor: colors.goldDim })]}>
      <View style={styles.inline}>
        {status === 'vod' ? <Label bg={colors.surface3} color={colors.muted}>ENDED</Label> : <StatusBadge status={status} size="sm" delayMin={delay || 30} />}
        <Text style={[type.small, type.tnum, { flexShrink: 1 }]} numberOfLines={1}>
          #{e.number} · {d.label}
        </Text>
      </View>
      <Text style={[type.h3, { marginTop: 6 }]} numberOfLines={1}>
        {shortEvent(e.name)}
      </Text>
      <Text style={type.small} numberOfLines={1}>
        {sub}
      </Text>
    </Pressable>
  );
}

const tableAccess = (d: Day, i: number): Access => (i === 0 ? (d.access ?? 'subscriber') : 'subscriber');
const FT_DESC: Record<string, string> = {
  'Main Feed': `Main broadcast · commentary + graphics · ${finalTableSeats.length} players`,
  'Clean Feed': 'Same table · no graphics · natural sound',
  'Player Cam': 'Isolated player camera',
  'Overhead Cam': 'Bird’s-eye view of the table',
};

function StreamCard({ x, t, i, on, onPress }: { x: Entry; t: TableFeed; i: number; on: boolean; onPress: () => void }) {
  const { state } = useApp();
  const st = tableStatus(t, x.status);
  const delay = st === 'delayed' ? tableDelay(t, x.status) : 0;
  const access = tableAccess(x.d, i);
  const locked = gateForAccess(access, state, isOnAir(x.status)) !== 'ok';
  // Final table = one table filmed by several cameras; earlier days = several tables.
  const desc = x.d.label === 'Final Table' ? (FT_DESC[t.name] ?? 'Camera feed') : i === 0 ? 'Main stream · commentary + graphics' : 'Outer table · natural sound';
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: on }} style={[styles.stream, on && { borderColor: 'rgba(229,72,77,0.8)', backgroundColor: 'rgba(229,72,77,0.05)' }]}>
      <View style={[styles.inline, { justifyContent: 'space-between' }]}>
        <StatusBadge status={st} size="sm" delayMin={delay || 30} />
        <AccessBadge access={access} live={isOnAir(x.status)} locked={locked} />
      </View>
      <Text style={[type.h3, { marginTop: 8 }]}>{t.name}</Text>
      <Text style={type.small}>{desc}</Text>
      {on && <Text style={[type.label, { color: colors.live, fontSize: 10, marginTop: 6 }]}>Now watching</Text>}
    </Pressable>
  );
}

/** Replay screen: every broadcast day of the event, like episodes. */
function Episodes({ e, current }: { e: TourEvent; current: string }) {
  const { state, status: statusOf } = useApp();
  return (
    <View>
      <Text style={[type.label, { color: 'rgba(242,242,243,0.8)', marginBottom: 12 }]}>Broadcast days · {e.days.length}</Text>
      <View style={{ gap: 8 }}>
        {e.days.map((d) => {
          const st = statusOf(d);
          const on = d.id === current;
          const watched = state.progress[d.id] ? Math.min(1, state.progress[d.id] / (d.durationMin * 60)) : 0;
          return (
            <Pressable key={d.id} onPress={() => router.replace(watchHref(d.id))} accessibilityRole="button" accessibilityState={{ selected: on }} style={[styles.stream, on && { borderColor: colors.gold, backgroundColor: colors.goldDim }]}>
              <View style={[styles.inline, { justifyContent: 'space-between' }]}>
                <Text style={type.h3}>{d.label}</Text>
                {st === 'vod' ? <Text style={[type.small, type.tnum]}>{Math.round(d.durationMin / 60)}h</Text> : <StatusBadge status={st} size="sm" />}
              </View>
              <Text style={type.small}>
                {fmtDate(d.start, VENUE_TZ)} · {d.tables.length} {d.label === 'Final Table' ? (d.tables.length > 1 ? 'camera feeds' : 'feed') : d.tables.length > 1 ? 'tables' : 'table'}
              </Text>
              {on && <Text style={[type.label, { color: colors.gold, fontSize: 10, marginTop: 6 }]}>Now playing</Text>}
              {watched > 0 && !on && (
                <View style={styles.bar}>
                  <View style={[styles.barFill, { width: `${watched * 100}%` }]} />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inline: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  crumbBar: { paddingHorizontal: space.gutter, paddingVertical: 14, gap: 10, borderBottomWidth: 1, borderBottomColor: colors.line, backgroundColor: 'rgba(19,20,24,0.6)' },
  crumbs: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  crumb: { color: colors.muted, fontSize: 13 },
  crumbSep: { color: colors.subtle, fontSize: 13 },
  strip: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.line, backgroundColor: 'rgba(19,20,24,0.6)' },
  stripHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: space.gutter, marginBottom: 12 },
  chip: { width: 224, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, paddingHorizontal: 14, paddingVertical: 12 },
  stream: { borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, padding: 14 },
  bar: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)', marginTop: 8 },
  barFill: { height: 4, borderRadius: 2, backgroundColor: colors.gold },
});
