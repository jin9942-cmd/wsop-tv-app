// UI primitives ported from the web demo (app/ui.tsx): icons, placeholder art, badges, buttons, section headers.
import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import type { Tier } from '@/data/types';
import { artColors, colors, radius, space, TOUCH, type } from '@/theme';

// ---- icons (Material Symbols via expo-symbols on Android and web) ------------------------------

const ICONS = {
  home: 'home',
  live: 'live_tv',
  calendar: 'calendar_month',
  vod: 'video_library',
  user: 'person',
  search: 'search',
  lock: 'lock',
  bell: 'notifications',
  bellOn: 'notifications_active',
  play: 'play_arrow',
  pause: 'pause',
  close: 'close',
  back: 'arrow_back',
  check: 'check',
  settings: 'settings',
  trophy: 'emoji_events',
  chevron: 'chevron_right',
  tune: 'tune',
  bookmark: 'bookmark',
  bookmarkAdd: 'bookmark_add',
  delete: 'delete',
  replay: 'replay',
  star: 'star',
  starOutline: 'star_outline',
  eye: 'visibility',
  refresh: 'refresh',
  globe: 'public',
  tv: 'tv',
  add: 'add',
} as const;
export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 22, color = colors.text, style }: { name: IconName; size?: number; color?: string; style?: StyleProp<ViewStyle> }) {
  return <SymbolView name={{ android: ICONS[name], web: ICONS[name] }} size={size} tintColor={color} style={style} />;
}

// ---- placeholder art -----------------------------------------------------------------------------

/** Gradient card art from a hue with an optional centred title — no logos, no casino props. */
export function Art({ hue, title, sub, ratio = 16 / 9, children, style }: { hue: number; title?: string; sub?: string; ratio?: number; children?: ReactNode; style?: StyleProp<ViewStyle> }) {
  const [a, b] = artColors(hue);
  return (
    <View style={[styles.art, { aspectRatio: ratio }, style]}>
      <LinearGradient colors={[a, b]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={styles.artRing} />
      {(title || sub) && (
        <View style={styles.artText} pointerEvents="none">
          {title && (
            <Text style={styles.artTitle} numberOfLines={2}>
              {title}
            </Text>
          )}
          {sub && (
            <Text style={styles.artSub} numberOfLines={1}>
              {sub}
            </Text>
          )}
        </View>
      )}
      {children}
    </View>
  );
}

/** Absolutely positioned corner slot inside Art. */
export function Corner({ at, children }: { at: 'tl' | 'tr' | 'bl' | 'br'; children: ReactNode }) {
  const pos: ViewStyle = { [at[0] === 't' ? 'top' : 'bottom']: 8, [at[1] === 'l' ? 'left' : 'right']: 8 };
  return <View style={[styles.corner, pos]}>{children}</View>;
}

// ---- badges -----------------------------------------------------------------------------------------

const TIER_COLOR: Record<Tier, string> = { free: colors.tierFree, basic: colors.tierBasic, premium: colors.tierPremium };

export function TierBadge({ tier, open }: { tier: Tier; open?: boolean }) {
  const c = open ? colors.ok : TIER_COLOR[tier];
  return (
    <View style={[styles.badge, { borderColor: c }]}>
      <Text style={[styles.badgeText, { color: c }]}>{open ? 'Free' : tier === 'free' ? 'Free' : tier === 'basic' ? 'Basic' : 'Premium'}</Text>
    </View>
  );
}

export function LiveBadge() {
  return (
    <View style={styles.live}>
      <View style={styles.liveDot} />
      <Text style={styles.liveText}>LIVE</Text>
    </View>
  );
}

export function Tag({ children, color = colors.muted }: { children: ReactNode; color?: string }) {
  return (
    <View style={styles.tag}>
      <Text style={[styles.tagText, { color }]}>{children}</Text>
    </View>
  );
}

export function LockBadge() {
  return (
    <View style={styles.lock} accessibilityLabel="Upgrade required">
      <Icon name="lock" size={13} color={colors.text} />
    </View>
  );
}

/** Dark pill for text on top of art (duration, viewers). */
export function Pill({ children }: { children: ReactNode }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillText}>{children}</Text>
    </View>
  );
}

// ---- buttons -------------------------------------------------------------------------------------

type ButtonVariant = 'gold' | 'outline' | 'ghost' | 'surface';

export function Button({
  title,
  onPress,
  variant = 'gold',
  size = 'md',
  icon,
  disabled,
  block,
  style,
  accessibilityLabel,
}: {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: 'md' | 'sm' | 'xs';
  icon?: IconName;
  disabled?: boolean;
  block?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const fg = variant === 'gold' ? colors.ink : variant === 'outline' ? colors.goldStrong : variant === 'ghost' ? colors.muted : colors.text;
  const height = size === 'md' ? TOUCH : size === 'sm' ? 38 : 32;
  const body = (
    <>
      {icon && <Icon name={icon} size={size === 'md' ? 18 : 16} color={fg} />}
      <Text style={[type.button, { color: fg, fontSize: size === 'xs' ? 12.5 : size === 'sm' ? 13 : 14 }]}>{title}</Text>
    </>
  );
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      style={({ pressed }) => [
        styles.btn,
        { minHeight: height, paddingHorizontal: size === 'xs' ? 12 : 18, borderRadius: size === 'xs' ? 8 : radius.button },
        variant === 'outline' && styles.btnOutline,
        variant === 'surface' && styles.btnSurface,
        block && styles.btnBlock,
        (pressed || disabled) && { opacity: disabled ? 0.45 : 0.8 },
        style,
      ]}>
      {variant === 'gold' ? (
        <LinearGradient colors={[colors.goldStrong, colors.gold]} style={[StyleSheet.absoluteFill, { borderRadius: size === 'xs' ? 8 : radius.button }]} />
      ) : null}
      {body}
    </Pressable>
  );
}

export function IconButton({ name, onPress, label, color = colors.text, size = 22, badge }: { name: IconName; onPress: () => void; label: string; color?: string; size?: number; badge?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={6} style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}>
      <Icon name={name} size={size} color={color} />
      {badge && <View style={styles.iconBadge} />}
    </Pressable>
  );
}

export function Chip({ label, on, onPress }: { label: string; on?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: on }} style={[styles.chip, on && styles.chipOn]}>
      <Text style={[styles.chipText, on && { color: colors.ink }]}>{label}</Text>
    </Pressable>
  );
}

/** Segmented control (web demo `.seg`). */
export function Seg<T extends string>({ value, options, label, onChange, scroll }: { value: T; options: readonly T[]; label: (v: T) => string; onChange: (v: T) => void; scroll?: boolean }) {
  return (
    <View style={[styles.seg, scroll && { flexWrap: 'wrap' }]} accessibilityRole="tablist">
      {options.map((o) => (
        <Pressable key={o} onPress={() => onChange(o)} accessibilityRole="tab" accessibilityState={{ selected: o === value }} style={[styles.segItem, o === value && styles.segOn]}>
          <Text style={[styles.segText, o === value && { color: colors.text }]} numberOfLines={1}>
            {label(o)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// ---- layout --------------------------------------------------------------------------------------

export function SectionHead({ title, action, onAction, count }: { title: string; action?: string; onAction?: () => void; count?: number }) {
  return (
    <View style={styles.secHead}>
      <Text style={type.h2} accessibilityRole="header">
        {title}
        {count ? <Text style={{ color: colors.live }}> {count}</Text> : null}
      </Text>
      {action && (
        <Pressable onPress={onAction} accessibilityRole="button" hitSlop={8} style={styles.secMore}>
          <Text style={styles.secMoreText}>{action}</Text>
          <Icon name="chevron" size={16} color={colors.muted} />
        </Pressable>
      )}
    </View>
  );
}

export function Section({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.section, style]}>{children}</View>;
}

export function Empty({ text }: { text: string }) {
  return <Text style={styles.empty}>{text}</Text>;
}

/** Initials avatar with a tier-free gradient (web demo ProfileAvatar). */
export function Avatar({ name, hue, size = 64 }: { name: string; hue: number; size?: number }) {
  const parts = name.trim().split(/\s+/);
  const ini = (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
  const [a, b] = artColors(hue);
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.gold }}>
      <LinearGradient colors={[a, b]} style={StyleSheet.absoluteFill} />
      <Text style={{ color: colors.text, fontWeight: '800', fontSize: size * 0.34 }}>{ini}</Text>
    </View>
  );
}

/** "WSOP TV" text wordmark — no official logo image. */
export function Wordmark({ size = 20 }: { size?: number }) {
  return (
    <Text style={{ fontSize: size, fontWeight: '900', letterSpacing: -0.5, color: colors.text }} accessibilityLabel="WSOP TV">
      WSOP<Text style={{ color: colors.gold }}> TV</Text>
    </Text>
  );
}

export function Row({ children, style, ...props }: { children: ReactNode; style?: StyleProp<ViewStyle> } & Omit<PressableProps, 'style' | 'children'>) {
  return (
    <Pressable accessibilityRole="button" {...props} style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surface2 }, style]}>
      {children}
    </Pressable>
  );
}

export const styles = StyleSheet.create({
  art: { width: '100%', borderRadius: radius.card, overflow: 'hidden', backgroundColor: colors.surface2 },
  artRing: {
    position: 'absolute',
    left: '18%',
    right: '18%',
    top: '22%',
    bottom: '22%',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  artText: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', padding: 16 },
  artTitle: { color: colors.text, fontSize: 17, fontWeight: '800', textAlign: 'center' },
  artSub: { color: 'rgba(242,242,243,0.75)', fontSize: 12, marginTop: 4, textAlign: 'center' },
  corner: { position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 6 },
  badge: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1, backgroundColor: 'rgba(11,12,14,0.7)' },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  live: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.live, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  liveText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 0.6 },
  tag: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: colors.surface2 },
  tagText: { fontSize: 11, fontWeight: '700' },
  lock: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(11,12,14,0.75)' },
  pill: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: 'rgba(0,0,0,0.65)' },
  pillText: { color: colors.text, fontSize: 11, fontWeight: '700', ...type.tnum },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, overflow: 'hidden' },
  btnOutline: { borderWidth: 1, borderColor: colors.gold },
  btnSurface: { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line },
  btnBlock: { alignSelf: 'stretch', marginTop: 8 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  iconBadge: { position: 'absolute', top: 9, right: 9, width: 7, height: 7, borderRadius: 4, backgroundColor: colors.live },
  chip: { minHeight: 34, paddingHorizontal: 14, borderRadius: 17, borderWidth: 1, borderColor: colors.line, justifyContent: 'center', backgroundColor: colors.surface },
  chipOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  chipText: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  seg: { flexDirection: 'row', marginHorizontal: space.gutter, marginBottom: 12, padding: 3, borderRadius: radius.button, backgroundColor: colors.surface, gap: 3 },
  segItem: { flexGrow: 1, minHeight: 34, paddingHorizontal: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  segOn: { backgroundColor: colors.surface3 },
  segText: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  secHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.gutter, marginBottom: 10 },
  secMore: { flexDirection: 'row', alignItems: 'center', minHeight: 32 },
  secMoreText: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  section: { marginTop: 26 },
  empty: { color: colors.muted, textAlign: 'center', paddingVertical: 28, paddingHorizontal: space.gutter },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 52, paddingHorizontal: space.gutter, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
});
