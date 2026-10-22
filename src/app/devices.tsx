// Devices (web demo v2 /devices): free a stream, then go back to what you were watching.
import { ScrollView, View } from 'react-native';

import { DeviceList } from '@/components/devices';
import { goBack, SubHead } from '@/components/headers';
import { PageHeader } from '@/components/ui';
import { useApp } from '@/state/app';
import { colors, space } from '@/theme';

export default function Devices() {
  const { state, set } = useApp();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SubHead />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <PageHeader kicker="Too many devices" title="Manage devices" intro="Your plan allows 2 streams at the same time. Sign out a device to keep watching here." />
        <View style={{ padding: space.gutter }}>
          <DeviceList
            onFreed={() => {
              // A freed stream lifts the device limit (demo).
              if (state.scenario === 'deviceLimit') set((s) => ({ scenario: s.paidTier }));
              goBack();
            }}
          />
        </View>
      </ScrollView>
    </View>
  );
}
