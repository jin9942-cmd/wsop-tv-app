// UI primitives (web demo v2 components/ui.tsx): buttons, status / access badges, bracelet, icons, avatar, section header,
// segmented control, chips, switch, spoiler guard, empty / error states, tabs. Colours come from src/theme.
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Switch as RNSwitch, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { requiredTier, TIER_BADGE, type Tier } from '@/data/policy';
import type { Access, StreamStatus } from '@/data/types';
import { initials } from '@/lib/format';
import { useApp } from '@/state/app';
import { colors, radius, space, TOUCH, type } from '@/theme';

// ---- icons (Material Symbols via expo-symbols on Android and web) ------------------------------

const ICONS = {
  home: 'star',
  live: 'play_arrow',
  calendar: 'calendar_month',
  hands: 'grid_view',
  more: 'menu',
  dots: 'more_horiz',
  user: 'person',
  search: 'search',
  lock: 'lock',
  bell: 'notifications',
  play: 'play_arrow',
  pause: 'pause',
  close: 'close',
  back: 'arrow_back',
  check: 'check',
  chevron: 'chevron_right',
  plus: 'add',
  layers: 'layers',
  history: 'history',
  grid1: 'crop_square',
  grid2: 'splitscreen',
  prev: 'skip_previous',
  next: 'skip_next',
  volume: 'volume_up',
  eye: 'visibility',
  globe: 'public',
  tv: 'tv',
  shield: 'shield',
  card: 'credit_card',
  refresh: 'refresh',
  settings: 'settings',
  list: 'format_list_bulleted',
  archive: 'video_library',
  players: 'groups',
  series: 'layers',
  devices: 'devices',
  logout: 'logout',
} as const;
export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 20, color = colors.text, style }: { name: IconName; size?: number; color?: string; style?: StyleProp<ViewStyle> }) {
  return <SymbolView name={{ android: ICONS[name], web: ICONS[name] }} size={size} tintColor={color} style={style} />;
}

// ---- button ---------------------------------------------------------------------------------

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline';

export function Button({
  title,
  onPress,
  variant = 'secondary',
  size = 'md',
  icon,
  disabled,
  block,
  style,
  pressed: on,
  accessibilityLabel,
}: {
  title?: string;
  onPress?: () => void;
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
  icon?: IconName;
  disabled?: boolean;
  block?: boolean;
  style?: StyleProp<ViewStyle>;
  /** aria-pressed for toggles. */
  pressed?: boolean;
  accessibilityLabel?: string;
}) {
  const fg = variant === 'primary' ? colors.ink : variant === 'ghost' ? colors.muted : colors.text;
  const h = size === 'sm' ? 36 : size === 'lg' ? 48 : TOUCH;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled, selected: on }}
      style={({ pressed }) => [
        styles.btn,
        { minHeight: h, paddingHorizontal: size === 'sm' ? 12 : size === 'lg' ? 24 : 16 },
        variant === 'primary' && { backgroundColor: pressed ? colors.goldStrong : colors.gold },
        variant === 'secondary' && { backgroundColor: pressed ? colors.lineStrong : colors.surface3 },
        variant === 'outline' && { borderWidth: 1, borderColor: pressed ? colors.gold : colors.lineStrong },
        variant === 'ghost' && pressed && { backgroundColor: colors.surface2 },
        block && { alignSelf: 'stretch' },
        disabled && { opacity: 0.45 },
        style,
      ]}>
      {icon && <Icon name={icon} size={size === 'sm' ? 15 : 18} color={fg} />}
      {!!title && <Text style={{ color: fg, fontWeight: variant === 'primary' ? '800' : '700', fontSize: size === 'sm' ? 13 : size === 'lg' ? 15 : 14 }}>{title}</Text>}
    </Pressable>
  );
}

export function IconButton({ name, onPress, label, color = colors.muted, size = 22, dot }: { name: IconName; onPress: () => void; label: string; color?: string; size?: number; dot?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={6} style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}>
      <Icon name={name} size={size} color={color} />
      {dot && <View style={styles.iconDot} />}
    </Pressable>
  );
}

// ---- status badges -----------------------------------------------------------------------

export function StatusBadge({ status, delayMin = 30, size = 'md' }: { status: StreamStatus; delayMin?: number; size?: 'sm' | 'md' }) {
  const pad = size === 'sm' ? styles.badgeSm : styles.badgeMd;
  const fs = size === 'sm' ? 10 : 11;
  const label = (text: string, color: string) => <Text style={[styles.badgeText, { color, fontSize: fs }]}>{text}</Text>;
  if (status === 'live')
    return (
      <View style={[styles.badge, pad, { backgroundColor: colors.live }]}>
        <View style={[styles.dot, { backgroundColor: '#fff' }]} />
        {label('LIVE', '#fff')}
      </View>
    );
  if (status === 'delayed')
    return (
      <View style={[styles.badge, pad, { backgroundColor: colors.delayed }]}>
        <View style={[styles.dot, { backgroundColor: colors.ink }]} />
        {label(`DELAYED ${delayMin} MIN`, colors.ink)}
      </View>
    );
  if (status === 'upcoming') return <View style={[styles.badge, pad, { borderWidth: 1, borderColor: colors.lineStrong }]}>{label('UPCOMING', colors.muted)}</View>;
  if (status === 'late') return <View style={[styles.badge, pad, { borderWidth: 1, borderColor: colors.delayed, backgroundColor: 'rgba(0,0,0,0.5)' }]}>{label('LATE START', colors.delayed)}</View>;
  if (status === 'interrupted') return <View style={[styles.badge, pad, { borderWidth: 1, borderColor: colors.live, backgroundColor: 'rgba(0,0,0,0.5)' }]}>{label('INTERRUPTED', colors.live)}</View>;
  return <View style={[styles.badge, pad, { backgroundColor: colors.surface3 }]}>{label('VOD', colors.muted)}</View>;
}

/** Small uppercase tag on dark glass (e.g. "CLASSIC · 2019", "Ended"). */
export function Label({ children, color = colors.text, border, bg = 'rgba(0,0,0,0.7)', size = 10 }: { children: ReactNode; color?: string; border?: string; bg?: string; size?: number }) {
  return (
    <View style={[styles.badge, styles.badgeSm, { backgroundColor: bg }, border ? { borderWidth: 1, borderColor: border } : null]}>
      <Text style={[styles.badgeText, { color, fontSize: size }]}>{children}</Text>
    </View>
  );
}

/**
 * Content-level access badge: the WSOP+ tier this content needs (depends on "WSOP TV included from"; `live` matters
 * for Split). `locked` adds a lock when the viewer can't play it yet. On artwork, only Free or what's still needed shows.
 */
export function AccessBadge({ access, locked, size = 'sm', live, onArt }: { access: Access; locked?: boolean; size?: 'sm' | 'md'; live?: boolean; onArt?: boolean }) {
  const { state } = useApp();
  const tier = requiredTier(access, state.includedFrom, live);
  if (onArt && !locked && tier !== 'free') return null;
  return <TierBadge tier={tier} locked={locked} size={size} />;
}

export function TierBadge({ tier, locked, size = 'sm' }: { tier: Tier; locked?: boolean; size?: 'sm' | 'md' }) {
  const c = TIER_STYLE[tier];
  return (
    <View style={[styles.badge, size === 'sm' ? styles.badgeSm : styles.badgeMd, { borderWidth: 1, borderColor: c.border, backgroundColor: c.bg }]}>
      {locked && tier !== 'free' && <Icon name="lock" size={size === 'sm' ? 10 : 12} color={c.fg} />}
      <Text style={[styles.badgeText, { color: c.fg, fontSize: size === 'sm' ? 10 : 11 }]}>{TIER_BADGE[tier].toUpperCase()}</Text>
    </View>
  );
}
const TIER_STYLE: Record<Tier, { fg: string; border: string; bg: string }> = {
  free: { fg: colors.ok, border: 'rgba(76,195,138,0.6)', bg: 'rgba(0,0,0,0.7)' },
  wsopFree: { fg: colors.text, border: colors.lineStrong, bg: 'rgba(0,0,0,0.7)' },
  basic: { fg: colors.goldStrong, border: 'rgba(201,169,97,0.6)', bg: 'rgba(0,0,0,0.7)' },
  premium: { fg: colors.goldStrong, border: colors.gold, bg: 'rgba(201,169,97,0.2)' },
};

// ---- bracelet (drawn with views, not an emoji) ------------------------------------------------

export function BraceletIcon({ size = 18, color = colors.gold }: { size?: number; color?: string }) {
  const w = size * 0.75;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }} accessible={false}>
      <View style={{ position: 'absolute', top: size * 0.3, width: w, height: size * 0.5, borderRadius: size, borderWidth: Math.max(1.5, size / 11), borderColor: color }} />
      <View style={{ position: 'absolute', top: size * 0.18, width: size * 0.3, height: size * 0.2, borderRadius: 2, backgroundColor: color }} />
    </View>
  );
}

export function BraceletCount({ n, size = 16 }: { n: number; size?: number }) {
  return (
    <View style={styles.row} accessibilityLabel={`${n} bracelets`}>
      <BraceletIcon size={size} />
      <Text style={[type.h3, type.tnum]}>{n}</Text>
    </View>
  );
}

// ---- artwork -------------------------------------------------------------------------------

/** Card artwork: a real still from the CC footage with a soft gradient, or a neutral stage. */
export function Art({ image, children, style, dim, ratio = 16 / 9 }: { image?: number; children?: ReactNode; style?: StyleProp<ViewStyle>; dim?: boolean; ratio?: number }) {
  return (
    <View style={[styles.art, { aspectRatio: ratio }, style]}>
      {image ? (
        <>
          <Image source={image} style={[StyleSheet.absoluteFill, dim && { opacity: 0.5 }]} contentFit="cover" transition={150} recyclingKey={String(image)} />
          <LinearGradient colors={['rgba(0,0,0,0.25)', 'transparent', 'rgba(0,0,0,0.55)']} style={StyleSheet.absoluteFill} />
        </>
      ) : (
        <View style={styles.stageRing} />
      )}
      {children}
    </View>
  );
}

/** Absolutely positioned slot on artwork. */
export function Corner({ at, children, inset = 8 }: { at: 'tl' | 'tr' | 'bl' | 'br'; children: ReactNode; inset?: number }) {
  const pos: ViewStyle = { [at[0] === 't' ? 'top' : 'bottom']: inset, [at[1] === 'l' ? 'left' : 'right']: inset };
  return <View style={[styles.corner, pos]}>{children}</View>;
}

/** Duration / viewer count chip on artwork. */
export function Pill({ children }: { children: ReactNode }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillText}>{children}</Text>
    </View>
  );
}

// ---- avatar (initials, no photos) ------------------------------------------------------------

/** Initials avatar. `vivid` = solid player colour with a thin outer ring (Featured players look). */
export function Avatar({ name, hue, size = 48, ring, vivid }: { name: string; hue: number; size?: number; ring?: boolean; vivid?: boolean }) {
  const circle: ViewStyle = { width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' };
  const label = <Text style={{ color: vivid ? '#fff' : 'rgba(255,255,255,0.9)', fontWeight: '800', fontSize: size * (vivid ? 0.38 : 0.36) }}>{initials(name)}</Text>;
  const body = vivid ? (
    <View style={[circle, { backgroundColor: `hsl(${hue}, 48%, 52%)` }]}>{label}</View>
  ) : (
    <View style={circle}>
      <LinearGradient colors={[`hsl(${hue}, 22%, 34%)`, `hsl(${hue}, 18%, 16%)`]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      {label}
    </View>
  );
  if (!vivid && !ring) return body;
  // Outer ring: bg gap + line (vivid) or gold (ring).
  return <View style={{ padding: 3, borderRadius: size, borderWidth: 1, borderColor: ring ? colors.gold : colors.lineStrong }}>{body}</View>;
}

export function CountryCode({ cc }: { cc: string }) {
  return (
    <View style={[styles.badge, { borderWidth: 1, borderColor: colors.lineStrong, paddingHorizontal: 4, paddingVertical: 0, alignSelf: 'flex-start' }]}>
      <Text style={[styles.badgeText, { color: colors.muted, fontSize: 10 }]}>{cc}</Text>
    </View>
  );
}

// ---- section header ------------------------------------------------------------------------

export function SectionHeader({ title, kicker, action, onAction }: { title: string; kicker?: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.secHead}>
      <View style={{ flex: 1 }}>
        {kicker && <Text style={[type.label, { color: colors.gold, marginBottom: 4 }]}>{kicker}</Text>}
        <Text style={styles.secTitle} accessibilityRole="header">
          {title}
        </Text>
      </View>
      {action && (
        <Pressable onPress={onAction} hitSlop={8} accessibilityRole="link" style={{ minHeight: 32, justifyContent: 'center' }}>
          <Text style={styles.secAction}>{action} →</Text>
        </Pressable>
      )}
    </View>
  );
}

/** Page title block: gold kicker + big title (+ optional intro). */
export function PageHeader({ kicker, title, intro }: { kicker?: string; title: string; intro?: string }) {
  return (
    <View style={{ paddingHorizontal: space.gutter, paddingTop: 8, paddingBottom: 8 }}>
      {kicker && <Text style={[type.label, { color: colors.gold }]}>{kicker}</Text>}
      <Text style={[type.title, { marginTop: 4 }]} accessibilityRole="header">
        {title}
      </Text>
      {intro && <Text style={[type.small, { marginTop: 6, lineHeight: 19 }]}>{intro}</Text>}
    </View>
  );
}

// ---- segmented control / chips / switch ---------------------------------------------------------

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  size = 'md',
}: {
  value: T;
  options: { value: T; label: ReactNode; disabled?: boolean }[];
  onChange: (v: T) => void;
  label: string;
  size?: 'sm' | 'md';
}) {
  return (
    <View style={styles.seg} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            disabled={o.disabled}
            accessibilityRole="radio"
            accessibilityState={{ checked: on, disabled: o.disabled }}
            style={[styles.segItem, { minHeight: size === 'sm' ? 30 : 34 }, on && { backgroundColor: colors.surface3 }, o.disabled && { opacity: 0.4 }]}>
            {typeof o.label === 'string' ? <Text style={[styles.segText, on && { color: colors.text }]}>{o.label}</Text> : o.label}
          </Pressable>
        );
      })}
    </View>
  );
}

export function FilterChip({ on, children, onPress }: { on: boolean; children: ReactNode; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: on }} style={[styles.chip, on && styles.chipOn]}>
      {typeof children === 'string' ? <Text style={[styles.chipText, on && { color: colors.goldStrong }]}>{children}</Text> : children}
    </Pressable>
  );
}

export function Switch({ on, onChange, label, description }: { on: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <View style={styles.switchRow}>
      <View style={{ flex: 1 }}>
        <Text style={[type.body, { fontWeight: '700' }]}>{label}</Text>
        {description && <Text style={[type.small, { marginTop: 2 }]}>{description}</Text>}
      </View>
      <RNSwitch value={on} onValueChange={onChange} trackColor={{ true: colors.gold, false: colors.surface3 }} thumbColor="#fff" accessibilityLabel={label} />
    </View>
  );
}

// ---- spoiler guard ------------------------------------------------------------------------

/** Hides content in spoiler-free mode behind a "Reveal" button. `k` identifies the item so a reveal sticks. */
export function Spoiler({ k, children, label = 'Result hidden' }: { k: string; children: ReactNode; label?: string }) {
  const { isRevealed, reveal } = useApp();
  if (isRevealed(k)) return <>{children}</>;
  return (
    <Pressable onPress={() => reveal(k)} accessibilityRole="button" accessibilityLabel={`${label}. Reveal`} style={styles.spoiler}>
      <Icon name="eye" size={12} color={colors.text} />
      <Text style={[styles.badgeText, { color: colors.text, fontSize: 10 }]}>REVEAL</Text>
    </Pressable>
  );
}

// ---- states -------------------------------------------------------------------------------

export function EmptyState({ title, body, children }: { title: string; body?: string; children?: ReactNode }) {
  return (
    <View style={styles.empty} accessibilityRole="summary">
      <Icon name="search" size={28} color={colors.subtle} />
      <Text style={[type.h3, { textAlign: 'center' }]}>{title}</Text>
      {body && <Text style={[type.small, { textAlign: 'center', maxWidth: 320 }]}>{body}</Text>}
      {children && <View style={{ marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>{children}</View>}
    </View>
  );
}

export function ErrorState({ title, body, onRetry }: { title: string; body?: string; onRetry?: () => void }) {
  return (
    <View style={[styles.empty, { borderStyle: 'solid', backgroundColor: colors.surface2, paddingVertical: 20 }]}>
      <Text style={type.h3}>{title}</Text>
      {body && <Text style={[type.small, { textAlign: 'center' }]}>{body}</Text>}
      {onRetry && <Button title="Retry" size="sm" variant="outline" onPress={onRetry} />}
    </View>
  );
}

// ---- tabs -----------------------------------------------------------------------------------

export function Tabs<T extends string>({ value, tabs, onChange, label }: { value: T; tabs: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <View style={styles.tabs} accessibilityRole="tablist" accessibilityLabel={label}>
      {tabs.map((t) => {
        const on = t.value === value;
        return (
          <Pressable key={t.value} onPress={() => onChange(t.value)} accessibilityRole="tab" accessibilityState={{ selected: on }} style={[styles.tab, on && { borderBottomColor: colors.gold }]}>
            <Text style={[styles.tabText, on && { color: colors.text }]} numberOfLines={1}>
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Marks a value that isn't decided yet (price, retention, thresholds…). */
export function Placeholder() {
  return (
    <View style={[styles.badge, { borderWidth: 1, borderStyle: 'dashed', borderColor: colors.lineStrong, paddingHorizontal: 4, paddingVertical: 0 }]}>
      <Text style={[styles.badgeText, { color: colors.subtle, fontSize: 9 }]}>PLACEHOLDER</Text>
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

export const text = StyleSheet.create({
  cardTitle: { color: colors.text, fontSize: 15, fontWeight: '700', marginTop: 8 },
  cardMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  cardSub: { color: colors.subtle, fontSize: 12, marginTop: 1 },
}) satisfies Record<string, TextStyle>;

export const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: radius.chip },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  iconDot: { position: 'absolute', top: 9, right: 9, width: 7, height: 7, borderRadius: 4, backgroundColor: colors.live },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 4, alignSelf: 'flex-start' },
  badgeSm: { paddingHorizontal: 6, paddingVertical: 2 },
  badgeMd: { paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontWeight: '800', letterSpacing: 0.8, ...type.tnum },
  dot: { width: 6, height: 6, borderRadius: 3 },
  art: { width: '100%', borderRadius: radius.card, overflow: 'hidden', backgroundColor: colors.surface2 },
  stageRing: { position: 'absolute', top: '24%', left: '18%', width: '64%', height: '52%', borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  corner: { position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 6 },
  pill: { borderRadius: 3, paddingHorizontal: 6, paddingVertical: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
  pillText: { color: colors.text, fontSize: 11, fontWeight: '700', ...type.tnum },
  secHead: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginBottom: 12, paddingHorizontal: space.gutter },
  secTitle: { color: colors.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  secAction: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  seg: { flexDirection: 'row', alignSelf: 'flex-start', borderRadius: radius.chip, backgroundColor: colors.surface2, padding: 2 },
  segItem: { paddingHorizontal: 12, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  segText: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  chip: { minHeight: 34, paddingHorizontal: 14, borderRadius: 17, borderWidth: 1, borderColor: colors.lineStrong, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 6 },
  chipOn: { borderColor: colors.gold, backgroundColor: colors.goldDim },
  chipText: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 12 },
  spoiler: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', borderRadius: 999, borderWidth: 1, borderColor: colors.lineStrong, backgroundColor: colors.surface, paddingHorizontal: 10, paddingVertical: 4 },
  empty: { alignItems: 'center', gap: 8, borderRadius: radius.card, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.lineStrong, paddingHorizontal: 24, paddingVertical: 40, marginHorizontal: space.gutter },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.line, gap: 4 },
  tab: { paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: 'transparent', marginBottom: -1 },
  tabText: { color: colors.muted, fontSize: 14, fontWeight: '700' },
});
