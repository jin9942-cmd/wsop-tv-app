// Bottom sheets: GGPass login prompt, WSOP+ subscribe prompt (after the 10s preview) and Demo Settings.
// Demo login / subscribe only switch the member state — no forms, no password fields.
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MEMBER_LABEL, TIER_LABEL } from '@/data/plans';
import { schedules } from '@/data/schedules';
import type { Member, Tier } from '@/data/types';
import { noLiveOffset } from '@/lib/access';
import { hapticSuccess } from '@/lib/haptics';
import { HOME_CONFIG_URL } from '@/lib/homeConfig';
import { DISPLAY_TZ, fmtTime, tzAbbr, tzCity, type DisplayTz } from '@/lib/time';
import { useApp, type Sheet } from '@/state/app';
import { colors, mono, radius, type } from '@/theme';

import { Button } from './ui';

export function SheetHost() {
  const { sheet, closeSheet } = useApp();
  return (
    <Modal visible={!!sheet} transparent animationType="slide" onRequestClose={closeSheet} statusBarTranslucent navigationBarTranslucent>
      <Pressable style={styles.backdrop} onPress={closeSheet} accessibilityLabel="Close" />
      {sheet && <SheetBody sheet={sheet} />}
    </Modal>
  );
}

function Frame({ children, demo }: { children: ReactNode; demo?: boolean }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.sheet, demo && styles.demoSheet, { paddingBottom: insets.bottom + 16 }]} accessibilityViewIsModal>
      <View style={[styles.handle, demo && { backgroundColor: colors.demo }]} />
      {children}
    </View>
  );
}

function SheetBody({ sheet }: { sheet: Sheet }) {
  if (sheet.kind === 'login') return <LoginSheet reason={sheet.reason} then={sheet.then} />;
  if (sheet.kind === 'paywall') return <SubscribeSheet tier={sheet.tier} title={sheet.title} />;
  return <DemoSettings />;
}

function LoginSheet({ reason, then }: { reason: string; then?: () => void }) {
  const { set, closeSheet, toast } = useApp();
  return (
    <Frame>
      <Text style={type.h2}>Log in with GGPass</Text>
      <Text style={styles.muted}>{reason}</Text>
      <Button
        title="Continue with GGPass"
        block
        onPress={() => {
          set({ member: 'free' });
          toast('Logged in with GGPass · WSOP+ Free (demo)');
          closeSheet();
          then?.();
        }}
      />
      <Button title="Not now" variant="ghost" block onPress={closeSheet} />
      <Text style={styles.fine}>WSOP+ Free comes with every GGPass account · demo only, no real account.</Text>
    </Frame>
  );
}

function SubscribeSheet({ tier, title }: { tier: Tier; title: string }) {
  const { set, closeSheet, toast } = useApp();
  const options: Tier[] = tier === 'basic' ? ['basic', 'premium'] : ['premium'];
  return (
    <Frame>
      <Text style={styles.kicker}>Preview ended</Text>
      <Text style={type.h2}>Subscribe to keep watching</Text>
      <Text style={styles.muted}>
        “{title}” is available on <Text style={{ fontWeight: '800', color: colors.text }}>WSOP+ {TIER_LABEL[tier]}</Text>
        {tier === 'basic' ? ' and Premium' : ''}.
      </Text>
      {options.map((t) => (
        <Button
          key={t}
          title={`Subscribe to WSOP+ ${TIER_LABEL[t]}`}
          variant={t === 'premium' ? 'gold' : 'outline'}
          block
          onPress={() => {
            set({ member: t });
            hapticSuccess();
            toast(`Subscribed to WSOP+ ${TIER_LABEL[t]} (demo) — enjoy the stream`);
            closeSheet();
          }}
        />
      ))}
      <Button
        title="Compare plans"
        variant="ghost"
        block
        onPress={() => {
          closeSheet();
          router.push('/paywall');
        }}
      />
      <Text style={styles.fine}>Membership is managed in WSOP+ · example policy, not final.</Text>
    </Frame>
  );
}

// ---- Demo Settings (web demo 데모 설정 panel) --------------------------------------------------------

const MEMBERS: Member[] = ['guest', 'free', 'basic', 'premium'];

function DemoSettings() {
  const { member, mode, noLive, tz, set, home, refreshHome, closeSheet } = useApp();
  return (
    <Frame demo>
      <ScrollView style={{ maxHeight: 560 }} contentContainerStyle={{ gap: 4 }}>
        <View style={styles.demoHead}>
          <Text style={styles.demoTitle}>⚙ DEMO SETTINGS</Text>
          <Pressable onPress={closeSheet} accessibilityRole="button" hitSlop={10}>
            <Text style={styles.demoText}>Close</Text>
          </Pressable>
        </View>
        <Text style={styles.demoHint}>Not part of the product UI. Changes apply immediately.</Text>

        <Group label="Member state">
          <DemoSeg value={member} options={MEMBERS} label={(m) => MEMBER_LABEL[m]} onChange={(m) => set({ member: m })} />
        </Group>
        <Group label="Operating mode" hint="Season / off-season home layout from the home config">
          <DemoSeg value={mode} options={['season', 'offseason'] as const} label={(m) => (m === 'season' ? 'Season' : 'Off-season')} onChange={(m) => set({ mode: m })} />
        </Group>
        <Group label="No live broadcasts" hint="Moves the demo clock to before today’s first broadcast">
          <View style={styles.switchRow}>
            <Text style={styles.demoText}>{noLive ? 'ON' : 'OFF'}</Text>
            <Switch value={noLive} onValueChange={(v) => set({ noLive: v, clockOffset: v ? noLiveOffset(schedules) : 0 })} trackColor={{ true: colors.demo, false: colors.lineStrong }} thumbColor="#fff" />
          </View>
        </Group>
        <Group label="Display time zone" hint="Every time in the app is converted">
          <DemoSeg value={tz} options={DISPLAY_TZ} label={(z: DisplayTz) => `${tzCity(z)} (${tzAbbr(z)})`} onChange={(z) => set({ tz: z })} />
        </Group>
        <Group label="Home config">
          <Text style={styles.demoText}>
            Source: {home.loading ? 'loading…' : home.source === 'remote' ? `remote · v${home.config.version}` : 'built-in default'}
          </Text>
          {home.fetchedAt && <Text style={styles.demoHint}>Fetched {fmtTime(home.fetchedAt, tz)}</Text>}
          {home.error && <Text style={[styles.demoHint, { color: colors.delayed }]}>Last fetch failed: {home.error}</Text>}
          <Text style={styles.demoHint} numberOfLines={2}>
            {HOME_CONFIG_URL ?? 'EXPO_PUBLIC_HOME_CONFIG_URL not set'}
          </Text>
          <Pressable onPress={refreshHome} style={styles.demoBtn} accessibilityRole="button">
            <Text style={styles.demoText}>↻ Reload home config</Text>
          </Pressable>
        </Group>
        <Pressable onPress={() => set({ member: 'guest', mode: 'season', noLive: false, clockOffset: 0, tz: 'Asia/Seoul' })} style={styles.demoBtn} accessibilityRole="button">
          <Text style={styles.demoText}>Reset to defaults</Text>
        </Pressable>
      </ScrollView>
    </Frame>
  );
}

function Group({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupLabel}>{label}</Text>
      {hint && <Text style={styles.demoHint}>{hint}</Text>}
      <View style={{ marginTop: 6 }}>{children}</View>
    </View>
  );
}

function DemoSeg<T extends string>({ value, options, label, onChange }: { value: T; options: readonly T[]; label: (v: T) => string; onChange: (v: T) => void }) {
  return (
    <View style={styles.demoSeg} accessibilityRole="radiogroup">
      {options.map((o) => (
        <Pressable key={o} onPress={() => onChange(o)} accessibilityRole="radio" accessibilityState={{ checked: o === value }} style={[styles.demoSegItem, o === value && styles.demoSegOn]}>
          <Text style={[styles.demoText, o === value && { color: '#fff' }]}>{label(o)}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: colors.scrim },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 560,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.panel + 4,
    borderTopRightRadius: radius.panel + 4,
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 6,
  },
  demoSheet: { backgroundColor: colors.demoBg, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.demo, borderBottomWidth: 0 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.lineStrong, marginBottom: 10 },
  kicker: { ...type.label, color: colors.gold },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 20, marginBottom: 6 },
  fine: { color: colors.subtle, fontSize: 11, textAlign: 'center', marginTop: 8 },
  demoHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  demoTitle: { color: colors.demo, fontFamily: mono, fontWeight: '700', letterSpacing: 1 },
  demoText: { color: '#CFE8F7', fontFamily: mono, fontSize: 12 },
  demoHint: { color: 'rgba(207,232,247,0.6)', fontFamily: mono, fontSize: 10.5, marginTop: 2 },
  group: { borderTopWidth: 1, borderTopColor: 'rgba(56,189,248,0.2)', paddingVertical: 10 },
  groupLabel: { color: colors.demo, fontFamily: mono, fontSize: 10.5, letterSpacing: 1, textTransform: 'uppercase' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  demoSeg: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  demoSegItem: { minHeight: 36, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(56,189,248,0.35)', justifyContent: 'center' },
  demoSegOn: { backgroundColor: 'rgba(56,189,248,0.25)', borderColor: colors.demo },
  demoBtn: { minHeight: 40, marginTop: 8, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(56,189,248,0.4)', alignItems: 'center', justifyContent: 'center' },
});
