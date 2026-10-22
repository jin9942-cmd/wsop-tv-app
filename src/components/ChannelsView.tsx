// Channels — the linear side of Live (web demo v2 features/channels/Channels.tsx). 24/7 channels on a fixed schedule:
// channel strip, the channel player (whatever is on now, no rewind), now / next, and the programme guide.
// Access is checked per programme as it airs: free programmes play for anyone, live and replay programmes need the
// membership of the broadcast they carry. Live coverage that starts late or drops out holds on highlights (standby).
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { channelById, channels, programAt, programsFor, upNext, type LinearChannel, type Program } from '@/data/channels';
import { handFor } from '@/data/hand';
import { bbFor, dayById, seatsFor } from '@/data/mock';
import { requiredTier } from '@/data/policy';
import { shortEvent } from '@/lib/broadcast';
import { fmtDate, fmtTime, relative, tzAbbr } from '@/lib/time';
import { gateForAccess, useApp, useTick } from '@/state/app';
import { useLiveStacks } from '@/state/stacks';
import { colors, radius, space, type } from '@/theme';

import { airingNow, blackedOut, FutureTag, mediaFor, ProgramTag, useProgramReminder, watchableNow } from './channel';
import { PlaybackGate, VpnBlocked } from './player/Gates';
import { StageOverlay } from './player/Stage';
import { VideoStage } from './player/VideoStage';
import { AccessBadge, Button, Icon, Label } from './ui';

const M = 60_000;
const SLOT = 30 * M;
const minutes = (p: Program) => Math.round((p.end - p.start) / M);
const lengthLabel = (min: number) => (min >= 60 ? `${Math.floor(min / 60)}h${min % 60 ? ` ${min % 60}m` : ''}` : `${min}m`);

export function ChannelsView({ channelId, onSelect }: { channelId?: string; onSelect: (id: string) => void }) {
  const now = useTick(15_000);
  const ch = channelById(channelId ?? '') ?? channels[0];
  const current = programAt(ch.id, now);
  if (!current) return null;
  return (
    <View>
      <ChannelStrip now={now} active={ch.id} onSelect={onSelect} />
      {/* Remounts when the channel changes or the next programme starts (access is checked per programme). */}
      <ChannelPlayer key={`${ch.id}:${current.id}`} ch={ch} p={current} onSwitch={onSelect} />
      <View style={{ paddingHorizontal: space.gutter }}>
        <NowInfo ch={ch} p={current} now={now} />
        <UpNextList ch={ch} now={now} />
        <AboutChannels />
      </View>
      <ChannelGuide now={now} active={ch.id} onSelect={onSelect} />
    </View>
  );
}

function ChannelStrip({ now, active, onSelect }: { now: number; active: string; onSelect: (id: string) => void }) {
  return (
    <View style={styles.strip}>
      <Text style={[type.label, { color: 'rgba(242,242,243,0.8)', marginBottom: 12, paddingHorizontal: space.gutter }]}>Channels · 24/7</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: space.gutter }} accessibilityRole="tablist">
        {channels.map((ch) => (
          <ChannelChip key={ch.id} ch={ch} now={now} on={ch.id === active} onPress={() => onSelect(ch.id)} />
        ))}
      </ScrollView>
    </View>
  );
}

function ChannelNumber({ ch, on }: { ch: LinearChannel; on?: boolean }) {
  return (
    <View style={[styles.chNum, on && { borderColor: colors.gold }]} accessibilityLabel={`Channel ${ch.number}`}>
      <Text style={[type.tnum, { color: on ? colors.goldStrong : colors.text, fontSize: 12, fontWeight: '900' }]}>{ch.number}</Text>
    </View>
  );
}

function ChannelChip({ ch, now, on, onPress }: { ch: LinearChannel; now: number; on: boolean; onPress: () => void }) {
  const { state } = useApp();
  const p = programAt(ch.id, now);
  if (!p) return null;
  const a = airingNow(p, state);
  const pct = Math.min(1, Math.max(0, (now - p.start) / (p.end - p.start)));
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: on }}
      style={[styles.chip, on && (a.mode === 'onair' ? { borderColor: 'rgba(229,72,77,0.8)', backgroundColor: 'rgba(229,72,77,0.1)' } : { borderColor: colors.gold, backgroundColor: colors.goldDim })]}>
      <View style={styles.inline}>
        <ChannelNumber ch={ch} />
        <Text style={[type.h3, { flex: 1 }]} numberOfLines={1}>
          {ch.name}
        </Text>
        <AccessBadge access={p.access} live={a.mode === 'onair'} locked={!watchableNow(ch, now, state)} />
      </View>
      <View style={[styles.inline, { marginTop: 8 }]}>
        <ProgramTag p={p} a={a} />
        <Text style={[type.small, { flex: 1 }]} numberOfLines={1}>
          {p.title}
        </Text>
      </View>
      <View style={styles.bar}>
        <View style={[styles.barFill, { width: `${pct * 100}%`, backgroundColor: a.mode === 'onair' ? colors.live : colors.gold }]} />
      </View>
    </Pressable>
  );
}

function ChannelPlayer({ ch, p, onSwitch }: { ch: LinearChannel; p: Program; onSwitch: (id: string) => void }) {
  const { state, openSheet } = useApp();
  const now = useTick(1000);
  const a = airingNow(p, state);
  const onAir = a.mode === 'onair';
  const ref = p.dayId ? dayById(p.dayId) : undefined;
  const hasData = !!ref && a.mode !== 'standby';
  const seatBase = useMemo(() => (p.dayId ? seatsFor(p.dayId) : []), [p.dayId]);
  const stacks = useLiveStacks(seatBase, onAir);
  const hand = useMemo(() => (p.dayId ? handFor(p.dayId) : undefined), [p.dayId]);
  const bb = p.dayId ? bbFor(p.dayId) : undefined;
  const [previewDone, setPreviewDone] = useState(false);

  // Order of checks: rights (blackout) → VPN → standby (free highlights) → membership for this programme.
  const gate = gateForAccess(p.access, state, onAir);
  const required = requiredTier(p.access, state.includedFrom, onAir);
  const blocked = blackedOut(p, state) ? 'blackout' : state.vpnDetected ? 'vpn' : a.mode === 'standby' ? null : gate !== 'ok' ? gate : null;
  const previewing = blocked === 'plans' && !previewDone;
  const next = upNext(ch.id, now, 1)[0];
  const alt = blocked && blocked !== 'vpn' && !previewing ? channels.find((c) => c.id !== ch.id && watchableNow(c, now, state)) : undefined;
  const altProg = alt ? programAt(alt.id, now) : undefined;
  const m = mediaFor(p);
  const pct = Math.min(1, Math.max(0, (now - p.start) / (p.end - p.start)));
  const info = ref
    ? { event: shortEvent(ref.event.name), day: ref.day.label, level: onAir && ref.day.label === 'Final Table' ? ref.event.level : undefined, blinds: bb ? { sb: bb / 2, bb, ante: bb } : undefined, left: onAir && ref.day.label === 'Final Table' ? ref.event.remaining : undefined }
    : undefined;

  const picture = () => {
    if (blocked === 'blackout')
      return (
        <View style={styles.hold}>
          <Icon name="globe" color={colors.gold} />
          <Text style={[type.label, { color: colors.gold }]}>Not available in your region</Text>
          <Text style={styles.holdTitle}>{p.title} is blacked out where you are</Text>
          <Text style={styles.holdBody}>
            Broadcast rights for this event don&apos;t cover your location.{next ? ` ${ch.name} returns with ${next.title} at ${fmtTime(next.start, state.tz)}.` : ''}
          </Text>
        </View>
      );
    if (blocked === 'vpn') return <VpnBlocked />;
    if (blocked && !previewing) return <PlaybackGate gate={blocked} required={required} returnTo="/live" />;
    if (a.mode === 'standby') {
      const title = `${shortEvent(ref!.event.name)} coverage`;
      return (
        <View style={styles.hold}>
          <Label color={colors.delayed} bg="transparent">
            STAND BY
          </Label>
          <Text style={styles.holdTitle}>{a.reason === 'late' ? `${title} is starting late` : a.reason === 'interrupted' ? `${title} is temporarily off air` : `${title} starts shortly`}</Text>
          <Text style={styles.holdBody}>{ch.name} is showing highlights in the meantime — stay on the channel and it picks the coverage back up.</Text>
        </View>
      );
    }
    return (
      <VideoStage
        url={m.video}
        start={m.start}
        poster={m.poster}
        live={onAir}
        preview={previewing}
        onPreviewEnd={() => {
          setPreviewDone(true);
          openSheet({ kind: 'plans', required, title: p.title, returnTo: '/live' });
        }}
        overlay={
          <>
            {hasData && hand && <StageOverlay overlay={state.overlayDefault} seats={stacks} phase={Math.floor(now / 6000) % 3} info={info} hand={hand} />}
            <View style={styles.bug} pointerEvents="none">
              <Label>{`CH ${ch.number} · ${ch.short}`}</Label>
              <ProgramTag p={p} a={a} />
            </View>
          </>
        }
      />
    );
  };

  return (
    <View>
      <View style={[styles.player, blocked && !previewing ? { minHeight: 300 } : { aspectRatio: 16 / 9 }]}>{picture()}</View>
      {(!blocked || previewing) && (
        // Programme progress: where the channel is in this slot (not seekable).
        <View style={styles.progressRow}>
          <Text style={[type.caption, type.tnum]}>{fmtTime(p.start, state.tz)}</Text>
          <View style={[styles.bar, { flex: 1, marginTop: 0 }]} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }}>
            <View style={[styles.barFill, { width: `${pct * 100}%`, backgroundColor: onAir ? colors.live : colors.gold }]} />
          </View>
          <Text style={[type.caption, type.tnum]}>{fmtTime(p.end, state.tz)}</Text>
        </View>
      )}
      {(!blocked || previewing) && (
        <View style={[styles.inline, { paddingHorizontal: space.gutter, marginTop: 8 }]}>
          <Button size="sm" variant="secondary" title="CH−" onPress={() => onSwitch(channels[(channels.indexOf(ch) - 1 + channels.length) % channels.length].id)} accessibilityLabel="Previous channel" />
          <Button size="sm" variant="secondary" title="CH+" onPress={() => onSwitch(channels[(channels.indexOf(ch) + 1) % channels.length].id)} accessibilityLabel="Next channel" />
          <Text style={[type.small, { flex: 1 }]} numberOfLines={1}>
            <Text style={{ color: colors.text, fontWeight: '700' }}>{onAir ? (a.status === 'delayed' ? `Live · ${a.delayMin} min delay` : 'Live') : a.mode === 'standby' ? 'Standing by' : 'On now'}</Text> · ends {relative(p.end, now)}
          </Text>
        </View>
      )}
      {/* Locked or blacked out: point to a channel this viewer can watch right now. */}
      {alt && altProg && (
        <View style={styles.alt}>
          <AccessBadge access={altProg.access} size="md" />
          <Text style={[type.small, { color: colors.text }]}>
            <Text style={{ fontWeight: '800' }}>On {alt.name} now:</Text> {altProg.title} <Text style={{ color: colors.muted }}>— you can watch this one</Text>
          </Text>
          <Button size="sm" variant="outline" title={`Switch to CH ${alt.number}`} onPress={() => onSwitch(alt.id)} />
        </View>
      )}
    </View>
  );
}

function NowInfo({ ch, p, now }: { ch: LinearChannel; p: Program; now: number }) {
  const { state } = useApp();
  const a = airingNow(p, state);
  const ref = p.dayId ? dayById(p.dayId) : undefined;
  const live = a.mode === 'onair';
  const encore = p.kind === 'live' && a.mode === 'program';
  return (
    <View style={styles.now}>
      <View style={[styles.inline, { flexWrap: 'wrap' }]}>
        <Text style={[type.label, { color: 'rgba(242,242,243,0.8)' }]}>
          CH {ch.number} · {ch.name}
        </Text>
        <ProgramTag p={p} a={a} />
        <AccessBadge access={p.access} live={live} locked={!watchableNow(ch, now, state)} />
      </View>
      <Text style={[type.small, type.tnum, { marginTop: 6 }]}>
        Now · {fmtTime(p.start, state.tz)} – {fmtTime(p.end, state.tz)} {tzAbbr(state.tz, p.start)} · ends {relative(p.end, now)}
      </Text>
      <Text style={styles.nowTitle}>
        {p.title}
        {encore && <Text style={{ color: colors.muted }}> · Encore</Text>}
      </Text>
      <Text style={[type.small, { marginTop: 4 }]}>
        {p.subtitle}
        {live && a.delayMin ? ` · airs ${a.delayMin} min behind the tournament floor` : ''}
      </Text>
      <View style={[styles.inline, { flexWrap: 'wrap', marginTop: 14 }]}>
        {ref && live && <Button size="sm" variant="primary" icon="layers" title="All tables & multiview" onPress={() => router.push({ pathname: '/watch/[dayId]', params: { dayId: ref.day.id } })} />}
        {ref && <Button size="sm" variant="secondary" icon="history" title="Watch from the start" onPress={() => router.push({ pathname: '/watch/[dayId]', params: { dayId: ref.day.id, t: '0' } })} />}
        {p.archiveId && <Button size="sm" variant="secondary" title="Full version in Archive" onPress={() => router.push('/archive')} />}
        {ref && (
          <Pressable onPress={() => router.push({ pathname: '/events/[id]', params: { id: ref.event.id } })} accessibilityRole="link">
            <Text style={[type.small, { fontWeight: '700' }]}>Event #{ref.event.number} details →</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function UpNextList({ ch, now }: { ch: LinearChannel; now: number }) {
  const { state } = useApp();
  const reminder = useProgramReminder();
  return (
    <View style={{ marginTop: 24 }}>
      <Text style={[type.label, { color: 'rgba(242,242,243,0.8)', marginBottom: 12 }]}>Next on {ch.short}</Text>
      <View style={{ gap: 8 }}>
        {upNext(ch.id, now, 6).map((p) => {
          const on = reminder.isOn(p);
          return (
            <View key={p.id} style={styles.next}>
              <Text style={[type.h3, type.tnum, { width: 72, fontSize: 14 }]}>{fmtTime(p.start, state.tz)}</Text>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[type.body, { fontWeight: '700' }]} numberOfLines={1}>
                  {p.title}
                </Text>
                <View style={[styles.inline, { marginTop: 4 }]}>
                  <FutureTag p={p} />
                  <AccessBadge access={p.access} live={p.kind === 'live'} locked={gateForAccess(p.access, state, p.kind === 'live') !== 'ok'} />
                  <Text style={[type.caption, type.tnum]}>{lengthLabel(minutes(p))}</Text>
                </View>
              </View>
              <Pressable
                onPress={() => reminder.toggle(p, ch)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={on ? `Reminder set for ${p.title}` : `Remind me about ${p.title}`}
                style={[styles.bell, on && { borderColor: colors.gold, backgroundColor: colors.goldDim }]}>
                <Icon name="bell" size={16} color={on ? colors.goldStrong : colors.muted} />
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function AboutChannels() {
  return (
    <View style={styles.about}>
      <Text style={[type.label, { color: colors.gold, marginBottom: 8 }]}>How channels work</Text>
      {[
        'Each channel runs 24/7 on a fixed schedule — no rewind. To start over, open the broadcast.',
        'Studio, highlight and classic programmes are free to watch.',
        'Live and replay programmes need the same membership as the broadcast they carry.',
        'Live coverage airs on the feature-table delay. If it starts late or drops out, the channel stays on with highlights.',
        'Programmes without rights in your region are blacked out; the channel continues after them.',
      ].map((t) => (
        <Text key={t} style={[type.small, { marginTop: 4, lineHeight: 18 }]}>
          · {t}
        </Text>
      ))}
    </View>
  );
}

// ---- programme guide (EPG) -------------------------------------------------------------------------

const PPM = 3; // pixels per minute
const GUIDE_HOURS = 8;
const CH_COL = 112;

function ChannelGuide({ now, active, onSelect }: { now: number; active: string; onSelect: (id: string) => void }) {
  const { state } = useApp();
  const start = Math.floor((now - 30 * M) / SLOT) * SLOT;
  const end = start + GUIDE_HOURS * 60 * M;
  const width = ((end - start) / M) * PPM;
  const x = (t: number) => ((Math.max(start, Math.min(end, t)) - start) / M) * PPM;
  const ticks = Array.from({ length: GUIDE_HOURS * 2 }, (_, i) => start + i * SLOT);
  return (
    <View style={{ marginTop: 32 }}>
      <View style={{ paddingHorizontal: space.gutter, marginBottom: 12 }}>
        <Text style={[type.label, { color: colors.gold }]}>All channels · next 8 hours</Text>
        <Text style={[type.h2, { marginTop: 4 }]}>Channel guide</Text>
        <Text style={[type.small, { marginTop: 4 }]}>Your time ({tzAbbr(state.tz)}) · select a programme on now to switch, a later one for a reminder</Text>
      </View>
      <View style={styles.guide}>
        {/* channel column */}
        <View style={{ width: CH_COL, borderRightWidth: 1, borderRightColor: colors.line }}>
          <View style={[styles.guideHead, { paddingHorizontal: 10, justifyContent: 'center' }]}>
            <Text style={[type.caption, { fontWeight: '700' }]}>{fmtDate(now, state.tz)}</Text>
          </View>
          {channels.map((ch) => (
            <Pressable key={ch.id} onPress={() => onSelect(ch.id)} accessibilityRole="button" style={[styles.guideCh, ch.id === active && { backgroundColor: colors.surface3 }]}>
              <ChannelNumber ch={ch} on={ch.id === active} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[type.small, { color: colors.text, fontWeight: '700' }]} numberOfLines={1}>
                  {ch.name}
                </Text>
                <Text style={[type.caption]} numberOfLines={1}>
                  {ch.free ? 'Free · 24/7' : ch.lang === 'ES' ? 'Español' : 'English'}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ width }}>
            <View style={styles.guideHead}>
              {ticks.map((t) => (
                <Text key={t} style={[styles.tick, type.tnum, { left: x(t) }]}>
                  {fmtTime(t, state.tz)}
                </Text>
              ))}
              <NowLine left={x(now)} />
            </View>
            {channels.map((ch) => (
              <View key={ch.id} style={styles.guideRow}>
                {programsFor(ch.id)
                  .filter((p) => p.end > start && p.start < end)
                  .map((p) => (
                    <GuideBlock key={p.id} ch={ch} p={p} now={now} left={x(p.start)} width={x(p.end) - x(p.start)} onSelect={onSelect} />
                  ))}
                <NowLine left={x(now)} />
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

function NowLine({ left }: { left: number }) {
  return <View pointerEvents="none" style={[styles.nowLine, { left }]} />;
}

function GuideBlock({ ch, p, now, left, width, onSelect }: { ch: LinearChannel; p: Program; now: number; left: number; width: number; onSelect: (id: string) => void }) {
  const { state, toast } = useApp();
  const reminder = useProgramReminder();
  const isNow = p.start <= now && now < p.end;
  const past = p.end <= now;
  const a = airingNow(p, state);
  const onPress = () => {
    if (isNow) return onSelect(ch.id);
    if (!past) return reminder.toggle(p, ch);
    if (p.dayId) return router.push({ pathname: '/watch/[dayId]', params: { dayId: p.dayId } });
    if (p.archiveId) return router.push('/archive');
    toast(`${p.title} has finished — see what's on next in the guide`);
  };
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${p.title} · ${fmtTime(p.start, state.tz)}–${fmtTime(p.end, state.tz)}`}
      style={[
        styles.block,
        { left: left + 2, width: Math.max(0, width - 4) },
        isNow && { borderColor: colors.gold, backgroundColor: colors.goldDim },
        past && { opacity: 0.55 },
        p.kind === 'live' && { borderLeftWidth: 3, borderLeftColor: colors.live },
      ]}>
      <Text style={[type.small, { color: colors.text, fontWeight: '700' }]} numberOfLines={1}>
        {p.title}
      </Text>
      <View style={[styles.inline, { marginTop: 4, overflow: 'hidden' }]}>
        <Text style={[type.caption, type.tnum]}>{fmtTime(p.start, state.tz)}</Text>
        {width > 150 && (isNow ? <ProgramTag p={p} a={a} /> : <FutureTag p={p} />)}
        {reminder.isOn(p) && <Icon name="bell" size={12} color={colors.gold} />}
      </View>
    </Pressable>
  );
}


const styles = StyleSheet.create({
  inline: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  strip: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.line, backgroundColor: 'rgba(19,20,24,0.6)' },
  chip: { width: 256, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, paddingHorizontal: 14, paddingVertical: 12 },
  chNum: { width: 28, height: 28, borderRadius: 6, borderWidth: 1, borderColor: colors.lineStrong, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  bar: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)', marginTop: 8, overflow: 'hidden' },
  barFill: { height: 4, borderRadius: 2 },
  player: { width: '100%', backgroundColor: '#000', overflow: 'hidden' },
  bug: { position: 'absolute', top: 8, left: 8, flexDirection: 'row', gap: 6 },
  hold: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, backgroundColor: '#14161b' },
  holdTitle: { color: colors.text, fontSize: 17, fontWeight: '800', textAlign: 'center' },
  holdBody: { color: colors.muted, fontSize: 12.5, textAlign: 'center', lineHeight: 18, maxWidth: 360 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: space.gutter, paddingTop: 10 },
  alt: { margin: space.gutter, marginBottom: 0, padding: 12, gap: 8, borderRadius: radius.card, borderWidth: 1, borderColor: 'rgba(76,195,138,0.4)', backgroundColor: colors.surface },
  now: { marginTop: 16, padding: 16, borderRadius: radius.panel, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  nowTitle: { color: colors.text, fontSize: 22, fontWeight: '900', letterSpacing: -0.4, marginTop: 6 },
  next: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, padding: 12 },
  bell: { width: 36, height: 36, borderRadius: radius.chip, borderWidth: 1, borderColor: colors.lineStrong, alignItems: 'center', justifyContent: 'center' },
  about: { marginTop: 24, padding: 16, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  guide: { flexDirection: 'row', marginHorizontal: space.gutter, borderRadius: radius.panel, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, overflow: 'hidden' },
  guideHead: { height: 34, borderBottomWidth: 1, borderBottomColor: colors.line },
  tick: { position: 'absolute', top: 9, paddingLeft: 5, color: colors.muted, fontSize: 11, borderLeftWidth: 1, borderLeftColor: 'rgba(42,45,52,0.7)', height: 34 },
  guideCh: { height: 76, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: colors.line },
  guideRow: { height: 76, borderBottomWidth: 1, borderBottomColor: colors.line },
  block: { position: 'absolute', top: 6, bottom: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface2, paddingHorizontal: 10, paddingVertical: 6, overflow: 'hidden' },
  nowLine: { position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: colors.live },
});
