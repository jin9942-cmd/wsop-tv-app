// Bottom sheets: sign in (web demo v2 LoginModal, GGPASS only — no email or password fields), the WSOP+ prompt after
// a preview (app-only), card menus, and Demo Settings (web demo v2 Demo Controls + the app's own settings).
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { INCLUDED_FROM_LABEL, TIER_NAME, tierFull, type IncludedFrom, type PaidTier, type Tier } from '@/data/policy';
import type { AccountScenario, StreamStatus } from '@/data/types';
import { hapticSuccess } from '@/lib/haptics';
import { HOME_CONFIG_URL } from '@/lib/homeConfig';
import { TZ_OPTIONS, fmtTime, tzAbbr } from '@/lib/time';
import { memberTier, useApp, type MenuAction, type Sheet } from '@/state/app';
import { colors, mono, radius, type } from '@/theme';

import { Button, Icon, Wordmark } from './ui';

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
  if (sheet.kind === 'login') return <LoginSheet reason={sheet.reason} />;
  if (sheet.kind === 'plans') return <PlansSheet required={sheet.required} title={sheet.title} returnTo={sheet.returnTo} />;
  if (sheet.kind === 'menu') return <MenuSheet title={sheet.title} actions={sheet.actions} />;
  return <DemoSettings />;
}

/** Sign-in entry: GGPASS SSO. The GGPASS mock page completes the sign-in and comes straight back. */
function LoginSheet({ reason }: { reason: string }) {
  const { closeSheet } = useApp();
  return (
    <Frame>
      <View style={styles.between}>
        <Wordmark />
        <Pressable onPress={closeSheet} accessibilityRole="button" hitSlop={10}>
          <Text style={[type.small, { fontWeight: '700' }]}>Close</Text>
        </Pressable>
      </View>
      <Text style={[type.title, { fontSize: 24, marginTop: 16 }]}>Sign in to WSOP TV</Text>
      <Text style={[type.small, { marginTop: 4 }]}>{reason}</Text>
      <View style={styles.note}>
        <Text style={type.small}>
          Sign in with GGPass — <Text style={{ color: colors.text, fontWeight: '800' }}>WSOP+ Free</Text> is included with every GGPass account.
        </Text>
      </View>
      <Pressable
        style={({ pressed }) => [styles.gg, pressed && { backgroundColor: colors.goldStrong }]}
        onPress={() => {
          closeSheet();
          router.push('/ggpass');
        }}
        accessibilityRole="button">
        <View style={styles.ggMark}>
          <Text style={{ color: colors.gold, fontSize: 10, fontWeight: '900' }}>G</Text>
        </View>
        <Text style={{ color: colors.ink, fontWeight: '800', fontSize: 15 }}>Continue with GGPASS</Text>
      </Pressable>
      <Text style={[type.caption, { textAlign: 'center', marginTop: 8 }]}>You&apos;ll sign in on GGPASS and come straight back here.</Text>
      <Text style={[type.caption, { textAlign: 'center', marginTop: 20, lineHeight: 16 }]}>By continuing you agree to the Terms of Use and Privacy Policy. Viewing service only — no real-money play.</Text>
    </Frame>
  );
}

/** App-only: after the 10-second preview, offer the WSOP+ tier this content needs. Joining here is the demo shortcut. */
function PlansSheet({ required, title, returnTo }: { required: Tier; title: string; returnTo: string }) {
  const { state, set, toast, closeSheet } = useApp();
  const need: PaidTier = required === 'premium' ? 'premium' : 'basic';
  const options: PaidTier[] = need === 'basic' ? ['basic', 'premium'] : ['premium'];
  const have = memberTier(state);
  return (
    <Frame>
      <Text style={[type.label, { color: colors.gold }]}>Preview ended</Text>
      <Text style={[type.h2, { marginTop: 4 }]}>{tierFull(need)} required</Text>
      <Text style={[type.small, { marginTop: 4, lineHeight: 19 }]}>
        “{title}” is included with {tierFull(need)}
        {need === 'basic' ? ' and Premium' : ''}. You’re on <Text style={{ color: colors.text, fontWeight: '700' }}>{have === 'free' ? 'no membership' : tierFull(have)}</Text>.
      </Text>
      <View style={{ gap: 8, marginTop: 14 }}>
        {options.map((t) => (
          <Button
            key={t}
            variant={t === need ? 'primary' : 'outline'}
            title={`Join WSOP+ ${TIER_NAME[t]}`}
            block
            onPress={() => {
              set({ scenario: t, paidTier: t });
              hapticSuccess();
              toast(`${tierFull(t)} is active — enjoy WSOP TV`);
              closeSheet();
            }}
          />
        ))}
        <Button
          variant="ghost"
          title="See WSOP+ plans"
          block
          onPress={() => {
            closeSheet();
            router.push({ pathname: '/plans', params: { required: need, returnTo } });
          }}
        />
      </View>
      <Text style={[type.caption, { textAlign: 'center', marginTop: 10 }]}>Membership is managed in WSOP+ · example policy, not final.</Text>
    </Frame>
  );
}

function MenuSheet({ title, actions }: { title: string; actions: MenuAction[] }) {
  const { closeSheet } = useApp();
  return (
    <Frame>
      <Text style={[type.h3, { marginBottom: 8 }]} numberOfLines={2}>
        {title}
      </Text>
      {actions.map((a) => (
        <Pressable
          key={a.label}
          onPress={() => {
            closeSheet();
            a.onSelect();
          }}
          accessibilityRole="menuitem"
          style={({ pressed }) => [styles.menuItem, pressed && { backgroundColor: colors.surface2 }]}>
          <Icon name={a.icon} size={18} color={colors.muted} />
          <Text style={type.body}>{a.label}</Text>
        </Pressable>
      ))}
    </Frame>
  );
}

// ---- Demo Settings ---------------------------------------------------------------------------------

const SCENARIOS: { v: AccountScenario; label: string }[] = [
  { v: 'guest', label: '1 · Not signed in' },
  { v: 'free', label: '2 · GGPass · WSOP+ Free' },
  { v: 'basic', label: '3 · GGPass · WSOP+ Basic' },
  { v: 'premium', label: '4 · GGPass · WSOP+ Premium' },
  { v: 'unlinked', label: '5 · WSOP+ member, GGPass not linked (TBD)' },
  { v: 'restricted', label: '6 · GGPass account restricted' },
  { v: 'deviceLimit', label: '7 · Too many devices' },
  { v: 'expired', label: '8 · WSOP+ membership ended' },
  { v: 'grace', label: '9 · WSOP+ payment issue' },
];
const STREAMS: [Exclude<StreamStatus, 'upcoming'>, string][] = [
  ['live', 'Live'],
  ['delayed', 'Delayed'],
  ['vod', 'VOD'],
  ['late', 'Late start'],
  ['interrupted', 'Interrupted'],
];

function DemoSettings() {
  const { state, set, home, refreshHome, closeSheet } = useApp();
  return (
    <Frame demo>
      <ScrollView style={{ maxHeight: 600 }}>
        <View style={styles.between}>
          <Text style={styles.demoTitle}>⚙ DEMO SETTINGS</Text>
          <Pressable onPress={closeSheet} accessibilityRole="button" hitSlop={10}>
            <Text style={styles.demoText}>Close</Text>
          </Pressable>
        </View>
        <Text style={styles.hint}>Not part of the product UI. Changes apply immediately.</Text>

        <Group label="Account state">
          <View style={{ gap: 4 }} accessibilityRole="radiogroup">
            {SCENARIOS.map((s) => (
              <Pressable
                key={s.v}
                accessibilityRole="radio"
                accessibilityState={{ checked: state.scenario === s.v }}
                // Basic / Premium also set the tier that states 5, 7, 8, 9 hold.
                onPress={() => set(s.v === 'basic' || s.v === 'premium' ? { scenario: s.v, paidTier: s.v } : { scenario: s.v })}
                style={[styles.option, state.scenario === s.v && styles.optionOn]}>
                <Text style={[styles.demoText, state.scenario === s.v && { color: '#fff' }]}>{s.label}</Text>
              </Pressable>
            ))}
          </View>
        </Group>
        <Group label="WSOP TV included from" hint="Paid content needs this tier. Split: live/delayed → Premium; replays, archive, paid clips → Basic.">
          <Seg value={state.includedFrom} options={['basic', 'premium', 'split'] as IncludedFrom[]} label={(v) => INCLUDED_FROM_LABEL[v]} onChange={(v) => set({ includedFrom: v })} />
        </Group>
        <Group label="Featured stream (Main Event FT)" hint="Delayed: feature table 30 min · Player Cam starts late, Overhead Cam is interrupted.">
          <Seg value={state.streamMode} options={STREAMS.map(([v]) => v)} label={(v) => STREAMS.find((x) => x[0] === v)![1]} onChange={(v) => set({ streamMode: v })} />
        </Group>
        <Group label="Operating mode" hint="Season / off-season home layout from the home config">
          <Seg value={state.mode} options={['season', 'offseason'] as const} label={(m) => (m === 'season' ? 'Season' : 'Off-season')} onChange={(m) => set({ mode: m })} />
        </Group>
        <Group label="No live broadcasts" hint="Everything on air is treated as ended: Home shows what's up next">
          <Toggle on={state.noLive} onChange={(v) => set({ noLive: v })} />
        </Group>
        <Group label="Display time zone" hint="Every time in the app is converted">
          <Seg value={state.tz} options={TZ_OPTIONS.map((o) => o.tz)} label={(tz) => `${TZ_OPTIONS.find((o) => o.tz === tz)!.label} · ${tzAbbr(tz)}`} onChange={(tz) => set({ tz })} />
        </Group>
        <Group label="Region">
          <Check label="Region restricted" on={state.regionBlocked} onChange={(v) => set({ regionBlocked: v })} />
          <Check label="VPN/proxy detected" on={state.vpnDetected} onChange={(v) => set({ vpnDetected: v })} />
          <Check label="Traveling abroad" on={state.abroad} onChange={(v) => set({ abroad: v, abroadDismissed: false })} />
        </Group>
        <Group label="Viewer">
          <Check label="Spoiler-Free Mode" on={state.spoilerFree} onChange={(v) => set({ spoilerFree: v })} />
        </Group>
        <Group label="WSOP+ page result">
          <Seg value={state.paymentResult} options={['success', 'fail', 'cancel'] as const} label={(v) => v[0].toUpperCase() + v.slice(1)} onChange={(v) => set({ paymentResult: v })} />
        </Group>
        <Group label="Home config">
          <Text style={styles.demoText}>Source: {home.loading ? 'loading…' : home.source === 'remote' ? `remote · v${home.config.version}` : 'built-in default'}</Text>
          {home.fetchedAt && <Text style={styles.hint}>Fetched {fmtTime(home.fetchedAt, state.tz)}</Text>}
          {home.error && <Text style={[styles.hint, { color: colors.delayed }]}>Last fetch failed: {home.error}</Text>}
          <Text style={styles.hint} numberOfLines={2}>
            {HOME_CONFIG_URL ?? 'EXPO_PUBLIC_HOME_CONFIG_URL not set'}
          </Text>
          <Pressable onPress={refreshHome} style={styles.demoBtn} accessibilityRole="button">
            <Text style={styles.demoText}>↻ Reload home config</Text>
          </Pressable>
        </Group>
      </ScrollView>
    </Frame>
  );
}

function Group({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupLabel}>{label}</Text>
      {hint && <Text style={styles.hint}>{hint}</Text>}
      <View style={{ marginTop: 6 }}>{children}</View>
    </View>
  );
}

function Seg<T extends string>({ value, options, label, onChange }: { value: T; options: readonly T[]; label: (v: T) => string; onChange: (v: T) => void }) {
  return (
    <View style={styles.seg} accessibilityRole="radiogroup">
      {options.map((o) => (
        <Pressable key={o} onPress={() => onChange(o)} accessibilityRole="radio" accessibilityState={{ checked: o === value }} style={[styles.option, { paddingHorizontal: 10 }, o === value && styles.optionOn]}>
          <Text style={[styles.demoText, o === value && { color: '#fff' }]}>{label(o)}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.between}>
      <Text style={styles.demoText}>{on ? 'ON' : 'OFF'}</Text>
      <Switch value={on} onValueChange={onChange} trackColor={{ true: colors.demo, false: colors.lineStrong }} thumbColor="#fff" />
    </View>
  );
}

function Check({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <Pressable onPress={() => onChange(!on)} accessibilityRole="checkbox" accessibilityState={{ checked: on }} style={[styles.between, { minHeight: 36 }]}>
      <Text style={styles.demoText}>{label}</Text>
      <View style={[styles.box, on && { backgroundColor: colors.demo }]}>{on && <Icon name="check" size={14} color={colors.demoBg} />}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.7)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, alignSelf: 'center', width: '100%', maxWidth: 560, backgroundColor: colors.surface, borderTopLeftRadius: radius.panel, borderTopRightRadius: radius.panel, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 24, paddingTop: 10 },
  demoSheet: { backgroundColor: colors.demoBg, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.demo, borderBottomWidth: 0, paddingHorizontal: 16 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.lineStrong, marginBottom: 14 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  note: { marginTop: 12, borderRadius: radius.chip, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface2, paddingHorizontal: 12, paddingVertical: 8 },
  gg: { marginTop: 20, minHeight: 48, borderRadius: radius.chip, backgroundColor: colors.gold, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  ggMark: { width: 20, height: 20, borderRadius: 5, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48, paddingHorizontal: 8, borderRadius: radius.chip },
  demoTitle: { color: colors.demo, fontFamily: mono, fontWeight: '700', letterSpacing: 1 },
  demoText: { color: '#CFE8F7', fontFamily: mono, fontSize: 12 },
  hint: { color: 'rgba(207,232,247,0.6)', fontFamily: mono, fontSize: 10.5, marginTop: 2 },
  group: { borderTopWidth: 1, borderTopColor: 'rgba(56,189,248,0.2)', paddingVertical: 10, marginTop: 4 },
  groupLabel: { color: colors.demo, fontFamily: mono, fontSize: 10.5, letterSpacing: 1, textTransform: 'uppercase' },
  seg: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  option: { minHeight: 34, paddingHorizontal: 8, borderRadius: 6, justifyContent: 'center' },
  optionOn: { backgroundColor: 'rgba(56,189,248,0.25)' },
  box: { width: 20, height: 20, borderRadius: 4, borderWidth: 1, borderColor: colors.demo, alignItems: 'center', justifyContent: 'center' },
  demoBtn: { minHeight: 40, marginTop: 8, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(56,189,248,0.4)', alignItems: 'center', justifyContent: 'center' },
});
