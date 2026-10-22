// Devices (web demo v2 features/auth/Devices.tsx): stream-limit device management.
import { StyleSheet, Text, View } from 'react-native';

import { MAX_STREAMS } from '@/data/policy';
import { useApp } from '@/state/app';
import { colors, radius, type } from '@/theme';

import { Button, Icon } from './ui';

export function DeviceList({ onFreed }: { onFreed?: () => void }) {
  const { state, set, toast } = useApp();
  const streaming = state.devices.filter((d) => d.streaming && !d.current).length;
  const signOut = (id: string) => {
    set((s) => ({ devices: s.devices.filter((d) => d.id !== id) }));
    toast('Device signed out');
    onFreed?.();
  };
  return (
    <View>
      <Text style={[type.small, { marginBottom: 10 }]}>
        Watching on {streaming} of {MAX_STREAMS} streams · signed in on {state.devices.length} devices
      </Text>
      <View style={{ gap: 8 }}>
        {state.devices.map((d) => (
          <View key={d.id} style={styles.row}>
            <Icon name={d.kind === 'tv' ? 'tv' : d.kind === 'web' ? 'devices' : 'devices'} size={18} color={colors.muted} />
            <View style={{ flex: 1 }}>
              <Text style={[type.body, { fontWeight: '700' }]}>{d.name}</Text>
              <Text style={type.small}>
                {d.current ? 'This device' : d.lastActive}
                {d.streaming && !d.current ? ' · Watching now' : ''}
              </Text>
            </View>
            {!d.current && <Button size="sm" variant="ghost" title="Sign out" onPress={() => signOut(d.id)} />}
          </View>
        ))}
      </View>
      <Button
        size="sm"
        variant="outline"
        title="Sign out of all other devices"
        style={{ alignSelf: 'flex-start', marginTop: 12 }}
        onPress={() => {
          set((s) => ({ devices: s.devices.filter((d) => d.current) }));
          toast('Signed out of all other devices');
          onFreed?.();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: radius.chip, borderWidth: 1, borderColor: colors.line, padding: 12 },
});
