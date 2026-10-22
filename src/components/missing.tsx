import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { colors, type } from '@/theme';

import { SubHead } from './headers';

/** Unknown content or route (web demo v2 NotFound). */
export function Missing() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SubHead />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 }}>
        <Text style={[type.label, { color: colors.gold }]}>404</Text>
        <Text style={[type.title, { textAlign: 'center' }]}>This page isn&apos;t available</Text>
        <Text style={type.small}>The broadcast or page may have moved.</Text>
        <Text style={[type.body, { color: colors.gold, fontWeight: '700', marginTop: 16 }]} onPress={() => router.replace('/')}>
          Back to Home
        </Text>
      </View>
    </View>
  );
}
