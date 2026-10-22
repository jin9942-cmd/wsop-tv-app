// Search (web demo SCR-09): recent / popular searches, results by VOD · Players · Tournaments.
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SeriesCard, VodCard } from '@/components/cards';
import { goBack } from '@/components/headers';
import { Avatar, Chip, Empty, Icon, IconButton, Seg } from '@/components/ui';
import { series } from '@/data/series';
import { players, popularSearches, vods } from '@/data/vods';
import { useApp, useNow } from '@/state/app';
import { colors, radius, space, type } from '@/theme';

const TABS = ['vod', 'player', 'series'] as const;
type Tab = (typeof TABS)[number];

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const { recentSearches, set } = useApp();
  const now = useNow(60_000);
  const [q, setQ] = useState('');
  const [tab, setTab] = useState<Tab>('vod');
  const term = q.trim().toLowerCase();

  const vodHits = term ? vods.filter((v) => `${v.title} ${v.type} ${v.description}`.toLowerCase().includes(term)) : [];
  const playerHits = term ? players.filter((p) => `${p.name} ${p.country}`.toLowerCase().includes(term)) : [];
  const seriesHits = term ? series.filter((s) => `${s.name} ${s.city} ${s.tour}`.toLowerCase().includes(term)) : [];
  const counts = { vod: vodHits.length, player: playerHits.length, series: seriesHits.length };

  const run = (text: string) => {
    setQ(text);
    const t = text.trim();
    if (t) set((s) => ({ recentSearches: [t, ...s.recentSearches.filter((x) => x !== t)].slice(0, 6) }));
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.head, { paddingTop: insets.top + 4 }]}>
        <IconButton name="back" label="Back" onPress={goBack} />
        <View style={styles.box}>
          <Icon name="search" size={18} color={colors.muted} />
          <TextInput
            autoFocus
            value={q}
            onChangeText={setQ}
            onSubmitEditing={() => run(q)}
            placeholder="Videos, players, tournaments"
            placeholderTextColor={colors.subtle}
            style={styles.input}
            returnKeyType="search"
            accessibilityLabel="Search"
          />
          {!!q && <IconButton name="close" label="Clear" size={18} color={colors.muted} onPress={() => setQ('')} />}
        </View>
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 32 }}>
        {!term ? (
          <View style={{ paddingHorizontal: space.gutter }}>
            {recentSearches.length > 0 && (
              <>
                <Text style={styles.mini}>Recent searches</Text>
                <View style={styles.cloud}>
                  {recentSearches.map((r) => (
                    <Chip key={r} label={r} onPress={() => run(r)} />
                  ))}
                </View>
              </>
            )}
            <Text style={styles.mini}>Popular searches</Text>
            {popularSearches.map((p, i) => (
              <Pressable key={p} style={styles.popular} onPress={() => run(p)} accessibilityRole="button">
                <Text style={styles.popularN}>{i + 1}</Text>
                <Text style={type.body}>{p}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <>
            <Seg value={tab} options={TABS} label={(t) => `${t === 'vod' ? 'VOD' : t === 'player' ? 'Players' : 'Tournaments'} ${counts[t]}`} onChange={setTab} />
            {tab === 'vod' &&
              (vodHits.length ? (
                <View style={styles.grid}>
                  {vodHits.map((v) => (
                    <View key={v.id} style={styles.cell}>
                      <VodCard v={v} />
                    </View>
                  ))}
                </View>
              ) : (
                <Empty text={`No results for “${q}”.`} />
              ))}
            {tab === 'player' &&
              (playerHits.length ? (
                playerHits.map((p) => (
                  <Pressable key={p.id} style={styles.playerRow} onPress={() => router.push({ pathname: '/player/[id]', params: { id: p.id } })} accessibilityRole="button">
                    <Avatar name={p.name} hue={p.hue} size={44} />
                    <View>
                      <Text style={[type.body, { fontWeight: '700' }]}>{p.name}</Text>
                      <Text style={type.small}>
                        {p.flag} {p.country}
                      </Text>
                    </View>
                  </Pressable>
                ))
              ) : (
                <Empty text={`No results for “${q}”.`} />
              ))}
            {tab === 'series' &&
              (seriesHits.length ? (
                <View style={{ paddingHorizontal: space.gutter, gap: 18 }}>
                  {seriesHits.map((s) => (
                    <SeriesCard key={s.id} id={s.id} now={now} />
                  ))}
                </View>
              ) : (
                <Empty text={`No results for “${q}”.`} />
              ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, paddingRight: space.gutter, paddingBottom: 10, gap: 4 },
  box: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingLeft: 12, borderRadius: radius.button, backgroundColor: colors.surface2 },
  input: { flex: 1, color: colors.text, fontSize: 15, paddingVertical: 8 },
  mini: { ...type.label, marginTop: 18, marginBottom: 10 },
  cloud: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  popular: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 44 },
  popularN: { color: colors.gold, fontWeight: '900', width: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: space.gutter, gap: 12 },
  cell: { width: '47%', flexGrow: 1, marginBottom: 6 },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: space.gutter, paddingVertical: 10 },
});
