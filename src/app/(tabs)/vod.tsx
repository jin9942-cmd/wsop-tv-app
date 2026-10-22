// VOD list (web demo SCR-05): type chips, tournament filter, Latest / Most popular.
import { useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';

import { VodCard } from '@/components/cards';
import { AppHeader } from '@/components/headers';
import { Chip, Empty, Seg } from '@/components/ui';
import { series } from '@/data/series';
import type { VodType } from '@/data/types';
import { vods } from '@/data/vods';
import { colors, space } from '@/theme';

const TYPES: VodType[] = ['Full Replay', 'Highlight', 'Clip', 'Hand', 'Interview', 'Shorts'];
const SORTS = ['latest', 'popular'] as const;

export default function VodScreen() {
  const [type, setType] = useState<VodType | ''>('');
  const [seriesId, setSeriesId] = useState('');
  const [sort, setSort] = useState<(typeof SORTS)[number]>('latest');
  const list = vods
    .filter((v) => (!seriesId || v.seriesId === seriesId) && (!type || v.type === type))
    .sort((a, b) => (sort === 'latest' ? b.publishedAt.localeCompare(a.publishedAt) : b.views - a.views));

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      data={list}
      keyExtractor={(v) => v.id}
      numColumns={2}
      columnWrapperStyle={{ gap: 12, paddingHorizontal: space.gutter }}
      renderItem={({ item }) => (
        <View style={{ flex: 1, maxWidth: '50%', marginBottom: 16 }}>
          <VodCard v={item} />
        </View>
      )}
      ListHeaderComponent={
        <>
          <AppHeader title="VOD" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            <Chip label="All" on={!type} onPress={() => setType('')} />
            {TYPES.map((t) => (
              <Chip key={t} label={t} on={type === t} onPress={() => setType(t)} />
            ))}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            <Chip label="All tournaments" on={!seriesId} onPress={() => setSeriesId('')} />
            {series.map((x) => (
              <Chip key={x.id} label={x.name.replace('2026 ', '')} on={seriesId === x.id} onPress={() => setSeriesId(x.id)} />
            ))}
          </ScrollView>
          <Seg value={sort} options={SORTS} label={(s) => (s === 'latest' ? 'Latest' : 'Most popular')} onChange={setSort} />
        </>
      }
      ListEmptyComponent={<Empty text="No videos match these filters." />}
      contentContainerStyle={{ paddingBottom: 24 }}
      initialNumToRender={8}
    />
  );
}

const styles = StyleSheet.create({
  chips: { gap: 8, paddingHorizontal: space.gutter, paddingBottom: 10 },
});
