// Screens shown in place of the picture when playback isn't possible (web demo v2 features/auth/Gates.tsx + the
// Watch screen's Upcoming / BroadcastHold / TableHold): soft paywall, policy states and broadcast states.
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { HERO_EXPECTED_START, archive } from '@/data/mock';
import { MAX_STREAMS, tierFull, type Tier } from '@/data/policy';
import type { TableFeed } from '@/data/types';
import { countdown, fmtDateTime, fmtTime } from '@/lib/time';
import { memberTier, useApp, useTick, type Gate } from '@/state/app';
import { colors, radius, type } from '@/theme';

import { Button, Icon, StatusBadge, type IconName } from '../ui';

function Panel({ kicker, title, body, children, icon = 'lock' }: { kicker: string; title: string; body: ReactNode; children?: ReactNode; icon?: IconName }) {
  return (
    <View style={styles.panel} accessibilityRole="alert">
      <View style={styles.iconCircle}>
        <Icon name={icon} color={colors.gold} />
      </View>
      <Text style={[type.label, { color: colors.gold }]}>{kicker}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {children && <View style={styles.actions}>{children}</View>}
    </View>
  );
}

export function PlaybackGate({ gate, required = 'basic', returnTo, compact }: { gate: Exclude<Gate, 'ok'>; required?: Tier; returnTo: string; compact?: boolean }) {
  const { state, set, toast, requireLogin } = useApp();
  const need = required === 'free' || required === 'wsopFree' ? 'basic' : required;
  const have = memberTier(state);
  switch (gate) {
    case 'login':
      return (
        <Panel kicker="Sign in to watch" title="Continue with GGPASS" body={compact ? 'Sign in when you’re ready to watch.' : "Browse freely — sign in when you're ready to watch. One GGPASS account works across the WSOP family of services."}>
          <Button variant="primary" title="Continue with GGPASS" onPress={() => requireLogin('Sign in to start watching.')} />
        </Panel>
      );
    case 'plans':
      return (
        <Panel
          kicker="WSOP+ membership"
          title={`${tierFull(need)} required`}
          body={
            <>
              You’re on <Text style={{ color: colors.text, fontWeight: '700' }}>{have === 'free' ? 'no membership' : tierFull(have)}</Text>. WSOP TV is included with WSOP+ — join or upgrade in WSOP+ and come straight back here.
            </>
          }>
          <Button variant="primary" title="See WSOP+ plans" onPress={() => router.push({ pathname: '/plans', params: { required: need, returnTo } })} />
        </Panel>
      );
    case 'link':
      return (
        <Panel kicker="Account linking" title="Link your GGPASS account" body="Your WSOP+ membership is active, but it isn't connected to a GGPass account yet. Link once to watch on every device." icon="user">
          <Button
            variant="primary"
            title="Link GGPASS account"
            onPress={() => {
              set((s) => ({ scenario: s.paidTier }));
              toast('GGPASS linked (demo) — enjoy the broadcast');
            }}
          />
        </Panel>
      );
    case 'restricted':
      return (
        <Panel kicker="Account restricted" title="Viewing isn't available on this account" body="Your GGPASS account is currently restricted, so streams can't be played. Our support team can help you review the account status.">
          <Button variant="outline" title="Contact GGPASS support" onPress={() => toast('Opens GGPASS support (demo)')} />
        </Panel>
      );
    case 'expired':
      return (
        <Panel kicker="WSOP+ membership" title={`Your ${tierFull(state.paidTier)} membership ended`} body="Renew in WSOP+ to keep watching. Free highlights and WSOP+ Free content are still available.">
          <Button variant="primary" title="Renew in WSOP+" onPress={() => router.push({ pathname: '/wsop-plus/join', params: { tier: state.paidTier, return: returnTo } })} />
        </Panel>
      );
    case 'devices':
      return (
        <Panel kicker="Too many devices" title={`You're watching on ${MAX_STREAMS} devices already`} body={`Your plan allows ${MAX_STREAMS} streams at the same time. Stop playback on another device to continue here.`} icon="tv">
          <Button variant="primary" title="Manage devices" onPress={() => router.push('/devices')} />
        </Panel>
      );
  }
}

/** VPN / proxy detected — a different problem from region rights, so a different message. */
export function VpnBlocked() {
  const { state, toast } = useApp();
  return (
    <Panel kicker="VPN or proxy detected" icon="shield" title="Turn off your VPN or proxy to watch" body="We can’t confirm where you’re watching from while a VPN or proxy is on. Turn it off, then try again.">
      <Button variant="primary" title="Try again" onPress={() => toast(state.vpnDetected ? 'Still detecting a VPN or proxy' : 'Connection looks fine — starting playback')} />
    </Panel>
  );
}

/** Region restriction: block message + alternatives + Notify me. */
export function RegionBlocked() {
  const { toast } = useApp();
  return (
    <View style={styles.panel} accessibilityRole="alert">
      <View style={styles.iconCircle}>
        <Icon name="globe" color={colors.gold} />
      </View>
      <Text style={styles.title}>This event isn&apos;t available in your region</Text>
      <Text style={styles.body}>Broadcast rights for this event don&apos;t cover your location.</Text>
      <View style={styles.actions}>
        <Button variant="primary" icon="bell" title="Notify me" size="sm" onPress={() => toast("We'll notify you if this event becomes available")} />
      </View>
      <Text style={[type.label, { marginTop: 8 }]}>Watch instead</Text>
      <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
        {archive.slice(0, 3).map((a) => (
          <Pressable key={a.id} onPress={() => router.push('/archive')} style={styles.alt} accessibilityRole="button">
            <Text style={[type.caption, type.tnum]}>{a.year}</Text>
            <Text style={{ color: colors.text, fontSize: 11, fontWeight: '700' }} numberOfLines={2}>
              {a.title}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

/** Upcoming broadcast: countdown + Remind me. */
export function UpcomingPanel({ dayId, start, title }: { dayId: string; start: string; title: string }) {
  const { state, toggleReminder } = useApp();
  const now = useTick(1000);
  const on = state.reminders.includes(dayId);
  return (
    <View style={styles.panel}>
      <StatusBadge status="upcoming" />
      <Text style={styles.body}>Starts {fmtDateTime(start, state.tz)}</Text>
      <Text style={[styles.count, type.tnum]}>{countdown(Date.parse(start) - now)}</Text>
      <Button
        variant={on ? 'secondary' : 'primary'}
        icon="bell"
        title={on ? 'Reminder set' : 'Remind me'}
        onPress={() => toggleReminder({ key: dayId, title, path: `/live/${dayId}`, setText: 'We’ll remind you 15 minutes before' })}
      />
    </View>
  );
}

/** Whole broadcast starting late or interrupted (Featured stream override on the hero broadcast). */
export function BroadcastHold({ kind, start, eventId }: { kind: 'late' | 'interrupted'; start: string; eventId: string }) {
  const { state, toast } = useApp();
  const now = useTick(1000);
  return (
    <View style={styles.panel}>
      <StatusBadge status={kind} />
      {kind === 'late' ? (
        <>
          <Text style={styles.title}>Coverage is starting late</Text>
          <Text style={styles.body}>
            Scheduled for {fmtTime(start, state.tz)} · now expected around <Text style={{ color: colors.text, fontWeight: '700' }}>{fmtTime(HERO_EXPECTED_START, state.tz)}</Text> your time.
          </Text>
          <Text style={[styles.count, type.tnum]}>{countdown(Date.parse(HERO_EXPECTED_START) - now)}</Text>
        </>
      ) : (
        <>
          <Text style={styles.title}>The broadcast is temporarily off air</Text>
          <Text style={styles.body}>The feed from the venue has paused. Playback resumes here automatically — no need to refresh.</Text>
        </>
      )}
      <View style={styles.actions}>
        <Button variant="primary" size="sm" icon="bell" title="Notify me" onPress={() => toast(kind === 'late' ? 'We’ll notify you when coverage starts' : 'We’ll notify you when the broadcast is back')} />
        <Button variant="outline" size="sm" title="Catch up on key hands" onPress={() => router.push({ pathname: '/events/[id]', params: { id: eventId } })} />
      </View>
    </View>
  );
}

/** One table on hold while the rest of the broadcast is on air (late start / interrupted). */
export function TableHold({ table, kind, onSwitch, switchLabel, compact }: { table: TableFeed; kind: 'late' | 'interrupted'; onSwitch?: () => void; switchLabel: string; compact?: boolean }) {
  const { state } = useApp();
  return (
    <View style={[styles.panel, compact && { padding: 6, gap: 4 }]}>
      <StatusBadge status={kind} size={compact ? 'sm' : 'md'} />
      <Text style={[styles.title, compact && { fontSize: 11 }]}>{kind === 'late' ? `${table.name} hasn't started yet` : `${table.name} is temporarily off air`}</Text>
      {!compact && (
        <Text style={styles.body}>
          {kind === 'late' && table.expected ? `Expected around ${fmtTime(table.expected, state.tz)} your time. ` : ''}
          {kind === 'interrupted' ? 'The production team is on it — other tables are unaffected.' : 'Other tables are on air now.'}
        </Text>
      )}
      {onSwitch && <Button size="sm" title={`Watch ${switchLabel}`} onPress={onSwitch} />}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', gap: 6, padding: 16, backgroundColor: '#14161b' },
  iconCircle: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.lineStrong, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  title: { color: colors.text, fontSize: 17, fontWeight: '800', textAlign: 'center' },
  body: { color: colors.muted, fontSize: 12.5, lineHeight: 18, textAlign: 'center', maxWidth: 360 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 6 },
  count: { color: colors.text, fontSize: 32, fontWeight: '900' },
  alt: { width: 90, borderRadius: radius.chip, borderWidth: 1, borderColor: colors.line, backgroundColor: 'rgba(0,0,0,0.4)', padding: 6 },
});
