import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '@/state/app';
import { colors } from '@/theme';

/** Bottom toasts above the tab bar (web demo app-toasts). */
export function ToastHost() {
  const { toasts } = useApp();
  const insets = useSafeAreaInsets();
  if (!toasts.length) return null;
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: insets.bottom + 76 }]} accessibilityLiveRegion="polite">
      {toasts.map((t) => (
        <View key={t.id} style={styles.toast}>
          <Text style={styles.text}>{t.text}</Text>
          {t.action && (
            <Pressable onPress={t.action.onPress} accessibilityRole="button" hitSlop={8}>
              <Text style={styles.action}>{t.action.label}</Text>
            </Pressable>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center', gap: 8 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    maxWidth: 480,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  text: { color: colors.text, fontSize: 13.5, flexShrink: 1 },
  action: { color: colors.goldStrong, fontSize: 13.5, fontWeight: '800' },
});
