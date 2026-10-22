// Channel player (web demo v2 Live > Channels). Access is checked per programme as it airs.
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AboutChannels, AccessBadge, ProgramLive } from '@/components/channel';
import { SubHead } from '@/components/headers';
import { Missing } from '@/components/missing';
import { Button, Chip, Icon, Pill, Section, SectionHead } from '@/components/ui';
import { VideoPlayer } from '@/components/VideoPlayer';
import { channelById, channels, KIND_LABEL, programAt, programReminderKey, upNext } from '@/data/channels';
import { accessForProgram } from '@/lib/access';
import { fmtTime, relative, tzAbbr } from '@/lib/time';
import { useApp, useNow } from '@/state/app';
import { colors, radius, space, type } from '@/theme';

export default function ChannelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { member, tz, alarms, toggleReminder } = useApp();
  const now = useNow(1000);
  const ch = channelById(id);
  const p = ch && programAt(ch.id, now);
  if (!ch || !p) return <Missing />;
  const access = accessForProgram(member, p.access);
  const locked = access !== 'ok';
  // A locked programme points to a channel this viewer can watch right now.
  const alt = locked
    ? channels.map((c) => ({ c, prog: programAt(c.id, now) })).find((x) => x.c.id !== ch.id && x.prog && accessForProgram(member, x.prog.access) === 'ok')
    : undefined;
  const minutes = Math.round((p.end - p.start) / 60_000);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SubHead title={`CH ${ch.number} · ${ch.name}`} />
      {/* Keyed by programme: the preview / gate restarts when the next programme airs. */}
      <VideoPlayer
        key={p.id}
        access={access}
        tier={p.access === 'open' ? 'free' : p.access}
        contentTitle={p.title}
        hue={ch.hue}
        label={p.title}
        sub={`${ch.short} · ${KIND_LABEL[p.kind]}`}
        live={p.kind === 'live'}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={styles.chips}>
          {channels.map((c) => (
            <Chip key={c.id} label={`CH ${c.number} ${c.short}`} on={c.id === ch.id} onPress={() => c.id !== ch.id && router.setParams({ id: c.id })} />
          ))}
        </View>

        {alt?.prog && (
          <View style={styles.alt}>
            <Text style={[type.body, { flex: 1 }]}>
              <Text style={{ fontWeight: '800' }}>On {alt.c.name} now:</Text> {alt.prog.title} <Text style={{ color: colors.muted }}>— you can watch this one</Text>
            </Text>
            <Button title={`Switch to CH ${alt.c.number}`} size="xs" variant="outline" onPress={() => router.setParams({ id: alt.c.id })} />
          </View>
        )}

        <View style={styles.now}>
          <View style={styles.inline}>
            <Text style={[type.label, { color: colors.text }]}>On now</Text>
            {p.kind === 'live' ? <ProgramLive /> : <Pill>{KIND_LABEL[p.kind]}</Pill>}
            <AccessBadge p={p} />
          </View>
          <Text style={[type.h2, { marginTop: 8 }]}>{p.title}</Text>
          <Text style={styles.meta}>{p.subtitle}</Text>
          <Text style={[styles.meta, type.tnum]}>
            {fmtTime(p.start, tz)} – {fmtTime(p.end, tz)} {tzAbbr(tz)} · {minutes} min · ends {relative(p.end, now)}
          </Text>
          <View style={[styles.inline, { marginTop: 12, flexWrap: 'wrap' }]}>
            {p.scheduleId && (
              <Button title="Watch from the start" size="sm" variant="surface" icon="replay" onPress={() => router.push({ pathname: '/live/[id]', params: { id: p.scheduleId! } })} />
            )}
            {p.vodId && <Button title="Full version" size="sm" variant="surface" onPress={() => router.push({ pathname: '/vod/[id]', params: { id: p.vodId! } })} />}
          </View>
        </View>

        <Section>
          <SectionHead title={`Next on ${ch.short}`} />
          {upNext(ch.id, now, 6).map((x) => {
            const on = alarms.includes(programReminderKey(x));
            return (
              <View key={x.id} style={styles.nextRow}>
                <Text style={[type.h3, type.tnum, { width: 76, fontSize: 14 }]}>{fmtTime(x.start, tz)}</Text>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={[type.body, { fontWeight: '700' }]} numberOfLines={1}>
                    {x.title}
                  </Text>
                  <View style={styles.inline}>
                    <Text style={[styles.kind, x.kind === 'live' && { color: colors.live }]}>{KIND_LABEL[x.kind]}</Text>
                    <AccessBadge p={x} />
                    {accessForProgram(member, x.access) !== 'ok' && <Icon name="lock" size={13} color={colors.muted} />}
                  </View>
                </View>
                <Pressable
                  onPress={() => toggleReminder({ key: programReminderKey(x), title: `${ch.name} · ${x.title}`, path: `/channel/${ch.id}` })}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={on ? `Reminder set for ${x.title}` : `Remind me about ${x.title}`}
                  style={[styles.bell, on && styles.bellOn]}>
                  <Icon name={on ? 'bellOn' : 'bell'} size={16} color={on ? colors.ink : colors.muted} />
                </Pressable>
              </View>
            );
          })}
        </Section>
        <AboutChannels />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: space.gutter, paddingTop: 12 },
  alt: { flexDirection: 'row', alignItems: 'center', gap: 10, margin: space.gutter, marginBottom: 0, padding: 12, borderRadius: radius.card, borderWidth: 1, borderColor: colors.ok, backgroundColor: colors.surface },
  now: { margin: space.gutter, padding: 14, borderRadius: radius.panel, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  meta: { color: colors.muted, fontSize: 13, marginTop: 4 },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: space.gutter, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  kind: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  bell: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.lineStrong, alignItems: 'center', justifyContent: 'center' },
  bellOn: { backgroundColor: colors.gold, borderColor: colors.gold },
});
