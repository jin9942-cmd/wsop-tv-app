// My List (web demo v2 features/library/MyList.tsx): saved events, broadcasts, classics and hands.
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { CardStack, ListItemCard } from '@/components/cards';
import { SubHead } from '@/components/headers';
import { Button, FilterChip, PageHeader } from '@/components/ui';
import { useApp, type ListKind } from '@/state/app';
import { colors, radius, space, type } from '@/theme';

const KIND_FILTERS: { v: ListKind | 'all'; label: string }[] = [
  { v: 'all', label: 'All' },
  { v: 'event', label: 'Events' },
  { v: 'day', label: 'Broadcasts' },
  { v: 'archive', label: 'Classics' },
  { v: 'hand', label: 'Hands & Clips' },
];

export default function MyList() {
  const { state, signedIn, requireLogin } = useApp();
  const [kind, setKind] = useState<ListKind | 'all'>('all');
  if (!signedIn)
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <SubHead />
        <View style={styles.center}>
          <Text style={[type.label, { color: colors.gold }]}>My List</Text>
          <Text style={[type.title, { textAlign: 'center' }]}>Sign in to see your list</Text>
          <Text style={[type.small, { textAlign: 'center' }]}>Save events, broadcasts, classics and hands to watch later.</Text>
          <Button variant="primary" size="lg" title="Continue with GGPASS" onPress={() => requireLogin('Sign in to see My List.')} />
        </View>
      </View>
    );
  const items = [...state.myList].sort((a, b) => b.addedAt - a.addedAt).filter((x) => kind === 'all' || x.kind === kind);
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SubHead />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <PageHeader kicker="Saved" title="My List" intro="Most recently added first. Saving an upcoming broadcast doesn’t set a reminder — use Remind me for that." />
        {state.myList.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {KIND_FILTERS.map((f) => (
              <FilterChip key={f.v} on={kind === f.v} onPress={() => setKind(f.v)}>
                {`${f.label} ${f.v === 'all' ? state.myList.length : state.myList.filter((x) => x.kind === f.v).length}`}
              </FilterChip>
            ))}
          </ScrollView>
        )}
        {state.myList.length === 0 ? (
          <View style={styles.empty}>
            <Text style={type.h2}>Your list is empty</Text>
            <Text style={[type.small, { marginTop: 4 }]}>Save events, broadcasts, classics and hands to come back to them later.</Text>
            {[
              ['On a card', 'Long-press a card, or open ⋯ → Add to My List'],
              ['While watching', 'Use the + My List button under the player'],
              ['On an event page', 'Use + My List next to the event name'],
            ].map(([k, v], i) => (
              <View key={k} style={styles.step}>
                <Text style={[type.label, { color: colors.gold, fontSize: 10 }]}>
                  {i + 1} · {k}
                </Text>
                <Text style={[type.small, { marginTop: 4 }]}>{v}</Text>
              </View>
            ))}
            <Text style={[type.small, { color: colors.gold, fontWeight: '700', marginTop: 16 }]} onPress={() => router.navigate('/')}>
              Browse Home →
            </Text>
          </View>
        ) : items.length === 0 ? (
          <Text style={[type.small, { paddingHorizontal: space.gutter, marginTop: 24 }]}>Nothing of this type in your list yet.</Text>
        ) : (
          <View style={{ marginTop: 8 }}>
            <CardStack>
              {items.map((x) => (
                <ListItemCard key={x.kind + x.id} item={x} />
              ))}
            </CardStack>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  chips: { gap: 8, paddingHorizontal: space.gutter, paddingVertical: 16 },
  empty: { margin: space.gutter, marginTop: 24, padding: 20, borderRadius: radius.panel, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.lineStrong },
  step: { marginTop: 12, padding: 14, borderRadius: radius.card, backgroundColor: colors.surface },
});
