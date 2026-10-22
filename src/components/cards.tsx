// Content cards (web demo v2 components/cards.tsx + Billboard cards): broadcasts, hands, players, classics, upcoming
// days, events and saved items. Every card keeps the web demo's badges and copy.
import { Image } from 'expo-image';
import { router } from 'expo-router';
import type { ReactElement, ReactNode } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { HERO_DAY_ID, archive, dayById, eventById, hands, playerById, seriesById } from '@/data/mock';
import type { ArchiveItem, Day, Hand, Player, TourEvent } from '@/data/types';
import { isOnAir, shortEvent, tableDelay, tableStatus } from '@/lib/broadcast';
import { chips, duration } from '@/lib/format';
import { thumbFor } from '@/lib/media';
import { useListAction } from '@/lib/mylist';
import { VENUE_TZ, fmtCardDate, fmtDateTime, fmtTime, relative, tzAbbr } from '@/lib/time';
import { canWatch, gateForAccess, useApp, useTick, type ListItem, type MenuAction } from '@/state/app';
import { colors, radius, space, type } from '@/theme';

import { HAND_META, HandGlyph } from './markers';
import { AccessBadge, Art, Avatar, BraceletIcon, Corner, Icon, Label, Pill, Spoiler, StatusBadge, text } from './ui';

/** ⋯ button on a card: opens the card menu (My List etc.). Long-pressing the card does the same. */
function CardMenu({ title, actions, inset = 8 }: { title: string; actions: MenuAction[]; inset?: number }) {
  const { openSheet } = useApp();
  return (
    <Pressable onPress={() => openSheet({ kind: 'menu', title, actions })} accessibilityRole="button" accessibilityLabel="More options" hitSlop={6} style={[styles.menuBtn, { top: inset, right: inset }]}>
      <Icon name="dots" size={18} />
    </Pressable>
  );
}

function useMenu(title: string, actions: MenuAction[]) {
  const { openSheet } = useApp();
  return () => openSheet({ kind: 'menu', title, actions });
}

export const watchHref = (dayId: string, params?: { t?: number; clip?: string }) =>
  ({ pathname: '/watch/[dayId]', params: { dayId, ...(params?.t !== undefined ? { t: String(params.t) } : {}), ...(params?.clip ? { clip: params.clip } : {}) } }) as const;

// ---- broadcast days -----------------------------------------------------------------------------

export function BroadcastCard({ event, day, progress, extraActions }: { event: TourEvent; day: Day; progress?: number; extraActions?: MenuAction[] }) {
  const { state, status } = useApp();
  const st = status(day);
  const listAction = useListAction('day', day.id);
  const title = `${event.name} · ${day.label}`;
  const actions = [listAction, ...(extraActions ?? [])];
  const onLong = useMenu(title, actions);
  const access = day.access ?? 'subscriber';
  return (
    <View>
    <Pressable onPress={() => router.push(watchHref(day.id))} onLongPress={onLong} accessibilityRole="button" accessibilityLabel={title}>
      <Art image={thumbFor(`day:${day.id}`)}>
        <Corner at="tl">
          <StatusBadge status={st} size="sm" />
        </Corner>
        <Corner at="br" inset={progress !== undefined ? 10 : 8}>
          <AccessBadge onArt access={access} live={isOnAir(st)} locked={!canWatch(access, state, isOnAir(st))} />
        </Corner>
        {progress !== undefined && (
          <View style={styles.progress}>
            <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
          </View>
        )}
      </Art>
      <Text style={text.cardTitle} numberOfLines={1}>
        {title}
      </Text>
      <Text style={text.cardMeta} numberOfLines={1}>
        {seriesById(event.seriesId).name} · {st === 'upcoming' ? fmtDateTime(day.start, state.tz) : `Event #${event.number}`}
      </Text>
    </Pressable>
    <CardMenu title={title} actions={actions} />
    </View>
  );
}

/** One table feed on air (Home "On air now"). */
export function OnAirCard({ e, d, tableIndex }: { e: TourEvent; d: Day; tableIndex: number }) {
  const { state, status } = useApp();
  const dayStatus = status(d);
  const t = d.tables[tableIndex];
  const st = tableStatus(t, dayStatus);
  const offline = st === 'late' || st === 'interrupted';
  const access = d.access ?? 'subscriber';
  const delay = st === 'delayed' ? tableDelay(t, dayStatus) : 0;
  return (
    <Pressable onPress={() => router.push(watchHref(d.id))} accessibilityRole="button" accessibilityLabel={`${shortEvent(e.name)}, ${t.name}`}>
      <View style={[styles.feed, offline && { opacity: 0.6 }]}>
        <Image source={thumbFor(`feed:${t.id}`)} style={[StyleSheet.absoluteFill, offline && { opacity: 0.5 }]} contentFit="cover" />
        <Corner at="tl">
          <StatusBadge status={st} size="sm" delayMin={delay || 30} />
        </Corner>
        <Corner at="br">
          <AccessBadge onArt access={access} live={isOnAir(dayStatus)} locked={!canWatch(access, state, isOnAir(dayStatus))} />
        </Corner>
      </View>
      <Text style={[text.cardTitle, { fontSize: 14 }]} numberOfLines={1}>
        {shortEvent(e.name)}
      </Text>
      <Text style={text.cardMeta} numberOfLines={1}>
        {t.name}
        {delay ? ` · ${delay}m delay` : ''}
      </Text>
    </Pressable>
  );
}

/** Upcoming broadcast day: still frame with a large date and venue time. */
export function UpcomingCard({ e, d }: { e: TourEvent; d: Day }) {
  const { state } = useApp();
  const now = useTick(60_000);
  const listAction = useListAction('day', d.id);
  const title = `#${e.number} ${e.name}`;
  const onLong = useMenu(title, [listAction]);
  return (
    <View>
    <Pressable onPress={() => router.push(watchHref(d.id))} onLongPress={onLong} accessibilityRole="button" accessibilityLabel={title} style={styles.upcoming}>
      <Art image={thumbFor(`day:${d.id}`)} style={{ borderRadius: 8 }}>
        <View style={styles.upcomingShade} />
        <Corner at="tl">
          <StatusBadge status="upcoming" size="sm" />
        </Corner>
        <View style={styles.upcomingWhen}>
          <Text style={[type.label, { color: 'rgba(255,255,255,0.85)' }]}>{fmtCardDate(d.start, VENUE_TZ)}</Text>
          <Text style={[styles.upcomingTime, type.tnum]}>
            {fmtTime(d.start, VENUE_TZ)} {tzAbbr(VENUE_TZ, d.start)}
          </Text>
        </View>
      </Art>
      <Text style={text.cardTitle} numberOfLines={1}>
        {title}
      </Text>
      <Text style={text.cardMeta}>
        {d.label} · starts {relative(d.start, now)}
      </Text>
      <Text style={text.cardSub}>
        {fmtTime(d.start, state.tz)} {tzAbbr(state.tz, d.start)} your time
      </Text>
    </Pressable>
    <CardMenu title={title} actions={[listAction]} inset={18} />
    </View>
  );
}

// ---- hands ------------------------------------------------------------------------------------

export function HandCard({ hand }: { hand: Hand }) {
  const { state } = useApp();
  const ev = eventById(hand.eventId)!;
  const m = HAND_META[hand.type];
  const listAction = useListAction('hand', hand.id);
  const onLong = useMenu(hand.title, [listAction]);
  return (
    <View style={styles.handCard}>
      {/* clip=… lets the player open just this hand when the full broadcast is locked (free highlights). */}
      <Pressable onPress={() => router.push(watchHref(hand.dayId, { t: hand.t, clip: hand.id }))} onLongPress={onLong} accessibilityRole="button" accessibilityLabel={hand.title}>
        <Art image={thumbFor(`hand:${hand.id}`)}>
          <Corner at="tl">
            <View style={styles.handTag}>
              <HandGlyph type={hand.type} size={14} />
              <Text style={[styles.tagText]}>{m.label.toUpperCase()}</Text>
            </View>
          </Corner>
          <Corner at="bl">
            <AccessBadge onArt access={hand.access} locked={!canWatch(hand.access, state)} />
          </Corner>
          <Corner at="br">
            <Pill>{duration(hand.durationSec)}</Pill>
          </Corner>
        </Art>
        <Text style={[text.cardTitle, { fontSize: 14, lineHeight: 19 }]} numberOfLines={2}>
          {hand.title}
        </Text>
        <Text style={text.cardMeta} numberOfLines={1}>
          {hand.playerIds.map((id) => playerById(id).name).join(' vs ')}
        </Text>
        <View style={styles.handFoot}>
          <Text style={[type.small, { color: colors.text }, type.tnum]}>
            Pot <Text style={{ fontWeight: '800' }}>{chips(hand.pot)}</Text>
          </Text>
          <Text style={[type.small, { color: colors.subtle, flexShrink: 1 }]} numberOfLines={1}>
            #{ev.number} {shortEvent(ev.name)}
          </Text>
        </View>
      </Pressable>
      <CardMenu title={hand.title} actions={[listAction]} inset={20} />
      <View style={styles.handResult}>
        <Spoiler k={`hand-${hand.id}`} label="Hand result hidden">
          <Text style={[type.small, { color: colors.text, fontWeight: '700' }]}>{hand.result}</Text>
        </Spoiler>
      </View>
    </View>
  );
}

// ---- players ------------------------------------------------------------------------------------

/** Player tile: large round avatar, name, country code · bracelets. */
export function PlayerTile({ player }: { player: Player }) {
  return (
    <Pressable onPress={() => router.push({ pathname: '/players/[id]', params: { id: player.id } })} accessibilityRole="button" accessibilityLabel={player.name} style={styles.playerTile}>
      <Avatar name={player.name} hue={player.hue} size={72} vivid />
      <Text style={[type.body, { fontWeight: '800', textAlign: 'center', marginTop: 6 }]} numberOfLines={2}>
        {player.name}
      </Text>
      <Text style={[type.small, type.tnum, { textAlign: 'center' }]}>
        {player.cc} · {player.bracelets} bracelet{player.bracelets === 1 ? '' : 's'}
      </Text>
    </Pressable>
  );
}

// ---- archive ------------------------------------------------------------------------------------

export function ArchiveCard({ item }: { item: ArchiveItem }) {
  const { state, toast, requireLogin } = useApp();
  const w = playerById(item.winnerId);
  const listAction = useListAction('archive', item.id);
  const title = `${item.year} ${item.title}`;
  const onLong = useMenu(title, [listAction]);
  const play = () => {
    const gate = gateForAccess(item.access, state);
    if (gate === 'ok') return toast('Archive playback opens the same player (demo)');
    if (gate === 'login') return requireLogin(item.access === 'signin' ? 'Sign in free with GGPASS to watch this classic.' : 'Sign in to watch this classic.');
    if (gate === 'plans' || gate === 'expired') return router.push({ pathname: '/plans', params: { access: item.access } });
    if (gate === 'link') return toast('Link your GGPASS account to watch (see Account)');
    if (gate === 'restricted') return toast('Viewing isn’t available on this account');
    router.push('/devices');
  };
  return (
    <View>
      <Pressable onPress={play} onLongPress={onLong} accessibilityRole="button" accessibilityLabel={title}>
        <Art image={thumbFor(`archive:${item.id}`)}>
          <Corner at="tl">
            <Label>{`CLASSIC · ${item.year}`}</Label>
          </Corner>
          <Corner at="bl">
            <AccessBadge onArt access={item.access} locked={!canWatch(item.access, state)} />
          </Corner>
          <Corner at="br">
            <Pill>{duration(item.durationSec)}</Pill>
          </Corner>
        </Art>
        <Text style={text.cardTitle}>{title}</Text>
        <Text style={text.cardMeta} numberOfLines={1}>
          {item.subtitle}
        </Text>
      </Pressable>
      <CardMenu title={title} actions={[listAction]} />
      <View style={[styles.inline, { marginTop: 4 }]}>
        <Text style={[type.small, { color: colors.subtle }]}>Champion </Text>
        <Spoiler k={`archive-${item.id}`} label="Champion hidden">
          <Text style={[type.small, { color: colors.text, fontWeight: '700' }]}>{w.name}</Text>
        </Spoiler>
      </View>
    </View>
  );
}

// ---- events / saved items ------------------------------------------------------------------------

/** A saved event (events have no single card elsewhere). */
export function EventCard({ eventId }: { eventId: string }) {
  const e = eventById(eventId)!;
  const action = useListAction('event', e.id);
  const onLong = useMenu(e.name, [action]);
  return (
    <View>
    <Pressable onPress={() => router.push({ pathname: '/events/[id]', params: { id: e.id } })} onLongPress={onLong} accessibilityRole="button" accessibilityLabel={e.name}>
      <Art image={thumbFor(`event:${e.id}`)}>
        <Corner at="tl">
          <View style={styles.handTag}>
            <BraceletIcon size={12} />
            <Text style={styles.tagText}>EVENT #{e.number}</Text>
          </View>
        </Corner>
      </Art>
      <Text style={text.cardTitle} numberOfLines={1}>
        {e.name}
      </Text>
      <Text style={text.cardMeta} numberOfLines={1}>
        {e.days.length} broadcast days · {e.game}
      </Text>
    </Pressable>
    <CardMenu title={e.name} actions={[action]} />
    </View>
  );
}

/** Renders a saved item with the card it uses everywhere else. */
export function ListItemCard({ item }: { item: ListItem }) {
  if (item.kind === 'event') return eventById(item.id) ? <EventCard eventId={item.id} /> : null;
  if (item.kind === 'day') {
    const ref = dayById(item.id);
    return ref ? <BroadcastCard event={ref.event} day={ref.day} /> : null;
  }
  if (item.kind === 'archive') {
    const a = archive.find((x) => x.id === item.id);
    return a ? <ArchiveCard item={a} /> : null;
  }
  const h = hands.find((x) => x.id === item.id);
  return h ? <HandCard hand={h} /> : null;
}

/** Vertical list of full-width cards with the web demo's phone spacing. */
export function CardStack({ children }: { children: ReactNode }) {
  return <View style={styles.stack}>{children}</View>;
}

export const ROW_GAP = 12;

/**
 * One home row: cards side by side, swiped left / right. The next card peeks in at the edge so the row reads as
 * scrollable; it snaps card by card. FlatList keeps long rows cheap.
 */
export function SwipeRow<T>({ data, keyOf, render, width = 280 }: { data: T[]; keyOf: (item: T) => string; render: (item: T) => ReactElement | null; width?: number }) {
  return (
    <FlatList
      horizontal
      data={data}
      keyExtractor={keyOf}
      renderItem={({ item }) => <View style={{ width }}>{render(item)}</View>}
      ItemSeparatorComponent={RowGap}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: space.gutter }}
      snapToInterval={width + ROW_GAP}
      decelerationRate="fast"
      disableIntervalMomentum
      initialNumToRender={3}
      windowSize={5}
    />
  );
}
const RowGap = () => <View style={{ width: ROW_GAP }} />;

export const isHero = (dayId: string) => dayId === HERO_DAY_ID;

const styles = StyleSheet.create({
  inline: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  menuBtn: { position: 'absolute', width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' },
  progress: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 4, backgroundColor: 'rgba(255,255,255,0.15)' },
  progressFill: { height: 4, backgroundColor: colors.gold },
  feed: { aspectRatio: 16 / 9, borderRadius: radius.card, overflow: 'hidden', borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface2 },
  upcoming: { borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, padding: 10 },
  upcomingShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.35)' },
  upcomingWhen: { position: 'absolute', left: 12, bottom: 10 },
  upcomingTime: { color: colors.text, fontSize: 24, fontWeight: '900', lineHeight: 28 },
  handCard: { borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, padding: 12 },
  handTag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 4 },
  tagText: { color: colors.text, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  handFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 8 },
  handResult: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.line },
  playerTile: { alignItems: 'center', paddingVertical: 8, paddingHorizontal: 2 },
  stack: { paddingHorizontal: space.gutter, gap: 24 },
});
