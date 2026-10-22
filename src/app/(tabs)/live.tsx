// Live (web demo v2): two ways in — event coverage by tournament, or 24/7 channels.
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ChannelsView } from '@/components/ChannelsView';
import { AppHeader } from '@/components/headers';
import { LiveScreen } from '@/components/LiveScreen';
import { channels } from '@/data/channels';
import { colors, space, type } from '@/theme';

export default function Live() {
  const { tab, channel } = useLocalSearchParams<{ tab?: string; channel?: string }>();
  const active = tab === 'channels' ? 'channels' : 'tournaments';
  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 40 }} stickyHeaderIndices={[1]}>
      <AppHeader />
      <LiveTabs active={active} />
      {active === 'channels' ? <ChannelsView channelId={channel} onSelect={(id) => router.setParams({ tab: 'channels', channel: id })} /> : <LiveScreen />}
    </ScrollView>
  );
}

function LiveTabs({ active }: { active: 'tournaments' | 'channels' }) {
  return (
    <View style={styles.tabs} accessibilityRole="tablist" accessibilityLabel="Live">
      <Pressable onPress={() => router.setParams({ tab: 'tournaments', channel: undefined })} accessibilityRole="tab" accessibilityState={{ selected: active === 'tournaments' }} style={[styles.tab, active === 'tournaments' && styles.tabOn]}>
        <Text style={[styles.tabText, active === 'tournaments' && { color: colors.text }]}>Tournaments</Text>
      </Pressable>
      <Pressable onPress={() => router.setParams({ tab: 'channels' })} accessibilityRole="tab" accessibilityState={{ selected: active === 'channels' }} style={[styles.tab, active === 'channels' && styles.tabOn]}>
        <Text style={[styles.tabText, active === 'channels' && { color: colors.text }]}>Channels</Text>
        <View style={styles.count}>
          <Text style={[type.caption, type.tnum, { color: colors.muted }]}>{channels.length}</Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 4, paddingHorizontal: space.gutter, borderBottomWidth: 1, borderBottomColor: colors.line, backgroundColor: colors.bg },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent', marginBottom: -1 },
  tabOn: { borderBottomColor: colors.gold },
  tabText: { color: colors.muted, fontSize: 14, fontWeight: '700' },
  count: { borderRadius: 999, backgroundColor: colors.surface3, paddingHorizontal: 6 },
});
