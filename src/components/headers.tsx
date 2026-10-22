// App chrome (web demo v2 components/Layout.tsx, phone layout): sign-in banner, payment / travel banners, header with
// the wordmark (long-press → Demo Settings), search and sign in / My; sub-screen header with back; footer.
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GRACE_DAYS, daysFromNow } from '@/data/policy';
import { fmtBillingDate } from '@/lib/time';
import { useApp } from '@/state/app';
import { colors, space, type } from '@/theme';

import { Button, Icon, IconButton, Wordmark } from './ui';

export const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

/** Tab screens: top banners + the header row. */
export function AppHeader({ right }: { right?: ReactNode }) {
  const insets = useSafeAreaInsets();
  const { state, set, signedIn, requireLogin, openSheet, toast } = useApp();
  return (
    <View style={{ paddingTop: insets.top, backgroundColor: colors.bg }}>
      {!signedIn && (
        <View style={styles.banner}>
          <Text style={[type.small, { flex: 1 }]}>WSOP TV is included with WSOP+ — free with every GGPass account.</Text>
          <Button title="Continue with GGPASS" variant="primary" size="sm" onPress={() => requireLogin('Sign in to watch live coverage and keep your progress.')} />
        </View>
      )}
      {/* Payment issue: watching continues during the grace period */}
      {state.scenario === 'grace' && (
        <View style={[styles.banner, { backgroundColor: 'rgba(245,165,36,0.1)', borderBottomColor: 'rgba(245,165,36,0.4)' }]}>
          <Text style={[type.small, { flex: 1, color: colors.text }]}>
            <Text style={{ fontWeight: '800' }}>Update your payment method in WSOP+.</Text>{' '}
            <Text style={{ color: colors.muted }}>Your WSOP+ membership — and WSOP TV — continues until {fmtBillingDate(daysFromNow(GRACE_DAYS))}.</Text>
          </Text>
          <Button title="Go to WSOP+" variant="outline" size="sm" onPress={() => toast('Opens WSOP+ payment settings (demo)')} />
        </View>
      )}
      {state.abroad && !state.abroadDismissed && (
        <View style={[styles.banner, { backgroundColor: colors.surface2 }]}>
          <Icon name="globe" size={16} color={colors.gold} />
          <Text style={[type.small, { flex: 1, color: colors.text }]}>You’re watching from Japan. Some events may not be available.</Text>
          <IconButton name="close" label="Dismiss" size={16} onPress={() => set({ abroadDismissed: true })} />
        </View>
      )}
      <View style={styles.header}>
        <Pressable onLongPress={() => openSheet({ kind: 'demo' })} delayLongPress={600} onPress={() => router.navigate('/')} accessibilityRole="button" accessibilityLabel="WSOP TV home" accessibilityHint="Long press to open Demo Settings" style={styles.brand}>
          <Wordmark size={22} />
          <View style={styles.wt}>
            <Text style={styles.wtText}>WORKING TITLE</Text>
          </View>
        </Pressable>
        <View style={styles.actions}>
          {right}
          <IconButton name="search" label="Search" onPress={() => router.push('/search')} />
          {signedIn ? (
            <Pressable onPress={() => router.push('/account')} accessibilityRole="button" accessibilityLabel="My menu" style={styles.my}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>DV</Text>
              </View>
              <Text style={[type.small, { color: colors.text, fontWeight: '700' }]}>My</Text>
            </Pressable>
          ) : (
            <Button title="Sign in" variant="ghost" size="sm" onPress={() => requireLogin('Sign in to WSOP TV.')} />
          )}
        </View>
      </View>
    </View>
  );
}

/** Pushed screens: back button + optional title. */
export function SubHead({ title, right }: { title?: string; right?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.sub, { paddingTop: insets.top + 4 }]}>
      <IconButton name="back" label="Back" color={colors.text} onPress={goBack} />
      <Text style={styles.subTitle} numberOfLines={1} accessibilityRole="header">
        {title ?? ''}
      </Text>
      {right ?? <View style={{ width: 40 }} />}
    </View>
  );
}

/** Footer (web demo v2). */
export function Footer() {
  const { toast } = useApp();
  return (
    <View style={styles.footer}>
      <Wordmark />
      <Text style={[type.small, { marginTop: 10, lineHeight: 19 }]}>
        The official home of the mind sport — live and on-demand coverage of championship poker. Viewing service only. Demo build with fictional players and events.
      </Text>
      <Text style={[type.label, { marginTop: 20 }]}>Responsible Gaming</Text>
      <Text style={[type.small, { marginTop: 6, lineHeight: 19 }]}>Poker is a game of skill and strategy. Play responsibly. Age requirements for poker-related services vary by region.</Text>
      <Pressable onPress={() => toast('Support resources (demo)')} accessibilityRole="link">
        <Text style={[type.small, { color: colors.gold, fontWeight: '700', marginTop: 6 }]}>Need help? Find support resources</Text>
      </Pressable>
      <Text style={[type.label, { marginTop: 20 }]}>Service</Text>
      {['Help Center', 'Terms of Use', 'Privacy Policy', 'Accessibility'].map((x) => (
        <Pressable key={x} onPress={() => toast(`${x} (demo)`)} accessibilityRole="link" style={{ minHeight: 30, justifyContent: 'center' }}>
          <Text style={type.small}>{x}</Text>
        </Pressable>
      ))}
      <Text style={[type.caption, { textAlign: 'center', marginTop: 20 }]}>WSOP TV (working title) · Interactive demo · All players, events and results are fictional.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: space.gutter, paddingVertical: 8, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.line },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.gutter, height: 56, borderBottomWidth: 1, borderBottomColor: colors.line, backgroundColor: colors.bg },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wt: { borderWidth: 1, borderColor: colors.lineStrong, borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1 },
  wtText: { color: colors.muted, fontSize: 8, fontWeight: '800', letterSpacing: 0.6 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  my: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.lineStrong, borderRadius: 999, paddingLeft: 3, paddingRight: 10, paddingVertical: 3, marginLeft: 4 },
  avatar: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.surface3, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.text, fontSize: 10, fontWeight: '800' },
  sub: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, paddingBottom: 4, backgroundColor: colors.bg, borderBottomWidth: 1, borderBottomColor: colors.line },
  subTitle: { flex: 1, color: colors.text, fontSize: 16, fontWeight: '800', textAlign: 'center' },
  footer: { marginTop: 40, paddingHorizontal: space.gutter, paddingVertical: 28, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.line },
});
