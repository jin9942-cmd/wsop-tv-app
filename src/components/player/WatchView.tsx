// The watch screen body (web demo v2 pages/Watch.tsx `WatchInner`, phone layout): player with broadcast graphics,
// access gates and broadcast states, toolbar (overlay · multiview · panel), stream / event info, Overview, hands,
// and the aside lists (streams or broadcast days, hand replays, more replays).
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { handFor } from '@/data/hand';
import { bbFor, dayById, events, hands, playerById, seatsFor, seriesById } from '@/data/mock';
import { CATCH_UP_DAYS, requiredTier, tierFull, TRAVEL_UNAVAILABLE_EVENTS } from '@/data/policy';
import type { Hand, OverlayLevel } from '@/data/types';
import { isOnAir, shortEvent, shortTableName, tableDelay, tableStatus } from '@/lib/broadcast';
import { chips, duration, money } from '@/lib/format';
import { tableVideo, thumbFor } from '@/lib/media';
import { useMyList } from '@/lib/mylist';
import { VENUE_TZ, fmtDate, fmtDateTime, fmtTime } from '@/lib/time';
import { canWatch, gateForAccess, useApp, useTick } from '@/state/app';
import { useLiveStacks } from '@/state/stacks';
import { colors, radius, space, type } from '@/theme';

import { watchHref } from '../cards';
import { HAND_META, HandGlyph } from '../markers';
import { AccessBadge, Button, Corner, Icon, Label, Pill, Segmented, Spoiler, StatusBadge } from '../ui';
import { BroadcastHold, PlaybackGate, RegionBlocked, TableHold, UpcomingPanel, VpnBlocked } from './Gates';
import { SidePanel } from './SidePanel';
import { StageOverlay } from './Stage';
import { VideoStage } from './VideoStage';

const CAPTIONS = ['Han has been patient all level — this is the spot she was waiting for.', 'Whitfield takes his time. Seven-time champion, never rushed.', 'The crowd in Las Vegas is completely silent.'];

/** Spoiler-safe title for a replay hand until it's revealed: who and how big, not what happened. */
const lastName = (id: string) => playerById(id).name.split(' ').slice(-1)[0];
export const neutralTitle = (h: Hand) => `${lastName(h.playerIds[0])} vs ${lastName(h.playerIds[1])} · ${chips(h.pot)} pot`;

export function WatchView({
  dayId,
  clipId,
  variant,
  tableId,
  onTable,
  asideTop,
  autoPlay,
}: {
  dayId: string;
  clipId?: string | null;
  variant: 'live' | 'vod';
  tableId?: string;
  onTable: (id: string) => void;
  asideTop?: ReactNode;
  /** Opened from the "Live now" reminder: play even if the slot hasn't started (demo). */
  autoPlay?: boolean;
}) {
  const app = useApp();
  const { state, status: statusOf, openSheet, requireLogin, set } = app;
  const { event, day } = dayById(dayId)!;
  const se = seriesById(event.seriesId);
  const now = useTick(1000);
  const seatBase = useMemo(() => seatsFor(dayId), [dayId]);
  const hand = useMemo(() => handFor(dayId), [dayId]);
  const bb = bbFor(dayId);

  const realStatus = statusOf(day);
  const status = autoPlay && realStatus === 'upcoming' ? 'live' : realStatus;
  const isLive = isOnAir(status);
  const stacks = useLiveStacks(seatBase, isLive);
  const main = day.tables.find((t) => t.id === tableId) ?? day.tables[0];
  const mainIdx = day.tables.indexOf(main);
  const delayMin = tableDelay(main, status);
  const [overlay, setOverlay] = useState<OverlayLevel>(state.overlayDefault);
  const [views, setViews] = useState<1 | 2>(1);
  const [panel, setPanel] = useState(false);
  const [previewDone, setPreviewDone] = useState(false);
  const phase = Math.floor(now / 6000) % 3;

  // Content access: the day's level, or a single free/sign-in hand opened as a highlight clip.
  const dayAccess = day.access ?? 'subscriber';
  const dayGate = gateForAccess(dayAccess, state, isLive);
  const dayRequired = requiredTier(dayAccess, state.includedFrom, isLive);
  const clipHand = clipId ? hands.find((h) => h.id === clipId && h.dayId === dayId) : undefined;
  const clipMode = dayGate !== 'ok' && !!clipHand && canWatch(clipHand.access, state) && (isLive || status === 'vod');
  const isVod = status === 'vod' && !clipMode;

  // Order of checks: rights → VPN → broadcast state → membership (soft paywall at play time).
  const blocked =
    state.regionBlocked || (state.abroad && TRAVEL_UNAVAILABLE_EVENTS.includes(event.id))
      ? 'region'
      : state.vpnDetected
        ? 'vpn'
        : status === 'upcoming' || status === 'late' || status === 'interrupted'
          ? status
          : clipMode || dayGate === 'ok'
            ? null
            : dayGate;
  // App-only: a signed-in viewer whose tier is too low gets a 10-second preview first.
  const previewing = blocked === 'plans' && !previewDone;

  // Opening locked content as a guest is a play intent → ask to sign in straight away.
  const askedLogin = useRef(false);
  useEffect(() => {
    if (blocked === 'login' && !askedLogin.current) {
      askedLogin.current = true;
      requireLogin('Sign in to start watching.');
    }
  }, [blocked, requireLogin]);

  // Replays: remember progress for Continue Watching when leaving.
  const pos = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (isVod && pos.current !== null) set((s) => ({ progress: { ...s.progress, [dayId]: pos.current! } }));
    },
    [isVod, dayId, set],
  );

  const markers = hands.filter((h) => h.dayId === dayId).sort((a, b) => a.t - b.t);
  const published = Date.parse(day.start) + day.durationMin * 60_000;
  const availableUntil = published + CATCH_UP_DAYS * 86_400_000;
  const daysLeft = Math.ceil((availableUntil - now) / 86_400_000);
  const firstOnAir = day.tables.find((t) => !t.state) ?? day.tables[0];
  const delays = [...new Set(day.tables.map((t) => tableDelay(t, status)))];
  const caption = state.ccDefault ? CAPTIONS[Math.floor(now / 5000) % 3] : null;
  const info = { event: shortEvent(event.name), day: day.label, level: isLive && day.label === 'Final Table' ? event.level : undefined, blinds: { sb: bb / 2, bb, ante: bb }, left: isLive && day.label === 'Final Table' ? event.remaining : undefined };
  const mainStatus = tableStatus(main, status);
  const showTiles = views === 2 && !clipMode && !isVod && day.tables.length > 1;

  const picture = () => {
    if (blocked === 'region') return <RegionBlocked />;
    if (blocked === 'vpn') return <VpnBlocked />;
    if (blocked === 'upcoming') return <UpcomingPanel dayId={dayId} start={day.start} title={`${event.name} · ${day.label}`} />;
    if (blocked === 'late' || blocked === 'interrupted') return <BroadcastHold kind={blocked} start={day.start} eventId={event.id} />;
    if (blocked && !previewing) return <PlaybackGate gate={blocked} required={dayRequired} returnTo={`/watch/${dayId}`} />;
    if (!clipMode && (mainStatus === 'late' || mainStatus === 'interrupted')) return <TableHold table={main} kind={mainStatus} onSwitch={() => onTable(firstOnAir.id)} switchLabel={firstOnAir.name} />;
    if (showTiles) {
      const tiles = [main, ...day.tables.filter((t) => t.id !== main.id)].slice(0, 2);
      return (
        <View style={styles.tiles}>
          {tiles.map((t) => {
            const ts = tableStatus(t, status);
            return (
              <Pressable key={t.id} style={[styles.tile, t.id === main.id && styles.tileOn]} onPress={() => onTable(t.id)} accessibilityRole="button" accessibilityLabel={`${t.name}${t.id === main.id ? ', audio on' : ', select to hear this table'}`}>
                {ts === 'late' || ts === 'interrupted' ? (
                  <TableHold table={t} kind={ts} switchLabel="" compact />
                ) : (
                  <>
                    <Image source={thumbFor(`feed:${t.id}`)} style={StyleSheet.absoluteFill} contentFit="cover" />
                    <StageOverlay overlay={overlay} seats={stacks} phase={phase} hand={hand} compact />
                  </>
                )}
                <Corner at="tl" inset={4}>
                  <Label size={9}>
                    {t.name}
                    {ts === 'delayed' ? ` · ${tableDelay(t, status)}m delay` : ''}
                  </Label>
                  {t.id === main.id && <Icon name="volume" size={12} color={colors.gold} />}
                </Corner>
              </Pressable>
            );
          })}
        </View>
      );
    }
    const v = tableVideo(mainIdx);
    return (
      <VideoStage
        key={`${main.id}:${previewing}`}
        url={v.url}
        start={v.start}
        poster={thumbFor(`feed:${main.id}`)}
        live={isLive}
        preview={previewing}
        onPreviewEnd={() => {
          setPreviewDone(true);
          openSheet({ kind: 'plans', required: dayRequired, title: `${event.name} · ${day.label}`, returnTo: `/watch/${dayId}` });
        }}
        onPosition={isVod ? (sec, len) => (pos.current = len > 0 ? (sec / len) * day.durationMin * 60 : null) : undefined}
        overlay={
          <>
            <StageOverlay overlay={overlay} seats={stacks} phase={phase} info={info} hand={hand} caption={caption} />
            <View style={styles.badgeTL} pointerEvents="none">
              {isVod ? <Label>{`Full replay`.toUpperCase()}</Label> : <StatusBadge status={clipMode ? 'vod' : mainStatus} delayMin={delayMin || 30} />}
            </View>
          </>
        }
      />
    );
  };

  return (
    <View>
      {clipMode && clipHand && !blocked && (
        <View style={styles.clip}>
          <AccessBadge access={clipHand.access} size="md" />
          <Text style={[type.small, { color: colors.text }]}>
            <Text style={{ fontWeight: '800' }}>Highlight · {clipHand.title}</Text>{' '}
            <Text style={{ color: colors.muted }}>
              ({duration(clipHand.durationSec)}) — the full broadcast is included with {dayRequired === 'wsopFree' ? 'WSOP+ Free — every GGPass account' : dayRequired === 'free' ? 'everyone' : tierFull(dayRequired)}.
            </Text>
          </Text>
          {dayGate === 'login' ? (
            <Button variant="primary" size="sm" title="Continue with GGPASS" onPress={() => requireLogin('Sign in to keep watching the full broadcast.')} />
          ) : dayGate === 'plans' ? (
            <Button variant="primary" size="sm" title="See WSOP+ plans" onPress={() => router.push({ pathname: '/plans', params: { required: dayRequired, returnTo: `/watch/${dayId}` } })} />
          ) : null}
        </View>
      )}

      {/* player */}
      <View style={[styles.player, blocked && !previewing ? { minHeight: 300 } : { aspectRatio: 16 / 9 }]}>{picture()}</View>

      {/* toolbar */}
      {(!blocked || previewing) && (
        <View style={styles.toolbar}>
          <View style={styles.inline}>
            <Text style={type.label}>Overlay</Text>
            <Segmented<OverlayLevel>
              label="Overlay level"
              size="sm"
              value={overlay}
              onChange={setOverlay}
              options={(['off', 'basic', 'pro'] as OverlayLevel[]).map((o) => ({ value: o, label: o === 'off' ? 'Off' : o === 'basic' ? 'Basic' : 'Pro' }))}
            />
          </View>
          {!clipMode && !isVod && day.tables.length > 1 && (
            <View style={styles.inline}>
              <Text style={type.label}>Multiview</Text>
              <Segmented<'1' | '2'>
                label="Multiview layout"
                size="sm"
                value={String(views) as '1' | '2'}
                onChange={(v) => setViews(Number(v) as 1 | 2)}
                options={[
                  { value: '1', label: <Icon name="grid1" size={15} color={views === 1 ? colors.text : colors.muted} /> },
                  { value: '2', label: <Icon name="grid2" size={15} color={views === 2 ? colors.text : colors.muted} /> },
                ]}
              />
            </View>
          )}
          {!clipMode && <Button size="sm" variant="outline" title={isVod ? 'Hands, chips & players' : 'Chip counts & tables'} onPress={() => setPanel(true)} />}
        </View>
      )}

      <View style={{ paddingHorizontal: space.gutter }}>
        {/* stream / replay info under the player */}
        {variant === 'live' ? (
          <View style={{ marginTop: 16 }}>
            <View style={[styles.inline, { flexWrap: 'wrap' }]}>
              <StatusBadge status={mainStatus} size="sm" delayMin={delayMin || 30} />
              <Text style={[type.small, { flexShrink: 1 }]}>
                {se.name} · Event #{event.number} · {day.label} · {main.name}
              </Text>
              <AccessBadge access={dayAccess} live={isLive} locked={dayGate !== 'ok'} />
            </View>
            <View style={styles.titleRow}>
              <Text style={styles.h1}>{event.name}</Text>
              <MyListButton id={dayId} />
            </View>
          </View>
        ) : (
          <View style={{ marginTop: 16 }}>
            <View style={[styles.inline, { flexWrap: 'wrap' }]}>
              <Label bg={colors.surface3}>FULL REPLAY</Label>
              <Text style={[type.small, { flexShrink: 1 }]}>
                {se.name} · Event #{event.number} · {duration(day.durationMin * 60)} · Published {fmtDate(published, VENUE_TZ)}
              </Text>
              <AccessBadge access={dayAccess} live={isLive} locked={dayGate !== 'ok'} />
            </View>
            <View style={styles.titleRow}>
              <Text style={styles.h1}>
                {event.name} <Text style={{ color: colors.muted }}>· {day.label}</Text>
              </Text>
              <MyListButton id={dayId} />
            </View>
            <Text style={[type.small, { marginTop: 6, color: daysLeft <= 14 ? colors.delayed : colors.subtle }]}>
              {daysLeft <= 14 ? `Leaving in ${daysLeft} day${daysLeft === 1 ? '' : 's'} · available until ${fmtDate(availableUntil, VENUE_TZ)}` : `Replay available until ${fmtDate(availableUntil, VENUE_TZ)}`}
            </Text>
          </View>
        )}

        {/* delay note: what the stream is showing vs the tournament floor */}
        {!blocked && !clipMode && status === 'delayed' && (
          <Text style={[type.caption, { marginTop: 8, lineHeight: 16 }]}>
            <Text style={{ color: colors.muted, fontWeight: '700' }}>{main.name}</Text> runs {delayMin} min behind the tournament floor — showing play from about {fmtTime(now - delayMin * 60_000, state.tz)} your time ({fmtTime(now - delayMin * 60_000, VENUE_TZ)} Las Vegas). Chip counts and hands follow the stream.
            {delays.length > 1 ? ` Delay by table: ${day.tables.map((t) => `${shortTableName(t.name)} ${tableDelay(t, status)} min`).join(' · ')}.` : ''}
          </Text>
        )}

        <Overview dayId={dayId} delayMin={delayMin} status={status} />

        {/* the aside (streams or broadcast days) comes first on phones */}
        {asideTop && <View style={{ marginTop: 24 }}>{asideTop}</View>}

        {markers.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <Text style={styles.h2}>{isVod ? `Hands · ${markers.length}` : 'Hands in this broadcast'}</Text>
            <View style={styles.list}>
              {markers.map((h, i) => (
                <HandRow key={h.id} h={h} safe={isVod} last={i === markers.length - 1} />
              ))}
            </View>
          </View>
        )}

        <EventHandReplays eventId={event.id} safe={isVod} />
        {variant === 'vod' && <RelatedReplays eventId={event.id} />}
      </View>

      <BroadcastPanel open={panel} onClose={() => setPanel(false)}>
        <SidePanel stacks={stacks} phase={phase} tables={day.tables} dayStatus={status} mainTable={main.id} onSelectTable={(id) => (onTable(id), setPanel(false))} spoilerKey={dayId} bb={bb} hand={hand} live={isLive} />
      </BroadcastPanel>
    </View>
  );
}

function MyListButton({ id }: { id: string }) {
  const list = useMyList();
  const on = list.has('day', id);
  return <Button size="sm" variant={on ? 'secondary' : 'outline'} icon={on ? 'check' : 'plus'} title={on ? 'In My List' : 'My List'} pressed={on} onPress={() => list.toggle('day', id)} accessibilityLabel={on ? 'Remove from My List' : 'Add to My List'} />;
}

function HandRow({ h, safe, last }: { h: Hand; safe?: boolean; last?: boolean }) {
  const { state } = useApp();
  // Replays: spoiler-safe (who and how big, not what happened) until revealed on purpose.
  const open = !safe || state.revealed.includes(`hand-${h.id}`);
  return (
    <Pressable onPress={() => router.push(watchHref(h.dayId, { t: h.t, clip: h.id }))} accessibilityRole="button" style={[styles.handRow, last && { borderBottomWidth: 0 }]}>
      <HandGlyph type={h.type} />
      <Text style={[type.small, type.tnum, { width: 56 }]}>{duration(h.t)}</Text>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[type.body, { fontWeight: '700' }]} numberOfLines={1}>
          {open ? h.title : neutralTitle(h)}
        </Text>
        <Text style={type.small} numberOfLines={1}>
          {open ? `${HAND_META[h.type].label} · ${h.playerIds.map((id) => playerById(id).name).join(' vs ')} · Pot ${chips(h.pot)}` : `${duration(h.durationSec)} clip`}
        </Text>
      </View>
    </Pressable>
  );
}
/** Tournament figures (web demo v2 "Overview"). */
function Overview({ dayId, delayMin, status }: { dayId: string; delayMin: number; status: string }) {
  const { state } = useApp();
  const { event, day } = dayById(dayId)!;
  const se = seriesById(event.seriesId);
  const started = event.entrants > 0;
  const live = status === 'live' || status === 'delayed';
  const cells: [string, ReactNode][] = [
    ['Game', event.game],
    ['Buy-in', event.buyIn ? money(event.buyIn) : 'Invitational'],
    ['Entries', started ? event.entrants.toLocaleString('en-US') : '—'],
    ['Prize pool', started ? money(event.prizePool) : 'TBD'],
    ['First prize', started ? money(event.firstPrize) : 'TBD'],
    event.winnerId
      ? [
          'Champion',
          <Spoiler key="champ" k={`winner-${event.id}`} label="Champion hidden">
            <Text style={styles.cellValue}>{playerById(event.winnerId).name}</Text>
          </Spoiler>,
        ]
      : ['Players left', started ? event.remaining.toLocaleString('en-US') : '—'],
    ['Level', started ? `Level ${event.level}` : '—'],
    ['Blinds', live && event.blinds ? `${chips(event.blinds.sb)} / ${chips(event.blinds.bb)} · ${chips(event.blinds.ante)} BB ante` : '—'],
    ['Chips in play', started ? `${chips(event.entrants * event.startingStack)} (${chips(event.startingStack)} start)` : `${chips(event.startingStack)} starting stack`],
    ['Started', `${fmtDateTime(day.start, VENUE_TZ)} PT\n${fmtTime(day.start, state.tz)} your time`],
    status === 'vod' ? ['Broadcast length', duration(day.durationMin * 60)] : ['Broadcast delay', status === 'delayed' ? `${delayMin}-minute delay` : status === 'live' ? 'Real time' : '—'],
    ['Venue', `${se.venue}, ${se.city}`],
  ];
  return (
    <View style={{ marginTop: 20 }}>
      <Text style={styles.h2}>Overview</Text>
      <View style={styles.cells}>
        {cells.map(([k, v]) => (
          <View key={k} style={styles.cell}>
            <Text style={[type.label, { fontSize: 10 }]}>{k}</Text>
            {typeof v === 'string' ? <Text style={styles.cellValue}>{v}</Text> : <View style={{ marginTop: 4 }}>{v}</View>}
          </View>
        ))}
      </View>
      <View style={[styles.inline, { marginTop: 8 }]}>
        <Label bg="transparent" border={colors.lineStrong} color={colors.subtle} size={9}>
          SAMPLE
        </Label>
        <Text style={[type.caption, { flex: 1 }]}>Tournament figures are sample data, not an EBS / live-reporting feed.</Text>
      </View>
    </View>
  );
}

/** "Hand replays from this event". */
function EventHandReplays({ eventId, safe }: { eventId: string; safe?: boolean }) {
  const { state } = useApp();
  const list = hands.filter((h) => h.eventId === eventId).slice(0, 5);
  if (!list.length) return null;
  return (
    <View style={{ marginTop: 24 }}>
      <Text style={[type.label, { color: 'rgba(242,242,243,0.8)', marginBottom: 12 }]}>Hand replays from this event</Text>
      <View style={{ gap: 8 }}>
        {list.map((h) => {
          const open = !safe || state.revealed.includes(`hand-${h.id}`);
          return (
            <Pressable key={h.id} onPress={() => router.push(watchHref(h.dayId, { t: h.t, clip: h.id }))} style={styles.mini} accessibilityRole="button" accessibilityLabel={open ? h.title : neutralTitle(h)}>
              <View style={styles.miniArt}>
                <Image source={thumbFor(`hand:${h.id}`)} style={StyleSheet.absoluteFill} contentFit="cover" />
                <Corner at="br" inset={4}>
                  <Pill>{duration(h.durationSec)}</Pill>
                </Corner>
              </View>
              <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                <AccessBadge access={h.access} locked={!canWatch(h.access, state)} />
                <Text style={[type.body, { fontWeight: '800', lineHeight: 18 }]} numberOfLines={2}>
                  {open ? h.title : neutralTitle(h)}
                </Text>
                <Text style={type.small} numberOfLines={1}>
                  {open ? `${HAND_META[h.type].label} · Pot ${chips(h.pot)}` : `${dayById(h.dayId)?.day.label ?? ''} · ${duration(h.durationSec)} clip`}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Replay aside: other events' replays. */
function RelatedReplays({ eventId }: { eventId: string }) {
  const list = events
    .filter((e) => e.id !== eventId)
    .flatMap((e) => e.days.filter((d) => d.status === 'vod').slice(-1).map((d) => ({ e, d })))
    .slice(0, 4);
  if (!list.length) return null;
  return (
    <View style={{ marginTop: 24 }}>
      <Text style={[type.label, { color: 'rgba(242,242,243,0.8)', marginBottom: 12 }]}>More replays</Text>
      <View style={{ gap: 8 }}>
        {list.map(({ e, d }) => (
          <Pressable key={d.id} onPress={() => router.push(watchHref(d.id))} style={styles.mini} accessibilityRole="button">
            <View style={styles.miniArt}>
              <Image source={thumbFor(`day:${d.id}`)} style={StyleSheet.absoluteFill} contentFit="cover" />
              <Corner at="br" inset={4}>
                <Pill>{duration(d.durationMin * 60)}</Pill>
              </Corner>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[type.body, { fontWeight: '800' }]} numberOfLines={2}>
                #{e.number} {shortEvent(e.name)}
              </Text>
              <Text style={type.small}>{d.label}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function BroadcastPanel({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close panel" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 8 }]} accessibilityViewIsModal>
        <View style={styles.handle} />
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close panel" hitSlop={8} style={{ padding: 6 }}>
            <Icon name="close" color={colors.muted} />
          </Pressable>
        </View>
        {children}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  inline: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  player: { width: '100%', backgroundColor: '#000', overflow: 'hidden' },
  badgeTL: { position: 'absolute', top: 8, left: 8 },
  tiles: { ...StyleSheet.absoluteFill, flexDirection: 'row', gap: 2, backgroundColor: '#000' },
  tile: { flex: 1, overflow: 'hidden' },
  tileOn: { borderWidth: 2, borderColor: colors.gold },
  clip: { margin: space.gutter, marginBottom: 12, padding: 12, gap: 8, borderRadius: radius.card, borderWidth: 1, borderColor: 'rgba(76,195,138,0.4)', backgroundColor: colors.surface },
  toolbar: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, paddingHorizontal: space.gutter, paddingTop: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 6, flexWrap: 'wrap' },
  h1: { color: colors.text, fontSize: 24, fontWeight: '900', letterSpacing: -0.4, flexShrink: 1 },
  h2: { color: colors.text, fontSize: 16, fontWeight: '800', marginBottom: 8 },
  cells: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 8 },
  cell: { width: '48.5%', borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 10 },
  cellValue: { color: colors.text, fontSize: 13.5, fontWeight: '800', marginTop: 4, ...type.tnum },
  list: { borderRadius: radius.panel, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  handRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  mini: { flexDirection: 'row', gap: 12, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, padding: 8 },
  miniArt: { width: 112, aspectRatio: 16 / 9, borderRadius: 6, overflow: 'hidden', backgroundColor: colors.surface2 },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '72%', borderTopLeftRadius: radius.panel, borderTopRightRadius: radius.panel, backgroundColor: colors.surface, paddingHorizontal: 12, paddingTop: 8 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.lineStrong },
});
