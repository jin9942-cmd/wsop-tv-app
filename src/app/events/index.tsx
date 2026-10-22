// Series & Events (web demo v2 pages/Series.tsx SeriesList).
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SubHead } from '@/components/headers';
import { BraceletIcon, PageHeader, StatusBadge } from '@/components/ui';
import { events, series } from '@/data/mock';
import type { Day, StreamStatus, TourEvent } from '@/data/types';
import { fmtDate } from '@/lib/time';
import { useApp } from '@/state/app';
import { colors, radius, space, type } from '@/theme';

export default function SeriesList() {
  const { state } = useApp();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SubHead />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <PageHeader kicker="Series → Event → Day" title="Series & Events" />
        {series.map((s) => {
          const evs = events.filter((e) => e.seriesId === s.id);
          return (
            <View key={s.id} style={{ marginTop: 24, paddingHorizontal: space.gutter }}>
              <View style={styles.seriesHead}>
                <Text style={type.h2}>{s.name}</Text>
                <Text style={type.small}>
                  {s.venue} · {s.city} · {fmtDate(s.start, state.tz)} – {fmtDate(s.end, state.tz)}
                </Text>
                <View style={[styles.inline, { marginTop: 4 }]}>
                  <BraceletIcon size={16} />
                  <Text style={type.small}>{evs.length} bracelet events</Text>
                </View>
              </View>
              <View style={{ gap: 12 }}>
                {evs.map((e) => (
                  <EventRow key={e.id} e={e} />
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function eventStatus(e: TourEvent, st: (d: Day) => StreamStatus): StreamStatus {
  const s = e.days.map(st);
  if (s.includes('live')) return 'live';
  if (s.includes('delayed')) return 'delayed';
  if (s.includes('interrupted')) return 'interrupted';
  if (s.includes('late')) return 'late';
  if (s.every((x) => x === 'upcoming')) return 'upcoming';
  return 'vod';
}

function EventRow({ e }: { e: TourEvent }) {
  const { status } = useApp();
  return (
    <Pressable onPress={() => router.push({ pathname: '/events/[id]', params: { id: e.id } })} accessibilityRole="button" style={styles.card}>
      <View style={[styles.inline, { justifyContent: 'space-between' }]}>
        <View style={styles.inline}>
          <BraceletIcon size={14} />
          <Text style={type.label}>Event #{e.number}</Text>
        </View>
        <StatusBadge status={eventStatus(e, status)} size="sm" />
      </View>
      <Text style={[type.h3, { marginTop: 10 }]}>{e.name}</Text>
      <View style={[styles.inline, { flexWrap: 'wrap', marginTop: 10, gap: 4 }]}>
        {e.days.map((d) => (
          <DayPill key={d.id} d={d} />
        ))}
      </View>
    </Pressable>
  );
}

function DayPill({ d }: { d: Day }) {
  const { status } = useApp();
  const st = status(d);
  const c = st === 'live' || st === 'interrupted' ? colors.live : st === 'delayed' || st === 'late' ? colors.delayed : st === 'upcoming' ? colors.subtle : colors.muted;
  return (
    <View style={[styles.pill, { borderColor: st === 'upcoming' ? colors.line : st === 'vod' ? colors.lineStrong : c }]}>
      <Text style={{ color: c, fontSize: 11, fontWeight: '700' }}>{d.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  inline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  seriesHead: { paddingBottom: 12, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.line, gap: 2 },
  card: { borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, padding: 16 },
  pill: { borderRadius: 4, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2 },
});
