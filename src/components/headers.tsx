// Screen headers (web demo AppHeader / SubHead). Native headers are hidden so every screen matches the web demo.
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '@/state/app';
import { colors, space } from '@/theme';

import { Button, IconButton, Wordmark } from './ui';

export const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

/** Tab screens: wordmark (long-press → Demo Settings) or a title, search, and log in / inbox / My. */
export function AppHeader({ title, right }: { title?: string; right?: ReactNode }) {
  const insets = useSafeAreaInsets();
  const { member, openSheet } = useApp();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
      {title ? (
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
      ) : (
        <Pressable onLongPress={() => openSheet({ kind: 'demo' })} delayLongPress={600} accessibilityRole="button" accessibilityLabel="WSOP TV" accessibilityHint="Long press to open Demo Settings">
          <Wordmark size={22} />
        </Pressable>
      )}
      <View style={styles.actions}>
        {right}
        <IconButton name="search" label="Search" onPress={() => router.push('/search')} />
        {member === 'guest' ? (
          <Button title="Log in" size="xs" onPress={() => openSheet({ kind: 'login', reason: 'Log in to get alerts, continue watching and more.' })} />
        ) : (
          <>
            <IconButton name="bell" label="Inbox" badge onPress={() => router.push('/inbox')} />
            <Pressable onPress={() => router.navigate('/my')} accessibilityRole="button" accessibilityLabel="My" style={styles.avatar}>
              <Text style={styles.avatarText}>DV</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

/** Pushed screens: back button + title. */
export function SubHead({ title, right }: { title?: string; right?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.sub, { paddingTop: insets.top + 4 }]}>
      <IconButton name="back" label="Back" onPress={goBack} />
      <Text style={styles.subTitle} numberOfLines={1} accessibilityRole="header">
        {title ?? ''}
      </Text>
      {right ?? <View style={{ width: 40 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.gutter,
    paddingBottom: 8,
    backgroundColor: colors.bg,
  },
  title: { color: colors.text, fontSize: 24, fontWeight: '900', letterSpacing: -0.4 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surface3, alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
  avatarText: { color: colors.text, fontSize: 11, fontWeight: '800' },
  sub: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, paddingBottom: 4, backgroundColor: colors.bg },
  subTitle: { flex: 1, color: colors.text, fontSize: 16, fontWeight: '800', textAlign: 'center' },
});
