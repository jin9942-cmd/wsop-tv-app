// Players (web demo v2 pages/Players.tsx): search + nationality filter.
import { useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { PlayerTile } from '@/components/cards';
import { SubHead } from '@/components/headers';
import { Button, EmptyState, FilterChip, Icon, PageHeader } from '@/components/ui';
import { players } from '@/data/mock';
import { colors, radius, space, type } from '@/theme';

export default function Players() {
  const [q, setQ] = useState('');
  const [cc, setCc] = useState('');
  const countries = useMemo(() => [...new Set(players.map((p) => p.country))].sort(), []);
  const list = players.filter((p) => (!cc || p.country === cc) && (!q || p.name.toLowerCase().includes(q.toLowerCase()))).sort((a, b) => b.earnings - a.earnings);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SubHead />
      <FlatList
        data={list}
        keyExtractor={(p) => p.id}
        numColumns={2}
        columnWrapperStyle={{ paddingHorizontal: space.gutter, gap: 12 }}
        renderItem={({ item }) => (
          <View style={{ flex: 1, maxWidth: '50%', marginBottom: 16 }}>
            <PlayerTile player={item} />
          </View>
        )}
        ListHeaderComponent={
          <>
            <PageHeader kicker="Competitors" title="Players" />
            <View style={styles.search}>
              <Icon name="search" size={16} color={colors.subtle} />
              <TextInput value={q} onChangeText={setQ} placeholder="Search players" placeholderTextColor={colors.subtle} style={styles.input} accessibilityLabel="Search players" />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} accessibilityLabel="Nationality">
              <FilterChip on={!cc} onPress={() => setCc('')}>
                All nationalities
              </FilterChip>
              {countries.map((c) => (
                <FilterChip key={c} on={cc === c} onPress={() => setCc(c)}>
                  {c}
                </FilterChip>
              ))}
            </ScrollView>
            <Text style={[type.small, type.tnum, { paddingHorizontal: space.gutter, marginBottom: 12 }]}>{list.length} players</Text>
          </>
        }
        ListEmptyComponent={
          <EmptyState title={`No players match “${q}”`} body="Try a different name or clear the nationality filter.">
            <Button size="sm" variant="outline" title="Clear filters" onPress={() => (setQ(''), setCc(''))} />
          </EmptyState>
        }
        contentContainerStyle={{ paddingBottom: 32 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: space.gutter, marginTop: 12, minHeight: 44, paddingHorizontal: 12, borderRadius: radius.chip, borderWidth: 1, borderColor: colors.lineStrong, backgroundColor: colors.surface },
  input: { flex: 1, color: colors.text, fontSize: 14 },
  chips: { gap: 8, paddingHorizontal: space.gutter, paddingVertical: 14 },
});
