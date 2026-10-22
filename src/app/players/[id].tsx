// Player profile (web demo v2 pages/Players.tsx PlayerProfile): earnings, bracelets, POY rank, follow + alerts,
// recent results, highlight hands. Fictional players only.
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { HandCard } from '@/components/cards';
import { SubHead } from '@/components/headers';
import { Missing } from '@/components/missing';
import { Avatar, BraceletCount, Button, CountryCode, EmptyState, SectionHeader, Switch } from '@/components/ui';
import { eventById, hands, players } from '@/data/mock';
import { count, money, ordinal } from '@/lib/format';
import { useApp } from '@/state/app';
import { colors, radius, space, type } from '@/theme';

export default function PlayerProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, set, toast, signedIn, requireLogin } = useApp();
  const p = players.find((x) => x.id === id);
  if (!p) return <Missing />;
  const follow = state.followed[p.id];
  const highlights = hands.filter((h) => h.playerIds.includes(p.id)).slice(0, 6);
  const rank = [...players].sort((a, b) => b.poyPoints - a.poyPoints).findIndex((x) => x.id === p.id) + 1;

  const doFollow = (on: boolean) => {
    set((s) => {
      const next = { ...s.followed };
      if (on) next[p.id] = { notify: true };
      else delete next[p.id];
      return { followed: next };
    });
    toast(on ? `Following ${p.name} · alerts on` : `Unfollowed ${p.name}`);
  };
  const toggleFollow = () => (signedIn ? doFollow(!follow) : requireLogin(`Sign in to follow ${p.name}.`, () => doFollow(true)));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SubHead title={p.name} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.card}>
          <Avatar name={p.name} hue={p.hue} size={96} ring={p.bracelets > 0} />
          <View style={[styles.inline, { marginTop: 16 }]}>
            <CountryCode cc={p.cc} />
            <Text style={type.small}>{p.country}</Text>
          </View>
          <Text style={styles.h1}>{p.name}</Text>
          <View style={styles.stats}>
            <View style={{ flex: 1 }}>
              <Text style={type.label}>Total earnings</Text>
              <Text style={styles.stat} numberOfLines={1} adjustsFontSizeToFit>
                {money(p.earnings)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={type.label}>Bracelets</Text>
              <View style={{ marginTop: 4 }}>
                <BraceletCount n={p.bracelets} size={20} />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={type.label}>POY rank</Text>
              <Text style={styles.stat}>#{rank}</Text>
            </View>
          </View>
          <Button variant={follow ? 'secondary' : 'primary'} icon={follow ? 'check' : undefined} title={follow ? 'Following' : 'Follow'} pressed={!!follow} block onPress={toggleFollow} style={{ marginTop: 20 }} />
          {follow && (
            <Switch label="Alerts" description="When they play on a broadcast table" on={follow.notify} onChange={(v) => set((s) => ({ followed: { ...s.followed, [p.id]: { notify: v } } }))} />
          )}
        </View>

        <View style={{ marginTop: 32 }}>
          <SectionHeader title="Recent results" />
          {p.recent.length ? (
            <View style={styles.list}>
              {p.recent.map((r, i) => {
                const e = eventById(r.eventId)!;
                return (
                  <View key={r.eventId} style={[styles.result, i === p.recent.length - 1 && { borderBottomWidth: 0 }]}>
                    <Text style={[type.tnum, { width: 44, color: colors.text, fontSize: 17, fontWeight: '900' }]}>{ordinal(r.place)}</Text>
                    <Pressable style={{ flex: 1 }} onPress={() => router.push({ pathname: '/events/[id]', params: { id: e.id } })} accessibilityRole="link">
                      <Text style={[type.body, { fontWeight: '700' }]} numberOfLines={1}>
                        #{e.number} {e.name}
                      </Text>
                    </Pressable>
                    <Text style={[type.small, type.tnum, { color: colors.text }]}>{money(r.prize)}</Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={[type.small, { paddingHorizontal: space.gutter }]}>No cashes recorded in the current series.</Text>
          )}
        </View>

        <View style={{ marginTop: 32 }}>
          <SectionHeader title="Highlight hands" />
          {highlights.length ? (
            <View style={{ gap: 16, paddingHorizontal: space.gutter }}>
              {highlights.map((h) => (
                <HandCard key={h.id} hand={h} />
              ))}
            </View>
          ) : (
            <EmptyState title="No highlight hands yet" />
          )}
        </View>
        <Text style={[type.caption, { paddingHorizontal: space.gutter, marginTop: 24 }]}>Player of the Year points: {count(p.poyPoints)} · Fictional player for demo purposes.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  inline: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  card: { margin: space.gutter, padding: 20, borderRadius: radius.panel, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  h1: { color: colors.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.5, marginTop: 4 },
  stats: { flexDirection: 'row', gap: 12, marginTop: 16 },
  stat: { color: colors.text, fontSize: 17, fontWeight: '900', marginTop: 4, ...type.tnum },
  list: { marginHorizontal: space.gutter, borderRadius: radius.panel, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  result: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
});
