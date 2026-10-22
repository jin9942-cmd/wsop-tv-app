// Live player (web demo SCR-04 LivePlayer). Deep link: wsoptvdemo://live/{scheduleId}
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { MyListButton, ScheduleRow } from '@/components/cards';
import { SubHead } from '@/components/headers';
import { Missing } from '@/components/missing';
import { Button, Chip, Icon, LiveBadge, Section, SectionHead, Tag, TierBadge } from '@/components/ui';
import { VideoPlayer } from '@/components/VideoPlayer';
import { scheduleById, schedules } from '@/data/schedules';
import { seriesById } from '@/data/series';
import { accessFor, eventLabel, isExclusive, statusOf, viewersOf } from '@/lib/access';
import { fmtCount, fmtDateTime } from '@/lib/time';
import { useApp, useNow } from '@/state/app';
import { colors, space, type } from '@/theme';

export default function LivePlayerScreen() {
  // `reminder=1`: opened from the "Live now" reminder — the demo plays the stream even if the slot hasn't started yet.
  const { id, reminder } = useLocalSearchParams<{ id: string; reminder?: string }>();
  const { member, tz, alarms, toggleReminder } = useApp();
  const now = useNow(1000);
  const s = scheduleById(id);
  const se = s && seriesById(s.seriesId);
  if (!s || !se) return <Missing />;
  const real = statusOf(s, now);
  const status = real === 'upcoming' && reminder === '1' ? 'live' : real;
  const access = accessFor(member, s.tier);

  // Same event, other channels / languages on air at the same time.
  const siblings = schedules.filter((x) => x.eventId === s.eventId && (statusOf(x, now) === 'live' || x.id === s.id)).sort((a, b) => a.channelId.localeCompare(b.channelId));
  const next = schedules
    .filter((x) => x.seriesId === s.seriesId && x.id !== s.id && statusOf(x, now) === 'upcoming')
    .sort((a, b) => a.start.localeCompare(b.start))
    .slice(0, 5);
  const reminderOn = alarms.includes(s.id);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SubHead title={s.title} />
      {status === 'live' ? (
        <VideoPlayer
          key={s.id}
          access={access}
          tier={s.tier}
          contentTitle={s.title}
          hue={se.hue + (s.lang === 'ES' ? 30 : 0)}
          label={s.type}
          sub={`${se.name} · ${s.lang}`}
          live
          viewers={`${fmtCount(viewersOf(s, now))} watching`}
        />
      ) : (
        <View style={styles.off}>
          <Text style={type.small}>{status === 'upcoming' ? 'Starts' : 'Broadcast ended'}</Text>
          <Text style={[type.h2, type.tnum]}>{status === 'upcoming' ? fmtDateTime(s.start, tz) : s.vodId ? 'Replay available' : '—'}</Text>
          {status === 'ended' && s.vodId && <Button title="Watch replay" size="sm" onPress={() => router.replace({ pathname: '/vod/[id]', params: { id: s.vodId! } })} />}
        </View>
      )}

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={styles.detail}>
          <View style={styles.badges}>
            {status === 'live' && <LiveBadge />}
            <TierBadge tier={s.tier} />
            <Tag>{s.lang}</Tag>
            <Tag>{s.channelId}</Tag>
          </View>
          <Text style={[type.h2, { marginTop: 8 }]}>{s.title}</Text>
          <Text style={styles.meta}>
            {se.name} · {eventLabel(s)}
          </Text>
          {status === 'live' && (
            <View style={styles.inline}>
              <Icon name="eye" size={14} color={colors.muted} />
              <Text style={styles.meta}>{fmtCount(viewersOf(s, now))} watching now</Text>
            </View>
          )}
          {isExclusive(s) ? (
            <View style={styles.excl}>
              <Text style={[type.h3, { color: colors.goldStrong }]}>Only on WSOP TV</Text>
              <Text style={type.small}>Every bracelet final table, live and on demand.</Text>
            </View>
          ) : s.type === 'Feature Table' ? (
            <Text style={[styles.meta, { color: colors.subtle }]}>Also streaming on the WSOP YouTube channel</Text>
          ) : null}
          {status === 'upcoming' && (
            <View style={[styles.inline, { marginTop: 12, gap: 8 }]}>
              <Button
                title={reminderOn ? 'Reminder set' : 'Remind me'}
                icon={reminderOn ? 'bellOn' : 'bell'}
                variant={reminderOn ? 'gold' : 'outline'}
                size="sm"
                onPress={() => toggleReminder({ key: s.id, title: s.title, path: `/live/${s.id}?reminder=1` })}
              />
              <MyListButton kind="live" id={s.id} />
            </View>
          )}
        </View>

        {siblings.length > 1 && (
          <Section>
            <SectionHead title="Switch broadcast" />
            <View style={styles.chips}>
              {siblings.map((x) => (
                <Chip key={x.id} label={`${x.type} ${x.lang}`} on={x.id === s.id} onPress={() => x.id !== s.id && router.setParams({ id: x.id })} />
              ))}
            </View>
          </Section>
        )}

        {next.length > 0 && (
          <Section>
            <SectionHead title="Up next" />
            {next.map((x) => (
              <ScheduleRow key={x.id} s={x} now={now} />
            ))}
          </Section>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  off: { aspectRatio: 16 / 9, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16 },
  detail: { paddingHorizontal: space.gutter, paddingTop: 14 },
  badges: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  meta: { color: colors.muted, fontSize: 13, marginTop: 4 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  excl: { marginTop: 12, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.gold, backgroundColor: colors.goldDim, gap: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: space.gutter },
});
