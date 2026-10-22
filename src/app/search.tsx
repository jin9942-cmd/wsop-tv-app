// Search (web demo v2 pages/Search.tsx): recent searches + ideas; results with Status / Access filters and tabs
// (All · Events · Hands & Clips · Players · Archive). Outcomes are never indexed, so search can't spoil anything.
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HandCard } from '@/components/cards';
import { goBack } from '@/components/headers';
import { AccessBadge, Avatar, EmptyState, FilterChip, Icon, IconButton, StatusBadge, Tabs } from '@/components/ui';
import { hands, players } from '@/data/mock';
import { requiredTier, TIER_BADGE, type Tier } from '@/data/policy';
import { isOnAir } from '@/lib/broadcast';
import { buildIndex, KIND_LABEL, search, type SearchItem, type SearchKind, type SearchStatus } from '@/lib/search';
import { canWatch, useApp } from '@/state/app';
import { colors, radius, space, type } from '@/theme';

type Tab = 'all' | 'events' | 'hands' | 'players' | 'archive';
const TAB_KINDS: Record<Tab, SearchKind[]> = { all: ['event', 'day', 'hand', 'player', 'archive'], events: ['event', 'day'], hands: ['hand'], players: ['player'], archive: ['archive'] };
const TAB_LABEL: Record<Tab, string> = { all: 'All', events: 'Events', hands: 'Hands & Clips', players: 'Players', archive: 'Archive' };
const STATUS_LABEL: Record<SearchStatus, string> = { live: 'Live', upcoming: 'Upcoming', vod: 'VOD' };
const TIERS: Tier[] = ['free', 'wsopFree', 'basic', 'premium'];
const IDEAS = ['Main Event', 'Final Table', 'High Roller', 'Lindgren', 'Pot-Limit Omaha', 'All-in'];
const liveOf = (it: SearchItem) => !!it.badge && isOnAir(it.badge);

export default function Search() {
  const insets = useSafeAreaInsets();
  const { state, set, status } = useApp();
  const [draft, setDraft] = useState('');
  const [q, setQ] = useState('');
  const [tab, setTab] = useState<Tab>('all');
  const [statuses, setStatuses] = useState<SearchStatus[]>([]);
  const [access, setAccess] = useState<Tier[]>([]);

  // The index follows the demo state (stream overrides, spoiler-free titles).
  const index = useMemo(() => buildIndex(status, state.spoilerFree), [status, state.spoilerFree]);
  const results = useMemo(() => (q ? search(index, q) : []), [index, q]);
  const filtered = results.filter(
    (r) => (!statuses.length || (r.status && statuses.includes(r.status))) && (!access.length || (r.access && access.includes(requiredTier(r.access, state.includedFrom, liveOf(r))))),
  );
  const ofTab = (t: Tab) => filtered.filter((r) => TAB_KINDS[t].includes(r.kind));
  const filtersOn = statuses.length + access.length;

  const commit = (text: string) => {
    const v = text.trim();
    setDraft(v);
    setQ(v);
    if (v) set((s) => ({ recentSearches: [v, ...s.recentSearches.filter((x) => x.toLowerCase() !== v.toLowerCase())].slice(0, 8) }));
  };
  const removeRecent = (v: string) => set((s) => ({ recentSearches: s.recentSearches.filter((x) => x !== v) }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.head, { paddingTop: insets.top + 6 }]}>
        <IconButton name="back" label="Back" color={colors.text} onPress={goBack} />
        <View style={styles.box}>
          <Icon name="search" size={20} color={colors.subtle} />
          <TextInput
            autoFocus
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={() => commit(draft)}
            returnKeyType="search"
            placeholder="Search events, broadcasts, hands, players…"
            placeholderTextColor={colors.subtle}
            style={styles.input}
            accessibilityLabel="Search events, broadcasts, hands, players and the archive"
          />
          {!!draft && <IconButton name="close" label="Clear search" size={18} onPress={() => commit('')} />}
        </View>
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
        {!q ? (
          <View style={{ padding: space.gutter, gap: 28 }}>
            <View>
              <Text style={[type.label, { marginBottom: 12 }]}>Recent searches</Text>
              {state.recentSearches.length ? (
                <View style={styles.wrap}>
                  {state.recentSearches.map((r) => (
                    <View key={r} style={styles.recent}>
                      <Pressable onPress={() => commit(r)} accessibilityRole="button" style={{ paddingLeft: 14, paddingVertical: 7, paddingRight: 4 }}>
                        <Text style={[type.small, { color: colors.text, fontWeight: '700' }]}>{r}</Text>
                      </Pressable>
                      <IconButton name="close" size={12} label={`Remove “${r}” from recent searches`} onPress={() => removeRecent(r)} />
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={type.small}>Your searches will show up here.</Text>
              )}
            </View>
            <View>
              <Text style={[type.label, { marginBottom: 12 }]}>Try searching for</Text>
              <View style={styles.wrap}>
                {IDEAS.map((i) => (
                  <FilterChip key={i} on={false} onPress={() => commit(i)}>
                    {i}
                  </FilterChip>
                ))}
              </View>
            </View>
          </View>
        ) : (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters} accessibilityLabel="Filters">
              <Text style={type.label}>Status</Text>
              {(Object.keys(STATUS_LABEL) as SearchStatus[]).map((s) => (
                <FilterChip key={s} on={statuses.includes(s)} onPress={() => setStatuses((x) => (x.includes(s) ? x.filter((y) => y !== s) : [...x, s]))}>
                  {STATUS_LABEL[s]}
                </FilterChip>
              ))}
              <Text style={[type.label, { marginLeft: 8 }]}>Access</Text>
              {TIERS.map((a) => (
                <FilterChip key={a} on={access.includes(a)} onPress={() => setAccess((x) => (x.includes(a) ? x.filter((y) => y !== a) : [...x, a]))}>
                  {TIER_BADGE[a]}
                </FilterChip>
              ))}
              {filtersOn > 0 && (
                <Pressable onPress={() => (setStatuses([]), setAccess([]))} accessibilityRole="button" style={{ justifyContent: 'center' }}>
                  <Text style={[type.small, { fontWeight: '700' }]}>Clear filters</Text>
                </Pressable>
              )}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space.gutter }}>
              <Tabs<Tab> label="Result type" value={tab} onChange={setTab} tabs={(Object.keys(TAB_LABEL) as Tab[]).map((t) => ({ value: t, label: `${TAB_LABEL[t]} · ${ofTab(t).length}` }))} />
            </ScrollView>
            {ofTab(tab).length === 0 ? (
              <NoResults q={q} filtered={filtersOn > 0} />
            ) : tab === 'all' ? (
              <View style={{ gap: 28, marginTop: 20 }}>
                {(['events', 'hands', 'players', 'archive'] as Tab[])
                  .filter((t) => ofTab(t).length)
                  .map((t) => (
                    <View key={t}>
                      <View style={styles.groupHead}>
                        <Text style={type.h3}>{TAB_LABEL[t]}</Text>
                        {ofTab(t).length > 4 && (
                          <Text style={[type.small, { fontWeight: '700' }]} onPress={() => setTab(t)}>
                            See all {ofTab(t).length} →
                          </Text>
                        )}
                      </View>
                      <ResultList items={ofTab(t).slice(0, 4)} />
                    </View>
                  ))}
              </View>
            ) : (
              <View style={{ marginTop: 20 }}>
                <ResultList items={ofTab(tab)} />
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function ResultList({ items }: { items: SearchItem[] }) {
  return (
    <View style={styles.list}>
      {items.map((it, i) => (
        <ResultRow key={it.kind + it.id} it={it} last={i === items.length - 1} />
      ))}
    </View>
  );
}

function ResultRow({ it, last }: { it: SearchItem; last: boolean }) {
  const { state } = useApp();
  const p = it.kind === 'player' ? players.find((x) => x.id === it.id) : undefined;
  return (
    <Pressable onPress={() => router.push(it.url as Href)} accessibilityRole="link" style={({ pressed }) => [styles.row, last && { borderBottomWidth: 0 }, pressed && { backgroundColor: colors.surface2 }]}>
      {p ? (
        <View style={{ width: 80, alignItems: 'center' }}>
          <Avatar name={p.name} hue={p.hue} size={40} vivid />
        </View>
      ) : (
        <View style={styles.thumb}>{it.image && <Image source={it.image} style={StyleSheet.absoluteFill} contentFit="cover" />}</View>
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[type.label, { fontSize: 10 }]}>{KIND_LABEL[it.kind]}</Text>
        <Text style={[type.body, { fontWeight: '700' }]} numberOfLines={1}>
          {it.title}
        </Text>
        <Text style={type.small} numberOfLines={1}>
          {it.sub}
        </Text>
        <View style={[styles.wrap, { marginTop: 4, gap: 6 }]}>
          {it.badge && <StatusBadge status={it.badge} size="sm" />}
          {!it.badge && it.status === 'upcoming' && <StatusBadge status="upcoming" size="sm" />}
          {it.access && <AccessBadge access={it.access} live={liveOf(it)} locked={!canWatch(it.access, state, liveOf(it))} />}
        </View>
      </View>
    </Pressable>
  );
}

function NoResults({ q, filtered }: { q: string; filtered: boolean }) {
  const picks = [...hands].filter((h) => h.access === 'free').sort((a, b) => b.views - a.views).slice(0, 3);
  return (
    <View style={{ marginTop: 20, gap: 20 }}>
      <EmptyState title={`No results for “${q}”`} body={filtered ? 'Try removing a filter, or check the spelling.' : 'Check the spelling, or try a player, an event or a hand type.'} />
      <View style={{ paddingHorizontal: space.gutter, gap: 16 }}>
        <Text style={type.h3}>Watch these instead</Text>
        {picks.map((h) => (
          <HandCard key={h.id} hand={h} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 4, paddingRight: space.gutter, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.line },
  box: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 50, paddingLeft: 14, borderRadius: radius.panel, borderWidth: 1, borderColor: colors.lineStrong, backgroundColor: colors.surface },
  input: { flex: 1, color: colors.text, fontSize: 15, paddingVertical: 10 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  recent: { flexDirection: 'row', alignItems: 'center', borderRadius: 999, borderWidth: 1, borderColor: colors.lineStrong },
  filters: { gap: 8, alignItems: 'center', paddingHorizontal: space.gutter, paddingVertical: 16 },
  groupHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: space.gutter, marginBottom: 8 },
  list: { marginHorizontal: space.gutter, borderRadius: radius.panel, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  thumb: { width: 80, aspectRatio: 16 / 9, borderRadius: 6, overflow: 'hidden', backgroundColor: colors.surface3 },
});
