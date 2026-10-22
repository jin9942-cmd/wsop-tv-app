// Watchlist (web demo MyListScreen): type filter and remove.
import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { SubHead } from '@/components/headers';
import { Seg } from '@/components/ui';
import { WatchlistRow } from '@/components/watchlist';
import type { MyListKind } from '@/data/types';
import { useApp } from '@/state/app';
import { colors, radius, space, type } from '@/theme';

type Filter = 'all' | MyListKind;
const FILTERS: Filter[] = ['all', 'vod', 'live', 'player', 'series'];
const LABEL: Record<Filter, string> = { all: 'All', vod: 'Videos', live: 'Live', player: 'Players', series: 'Events' };
const EMPTY: Record<Filter, { text: string; to: Href }> = {
  all: { text: 'Tap “Watchlist” on any video.', to: '/vod' },
  vod: { text: 'Tap “Watchlist” on any video.', to: '/vod' },
  live: { text: 'Open an upcoming broadcast in Schedule and tap “Watchlist”.', to: '/schedule' },
  player: { text: 'Open a player and tap Follow.', to: '/' },
  series: { text: 'Open a tournament and tap Save.', to: '/tournaments' },
};

export default function WatchlistScreen() {
  const { myList } = useApp();
  const [filter, setFilter] = useState<Filter>('all');
  const shown = myList.filter((x) => filter === 'all' || x.kind === filter);
  const count = (f: Filter) => (f === 'all' ? myList.length : myList.filter((x) => x.kind === f).length);
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SubHead title="Watchlist" />
      <Seg value={filter} options={FILTERS} label={(f) => `${LABEL[f]} ${count(f)}`} onChange={setFilter} scroll />
      <FlatList
        data={shown}
        keyExtractor={(it) => `${it.kind}-${it.id}`}
        renderItem={({ item }) => <WatchlistRow item={item} removable />}
        ListEmptyComponent={
          <Pressable style={styles.empty} onPress={() => router.navigate(EMPTY[filter].to)} accessibilityRole="button">
            <Text style={type.h3}>Nothing here yet</Text>
            <Text style={type.small}>{EMPTY[filter].text}</Text>
          </Pressable>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { margin: space.gutter, padding: 16, borderRadius: radius.card, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.lineStrong, gap: 4 },
});
