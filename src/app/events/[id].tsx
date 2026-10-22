// Event detail (web demo v2 pages/Series.tsx EventDetail): scoreboard, days, key hands.
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { HandCard, watchHref } from '@/components/cards';
import { SubHead } from '@/components/headers';
import { Missing } from '@/components/missing';
import { AccessBadge, Art, BraceletIcon, Button, Icon, SectionHeader, Spoiler, StatusBadge } from '@/components/ui';
import { eventById, hands, playerById, seriesById } from '@/data/mock';
import type { Day, TourEvent } from '@/data/types';
import { isOnAir } from '@/lib/broadcast';
import { count, money } from '@/lib/format';
import { thumbFor } from '@/lib/media';
import { useMyList } from '@/lib/mylist';
import { fmtDateTime } from '@/lib/time';
import { canWatch, useApp } from '@/state/app';
import { colors, radius, space, type } from '@/theme';

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const list = useMyList();
  const e = eventById(id);
  if (!e) return <Missing />;
  const se = seriesById(e.seriesId);
  const evHands = hands.filter((h) => h.eventId === e.id).slice(0, 6);
  const finished = !!e.winnerId;
  const started = e.entrants > 0;
  const saved = list.has('event', e.id);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SubHead title={`Event #${e.number}`} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.crumbs}>
          <Text style={type.small} onPress={() => router.push('/events')}>
            Series &amp; Events
          </Text>
          <Text style={type.small}> / {se.name} / </Text>
          <Text style={[type.small, { color: colors.text }]}>Event #{e.number}</Text>
        </View>

        {/* scoreboard */}
        <View style={styles.board}>
          <View style={styles.boardHead}>
            <View style={styles.braceletBox}>
              <BraceletIcon size={34} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[type.label, { color: colors.gold }]}>
                {se.name} · Event #{e.number}
              </Text>
              <Text style={styles.h1}>{e.name}</Text>
              <Text style={type.small}>
                {se.venue}, {se.city} · Buy-in {e.buyIn ? money(e.buyIn) : 'Invitational'}
              </Text>
              <Button size="sm" variant={saved ? 'secondary' : 'outline'} icon={saved ? 'check' : 'plus'} title={saved ? 'In My List' : 'My List'} pressed={saved} onPress={() => list.toggle('event', e.id)} style={{ alignSelf: 'flex-start', marginTop: 12 }} />
            </View>
          </View>
          {finished && (
            <View style={styles.champion}>
              <Text style={type.label}>Champion</Text>
              <Spoiler k={`winner-${e.id}`} label="Champion hidden">
                <Text style={type.h2}>{playerById(e.winnerId!).name}</Text>
              </Spoiler>
            </View>
          )}
          <View style={styles.cells}>
            <Cell k="Entrants" v={started ? count(e.entrants) : '—'} />
            <Cell k="Prize pool" v={started ? money(e.prizePool) : 'TBD'} />
            <Cell k="First prize" v={started ? money(e.firstPrize) : 'TBD'} />
            <Cell k="Level" v={started ? String(e.level) : '—'} />
            <Cell k="Players left" v={started ? count(e.remaining) : '—'} />
            <View style={styles.cell}>
              <Text style={type.label}>{finished ? 'Final chip leader' : 'Chip leader'}</Text>
              {e.leaderId ? (
                <View style={{ marginTop: 4 }}>
                  <Spoiler k={`leader-${e.id}`} label="Chip leader hidden">
                    <Text style={[type.h3, { fontSize: 15 }]}>{playerById(e.leaderId).name}</Text>
                  </Spoiler>
                </View>
              ) : (
                <Text style={styles.cellValue}>—</Text>
              )}
            </View>
          </View>
        </View>

        <View style={{ marginTop: 32 }}>
          <SectionHeader title="Days" />
          <View style={{ gap: 8, paddingHorizontal: space.gutter }}>
            {e.days.map((d) => (
              <DayRow key={d.id} e={e} d={d} />
            ))}
          </View>
        </View>

        {evHands.length > 0 && (
          <View style={{ marginTop: 32 }}>
            <SectionHeader title="Key hands" />
            <View style={{ gap: 16, paddingHorizontal: space.gutter }}>
              {evHands.map((h) => (
                <HandCard key={h.id} hand={h} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function Cell({ k, v }: { k: string; v: string }) {
  return (
    <View style={styles.cell}>
      <Text style={type.label}>{k}</Text>
      <Text style={styles.cellValue}>{v}</Text>
    </View>
  );
}

function DayRow({ e, d }: { e: TourEvent; d: Day }) {
  const { state, status } = useApp();
  const st = status(d);
  const access = d.access ?? 'subscriber';
  return (
    <Pressable onPress={() => router.push(watchHref(d.id))} accessibilityRole="button" style={styles.day}>
      <Art image={thumbFor(`day:${d.id}`)} style={{ width: 120 }}>
        <View style={styles.play}>
          <Icon name="play" size={22} color="rgba(255,255,255,0.7)" />
        </View>
      </Art>
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <Text style={type.h3}>{d.label}</Text>
        <Text style={type.small}>
          {fmtDateTime(d.start, state.tz)} · {Math.round(d.durationMin / 60)}h · {d.tables.length} {d.tables.length > 1 ? 'tables' : 'table'}
        </Text>
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          <AccessBadge access={access} live={isOnAir(st)} locked={!canWatch(access, state, isOnAir(st))} />
          <StatusBadge status={st} size="sm" />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  crumbs: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: space.gutter, paddingTop: 16 },
  board: { marginHorizontal: space.gutter, marginTop: 16, borderRadius: radius.panel, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, overflow: 'hidden' },
  boardHead: { flexDirection: 'row', gap: 16, padding: 20, borderBottomWidth: 1, borderBottomColor: colors.line },
  braceletBox: { width: 56, height: 56, borderRadius: radius.card, borderWidth: 1, borderColor: 'rgba(201,169,97,0.4)', backgroundColor: colors.goldDim, alignItems: 'center', justifyContent: 'center' },
  h1: { color: colors.text, fontSize: 24, fontWeight: '900', letterSpacing: -0.4, marginTop: 4 },
  champion: { margin: 16, marginBottom: 0, padding: 12, borderRadius: radius.card, borderWidth: 1, borderColor: colors.lineStrong, alignItems: 'flex-end', gap: 4 },
  cells: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '50%', padding: 16, borderTopWidth: 1, borderTopColor: colors.line },
  cellValue: { color: colors.text, fontSize: 20, fontWeight: '900', marginTop: 4, ...type.tnum },
  day: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, padding: 10 },
  play: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
});
