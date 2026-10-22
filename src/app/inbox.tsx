// Inbox (web demo My > Inbox): reminders set plus sample messages.
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { SubHead } from '@/components/headers';
import { channelById, programById } from '@/data/channels';
import { scheduleById } from '@/data/schedules';
import { fmtDate, fmtTime } from '@/lib/time';
import { useApp } from '@/state/app';
import { colors, space, type } from '@/theme';

export default function InboxScreen() {
  const { alarms, tz } = useApp();
  const reminders = alarms
    .map((key) => {
      if (key.startsWith('ch:')) {
        const p = programById(key.slice(3));
        return p && { id: key, title: `Reminder set: ${p.title}`, sub: `${channelById(p.channelId)?.name} · ${fmtDate(p.start, tz)} ${fmtTime(p.start, tz)}` };
      }
      const s = scheduleById(key);
      return s && { id: key, title: `Reminder set: ${s.title}`, sub: `${s.lang} · ${fmtDate(s.start, tz)}` };
    })
    .filter((x): x is { id: string; title: string; sub: string } => !!x);
  const items = [...reminders, { id: 'n1', title: 'Main Event Day 1B Full Replay is now available', sub: 'VOD' }, { id: 'n2', title: 'Welcome to WSOP TV', sub: 'Account' }];
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SubHead title="Inbox" />
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={type.body}>{item.title}</Text>
            <Text style={type.small}>{item.sub}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: space.gutter, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line, gap: 3 },
});
