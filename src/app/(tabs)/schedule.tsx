// Schedule (web demo v2 pages/Schedule.tsx): venue-calendar date strip, Las Vegas (PT) start times with "your time"
// alongside, one row per broadcast day with status, event number, buy-in and a clear next action.
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { watchHref } from '@/components/cards';
import { AppHeader } from '@/components/headers';
import { Button, EmptyState, FilterChip, StatusBadge } from '@/components/ui';
import { events, seriesById } from '@/data/mock';
import type { Day, TourEvent } from '@/data/types';
import { isBroadcasting, isOnAir, tableDelay } from '@/lib/broadcast';
import { money } from '@/lib/format';
import { TZ_OPTIONS, VENUE_TZ, dayKey, fmtDate, fmtTime, keyParts, relative, shiftKey, tzAbbr } from '@/lib/time';
import { useApp, useTick } from '@/state/app';
import { colors, radius, space, type } from '@/theme';

const DAYS_BEFORE = 1;
const DAYS_AFTER = 5;

export default function Schedule() {
  const { state, set, status } = useApp();
  const all = useMemo(() => events.flatMap((e) => e.days.map((d) => ({ e, d }))).sort((a, b) => a.d.start.localeCompare(b.d.start)), []);
  const now = useTick(60_000);
  const today = dayKey(now, VENUE_TZ);
  const [date, setDate] = useState(today);
  const strip = Array.from({ length: DAYS_BEFORE + DAYS_AFTER + 1 }, (_, i) => shiftKey(today, i - DAYS_BEFORE));
  const datesWithEvents = useMemo(() => [...new Set(all.map((x) => dayKey(x.d.start, VENUE_TZ)))].sort(), [all]);
  // Today also lists anything still on air that started on an earlier venue day.
  const list = all.filter((x) => dayKey(x.d.start, VENUE_TZ) === date || (date === today && dayKey(x.d.start, VENUE_TZ) < today && isBroadcasting(status(x.d))));
  const nextWithEvents = datesWithEvents.find((d) => d > date);
  const sel = keyParts(date);

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      data={list}
      keyExtractor={(x) => x.d.id}
      renderItem={({ item, index }) => <Row e={item.e} d={item.d} first={index === 0} last={index === list.length - 1} />}
      ListHeaderComponent={
        <>
          <AppHeader />
          <View style={styles.head}>
            <Text style={type.title}>Schedule</Text>
            <Text style={[type.small, { marginTop: 8, lineHeight: 19 }]}>
              Times in <Text style={{ color: colors.text, fontWeight: '700' }}>Las Vegas (PT)</Text> with your local time ({tzAbbr(state.tz)}). Dates follow the venue&apos;s calendar. Times are stream start times; streams air on a broadcast delay, so they show play from a little earlier.
            </Text>
            <Pressable onPress={() => router.push({ pathname: '/live', params: { tab: 'channels' } })} accessibilityRole="link">
              <Text style={[type.small, { color: colors.gold, fontWeight: '700', marginTop: 8 }]}>What&apos;s on the 24/7 channels → Channel guide</Text>
            </Pressable>
            <Text style={[type.label, { marginTop: 16, marginBottom: 8 }]}>Your time zone</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {TZ_OPTIONS.map((o) => (
              <FilterChip key={o.tz} on={state.tz === o.tz} onPress={() => set({ tz: o.tz })}>
                {`${o.label} · ${tzAbbr(o.tz)}`}
              </FilterChip>
            ))}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.chips, { marginTop: 16 }]} accessibilityRole="tablist">
            {strip.map((k) => {
              const l = keyParts(k);
              const has = datesWithEvents.includes(k);
              const on = k === date;
              return (
                <Pressable key={k} onPress={() => setDate(k)} accessibilityRole="tab" accessibilityState={{ selected: on }} style={[styles.date, on && { borderColor: colors.gold, backgroundColor: colors.goldDim }]}>
                  <Text style={[type.label, { fontSize: 10, color: on ? colors.text : colors.muted }]}>{k === today ? 'Today' : l.weekday}</Text>
                  <Text style={[type.tnum, { fontSize: 20, fontWeight: '900', color: on ? colors.text : colors.muted }]}>{l.day}</Text>
                  <Text style={{ fontSize: 11, color: on ? colors.text : colors.muted }}>{l.month}</Text>
                  <View style={[styles.dot, { backgroundColor: has ? colors.gold : 'transparent' }]} accessibilityLabel={has ? 'Has broadcasts' : 'No broadcasts'} />
                </Pressable>
              );
            })}
          </ScrollView>
          <Text style={[type.small, { fontWeight: '700', marginTop: 20, marginBottom: 10, paddingHorizontal: space.gutter }]}>
            {date === today ? 'Today' : `${sel.weekday}, ${sel.month} ${sel.day}`} · {list.length} {list.length === 1 ? 'broadcast' : 'broadcasts'}
          </Text>
        </>
      }
      ListEmptyComponent={
        <EmptyState title="No broadcasts scheduled for this day" body="Rest day at the venue. Catch up on past final tables in the archive.">
          {nextWithEvents && <Button variant="primary" size="sm" title="Next day with broadcasts" onPress={() => setDate(nextWithEvents)} />}
          <Button size="sm" title="Watch replays" onPress={() => router.push('/archive')} />
        </EmptyState>
      }
      contentContainerStyle={{ paddingBottom: 32 }}
    />
  );
}

function Row({ e, d, first, last }: { e: TourEvent; d: Day; first: boolean; last: boolean }) {
  const { state, status: statusOf, toggleReminder, toast } = useApp();
  const now = useTick(60_000);
  const status = statusOf(d);
  const onAir = isOnAir(status);
  const broadcasting = isBroadcasting(status);
  const delay = Math.max(...d.tables.map((t) => tableDelay(t, status)), 0);
  const on = state.reminders.includes(d.id);
  const note =
    status === 'late'
      ? 'Coverage is starting late'
      : status === 'interrupted'
        ? 'Temporarily off air — resumes automatically'
        : onAir
          ? `On air · ${d.tables.length} stream${d.tables.length > 1 ? 's' : ''}${delay ? ` · ${delay}-min broadcast delay` : ''}`
          : status === 'upcoming'
            ? `Stream starts ${relative(d.start, now)}${d.label === 'Final Table' ? ' · airs on a 30-min delay' : ''}`
            : 'Coverage ended · full replay available';
  return (
    <View style={[styles.row, first && styles.rowFirst, last && styles.rowLast, status === 'vod' && { opacity: 0.8 }]}>
      <Text style={[type.tnum, { color: colors.text, fontSize: 20, fontWeight: '900' }]}>
        {fmtTime(d.start, VENUE_TZ)} <Text style={{ fontSize: 12, color: colors.muted }}>{tzAbbr(VENUE_TZ, d.start)}</Text>
      </Text>
      <Text style={[type.small, type.tnum]}>
        {fmtTime(d.start, state.tz)} {tzAbbr(state.tz, d.start)} your time
      </Text>
      {dayKey(d.start, VENUE_TZ) < dayKey(now, VENUE_TZ) && <Text style={type.caption}>Started {fmtDate(d.start, VENUE_TZ)}</Text>}
      <View style={[styles.inline, { marginTop: 10, flexWrap: 'wrap' }]}>
        <StatusBadge status={status} size="sm" delayMin={delay || 30} />
        <Text style={[type.small, type.tnum]}>
          #{e.number} · {d.label} · {e.buyIn ? money(e.buyIn) : 'Invitational'}
        </Text>
      </View>
      <Pressable onPress={() => router.push(watchHref(d.id))} accessibilityRole="link">
        <Text style={[type.h3, { fontSize: 17, marginTop: 4 }]} numberOfLines={1}>
          {e.name}
        </Text>
      </Pressable>
      <Text style={[type.small, status === 'late' ? { color: colors.delayed } : status === 'interrupted' ? { color: colors.live } : null]}>
        {note} <Text style={{ color: colors.subtle }}>· {seriesById(e.seriesId).name}</Text>
      </Text>
      <View style={[styles.inline, { marginTop: 12 }]}>
        {status === 'upcoming' && (
          <>
            <Button
              size="sm"
              variant={on ? 'secondary' : 'outline'}
              icon="bell"
              title={on ? 'Reminder set' : 'Remind me'}
              pressed={on}
              onPress={() => toggleReminder({ key: d.id, title: `${e.name} · ${d.label}`, path: `/live/${d.id}`, setText: `Reminder set · ${fmtTime(d.start, state.tz)} ${tzAbbr(state.tz, d.start)}` })}
            />
            <Button size="sm" variant="ghost" icon="calendar" onPress={() => toast('Calendar file (.ics) would download here (demo)')} accessibilityLabel={`Add ${e.name} ${d.label} to calendar`} />
          </>
        )}
        <Button size="sm" variant={broadcasting ? 'primary' : 'secondary'} title={broadcasting ? 'Watch' : status === 'upcoming' ? 'Details' : 'View'} onPress={() => router.push(watchHref(d.id))} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: space.gutter, paddingTop: 20 },
  chips: { gap: 8, paddingHorizontal: space.gutter },
  date: { width: 64, alignItems: 'center', borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, paddingVertical: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 4 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  row: { marginHorizontal: space.gutter, padding: 16, backgroundColor: colors.surface, borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: colors.line },
  rowFirst: { borderTopWidth: 1, borderTopLeftRadius: radius.panel, borderTopRightRadius: radius.panel },
  rowLast: { borderBottomLeftRadius: radius.panel, borderBottomRightRadius: radius.panel },
});

