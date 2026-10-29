// Schedule (web demo v2 pages/Schedule.tsx): broadcasts grouped by venue date (date strip jumps between them), Las Vegas (PT) start times with "your time"
// alongside, one row per broadcast day with status, event number, buy-in and a clear next action.
import { router } from 'expo-router';
import { type ComponentRef, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { watchHref } from '@/components/cards';
import { AppHeader } from '@/components/headers';
import { Button, EmptyState, FilterChip, StatusBadge } from '@/components/ui';
import { events, seriesById } from '@/data/mock';
import type { Day, TourEvent } from '@/data/types';
import { PRESENTATION } from '@/data/policy';
import { isBroadcasting, isOnAir, tableDelay } from '@/lib/broadcast';
import { money } from '@/lib/format';
import { TZ_OPTIONS, VENUE_TZ, dayKey, fmtTime, keyParts, relative, shiftKey, tzAbbr } from '@/lib/time';
import { useApp, useTick } from '@/state/app';
import { colors, radius, space, type } from '@/theme';

/** Past venue days still listed (yesterday's finished coverage, for replays). */
const DAYS_BEFORE = 1;

type Item = { e: TourEvent; d: Day };

export default function Schedule() {
  const { state, set, status } = useApp();
  const all = useMemo(() => events.flatMap((e) => e.days.map((d) => ({ e, d }))).sort((a, b) => a.d.start.localeCompare(b.d.start)), []);
  const now = useTick(60_000);
  const from = shiftKey(dayKey(now, VENUE_TZ), -DAYS_BEFORE);
  // One section per venue date (no "Today / Tomorrow"): every date with broadcasts from yesterday on, plus any earlier
  // day still on air (listed under the date it started).
  const byDate = new Map<string, Item[]>();
  for (const x of all) {
    const k = dayKey(x.d.start, VENUE_TZ);
    if (k < from && !isBroadcasting(status(x.d))) continue;
    byDate.set(k, [...(byDate.get(k) ?? []), x]);
  }
  const sections = [...byDate.entries()].map(([key, data]) => ({ key, data }));
  // A plain ScrollView (a few dozen rows at most) so the date strip can jump to each section's measured offset.
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const offsets = useRef(new Map<string, number>());
  const [date, setDate] = useState<string>();
  const jump = (key: string) => {
    setDate(key);
    scrollRef.current?.scrollTo({ y: offsets.current.get(key) ?? 0 });
  };

  return (
    <ScrollView ref={scrollRef} style={{ backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 32 }}>
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
      {/* Date strip: jumps to that date's section. */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.chips, { marginTop: 16, marginBottom: 8 }]}>
        {sections.map((s) => {
          const l = keyParts(s.key);
          const on = s.key === date;
          return (
            <Pressable key={s.key} onPress={() => jump(s.key)} accessibilityRole="button" accessibilityLabel={`Go to ${l.weekday}, ${l.month} ${l.day}`} style={[styles.date, on && { borderColor: colors.gold, backgroundColor: colors.goldDim }]}>
              <Text style={[type.label, { fontSize: 10, color: on ? colors.text : colors.muted }]}>{l.weekday}</Text>
              <Text style={[type.tnum, { fontSize: 20, fontWeight: '900', color: on ? colors.text : colors.muted }]}>{l.day}</Text>
              <Text style={{ fontSize: 11, color: on ? colors.text : colors.muted }}>{l.month}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {sections.map((s) => (
        <View key={s.key} onLayout={(ev) => offsets.current.set(s.key, ev.nativeEvent.layout.y)}>
          <DateHeader dateKey={s.key} count={s.data.length} />
          {s.data.map((x, i) => (
            <Row key={x.d.id} e={x.e} d={x.d} first={i === 0} last={i === s.data.length - 1} />
          ))}
        </View>
      ))}
      {!sections.length && (
        <EmptyState title="No broadcasts scheduled" body="Catch up on past final tables in the archive.">
          <Button size="sm" title="Watch replays" onPress={() => router.push('/archive')} />
        </EmptyState>
      )}
    </ScrollView>
  );
}

/** Date heading, e.g. "Thu, Oct 29 · 3 broadcasts". */
function DateHeader({ dateKey, count }: { dateKey: string; count: number }) {
  const l = keyParts(dateKey);
  return (
    <View style={styles.dateHeader}>
      <Text style={[type.h2, type.tnum]}>
        {l.weekday}, {l.month} {l.day}
      </Text>
      <Text style={type.small}>
        {count} {count === 1 ? 'broadcast' : 'broadcasts'}
      </Text>
    </View>
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
      <View style={[styles.inline, { marginTop: 10, flexWrap: 'wrap' }]}>
        {/* Presentation build: no LIVE / DELAYED / UPCOMING / VOD badge on the rows. */}
        {!PRESENTATION && <StatusBadge status={status} size="sm" delayMin={delay || 30} />}
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
  dateHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: space.gutter, paddingTop: 24, paddingBottom: 10 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  row: { marginHorizontal: space.gutter, padding: 16, backgroundColor: colors.surface, borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: colors.line },
  rowFirst: { borderTopWidth: 1, borderTopLeftRadius: radius.panel, borderTopRightRadius: radius.panel },
  rowLast: { borderBottomLeftRadius: radius.panel, borderBottomRightRadius: radius.panel },
});

