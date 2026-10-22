// Account (web demo v2 pages/Account.tsx): GGPASS, WSOP+ membership, viewing history, devices, viewing preferences,
// notifications, privacy, Responsible Gaming, sign out.
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { DeviceList } from '@/components/devices';
import { SubHead } from '@/components/headers';
import { Button, PageHeader, Placeholder, Segmented, Switch } from '@/components/ui';
import { dayById } from '@/data/mock';
import { COMPLETE_THRESHOLD, GRACE_DAYS, NEXT_PAYMENT_DAYS, daysFromNow, tierFull } from '@/data/policy';
import type { AudioTrack, OverlayLevel } from '@/data/types';
import { fmtBillingDate } from '@/lib/time';
import { memberTier, useApp } from '@/state/app';
import { colors, radius, space, type } from '@/theme';

const AUDIO_LABEL: Record<AudioTrack, string> = { en: 'English Commentary', natural: 'Natural Sound', es: 'Spanish Commentary' };

export default function Account() {
  const { state, set, toast, signedIn, requireLogin } = useApp();

  if (!signedIn)
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <SubHead />
        <View style={styles.center}>
          <Text style={[type.label, { color: colors.gold }]}>Account</Text>
          <Text style={[type.title, { textAlign: 'center' }]}>Sign in to manage your account</Text>
          <Text style={[type.small, { textAlign: 'center' }]}>Settings like Spoiler-Free Mode and followed players are saved to your account.</Text>
          <Button variant="primary" size="lg" title="Continue with GGPASS" onPress={() => requireLogin('Sign in to manage your account.')} />
        </View>
      </View>
    );

  const linked = state.scenario !== 'unlinked';
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SubHead />
      <ScrollView contentContainerStyle={{ paddingBottom: 40, gap: 16 }}>
        <PageHeader kicker="Account" title="Demo Viewer" intro="demo.viewer@example.com" />
        <Card title="GGPASS">
          <View style={styles.inline}>
            <View style={styles.gg}>
              <Text style={{ color: colors.gold, fontWeight: '900' }}>G</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[type.body, { fontWeight: '700' }]}>{linked ? 'Connected' : 'Not connected'}</Text>
              <Text style={type.small}>{state.scenario === 'restricted' ? 'Account restricted — contact GGPASS support' : 'Shared with WSOP TV: email, nickname'}</Text>
              <Text style={[type.small, { marginTop: 2 }]}>Your GGPass account includes WSOP+ Free.</Text>
            </View>
            {linked ? (
              <Button size="sm" variant="ghost" title="Manage" onPress={() => toast('Manage connected apps on GGPASS (demo)')} />
            ) : (
              <Button size="sm" variant="primary" title="Link" onPress={() => (set((x) => ({ scenario: x.paidTier })), toast('GGPASS linked (demo)'))} />
            )}
          </View>
        </Card>
        <Card title="WSOP+ membership">
          <Membership />
        </Card>
        <ViewingHistory />
        <Card title="Devices">
          <DeviceList />
        </Card>
        <Card title="Viewing preferences">
          <Switch label="Spoiler-Free Mode" description="Hide results, champions, chip standings and hand outcomes everywhere until you choose to reveal them." on={state.spoilerFree} onChange={(v) => set({ spoilerFree: v })} />
          <Row label="Default overlay">
            <Segmented<OverlayLevel>
              label="Default overlay"
              size="sm"
              value={state.overlayDefault}
              onChange={(v) => set({ overlayDefault: v })}
              options={[
                { value: 'off', label: 'Off' },
                { value: 'basic', label: 'Basic' },
                { value: 'pro', label: 'Pro' },
              ]}
            />
          </Row>
          <Row label="Default audio">
            <Segmented<AudioTrack>
              label="Default audio"
              size="sm"
              value={state.audioDefault}
              onChange={(v) => set({ audioDefault: v })}
              options={(Object.keys(AUDIO_LABEL) as AudioTrack[]).map((a) => ({ value: a, label: a === 'en' ? 'English' : a === 'es' ? 'Spanish' : 'Natural' }))}
            />
          </Row>
          <Switch label="Captions on by default" on={state.ccDefault} onChange={(v) => set({ ccDefault: v })} />
        </Card>
        <Card title="Notifications">
          <Switch label="Live start" description="When a final table or followed event goes live" on={state.notifyLiveStart} onChange={(v) => set({ notifyLiveStart: v })} />
          <Switch label="Followed players" description="When a player you follow is on a broadcast table" on={state.notifyFollowed} onChange={(v) => set({ notifyFollowed: v })} />
        </Card>
        <Card title="Privacy">
          <Text style={type.small}>Request a copy of your data or ask us to delete it. Requests are verified through GGPASS.</Text>
          <View style={[styles.inline, { marginTop: 12, flexWrap: 'wrap' }]}>
            <Button variant="outline" size="sm" title="Request data download" onPress={() => toast('Data download request submitted (demo)')} />
            <Button variant="ghost" size="sm" title="Request account deletion" onPress={() => toast('Deletion request submitted (demo)')} />
          </View>
        </Card>
        <Card title="Responsible Gaming">
          <Text style={type.small}>WSOP TV is a viewing service. If poker or gaming is affecting you or someone you know, support is available. Age requirements for poker-related services vary by region.</Text>
          <View style={{ marginTop: 10, gap: 6 }}>
            {['Responsible Gaming principles', 'Find support near you', 'Self-assessment'].map((x) => (
              <Text key={x} style={[type.small, { color: colors.gold, fontWeight: '700' }]} onPress={() => toast(`${x} (demo)`)}>
                {x}
              </Text>
            ))}
          </View>
        </Card>
        <Button variant="ghost" icon="logout" title="Sign out" onPress={() => (set({ scenario: 'guest' }), toast('Signed out'))} style={{ alignSelf: 'flex-start', marginLeft: space.gutter }} />
      </ScrollView>
    </View>
  );
}

/** Viewing history: what Continue Watching is built from. */
function ViewingHistory() {
  const { state, set, toast } = useApp();
  const entries = Object.entries(state.progress).filter(([id]) => dayById(id));
  return (
    <Card title="Viewing history">
      <Text style={[type.body, { fontWeight: '700' }]}>{entries.length ? `${entries.length} broadcast${entries.length === 1 ? '' : 's'} with saved progress` : 'No viewing history'}</Text>
      <View style={[styles.inline, { marginTop: 4 }]}>
        <Text style={type.small}>Broadcasts leave Continue Watching once you’ve watched {Math.round(COMPLETE_THRESHOLD * 100)}%</Text>
        <Placeholder />
      </View>
      <Button size="sm" variant="outline" title="Clear all" disabled={!entries.length} onPress={() => (set({ progress: {} }), toast('Viewing history cleared'))} style={{ alignSelf: 'flex-start', marginTop: 12 }} />
    </Card>
  );
}

/** WSOP+ membership as WSOP TV reads it. Joining, upgrading, billing and cancelling all happen in WSOP+. */
function Membership() {
  const { state, toast } = useApp();
  const tier = memberTier(state);
  const paid = tier === 'basic' || tier === 'premium';
  const next = tier === 'basic' ? 'premium' : tier === 'wsopFree' ? 'basic' : null;
  const manage = <Button size="sm" variant="ghost" title="Manage in WSOP+" onPress={() => toast('Opens your WSOP+ membership (demo)')} />;
  if (state.scenario === 'expired')
    return (
      <>
        <Text style={[type.body, { fontWeight: '700' }]}>Your {tierFull(state.paidTier)} membership ended</Text>
        <Text style={type.small}>You still have WSOP+ Free with your GGPass account.</Text>
        <View style={[styles.inline, { marginTop: 12 }]}>
          <Button size="sm" variant="primary" title="Renew in WSOP+" onPress={() => router.push({ pathname: '/wsop-plus/join', params: { tier: state.paidTier, return: '/account' } })} />
          {manage}
        </View>
      </>
    );
  return (
    <>
      <View style={styles.inline}>
        <Text style={[type.body, { fontWeight: '700' }]}>{tier === 'free' ? 'No WSOP+ membership' : tierFull(tier)}</Text>
        {state.scenario === 'grace' && <Text style={[type.label, { color: colors.delayed, fontSize: 9 }]}>Payment issue</Text>}
      </View>
      <View style={[styles.inline, { marginTop: 2 }]}>
        <Text style={type.small}>
          {state.scenario === 'grace'
            ? `Update your payment method in WSOP+ by ${fmtBillingDate(daysFromNow(GRACE_DAYS))} to keep watching.`
            : paid
              ? `Next payment ${fmtBillingDate(daysFromNow(NEXT_PAYMENT_DAYS))} · billed by WSOP+`
              : 'Included with your GGPass account'}
        </Text>
        {paid && state.scenario !== 'grace' && <Placeholder />}
      </View>
      <View style={[styles.inline, { marginTop: 12 }]}>
        {next && <Button size="sm" variant="primary" title={next === 'premium' ? 'Upgrade to Premium' : 'See WSOP+ plans'} onPress={() => router.push('/plans')} />}
        {manage}
      </View>
    </>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={[type.label, { marginBottom: 12 }]}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.row}>
      <Text style={[type.body, { fontWeight: '700' }]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  gg: { width: 32, height: 32, borderRadius: 6, backgroundColor: colors.ink, borderWidth: 1, borderColor: colors.lineStrong, alignItems: 'center', justifyContent: 'center' },
  card: { marginHorizontal: space.gutter, padding: 18, borderRadius: radius.panel, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderTopWidth: 1, borderTopColor: colors.line, paddingVertical: 12, flexWrap: 'wrap' },
});
