// Notices (web demo SCR-12): by type, pinned first, tier notices only for that tier.
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { SubHead } from '@/components/headers';
import { NoticeTags } from '@/components/notice';
import { Empty, Seg } from '@/components/ui';
import { visibleNotices } from '@/data/home';
import type { NoticeType } from '@/data/types';
import { fmtDate } from '@/lib/time';
import { useApp } from '@/state/app';
import { colors, space, type } from '@/theme';

const TYPES = ['All', 'Service', 'Event', 'Maintenance'] as const;

export default function NoticeList() {
  const { member, tz } = useApp();
  const [t, setT] = useState<'All' | NoticeType>('All');
  const list = visibleNotices(member).filter((n) => t === 'All' || n.type === t);
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SubHead title="Notices" />
      <Seg value={t} options={TYPES} label={(x) => x} onChange={setT} />
      <FlatList
        data={list}
        keyExtractor={(n) => n.id}
        renderItem={({ item: n }) => (
          <Pressable style={styles.row} onPress={() => router.push({ pathname: '/notices/[id]', params: { id: n.id } })} accessibilityRole="button">
            <NoticeTags n={n} />
            <Text style={[type.body, { fontWeight: '700' }]}>{n.title}</Text>
            <Text style={type.caption}>{fmtDate(n.date, tz)}</Text>
          </Pressable>
        )}
        ListEmptyComponent={<Empty text="No notices." />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: space.gutter, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line, gap: 5 },
});
