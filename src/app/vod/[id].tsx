// VOD detail (web demo SCR-06): player, badges, Watchlist, resume, key moments, players, related.
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { HRow, MyListButton, PlayerChip, VodCard } from '@/components/cards';
import { SubHead } from '@/components/headers';
import { Missing } from '@/components/missing';
import { Pill, Section, SectionHead, Tag, TierBadge } from '@/components/ui';
import { VideoPlayer } from '@/components/VideoPlayer';
import { seriesById } from '@/data/series';
import type { Vod } from '@/data/types';
import { keyMoments, playerById, vodById, vods } from '@/data/vods';
import { accessFor, eventLabel } from '@/lib/access';
import { fmtCount, fmtDate, fmtDuration } from '@/lib/time';
import { useApp } from '@/state/app';
import { colors, radius, space, type } from '@/theme';

export default function VodDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { member, tz, continueList, recordProgress } = useApp();
  const v = vodById(id);
  const se = v && seriesById(v.seriesId);
  if (!v || !se) return <Missing />;
  const resume = member !== 'guest' ? continueList.find((c) => c.vodId === v.id) : undefined;
  const moments = keyMoments(v);
  const sameEvent = vods.filter((x) => x.id !== v.id && v.eventId && x.eventId === v.eventId).slice(0, 6);
  const samePlayer = vods.filter((x) => x.id !== v.id && !sameEvent.includes(x) && x.playerIds.some((p) => v.playerIds.includes(p))).slice(0, 6);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SubHead title={v.title} />
      <VideoPlayer
        key={v.id}
        access={accessFor(member, v.tier)}
        tier={v.tier}
        contentTitle={v.title}
        hue={se.hue + 20}
        label={v.type}
        sub={se.name}
        resumeAt={resume && resume.progress < 0.9 ? resume.progress : undefined}
        onProgress={(f) => recordProgress(v.id, f)}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={styles.detail}>
          <View style={styles.badges}>
            <TierBadge tier={v.tier} />
            <Tag>{v.type}</Tag>
            <Tag>{fmtDuration(v.durationSec)}</Tag>
            <Tag>{`${fmtCount(v.views)} views`}</Tag>
          </View>
          <Text style={[type.h2, { marginTop: 8 }]}>{v.title}</Text>
          <View style={{ marginTop: 10 }}>
            <MyListButton kind="vod" id={v.id} />
          </View>
          {resume && resume.progress < 0.9 && <Text style={styles.resume}>Resume from {fmtDuration(Math.round(v.durationSec * resume.progress))}</Text>}
          {!!v.description && <Text style={[type.body, { color: colors.muted, marginTop: 10 }]}>{v.description}</Text>}
          <Pressable style={styles.info} onPress={() => router.push({ pathname: '/tournaments/[id]', params: { id: se.id } })} accessibilityRole="button">
            <Pill>{se.tour}</Pill>
            <View style={{ flex: 1 }}>
              <Text style={type.h3}>{se.name}</Text>
              <Text style={type.small}>
                {eventLabel(v)} · {fmtDate(v.publishedAt, tz)}
              </Text>
            </View>
          </Pressable>
        </View>

        {moments.length > 0 && (
          <Section>
            <SectionHead title="Key moments" />
            {moments.map((m) => (
              <View key={m.t} style={styles.moment}>
                <Text style={[styles.momentT, type.tnum]}>{fmtDuration(m.t)}</Text>
                <Text style={[type.body, { flex: 1 }]}>{m.label}</Text>
                <Tag>{m.tag}</Tag>
              </View>
            ))}
          </Section>
        )}

        {v.playerIds.length > 0 && (
          <Section>
            <SectionHead title="Players" />
            <HRow
              data={v.playerIds}
              keyOf={(pid) => pid}
              width={96}
              render={(pid) => {
                const p = playerById(pid)!;
                return <PlayerChip id={p.id} name={p.name} hue={p.hue} size={56} />;
              }}
            />
          </Section>
        )}
        <Related title="More from this event" list={sameEvent} />
        <Related title="More with these players" list={samePlayer} />
      </ScrollView>
    </View>
  );
}

function Related({ title, list }: { title: string; list: Vod[] }) {
  if (!list.length) return null;
  return (
    <Section>
      <SectionHead title={title} />
      <HRow data={list} keyOf={(x) => x.id} width={200} render={(x) => <VodCard v={x} />} />
    </Section>
  );
}

const styles = StyleSheet.create({
  detail: { paddingHorizontal: space.gutter, paddingTop: 14 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  resume: { color: colors.goldStrong, fontSize: 13, fontWeight: '700', marginTop: 10 },
  info: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, padding: 12, borderRadius: radius.card, backgroundColor: colors.surface },
  moment: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: space.gutter, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  momentT: { color: colors.gold, fontWeight: '800', width: 64 },
});
