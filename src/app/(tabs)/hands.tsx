// Hands & Clips (web demo v2 pages/Hands.tsx): filter chips by hand type, Trending / Biggest pot.
import { useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';

import { HandCard } from '@/components/cards';
import { AppHeader } from '@/components/headers';
import { HAND_META, HandGlyph } from '@/components/markers';
import { EmptyState, FilterChip, PageHeader, Segmented } from '@/components/ui';
import { hands } from '@/data/mock';
import type { HandType } from '@/data/types';
import { colors, space, type } from '@/theme';

const FILTERS: HandType[] = ['allin', 'bigpot', 'bluff', 'badbeat', 'herofold'];

export default function Hands() {
  const [types, setTypes] = useState<HandType[]>([]);
  const [sort, setSort] = useState<'trending' | 'pot'>('trending');
  const list = hands.filter((h) => !types.length || types.includes(h.type)).sort((a, b) => (sort === 'pot' ? b.pot - a.pot : b.views - a.views));
  const toggle = (t: HandType) => setTypes((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t]));

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      data={list}
      keyExtractor={(h) => h.id}
      renderItem={({ item }) => (
        <View style={{ paddingHorizontal: space.gutter, marginBottom: 16 }}>
          <HandCard hand={item} />
        </View>
      )}
      ListHeaderComponent={
        <>
          <AppHeader />
          <View style={{ paddingTop: 12 }}>
            <PageHeader kicker="Every key moment" title="Hands & Clips" />
          </View>
          <View style={{ paddingHorizontal: space.gutter, marginTop: 8 }}>
            <Segmented
              label="Sort"
              value={sort}
              onChange={setSort}
              options={[
                { value: 'trending', label: 'Trending' },
                { value: 'pot', label: 'Biggest pot' },
              ]}
            />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} accessibilityLabel="Filter by hand type">
            <FilterChip on={!types.length} onPress={() => setTypes([])}>
              All
            </FilterChip>
            {FILTERS.map((t) => (
              <FilterChip key={t} on={types.includes(t)} onPress={() => toggle(t)}>
                <HandGlyph type={t} size={14} />
                <Text style={[styles.chipText, types.includes(t) && { color: colors.goldStrong }]}>{HAND_META[t].label}</Text>
              </FilterChip>
            ))}
          </ScrollView>
          <Text style={[type.small, type.tnum, { paddingHorizontal: space.gutter, marginBottom: 12 }]}>{list.length} hands</Text>
        </>
      }
      ListEmptyComponent={<EmptyState title="No hands match these filters" />}
      contentContainerStyle={{ paddingBottom: 24 }}
      initialNumToRender={4}
    />
  );
}

const styles = StyleSheet.create({
  chips: { gap: 8, paddingHorizontal: space.gutter, paddingVertical: 16 },
  chipText: { color: colors.muted, fontSize: 13, fontWeight: '700' },
});
