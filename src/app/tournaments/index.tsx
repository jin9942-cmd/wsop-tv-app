// Tournaments (web demo SCR-07): On now / Upcoming / Completed, filtered by tour.
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { SeriesCard } from '@/components/cards';
import { SubHead } from '@/components/headers';
import { Chip, Section, SectionHead } from '@/components/ui';
import { series, tours } from '@/data/series';
import type { SeriesPhase, TourId } from '@/data/types';
import { phaseOf } from '@/lib/access';
import { useNow } from '@/state/app';
import { colors, space } from '@/theme';

const GROUPS: { phase: SeriesPhase; label: string }[] = [
  { phase: 'ongoing', label: 'On now' },
  { phase: 'upcoming', label: 'Upcoming' },
  { phase: 'ended', label: 'Completed' },
];

export default function TournamentsScreen() {
  const now = useNow(60_000);
  const [tour, setTour] = useState<TourId | ''>('');
  const list = series.filter((x) => !tour || x.tour === tour);
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SubHead title="Tournaments" />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip label="All" on={!tour} onPress={() => setTour('')} />
          {tours.map((t) => (
            <Chip key={t} label={t} on={tour === t} onPress={() => setTour(t)} />
          ))}
        </ScrollView>
        {GROUPS.map((g) => {
          const items = list.filter((x) => phaseOf(x, now) === g.phase);
          if (!items.length) return null;
          return (
            <Section key={g.phase} style={{ marginTop: 18 }}>
              <SectionHead title={g.label} />
              <View style={styles.stack}>
                {items.map((x) => (
                  <SeriesCard key={x.id} id={x.id} now={now} />
                ))}
              </View>
            </Section>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { gap: 8, paddingHorizontal: space.gutter, paddingTop: 4 },
  stack: { paddingHorizontal: space.gutter, gap: 18 },
});
