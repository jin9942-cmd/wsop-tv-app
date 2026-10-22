// More (web demo v2 mobile "More" menu): the rest of the main navigation, My List / Account, and the app-only
// Demo Settings.
import { router, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader, Footer } from '@/components/headers';
import { Icon, type IconName } from '@/components/ui';
import { useApp } from '@/state/app';
import { colors, mono, radius, space } from '@/theme';

const ITEMS: { to: Href; label: string; icon: IconName }[] = [
  { to: '/', label: 'Home', icon: 'home' },
  { to: '/live', label: 'Live', icon: 'live' },
  { to: '/schedule', label: 'Schedule', icon: 'calendar' },
  { to: '/events', label: 'Series & Events', icon: 'layers' },
  { to: '/players', label: 'Players', icon: 'user' },
  { to: '/hands', label: 'Hands & Clips', icon: 'hands' },
  { to: '/archive', label: 'Archive', icon: 'archive' },
  { to: '/search', label: 'Search', icon: 'search' },
  { to: '/my-list', label: 'My List', icon: 'plus' },
  { to: '/account', label: 'Account', icon: 'user' },
];

export default function More() {
  const { state, openSheet } = useApp();
  return (
    <ScrollView style={{ backgroundColor: colors.bg }}>
      <AppHeader />
      <View style={styles.grid}>
        {ITEMS.map((n) => (
          <Pressable key={n.label} onPress={() => router.navigate(n.to)} accessibilityRole="link" style={({ pressed }) => [styles.item, pressed && { backgroundColor: colors.surface3 }]}>
            <Icon name={n.icon} size={16} color={colors.muted} />
            <Text style={styles.itemText}>{n.label}</Text>
            {n.label === 'My List' && state.myList.length > 0 && <Text style={styles.count}>{state.myList.length}</Text>}
          </Pressable>
        ))}
      </View>
      {/* App-only: the web demo's Demo Controls (also: long-press the WSOP TV wordmark). */}
      <Pressable style={styles.demo} onPress={() => openSheet({ kind: 'demo' })} accessibilityRole="button">
        <Text style={styles.demoText}>⚙ Demo Settings</Text>
        <Icon name="chevron" size={18} color={colors.demo} />
      </Pressable>
      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, padding: space.gutter, borderBottomWidth: 1, borderBottomColor: colors.line, backgroundColor: colors.surface },
  item: { width: '49%', flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, paddingHorizontal: 12, borderRadius: radius.chip },
  itemText: { color: colors.muted, fontSize: 14, fontWeight: '700', flex: 1 },
  count: { color: colors.subtle, fontSize: 12 },
  demo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 52, margin: space.gutter, paddingHorizontal: 14, borderRadius: radius.card, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.demo, backgroundColor: colors.demoBg },
  demoText: { color: colors.demo, fontFamily: mono, fontWeight: '700' },
});
