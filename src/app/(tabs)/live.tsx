// Live: Tournaments tab (broadcasts on air now) and Channels tab (24/7 linear channels, web demo v2 Live > Channels).
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { LiveCard, ScheduleRow } from '@/components/cards';
import { AppHeader } from '@/components/headers';
import { AboutChannels, AccessBadge, ProgramLive } from '@/components/channel';
import { Art, Corner, Icon, LockBadge, Pill, Section, SectionHead, Seg } from '@/components/ui';
import { channels, KIND_LABEL, programAt, upNext, type LinearChannel } from '@/data/channels';
import { schedules } from '@/data/schedules';
import { accessForProgram, liveNow, nextUpcoming, statusOf } from '@/lib/access';
import { fmtCountdown, fmtTime, relative, tzAbbr } from '@/lib/time';
import { useApp, useNow } from '@/state/app';
import { colors, radius, space, type } from '@/theme';

const TABS = ['tournaments', 'channels'] as const;
type Tab = (typeof TABS)[number];

export default function Live() {
  const { tab: param } = useLocalSearchParams<{ tab?: string }>();
  const tab: Tab = param === 'channels' ? 'channels' : 'tournaments';
  const now = useNow(1000);
  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 32 }}>
      <AppHeader title="Live" />
      <Seg value={tab} options={TABS} label={(t) => (t === 'tournaments' ? 'Tournaments' : 'Channels · 24/7')} onChange={(t) => router.setParams({ tab: t })} />
      {tab === 'tournaments' ? <Tournaments now={now} /> : <Channels now={now} />}
    </ScrollView>
  );
}

function Tournaments({ now }: { now: number }) {
  const { tz } = useApp();
  const live = liveNow(schedules, now);
  const next = nextUpcoming(schedules, now);
  const upcoming = schedules
    .filter((s) => statusOf(s, now) === 'upcoming')
    .sort((a, b) => a.start.localeCompare(b.start))
    .slice(0, 5);
  const ended = schedules
    .filter((s) => statusOf(s, now) === 'ended' && s.vodId)
    .sort((a, b) => b.end.localeCompare(a.end))
    .slice(0, 3);
  return (
    <>
      <Section style={{ marginTop: 8 }}>
        <SectionHead title="On air now" count={live.length} />
        {live.length ? (
          <View style={styles.liveList}>
            {live.map((s) => (
              <LiveCard key={s.id} s={s} now={now} />
            ))}
          </View>
        ) : (
          <View style={styles.countdown}>
            <Text style={type.label}>No live broadcasts right now</Text>
            {next && (
              <>
                <Text style={styles.countdownTime}>{fmtCountdown(Date.parse(next.start) - now)}</Text>
                <Text style={type.h3}>{next.title}</Text>
                <Text style={type.small}>
                  Starts {fmtTime(next.start, tz)} {tzAbbr(tz)}
                </Text>
              </>
            )}
            <Pressable onPress={() => router.setParams({ tab: 'channels' })} style={styles.linkBtn} accessibilityRole="button">
              <Text style={styles.link}>Watch the 24/7 channels meanwhile →</Text>
            </Pressable>
          </View>
        )}
      </Section>
      {upcoming.length > 0 && (
        <Section>
          <SectionHead title="Coming up" action="Schedule" onAction={() => router.navigate('/schedule')} />
          {upcoming.map((s) => (
            <ScheduleRow key={s.id} s={s} now={now} />
          ))}
        </Section>
      )}
      {ended.length > 0 && (
        <Section>
          <SectionHead title="Just ended · replays" />
          {ended.map((s) => (
            <ScheduleRow key={s.id} s={s} now={now} />
          ))}
        </Section>
      )}
    </>
  );
}

// ---- Channels ---------------------------------------------------------------------------------------

function Channels({ now }: { now: number }) {
  return (
    <>
      <View style={styles.channelGrid}>
        {channels.map((ch) => (
          <ChannelCard key={ch.id} ch={ch} now={now} />
        ))}
      </View>
      <Section>
        <SectionHead title="Channel guide" />
        <Text style={styles.lead}>All channels · now and next · your time</Text>
        {channels.map((ch) => (
          <GuideRow key={ch.id} ch={ch} now={now} />
        ))}
      </Section>
      <AboutChannels />
    </>
  );
}

function ChannelCard({ ch, now }: { ch: LinearChannel; now: number }) {
  const { member } = useApp();
  const p = programAt(ch.id, now);
  if (!p) return null;
  const locked = accessForProgram(member, p.access) !== 'ok';
  return (
    <Pressable style={styles.channelCard} onPress={() => router.push({ pathname: '/channel/[id]', params: { id: ch.id } })} accessibilityRole="button" accessibilityLabel={`${ch.name}, now: ${p.title}`}>
      <Art hue={ch.hue} title={`CH ${ch.number}`} sub={ch.short}>
        <Corner at="tl">{p.kind === 'live' ? <ProgramLive /> : <Pill>{KIND_LABEL[p.kind]}</Pill>}</Corner>
        <Corner at="tr">
          <AccessBadge p={p} />
        </Corner>
        {locked && (
          <Corner at="br">
            <LockBadge />
          </Corner>
        )}
      </Art>
      <Text style={styles.cardTitle} numberOfLines={1}>
        {ch.name}
      </Text>
      <Text style={styles.cardMeta} numberOfLines={2}>
        Now: {p.title}
      </Text>
    </Pressable>
  );
}

function GuideRow({ ch, now }: { ch: LinearChannel; now: number }) {
  const { tz, member } = useApp();
  const cur = programAt(ch.id, now);
  const list = [...(cur ? [cur] : []), ...upNext(ch.id, now, 3)];
  return (
    <View style={styles.guideRow}>
      <Pressable onPress={() => router.push({ pathname: '/channel/[id]', params: { id: ch.id } })} style={styles.guideCh} accessibilityRole="button" accessibilityLabel={`Open ${ch.name}`}>
        <Text style={styles.guideNum}>CH {ch.number}</Text>
        <Text style={styles.cardMeta} numberOfLines={1}>
          {ch.short}
        </Text>
      </Pressable>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: space.gutter }}>
        {list.map((p) => {
          const isNow = p === cur;
          const locked = accessForProgram(member, p.access) !== 'ok';
          return (
            <Pressable
              key={p.id}
              onPress={() => router.push({ pathname: '/channel/[id]', params: { id: ch.id } })}
              style={[styles.guideCell, isNow && styles.guideNow]}
              accessibilityRole="button"
              accessibilityLabel={`${fmtTime(p.start, tz)} ${p.title}`}>
              <Text style={[styles.cardMeta, type.tnum]}>
                {isNow ? `Now · ends ${relative(p.end, now)}` : fmtTime(p.start, tz)}
              </Text>
              <Text style={styles.guideTitle} numberOfLines={2}>
                {p.title}
              </Text>
              <View style={styles.inline}>
                <Text style={[styles.kind, p.kind === 'live' && { color: colors.live }]}>{KIND_LABEL[p.kind]}</Text>
                <AccessBadge p={p} />
                {locked && <Icon name="lock" size={13} color={colors.muted} />}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}



const styles = StyleSheet.create({
  liveList: { paddingHorizontal: space.gutter, gap: 18 },
  countdown: { marginHorizontal: space.gutter, padding: 18, borderRadius: radius.panel, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, gap: 6 },
  countdownTime: { color: colors.gold, fontSize: 36, fontWeight: '900', ...type.tnum },
  linkBtn: { minHeight: 36, justifyContent: 'center' },
  link: { color: colors.goldStrong, fontWeight: '700', fontSize: 13 },
  lead: { color: colors.muted, fontSize: 13, paddingHorizontal: space.gutter, marginTop: -4, marginBottom: 10 },
  channelGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: space.gutter, gap: 12, marginTop: 8 },
  channelCard: { width: '47.5%', flexGrow: 1 },
  cardTitle: { color: colors.text, fontSize: 13.5, fontWeight: '800', marginTop: 8 },
  cardMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  guideRow: { flexDirection: 'row', alignItems: 'stretch', paddingLeft: space.gutter, marginBottom: 10, gap: 8 },
  guideCh: { width: 64, justifyContent: 'center' },
  guideNum: { color: colors.text, fontSize: 13, fontWeight: '900' },
  guideCell: { width: 168, padding: 10, borderRadius: radius.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, gap: 4 },
  guideNow: { borderColor: colors.gold, backgroundColor: colors.surface2 },
  guideTitle: { color: colors.text, fontSize: 13, fontWeight: '700' },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  kind: { color: colors.muted, fontSize: 11, fontWeight: '700' },
});
