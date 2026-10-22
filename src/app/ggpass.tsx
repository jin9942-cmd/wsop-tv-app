// Mock of the external GGPASS domain (web demo v2 features/auth/GGPassFlow.tsx): sign-in → consent → back to WSOP TV.
// Deliberately a different (light) tone so it reads as another site. No credentials are collected: there are no
// input fields, only the demo account and buttons.
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { goBack } from '@/components/headers';
import { useApp } from '@/state/app';
import { colors } from '@/theme';

type Step = 'signin' | 'consent' | 'return';

export default function GGPassFlow() {
  const insets = useSafeAreaInsets();
  const { completeLogin } = useApp();
  const [step, setStep] = useState<Step>('signin');

  useEffect(() => {
    if (step !== 'return') return;
    const t = setTimeout(() => {
      goBack();
      completeLogin();
    }, 1400);
    return () => clearTimeout(t);
  }, [step, completeLogin]);

  return (
    <View style={[styles.page, { paddingTop: insets.top }]}>
      {/* fake address bar to signal "you are on another domain" */}
      <View style={styles.bar}>
        <Text style={styles.addr} numberOfLines={1}>
          🔒 accounts.ggpass.example/{step === 'consent' ? 'oauth/consent' : 'login'}
        </Text>
        <View style={styles.mock}>
          <Text style={styles.mockText}>DEMO MOCK</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.main}>
        <Text style={styles.brand}>GGPASS</Text>
        {step === 'signin' && (
          <View style={styles.card}>
            <Text style={styles.h1}>Sign in to continue to WSOP TV</Text>
            <Text style={styles.muted}>One account for the WSOP family of services.</Text>
            <View style={styles.account}>
              <View style={styles.avatar}>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>DV</Text>
              </View>
              <Text style={styles.ink}>demo.viewer@example.com</Text>
            </View>
            <Text style={[styles.muted, { fontSize: 12 }]}>Demo mock — nothing is entered or sent.</Text>
            <Pressable style={styles.primary} onPress={() => setStep('consent')} accessibilityRole="button">
              <Text style={styles.primaryText}>Sign in</Text>
            </Pressable>
            <Pressable style={styles.ghost} onPress={goBack} accessibilityRole="button">
              <Text style={styles.ghostText}>Cancel and return to WSOP TV</Text>
            </Pressable>
          </View>
        )}
        {step === 'consent' && (
          <View style={styles.card}>
            <Text style={styles.h1}>WSOP TV wants to access your GGPASS account</Text>
            <Text style={[styles.muted, { marginTop: 8 }]}>This will share only:</Text>
            {['Email address', 'Nickname'].map((x) => (
              <Text key={x} style={[styles.ink, { marginTop: 6 }]}>
                <Text style={{ color: colors.extBrand }}>✓</Text> {x}
              </Text>
            ))}
            <Text style={[styles.muted, { fontSize: 12, marginTop: 10 }]}>WSOP TV won&apos;t see your password or any other account details. You can revoke access anytime in GGPASS settings.</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 20 }}>
              <Pressable style={[styles.ghost, styles.outline, { flex: 1 }]} onPress={goBack} accessibilityRole="button">
                <Text style={styles.ink}>Deny</Text>
              </Pressable>
              <Pressable style={[styles.primary, { flex: 1, marginTop: 0 }]} onPress={() => setStep('return')} accessibilityRole="button">
                <Text style={styles.primaryText}>Allow</Text>
              </Pressable>
            </View>
          </View>
        )}
        {step === 'return' && (
          <View style={[styles.card, { alignItems: 'center' }]} accessibilityRole="summary">
            <ActivityIndicator color={colors.extBrand} />
            <Text style={[styles.ink, { fontWeight: '700', marginTop: 14 }]}>Returning to WSOP TV…</Text>
            <Text style={[styles.muted, { fontSize: 12 }]}>Redirecting with an authorization code (OAuth 2.0 / OIDC, assumed)</Text>
          </View>
        )}
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
  main: { padding: 24, paddingTop: 40 },
  brand: { color: colors.extBrand, fontSize: 24, fontWeight: '900', letterSpacing: -0.4 },
  card: { marginTop: 24, borderRadius: 16, backgroundColor: '#fff', padding: 22, gap: 6 },
  h1: { color: colors.extInk, fontSize: 19, fontWeight: '800' },
  muted: { color: 'rgba(0,0,0,0.55)', fontSize: 14 },
  ink: { color: colors.extInk, fontSize: 14 },
  account: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', backgroundColor: 'rgba(0,0,0,0.03)', padding: 10 },
  avatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.extBrand, alignItems: 'center', justifyContent: 'center' },
  primary: { marginTop: 18, height: 46, borderRadius: 10, backgroundColor: colors.extBrand, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  ghost: { height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  ghostText: { color: 'rgba(0,0,0,0.6)', fontWeight: '700', fontSize: 14 },
  outline: { borderWidth: 1, borderColor: 'rgba(0,0,0,0.15)', height: 46 },
});
