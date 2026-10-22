// Back on WSOP TV after WSOP+ (web demo v2 MembershipCheck): re-read the WSOP+ tier, apply it, return to the content.
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { tierFull } from '@/data/policy';
import { hapticSuccess } from '@/lib/haptics';
import { useApp } from '@/state/app';
import { colors, type } from '@/theme';

export default function MembershipCheck() {
  const params = useLocalSearchParams<{ return?: string }>();
  const { state, set, toast } = useApp();
  const returnTo = (params.return || '/') as Href;

  useEffect(() => {
    const t = setTimeout(() => {
      const rec = state.wsopPlusRecord;
      if (rec) {
        set({ scenario: rec, paidTier: rec, wsopPlusRecord: null });
        hapticSuccess();
        toast(`${tierFull(rec)} is active — enjoy WSOP TV`);
      }
      // Not upgraded → the content's gate shows again; WSOP+ already told the viewer why.
      router.replace(returnTo);
    }, 1500);
    return () => clearTimeout(t);
    // Runs once on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, backgroundColor: colors.bg }} accessibilityRole="summary">
      <ActivityIndicator color={colors.gold} size="large" />
      <Text style={[type.h2, { textAlign: 'center' }]}>Checking your WSOP+ membership…</Text>
      <Text style={type.small}>You’ll be taken back in a moment.</Text>
    </View>
  );
}
