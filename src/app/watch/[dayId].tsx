// /watch/[dayId] (web demo v2 WatchRoute): the same screen as the Live menu with that day selected.
// `clip=` opens a free highlight when the full broadcast is locked; `reminder=1` comes from the "Live now" notification.
import { useLocalSearchParams } from 'expo-router';
import { ScrollView } from 'react-native';

import { SubHead } from '@/components/headers';
import { LiveScreen } from '@/components/LiveScreen';
import { Missing } from '@/components/missing';
import { dayById } from '@/data/mock';
import { colors } from '@/theme';

export default function WatchRoute() {
  const { dayId, clip, reminder } = useLocalSearchParams<{ dayId: string; clip?: string; reminder?: string }>();
  const ref = dayById(dayId);
  if (!ref) return <Missing />;
  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 40 }} stickyHeaderIndices={[0]}>
      <SubHead title={`${ref.event.name.replace(' World Championship', '')} · ${ref.day.label}`} />
      <LiveScreen dayId={dayId} clipId={clip ?? null} autoPlay={reminder === '1'} />
    </ScrollView>
  );
}
