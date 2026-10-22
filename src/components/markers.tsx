// Hand types (web demo v2 features/player/markers.tsx): each has a distinct glyph AND tone, so markers never rely on colour alone.
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import type { HandType } from '@/data/types';
import { colors } from '@/theme';

export const HAND_META: Record<HandType, { label: string; short: string }> = {
  allin: { label: 'All-in', short: 'A' },
  bigpot: { label: 'Big Pot', short: 'P' },
  bluff: { label: 'Bluff', short: 'B' },
  badbeat: { label: 'Bad Beat', short: '!' },
  herofold: { label: 'Hero Fold', short: 'F' },
};

const TONE: Record<HandType, { bg: string; fg: string; border?: string }> = {
  allin: { bg: colors.gold, fg: colors.ink },
  bigpot: { bg: colors.text, fg: colors.ink },
  bluff: { bg: colors.surface3, fg: colors.goldStrong, border: colors.gold },
  badbeat: { bg: colors.surface3, fg: colors.text, border: colors.text },
  herofold: { bg: colors.surface3, fg: colors.muted, border: colors.lineStrong },
};

/** Marker glyph: shape differs per type (circle / square / diamond). */
export function HandGlyph({ type, size = 18 }: { type: HandType; size?: number }) {
  const t = TONE[type];
  const diamond = type === 'badbeat' || type === 'bluff';
  const inner = diamond ? size * 0.74 : size;
  const shape: ViewStyle = {
    width: inner,
    height: inner,
    backgroundColor: t.bg,
    borderWidth: t.border ? 1 : 0,
    borderColor: t.border,
    borderRadius: type === 'bigpot' ? 3 : diamond ? 2 : size / 2,
    transform: diamond ? [{ rotate: '45deg' }] : undefined,
    alignItems: 'center',
    justifyContent: 'center',
  };
  return (
    <View style={[styles.box, { width: size, height: size }]} accessible={false}>
      <View style={shape}>
        <Text style={[styles.letter, { color: t.fg, transform: diamond ? [{ rotate: '-45deg' }] : undefined }]}>{HAND_META[type].short}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
  letter: { fontSize: 10, fontWeight: '900', lineHeight: 12 },
});
