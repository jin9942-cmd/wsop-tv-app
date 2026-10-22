// WSOP+ join / upgrade page (web demo v2 features/membership/WsopPlus.tsx — mock of another domain).
// WSOP TV never takes payment: no payment fields; the outcome comes from Demo Settings → WSOP+ page result.
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MEMBERSHIP_PRICES, TIER_NAME, tierFull, type PaidTier } from '@/data/policy';
import { useApp } from '@/state/app';
import { colors } from '@/theme';

export default function WsopPlusJoin() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tier?: string; return?: string }>();
  const tier: PaidTier = params.tier === 'premium' ? 'premium' : 'basic';
  const returnTo = params.return || '/';
  const { state, set } = useApp();
  const [busy, setBusy] = useState(false);
  const back = () => router.replace({ pathname: '/membership/check', params: { return: returnTo } });

  const complete = () => {
    setBusy(true);
    setTimeout(() => {
      // WSOP+ records the membership only on success; fail / cancel leave it unchanged.
      if (state.paymentResult === 'success') set({ wsopPlusRecord: tier });
      back();
    }, 1200);
  };

  return (
    <View style={[styles.page, { paddingTop: insets.top }]}>
      <View style={styles.bar}>
        <Text style={styles.addr} numberOfLines={1}>
          🔒 plus.wsop.example/membership/join
        </Text>
        <View style={styles.mock}>
          <Text style={styles.mockText}>DEMO MOCK</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 32 }}>
        <View style={styles.head}>
          <Text style={styles.brand}>
            WSOP<Text style={{ color: colors.extBrand }}>+</Text>
          </Text>
          <View style={styles.who}>
            <Text style={{ fontSize: 11, color: 'rgba(0,0,0,0.6)' }}>GGPass · demo.viewer@example.com</Text>
          </View>
        </View>
        <View style={styles.card}>
          <Text style={styles.kicker}>{state.scenario === 'basic' && tier === 'premium' ? 'Upgrade membership' : 'Join membership'}</Text>
          <Text style={styles.h1}>{tierFull(tier)}</Text>
          <Text style={styles.price}>
            {MEMBERSHIP_PRICES[tier].monthly}
            <Text style={{ fontSize: 14, color: 'rgba(0,0,0,0.5)' }}> / month</Text>
          </Text>
          <Text style={styles.muted}>Pricing to be confirmed · billed and managed in WSOP+ · includes WSOP TV per your {TIER_NAME[tier]} tier</Text>
          <Text style={styles.note}>Demo mock — no payment details are entered or stored. The result is set in WSOP TV’s Demo Settings (WSOP+ page result).</Text>
          <Pressable style={[styles.primary, busy && { opacity: 0.7 }]} onPress={complete} disabled={busy} accessibilityRole="button">
            {busy && <ActivityIndicator color="#fff" />}
            <Text style={styles.primaryText}>{busy ? 'Processing…' : 'Complete (demo)'}</Text>
          </Pressable>
          <Pressable style={styles.ghost} onPress={back} accessibilityRole="button">
            <Text style={styles.ghostText}>Cancel</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.extBg },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.1)' },
  addr: { flex: 1, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, fontSize: 12, color: 'rgba(0,0,0,0.6)' },
  mock: { backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  mockText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  brand: { color: colors.extInk, fontSize: 24, fontWeight: '900' },
  who: { backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  card: { marginTop: 24, borderRadius: 16, backgroundColor: '#fff', padding: 22, gap: 6 },
  kicker: { color: 'rgba(0,0,0,0.5)', fontSize: 12, fontWeight: '700' },
  h1: { color: colors.extInk, fontSize: 20, fontWeight: '800' },
  price: { color: colors.extInk, fontSize: 30, fontWeight: '900', marginTop: 4 },
  muted: { color: 'rgba(0,0,0,0.5)', fontSize: 12 },
  note: { marginTop: 10, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', backgroundColor: 'rgba(0,0,0,0.03)', padding: 10, fontSize: 12, color: 'rgba(0,0,0,0.55)' },
  primary: { marginTop: 18, height: 46, borderRadius: 10, backgroundColor: colors.extBrand, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  primaryText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  ghost: { height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  ghostText: { color: 'rgba(0,0,0,0.6)', fontWeight: '700', fontSize: 14 },
});
