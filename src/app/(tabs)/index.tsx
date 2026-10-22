// Home (web demo SCR-02). Section order and visibility come from the home config (remote, else built-in default).
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Platform, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { CARD_W, CARD_W_SM, HRow, LiveCard, PlayerChip, ScheduleRow, SeriesCard, VodCard } from '@/components/cards';
import { AppHeader } from '@/components/headers';
import { Art, Corner, Icon, IconButton, Pill, Section, SectionHead, Seg, TierBadge, Button } from '@/components/ui';
import { banners, curations, stripBanners, visibleNotices, type HomeSection } from '@/data/home';
import { PLAN_ORDER, PLANS } from '@/data/plans';
import { schedules } from '@/data/schedules';
import { series } from '@/data/series';
import type { Tier, Vod } from '@/data/types';
import { players, vodById, vods } from '@/data/vods';
import { eventLabel, isExclusive, liveNow, nextUpcoming, phaseOf, schedulesOnDay, seriesHue, statusOf } from '@/lib/access';
import { linkHref } from '@/lib/nav';
import { addDays, dateKey, fmtCountdown, fmtDate, fmtDuration, fmtKey, fmtTime } from '@/lib/time';
import { useApp, useNow } from '@/state/app';
import { colors, radius, space, type } from '@/theme';

export default function Home() {
  const { member, mode, home, refreshHome } = useApp();
  const now = useNow(1000);
  const [refreshing, setRefreshing] = useState(false);
  const layout = home.config.layouts[mode].filter((s) => s.visible && (!s.audience || s.audience.includes(member)));

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshHome();
    setRefreshing(false);
  };

  return (
    <FlatList
      data={layout}
      keyExtractor={(s, i) => `${s.type}-${s.curationId ?? ''}-${i}`}
      renderItem={({ item }) => <HomeSectionView section={item} now={now} />}
      ListHeaderComponent={
        // Pull-to-refresh doesn't exist in a desktop browser, so the web preview gets a refresh button instead.
        <AppHeader right={Platform.OS === 'web' ? <IconButton name="refresh" label="Refresh home" onPress={onRefresh} /> : undefined} />
      }
      ListFooterComponent={<Text style={styles.end}>WSOP TV · Demo build</Text>}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} colors={[colors.gold]} progressBackgroundColor={colors.surface2} />}
      contentContainerStyle={{ paddingBottom: 24 }}
      style={{ backgroundColor: colors.bg }}
    />
  );
}

function HomeSectionView({ section, now }: { section: HomeSection; now: number }) {
  switch (section.type) {
    case 'mainBanner':
      return <BannerCarousel />;
    case 'liveNow':
      return <LiveNowSection section={section} now={now} />;
    case 'todaySchedule':
      return <TodaySchedule title={section.title} now={now} />;
    case 'exclusive':
      return <ExclusiveSection title={section.title} now={now} />;
    case 'tournaments':
      return <TournamentsRow title={section.title} now={now} />;
    case 'stripBanner':
      return <Strip />;
    case 'curatedVod':
      return <Curation section={section} />;
    case 'popularVod':
      return <PopularVod title={section.title} />;
    case 'continueWatching':
      return <ContinueRow title={section.title} />;
    case 'players':
      return <PlayersRow title={section.title} />;
    case 'notice':
      return <NoticeRow />;
    case 'plans':
      return <PlansSection title={section.title} />;
  }
}

// ---- banner ------------------------------------------------------------------------------------

function BannerCarousel() {
  const { member } = useApp();
  const list = banners.filter((b) => b.audiences.includes(member)).slice(0, 8);
  const [i, setI] = useState(0);
  useEffect(() => {
    if (list.length < 2) return;
    const id = setInterval(() => setI((x) => (x + 1) % list.length), 5000);
    return () => clearInterval(id);
  }, [list.length]);
  if (!list.length) return null;
  const b = list[i % list.length];
  return (
    <View style={{ paddingHorizontal: space.gutter, marginTop: 4 }}>
      <Pressable onPress={() => router.push(linkHref(b.link))} accessibilityRole="button" accessibilityLabel={`${b.title}. ${b.cta}`}>
        <Art hue={b.hue} ratio={4 / 3}>
          <View style={styles.bannerText}>
            <Text style={styles.bannerSub}>{b.subtitle}</Text>
            <Text style={styles.bannerTitle}>{b.title}</Text>
            <View style={styles.bannerCta}>
              <Text style={{ color: colors.ink, fontWeight: '800', fontSize: 13 }}>{b.cta}</Text>
            </View>
          </View>
          {b.audiences.length === 1 && (
            <Corner at="tr">
              <Pill>Free members only</Pill>
            </Corner>
          )}
        </Art>
      </Pressable>
      <View style={styles.dots}>
        {list.map((x, n) => (
          <Pressable key={x.id} onPress={() => setI(n)} accessibilityLabel={`Banner ${n + 1}`} hitSlop={8}>
            <View style={[styles.dot, n === i % list.length && styles.dotOn]} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ---- LIVE NOW -------------------------------------------------------------------------------------

function LiveNowSection({ section, now }: { section: HomeSection; now: number }) {
  const { tz } = useApp();
  const live = liveNow(schedules, now);
  const next = section.emptyMode === 'hide' ? undefined : nextUpcoming(schedules, now);
  if (!live.length && !next) return null;
  return (
    <Section>
      <SectionHead title={section.title ?? 'LIVE NOW'} count={live.length} />
      {live.length ? (
        <HRow data={live} keyOf={(s) => s.id} render={(s) => <LiveCard s={s} now={now} viewers={section.showViewers !== false} />} />
      ) : (
        next && (
          <Pressable style={styles.countdown} onPress={() => router.navigate('/schedule')} accessibilityRole="button">
            <Text style={type.label}>Next live in</Text>
            <Text style={styles.countdownTime}>{fmtCountdown(Date.parse(next.start) - now)}</Text>
            <Text style={type.h3}>{next.title}</Text>
            <View style={styles.inline}>
              <Text style={type.small}>
                {fmtTime(next.start, tz)} · {next.lang}
              </Text>
              <TierBadge tier={next.tier} />
            </View>
          </Pressable>
        )
      )}
    </Section>
  );
}

// ---- today's schedule ------------------------------------------------------------------------------

const DAY_TABS = ['0', '1', '2'] as const;

function TodaySchedule({ title, now }: { title?: string; now: number }) {
  const { tz } = useApp();
  const today = dateKey(now, tz);
  const keys = [today, addDays(today, 1), addDays(today, 2)];
  const [tab, setTab] = useState<(typeof DAY_TABS)[number]>('0');
  const n = Number(tab);
  const all = schedulesOnDay(schedules, keys[n], tz);
  // Today starts just before "now" so live and upcoming broadcasts come first.
  const firstOpen = all.findIndex((s) => statusOf(s, now) !== 'ended');
  const from = n === 0 && firstOpen > 0 ? firstOpen - 1 : 0;
  const list = all.slice(from);
  if (!keys.some((k) => schedulesOnDay(schedules, k, tz).length)) return null;
  const label = (t: string) => (t === '0' ? 'Today' : t === '1' ? 'Tomorrow' : fmtKey(keys[2]));
  return (
    <Section>
      <SectionHead title={title ?? 'Schedule'} action="Full schedule" onAction={() => router.navigate('/schedule')} />
      <Seg value={tab} options={DAY_TABS} label={label} onChange={setTab} />
      {from > 0 && (
        <Pressable onPress={() => router.navigate('/schedule')} style={styles.earlier} accessibilityRole="button">
          <Text style={type.small}>{from} earlier today</Text>
        </Pressable>
      )}
      {list.length ? list.slice(0, 6).map((s) => <ScheduleRow key={s.id} s={s} now={now} />) : <Text style={styles.emptyLine}>No broadcasts on this day.</Text>}
      {list.length > 6 && <Button title={`+${list.length - 6} more in Schedule`} variant="ghost" size="sm" onPress={() => router.navigate('/schedule')} />}
    </Section>
  );
}

// ---- only on WSOP TV --------------------------------------------------------------------------------

/** Every bracelet final table streams only on WSOP TV: live → upcoming → replays. */
function ExclusiveSection({ title, now }: { title?: string; now: number }) {
  const { tz } = useApp();
  const fts = schedules.filter((s) => isExclusive(s) && s.lang === 'EN');
  const live = fts.filter((s) => statusOf(s, now) === 'live');
  const upcoming = fts.filter((s) => statusOf(s, now) === 'upcoming').sort((a, b) => a.start.localeCompare(b.start)).slice(0, 3);
  const replays = fts.filter((s) => statusOf(s, now) === 'ended' && s.vodId).sort((a, b) => b.start.localeCompare(a.start)).slice(0, 3);
  const items = [...live.map((s) => ({ s, k: 'live' as const })), ...upcoming.map((s) => ({ s, k: 'upcoming' as const })), ...replays.map((s) => ({ s, k: 'replay' as const }))];
  if (!items.length) return null;
  return (
    <Section>
      <SectionHead title={title ?? 'Only on WSOP TV'} />
      <Text style={styles.lead}>Every bracelet final table, live and on demand.</Text>
      <HRow
        data={items}
        keyOf={(x) => x.s.id}
        render={({ s, k }) =>
          k === 'live' ? (
            <LiveCard s={s} now={now} />
          ) : (
            <Pressable
              onPress={() => (k === 'replay' ? router.push({ pathname: '/vod/[id]', params: { id: s.vodId! } }) : router.push({ pathname: '/live/[id]', params: { id: s.id } }))}
              accessibilityRole="button"
              accessibilityLabel={s.title}>
              <Art hue={seriesHue(s.seriesId) + (k === 'replay' ? 20 : 0)}>
                <Corner at="tl">
                  <Pill>{k === 'replay' ? 'Replay' : fmtTime(s.start, tz)}</Pill>
                </Corner>
                <Corner at="tr">
                  <TierBadge tier={s.tier} />
                </Corner>
              </Art>
              <Text style={cardText.title} numberOfLines={2}>
                {s.title}
              </Text>
              <Text style={cardText.meta} numberOfLines={1}>
                {k === 'replay' ? eventLabel(s) : `${fmtDate(s.start, tz)} · Upcoming`}
              </Text>
            </Pressable>
          )
        }
      />
    </Section>
  );
}

// ---- tournaments ------------------------------------------------------------------------------------

function TournamentsRow({ title, now }: { title?: string; now: number }) {
  const order = { ongoing: 0, upcoming: 1, ended: 2 } as const;
  const list = series
    .filter((x) => phaseOf(x, now) !== 'ended')
    .sort((a, b) => order[phaseOf(a, now)] - order[phaseOf(b, now)] || a.start.localeCompare(b.start))
    .slice(0, 10);
  if (!list.length) return null;
  return (
    <Section>
      <SectionHead title={title ?? 'Tournaments'} action="All" onAction={() => router.push('/tournaments')} />
      <HRow data={list} keyOf={(x) => x.id} render={(x) => <SeriesCard id={x.id} now={now} />} width={260} />
    </Section>
  );
}

// ---- strip banner -----------------------------------------------------------------------------------

function Strip() {
  const { member, openSheet } = useApp();
  const b = stripBanners.find((x) => x.audience === member);
  if (!b) return null;
  return (
    <Section style={{ paddingHorizontal: space.gutter }}>
      <Pressable
        style={[styles.strip, member === 'premium' && { borderColor: colors.gold }]}
        onPress={() => (member === 'guest' ? openSheet({ kind: 'login', reason: 'Free account: alerts and continue watching.' }) : router.push(linkHref(b.link)))}
        accessibilityRole="button">
        <Text style={[type.body, { flex: 1 }]}>{b.title}</Text>
        <Text style={{ color: colors.goldStrong, fontWeight: '800' }}>{b.cta}</Text>
      </Pressable>
    </Section>
  );
}

// ---- VOD rows ------------------------------------------------------------------------------------

function Curation({ section }: { section: HomeSection }) {
  const c = curations.find((x) => x.id === section.curationId) ?? curations.find((x) => x.title === section.title) ?? curations[0];
  const list = c.vodIds.map((id) => vodById(id)).filter((v): v is Vod => !!v);
  if (!list.length) return null;
  return (
    <Section>
      <SectionHead title={section.title ?? c.title} />
      <HRow data={list} keyOf={(v) => v.id} render={(v) => <VodCard v={v} />} width={CARD_W_SM + 32} />
    </Section>
  );
}

/** Top 10 by views; Shorts excluded. */
function PopularVod({ title }: { title?: string }) {
  const top = [...vods].filter((v) => v.type !== 'Shorts').sort((a, b) => b.views - a.views).slice(0, 10);
  return (
    <Section>
      <SectionHead title={title ?? 'Top 10 This Week'} />
      <HRow
        data={top}
        keyOf={(v) => v.id}
        width={CARD_W}
        render={(v, i) => (
          <Pressable style={styles.rank} onPress={() => router.push({ pathname: '/vod/[id]', params: { id: v.id } })} accessibilityRole="button" accessibilityLabel={`Rank ${i + 1}, ${v.title}`}>
            <Text style={styles.rankN}>{i + 1}</Text>
            <View style={{ flex: 1 }}>
              <Art hue={seriesHue(v.seriesId) + 20}>
                <Corner at="tr">
                  <TierBadge tier={v.tier} />
                </Corner>
                <Corner at="br">
                  <Pill>{fmtDuration(v.durationSec)}</Pill>
                </Corner>
              </Art>
              <Text style={cardText.title} numberOfLines={2}>
                {v.title}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </Section>
  );
}

function ContinueRow({ title }: { title?: string }) {
  const { member, continueList, removeContinue, toast } = useApp();
  const [editing, setEditing] = useState(false);
  if (member === 'guest') return null;
  // Recent first, max 10; 90%+ watched counts as finished.
  const items = continueList
    .filter((c) => c.progress < 0.9)
    .slice(0, 10)
    .map((c) => ({ ...c, v: vodById(c.vodId) }))
    .filter((c): c is { vodId: string; progress: number; v: Vod } => !!c.v);
  if (!items.length) return null;
  return (
    <Section>
      <SectionHead title={title ?? 'Continue Watching'} action={editing ? 'Done' : 'Edit'} onAction={() => setEditing((e) => !e)} />
      <HRow
        data={items}
        keyOf={(c) => c.vodId}
        width={CARD_W_SM + 32}
        render={({ v, progress }) => (
          <View>
            <Pressable onPress={() => !editing && router.push({ pathname: '/vod/[id]', params: { id: v.id } })} accessibilityRole="button" accessibilityLabel={v.title}>
              <Art hue={seriesHue(v.seriesId) + 20}>
                <Corner at="tr">
                  <TierBadge tier={v.tier} />
                </Corner>
                <View style={styles.progress}>
                  <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                </View>
              </Art>
              <Text style={cardText.title} numberOfLines={2}>
                {v.title}
              </Text>
              <Text style={cardText.meta}>{fmtDuration(Math.round(v.durationSec * (1 - progress)))} left</Text>
            </Pressable>
            {editing && (
              <Pressable
                style={styles.cwRemove}
                onPress={() => {
                  removeContinue(v.id);
                  toast('Removed from Continue Watching');
                }}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${v.title} from Continue Watching`}>
                <Icon name="close" size={14} />
              </Pressable>
            )}
          </View>
        )}
      />
    </Section>
  );
}

function PlayersRow({ title }: { title?: string }) {
  return (
    <Section>
      <SectionHead title={title ?? 'Players'} />
      <HRow data={players} keyOf={(p) => p.id} width={96} render={(p) => <PlayerChip id={p.id} name={p.name} hue={p.hue} sub={`${p.flag} ${p.country}`} />} />
    </Section>
  );
}

function NoticeRow() {
  const { member, tz } = useApp();
  const n = visibleNotices(member)[0];
  if (!n) return null;
  return (
    <Section style={{ paddingHorizontal: space.gutter }}>
      <Pressable style={styles.notice} onPress={() => router.push({ pathname: '/notices/[id]', params: { id: n.id } })} accessibilityRole="button">
        <Text style={styles.noticeTag}>Notice</Text>
        <Text style={[type.body, { flex: 1, fontWeight: '600' }]} numberOfLines={1}>
          {n.title}
        </Text>
        <Text style={type.caption}>{fmtDate(n.date, tz)}</Text>
      </Pressable>
    </Section>
  );
}

/** Optional section (off by default): what each plan unlocks. */
function PlansSection({ title }: { title?: string }) {
  const { member, openSheet } = useApp();
  const current = member === 'guest' ? null : member;
  const open = (t: Tier) => (member === 'guest' && t === 'free' ? openSheet({ kind: 'login', reason: 'Create a free account to start watching.' }) : router.push('/paywall'));
  return (
    <Section>
      <SectionHead title={title ?? 'Plans'} action="Compare" onAction={() => router.push('/paywall')} />
      <Text style={[styles.lead, { color: colors.subtle }]}>Example policy · not final</Text>
      <HRow
        data={PLAN_ORDER}
        keyOf={(t) => t}
        width={200}
        render={(t) => (
          <Pressable style={[styles.planCard, current === t && { borderColor: colors.gold }]} onPress={() => open(t)} accessibilityRole="button">
            <TierBadge tier={t} />
            <Text style={[type.h2, { marginTop: 8 }]}>WSOP+ {PLANS[t].name}</Text>
            <Text style={type.small}>{PLANS[t].tagline}</Text>
            {PLANS[t].highlights.map((h) => (
              <Text key={h} style={[type.small, { marginTop: 4 }]}>
                · {h}
              </Text>
            ))}
            <Text style={[type.h3, { marginTop: 8 }]}>{PLANS[t].price}</Text>
          </Pressable>
        )}
      />
    </Section>
  );
}

const cardText = StyleSheet.create({
  title: { color: colors.text, fontSize: 13.5, fontWeight: '700', marginTop: 8, lineHeight: 18 },
  meta: { color: colors.muted, fontSize: 12, marginTop: 2 },
});

const styles = StyleSheet.create({
  end: { color: colors.subtle, textAlign: 'center', fontSize: 12, marginTop: 32 },
  bannerText: { position: 'absolute', left: 16, right: 16, bottom: 16, gap: 4 },
  bannerSub: { color: 'rgba(242,242,243,0.8)', fontSize: 12.5, fontWeight: '600' },
  bannerTitle: { color: colors.text, fontSize: 26, fontWeight: '900', letterSpacing: -0.5, lineHeight: 30 },
  bannerCta: { alignSelf: 'flex-start', marginTop: 8, backgroundColor: colors.gold, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.lineStrong },
  dotOn: { width: 18, backgroundColor: colors.gold },
  countdown: { marginHorizontal: space.gutter, padding: 18, borderRadius: radius.panel, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, gap: 6 },
  countdownTime: { color: colors.gold, fontSize: 36, fontWeight: '900', ...type.tnum },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  earlier: { paddingHorizontal: space.gutter, paddingVertical: 8 },
  emptyLine: { color: colors.muted, paddingHorizontal: space.gutter, paddingVertical: 16 },
  lead: { color: colors.muted, fontSize: 13, paddingHorizontal: space.gutter, marginTop: -4, marginBottom: 10 },
  strip: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, paddingHorizontal: 16, borderRadius: radius.card, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line },
  rank: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  rankN: { color: colors.gold, fontSize: 46, fontWeight: '900', width: 40, textAlign: 'center', marginTop: 16, ...type.tnum },
  progress: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 4, backgroundColor: 'rgba(255,255,255,0.2)' },
  progressFill: { height: 4, backgroundColor: colors.gold },
  cwRemove: { position: 'absolute', top: -6, right: -6, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surface3, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.lineStrong },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, paddingHorizontal: 14, borderRadius: radius.card, backgroundColor: colors.surface },
  noticeTag: { ...type.label, color: colors.gold },
  planCard: { padding: 14, borderRadius: radius.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, minHeight: 200 },
});

