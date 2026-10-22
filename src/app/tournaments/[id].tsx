// Tournament detail (web demo SCR-07 SeriesDetail): live now, events, broadcast schedule, videos.
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { HRow, LiveCard, MyListButton, ScheduleRow, VodCard } from '@/components/cards';
import { SubHead } from '@/components/headers';
import { Missing } from '@/components/missing';
import { Art, Corner, Empty, Pill, Section, SectionHead } from '@/components/ui';
import { schedules } from '@/data/schedules';
import { events, seriesById } from '@/data/series';
import { vods } from '@/data/vods';
import { phaseOf, statusOf } from '@/lib/access';
import { fmtSeriesDates, fmtShortKey } from '@/lib/time';
import { useNow } from '@/state/app';
import { colors, space, type } from '@/theme';

export default function SeriesDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const now = useNow(5000);
  const se = seriesById(id);
  if (!se) return <Missing />;
  const evs = events.filter((e) => e.seriesId === se.id).sort((a, b) => a.number - b.number);
  const slots = schedules.filter((s) => s.seriesId === se.id);
  const live = slots.filter((s) => statusOf(s, now) === 'live');
  const upcoming = slots.filter((s) => statusOf(s, now) === 'upcoming').sort((a, b) => a.start.localeCompare(b.start)).slice(0, 5);
  const seriesVods = vods.filter((v) => v.seriesId === se.id).slice(0, 8);
  const phase = phaseOf(se, now);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SubHead title={se.name} />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <Art hue={se.hue} title={se.name} sub={`${se.venue} · ${se.city}`} ratio={2} style={{ borderRadius: 0 }}>
          <Corner at="tl">
            <Pill>{se.tour}</Pill>
          </Corner>
          {phase === 'ongoing' && (
            <Corner at="tr">
              <Pill>ON NOW</Pill>
            </Corner>
          )}
        </Art>
        <View style={styles.detail}>
          <Text style={type.h2}>{se.name}</Text>
          <Text style={styles.meta}>
            {fmtSeriesDates(se.start, se.end)} · {se.venue}, {se.city}
          </Text>
          <Text style={styles.meta}>Local time zone: {se.timezone}</Text>
          <View style={{ marginTop: 10 }}>
            <MyListButton kind="series" id={se.id} />
          </View>
        </View>

        {live.length > 0 && (
          <Section>
            <SectionHead title="Live now" />
            <HRow data={live} keyOf={(s) => s.id} render={(s) => <LiveCard s={s} now={now} />} />
          </Section>
        )}

        <Section>
          <SectionHead title="Events" />
          {evs.map((e) => (
            <View key={e.id} style={styles.event}>
              <Text style={styles.eventNo}>#{e.number}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[type.body, { fontWeight: '700' }]}>
                  {e.buyIn} {e.name}
                </Text>
                <Text style={type.small}>{e.days.map((d) => `${d.label} ${fmtShortKey(d.date)}`).join(' · ')}</Text>
              </View>
            </View>
          ))}
        </Section>

        {upcoming.length > 0 && (
          <Section>
            <SectionHead title="Broadcast schedule" />
            {upcoming.map((s) => (
              <ScheduleRow key={s.id} s={s} now={now} />
            ))}
          </Section>
        )}

        {seriesVods.length > 0 && (
          <Section>
            <SectionHead title="Videos" />
            <HRow data={seriesVods} keyOf={(v) => v.id} width={200} render={(v) => <VodCard v={v} />} />
          </Section>
        )}
        {!live.length && !upcoming.length && !seriesVods.length && <Empty text="Broadcast details coming soon." />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  detail: { paddingHorizontal: space.gutter, paddingTop: 14 },
  meta: { color: colors.muted, fontSize: 13, marginTop: 4 },
  event: { flexDirection: 'row', gap: 12, paddingHorizontal: space.gutter, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  eventNo: { color: colors.gold, fontWeight: '900', width: 36, ...type.tnum },
});
