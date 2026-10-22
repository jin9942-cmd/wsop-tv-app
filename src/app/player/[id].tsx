// Player profile (web demo SCR-08). Fictional players only.
import { useLocalSearchParams } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { MyListButton, VodCard } from '@/components/cards';
import { SubHead } from '@/components/headers';
import { Missing } from '@/components/missing';
import { Avatar, Empty, SectionHead } from '@/components/ui';
import { playerById, vods } from '@/data/vods';
import { fmtMoney } from '@/lib/time';
import { colors, radius, space, type } from '@/theme';

export default function PlayerDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const p = playerById(id);
  if (!p) return <Missing />;
  const related = vods.filter((v) => v.playerIds.includes(p.id));
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SubHead title={p.name} />
      <FlatList
        data={related}
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
            <View style={styles.profile}>
              <Avatar name={p.name} hue={p.hue} size={96} />
              <Text style={[type.h2, { marginTop: 10 }]}>{p.name}</Text>
              <Text style={type.small}>
                {p.flag} {p.country}
              </Text>
              <Text style={styles.fictional}>Fictional demo player</Text>
              <MyListButton kind="player" id={p.id} />
            </View>
            <View style={styles.stats}>
              {[
                ['Bracelets', String(p.bracelets)],
                ['Rings', String(p.rings)],
                ['Earnings', fmtMoney(p.earnings)],
              ].map(([k, v]) => (
                <View key={k} style={styles.stat}>
                  <Text style={type.label}>{k}</Text>
                  <Text style={[type.h3, type.tnum, { marginTop: 4 }]} numberOfLines={1} adjustsFontSizeToFit>
                    {v}
                  </Text>
                </View>
              ))}
            </View>
            <View style={{ marginTop: 24 }}>
              <SectionHead title="Videos" />
            </View>
          </>
        }
        ListEmptyComponent={<Empty text="No videos yet." />}
        contentContainerStyle={{ paddingBottom: 32 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  profile: { alignItems: 'center', paddingTop: 12, gap: 4 },
  fictional: { color: colors.subtle, fontSize: 11, marginBottom: 8 },
  stats: { flexDirection: 'row', gap: 10, paddingHorizontal: space.gutter, marginTop: 16 },
  stat: { flex: 1, padding: 12, borderRadius: radius.card, backgroundColor: colors.surface },
});
