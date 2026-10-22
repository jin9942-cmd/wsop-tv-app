import { router } from 'expo-router';
import { View } from 'react-native';

import { colors } from '@/theme';

import { SubHead } from './headers';
import { Button, Empty } from './ui';

/** Unknown content id (web demo Missing). */
export function Missing() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SubHead />
      <Empty text="This content isn’t available." />
      <Button title="Go home" variant="outline" style={{ marginHorizontal: 16 }} onPress={() => router.replace('/')} />
    </View>
  );
}
