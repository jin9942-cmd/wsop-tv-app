// More (web demo v2 mobile "More" menu): what the bottom tabs don't already cover — browse (Series & Events, Players,
// Archive, Search) and your account (My List, Account). The app-only Demo Settings entry is hidden in the
// presentation build (long-press the WSOP TV wordmark instead).
import { router, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader, Footer } from '@/components/headers';
import { Icon, type IconName } from '@/components/ui';
import { PRESENTATION } from '@/data/policy';
import { useApp } from '@/state/app';
import { colors, mono, radius, space, type } from '@/theme';

type Item = { to: Href; label: string; icon: IconName; sub: string };
const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: 'Browse',
    items: [
      { to: '/events', label: 'Series & Events', icon: 'layers', sub: 'Every bracelet event, day by day' },
      { to: '/players', label: 'Players', icon: 'players', sub: 'Profiles, results and highlight hands' },
      { to: '/archive', label: 'Archive', icon: 'archive', sub: 'Full replays and classic final tables' },
      { to: '/search', label: 'Search', icon: 'search', sub: 'Events, broadcasts, hands and players' },
    ],
  },
  {
    title: 'My WSOP TV',
    items: [
      { to: '/my-list', label: 'My List', icon: 'plus', sub: 'Saved events, broadcasts, classics and hands' },
      { to: '/account', label: 'Account', icon: 'user', sub: 'GGPASS, WSOP+ membership and preferences' },
    ],
  },
];

export default function More() {
  const { state, openSheet } = useApp();
  return (
    <ScrollView style={{ backgroundColor: colors.bg }}>
      <AppHeader />
      {GROUPS.map((g) => (
        <View key={g.title} style={styles.group}>
          <Text style={[type.label, styles.groupTitle]}>{g.title}</Text>
          <View style={styles.card}>
            {g.items.map((n, i) => (
              <Pressable
                key={n.label}
                onPress={() => router.push(n.to)}
                accessibilityRole="link"
                style={({ pressed }) => [styles.item, i < g.items.length - 1 && styles.itemLine, pressed && { backgroundColor: colors.surface2 }]}>
                <View style={styles.iconBox}>
                  <Icon name={n.icon} size={18} color={colors.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemText}>{n.label}</Text>
                  <Text style={type.small}>{n.sub}</Text>
                </View>
                {n.label === 'My List' && state.myList.length > 0 && <Text style={styles.count}>{state.myList.length}</Text>}
                <Icon name="chevron" size={18} color={colors.subtle} />
              </Pressable>
            ))}
          </View>
        </View>
      ))}
      {/* App-only: the web demo's Demo Controls. Hidden in the presentation build — long-press the WSOP TV wordmark. */}
      {!PRESENTATION && (
        <Pressable style={styles.demo} onPress={() => openSheet({ kind: 'demo' })} accessibilityRole="button">
          <Text style={styles.demoText}>⚙ Demo Settings</Text>
          <Icon name="chevron" size={18} color={colors.demo} />
        </Pressable>
      )}
      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  group: { marginTop: 24, paddingHorizontal: space.gutter },
  groupTitle: { marginBottom: 10 },
  card: { borderRadius: radius.panel, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, overflow: 'hidden' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, paddingHorizontal: 14, paddingVertical: 10 },
  itemLine: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  iconBox: { width: 36, height: 36, borderRadius: radius.chip, backgroundColor: colors.goldDim, alignItems: 'center', justifyContent: 'center' },
  itemText: { color: colors.text, fontSize: 15, fontWeight: '700' },
  count: { color: colors.subtle, fontSize: 12 },
  demo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 52, margin: space.gutter, paddingHorizontal: 14, borderRadius: radius.card, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.demo, backgroundColor: colors.demoBg },
  demoText: { color: colors.demo, fontFamily: mono, fontWeight: '700' },
});
