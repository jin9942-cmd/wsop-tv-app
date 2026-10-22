// My (web demo SCR-11): account, subscription, Watchlist, Continue Watching, settings, notices, Demo Settings.
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { AppHeader } from '@/components/headers';
import { WatchlistRow } from '@/components/watchlist';
import { Button, Icon, Row, Section, SectionHead } from '@/components/ui';
import { MEMBER_LABEL } from '@/data/plans';
import { vodById } from '@/data/vods';
import { fmtDuration } from '@/lib/time';
import { useApp } from '@/state/app';
import { colors, mono, radius, space, type } from '@/theme';

export default function MyScreen() {
  const { member, set, toast, openSheet, myList, continueList, removeContinue, push, nightPush } = useApp();
  const guest = member === 'guest';
  const cw = continueList.filter((c) => c.progress < 0.9);

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 32 }}>
      <AppHeader title="My" />
      <View style={styles.account}>
        {guest ? (
          <>
            <Text style={type.h3}>You’re browsing as a guest</Text>
            <Text style={type.small}>Log in for alerts, continue watching and subscriptions.</Text>
            <Button title="Log in" block onPress={() => openSheet({ kind: 'login', reason: 'Log in to manage your account.' })} />
          </>
        ) : (
          <View style={styles.inline}>
            <View style={styles.avatar}>
              <Text style={{ color: colors.text, fontWeight: '800' }}>DV</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={type.h3}>Demo Viewer</Text>
              <Text style={type.small}>GGPass · demo.viewer@example.com</Text>
            </View>
            <View style={[styles.plan, member !== 'free' && { borderColor: colors.gold }]}>
              <Text style={[styles.planText, member !== 'free' && { color: colors.goldStrong }]}>{MEMBER_LABEL[member]}</Text>
            </View>
          </View>
        )}
      </View>
      {!guest && (
        <>
          <Row onPress={() => router.push('/paywall')}>
            <Text style={type.body}>Subscription</Text>
            <View style={styles.inline}>
              <Text style={type.small}>{MEMBER_LABEL[member]}</Text>
              <Icon name="chevron" size={18} color={colors.muted} />
            </View>
          </Row>
          <Row onPress={() => toast('Payment history is managed in WSOP+ (demo)')}>
            <Text style={type.body}>Payment history</Text>
            <Icon name="chevron" size={18} color={colors.muted} />
          </Row>
        </>
      )}

      <Section>
        <SectionHead title={`Watchlist${guest ? '' : ` ${myList.length}`}`} action={!guest && myList.length ? 'See all' : undefined} onAction={() => router.push('/watchlist')} />
        {guest ? (
          <Pressable style={styles.empty} onPress={() => openSheet({ kind: 'login', reason: 'Log in to keep videos, live broadcasts, players and tournaments in one place.' })} accessibilityRole="button">
            <Text style={type.h3}>Save what you want to watch</Text>
            <Text style={type.small}>Log in to build your Watchlist.</Text>
          </Pressable>
        ) : myList.length ? (
          myList.slice(0, 4).map((it) => <WatchlistRow key={`${it.kind}-${it.id}`} item={it} />)
        ) : (
          <Pressable style={styles.empty} onPress={() => router.navigate('/vod')} accessibilityRole="button">
            <Text style={type.h3}>Your Watchlist is empty</Text>
            <Text style={type.small}>Tap “Watchlist” on a video or an upcoming broadcast.</Text>
          </Pressable>
        )}
      </Section>

      {!guest && (
        <Section>
          <SectionHead
            title="Continue Watching"
            action={cw.length ? 'Clear all' : undefined}
            onAction={() => {
              set({ continueList: [] });
              toast('Continue Watching cleared');
            }}
          />
          {cw.length ? (
            cw.map((c) => {
              const v = vodById(c.vodId);
              if (!v) return null;
              return (
                <View key={c.vodId} style={styles.history}>
                  <Pressable style={{ flex: 1 }} onPress={() => router.push({ pathname: '/vod/[id]', params: { id: v.id } })} accessibilityRole="button">
                    <Text style={[type.body, { fontWeight: '700' }]} numberOfLines={1}>
                      {v.title}
                    </Text>
                    <Text style={type.small}>
                      {Math.round(c.progress * 100)}% · {fmtDuration(v.durationSec)}
                    </Text>
                    <View style={styles.bar}>
                      <View style={[styles.barFill, { width: `${c.progress * 100}%` }]} />
                    </View>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      removeContinue(c.vodId);
                      toast('Removed from Continue Watching');
                    }}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${v.title} from Continue Watching`}
                    style={styles.remove}>
                    <Icon name="close" size={18} color={colors.muted} />
                  </Pressable>
                </View>
              );
            })
          ) : (
            <Text style={[type.small, { paddingHorizontal: space.gutter }]}>Nothing to continue. Videos you start will appear here.</Text>
          )}
        </Section>
      )}

      <Section>
        <SectionHead title="Settings" />
        <Row disabled={guest} onPress={() => set({ push: !push })} accessibilityRole="switch" accessibilityState={{ checked: push, disabled: guest }}>
          <Text style={[type.body, guest && { color: colors.subtle }]}>Push notifications</Text>
          <Switch value={push && !guest} disabled={guest} onValueChange={(v) => set({ push: v })} trackColor={{ true: colors.gold, false: colors.lineStrong }} thumbColor="#fff" />
        </Row>
        <Row disabled={guest || !push} onPress={() => set({ nightPush: !nightPush })} accessibilityRole="switch" accessibilityState={{ checked: nightPush, disabled: guest || !push }}>
          <Text style={[type.body, (guest || !push) && { color: colors.subtle }]}>Night-time notifications (21:00–08:00)</Text>
          <Switch value={nightPush && push && !guest} disabled={guest || !push} onValueChange={(v) => set({ nightPush: v })} trackColor={{ true: colors.gold, false: colors.lineStrong }} thumbColor="#fff" />
        </Row>
        {!guest && (
          <Row onPress={() => router.push('/inbox')}>
            <Text style={type.body}>Inbox</Text>
            <Icon name="chevron" size={18} color={colors.muted} />
          </Row>
        )}
      </Section>

      <Section>
        <Row onPress={() => router.push('/notices')}>
          <Text style={type.body}>Notices</Text>
          <Icon name="chevron" size={18} color={colors.muted} />
        </Row>
        <Row onPress={() => toast('UI and subtitles in 20+ languages (demo shows English)')}>
          <Text style={type.body}>App language</Text>
          <Text style={type.small}>English</Text>
        </Row>
        <Row onPress={() => toast('Help center (demo)')}>
          <Text style={type.body}>Help center</Text>
          <Icon name="chevron" size={18} color={colors.muted} />
        </Row>
        <Row disabled>
          <Text style={type.body}>App version</Text>
          <Text style={type.small}>{Constants.expoConfig?.version ?? '—'} (demo)</Text>
        </Row>
        {/* App-only: the web demo's settings panel lives here (also: long-press the Home wordmark). */}
        <Pressable style={styles.demoRow} onPress={() => openSheet({ kind: 'demo' })} accessibilityRole="button">
          <Text style={styles.demoText}>⚙ Demo Settings</Text>
          <Icon name="chevron" size={18} color={colors.demo} />
        </Pressable>
        {!guest && (
          <Button
            title="Log out"
            variant="ghost"
            block
            onPress={() => {
              set({ member: 'guest' });
              toast('Logged out');
            }}
          />
        )}
        {!guest && (
          <Pressable onPress={() => toast('Account deletion is handled through GGPass (demo)')} accessibilityRole="button" style={{ alignSelf: 'center', padding: 10 }}>
            <Text style={[type.small, { textDecorationLine: 'underline' }]}>Delete account</Text>
          </Pressable>
        )}
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  account: { margin: space.gutter, marginTop: 4, padding: 16, borderRadius: radius.panel, backgroundColor: colors.surface, gap: 4 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surface3, alignItems: 'center', justifyContent: 'center' },
  plan: { borderWidth: 1, borderColor: colors.lineStrong, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  planText: { color: colors.muted, fontSize: 11.5, fontWeight: '800' },
  empty: { marginHorizontal: space.gutter, padding: 16, borderRadius: radius.card, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.lineStrong, gap: 4 },
  history: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: space.gutter, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  bar: { height: 3, borderRadius: 2, backgroundColor: colors.surface3, marginTop: 6 },
  barFill: { height: 3, borderRadius: 2, backgroundColor: colors.gold },
  remove: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  demoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    marginHorizontal: space.gutter,
    marginVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.card,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.demo,
    backgroundColor: colors.demoBg,
  },
  demoText: { color: colors.demo, fontFamily: mono, fontWeight: '700' },
});
