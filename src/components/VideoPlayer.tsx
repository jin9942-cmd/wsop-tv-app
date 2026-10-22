// Player (web demo MockPlayer) on expo-video. Access rules:
//  guest → GGPass login sheet · tier too low → 10-second preview, then the WSOP+ subscribe sheet · subscribing resumes playback.
// Landscape uses expo-video's own full screen (no orientation lock). PiP is enabled.
// If the test stream can't play (e.g. no HLS support in the browser), it falls back to artwork with a simulated progress bar.
import { useEvent, useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Tier } from '@/data/types';
import { PREVIEW_SECONDS, type Access } from '@/lib/access';
import { TEST_STREAM_NOTE, TEST_STREAM_URL } from '@/lib/media';
import { fmtDuration } from '@/lib/time';
import { useApp } from '@/state/app';
import { colors } from '@/theme';

import { Art, Corner, Icon, LiveBadge, Pill } from './ui';

export interface PlayerProps {
  access: Access;
  /** Tier the subscribe sheet asks for. */
  tier: Tier;
  contentTitle: string;
  hue: number;
  label: string;
  sub?: string;
  live?: boolean;
  viewers?: string;
  /** VOD: fraction to resume from. */
  resumeAt?: number;
  /** VOD: reports watched fraction (Continue Watching). */
  onProgress?: (fraction: number) => void;
}

export function VideoPlayer(props: PlayerProps) {
  const { access, tier, contentTitle } = props;
  const { openSheet } = useApp();
  const player = useVideoPlayer(TEST_STREAM_URL, (p) => {
    p.loop = true;
    // Browsers block unmuted autoplay; viewers unmute from the controls.
    p.muted = Platform.OS === 'web';
    p.timeUpdateEventInterval = 1;
  });
  const { status } = useEvent(player, 'statusChange', { status: player.status });
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const failed = status === 'error';

  const [elapsed, setElapsed] = useState(0);
  const previewEnded = access === 'preview' && elapsed >= PREVIEW_SECONDS;
  const canPlay = access === 'ok' || (access === 'preview' && !previewEnded);

  // Simulated playback for the fallback (no stream): plays whenever allowed, unless the viewer paused it.
  const [fakePaused, setFakePaused] = useState(false);
  const [fakePos, setFakePos] = useState(0);
  const fakePlaying = failed && canPlay && !fakePaused;
  const playing = failed ? fakePlaying : isPlaying;

  const askedLogin = useRef(false);
  const shownPaywall = useRef(false);

  // Opening content as a guest is a play intent → ask to log in straight away.
  useEffect(() => {
    if (access === 'login' && !askedLogin.current) {
      askedLogin.current = true;
      openSheet({ kind: 'login', reason: 'Log in to watch live tournaments and replays.' });
    }
  }, [access, openSheet]);

  // Start / stop with access (logging in or subscribing while here plays immediately).
  useEffect(() => {
    if (failed) return;
    if (canPlay) player.play();
    else player.pause();
  }, [canPlay, failed, player]);

  // Resume position for VOD, once the stream has loaded.
  const { resumeAt } = props;
  useEventListener(player, 'sourceLoad', ({ duration }) => {
    if (resumeAt && duration > 0) player.seekBy(duration * resumeAt);
  });

  // Preview countdown and the simulated progress bar tick while playing.
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      if (access === 'preview') setElapsed((e) => Math.min(PREVIEW_SECONDS, e + 1));
      if (failed) setFakePos((p) => p + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [playing, access, failed]);

  useEffect(() => {
    if (previewEnded && !shownPaywall.current) {
      shownPaywall.current = true;
      openSheet({ kind: 'paywall', tier, title: contentTitle });
    }
  }, [previewEnded, openSheet, tier, contentTitle]);

  const { onProgress } = props;
  const reported = useRef(0);
  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    if (!onProgress || access !== 'ok' || player.duration <= 0) return;
    const f = Math.min(0.99, currentTime / player.duration);
    // Report in 2% steps so Continue Watching doesn't re-render the app every second.
    if (Math.abs(f - reported.current) >= 0.02) {
      reported.current = f;
      onProgress(f);
    }
  });

  const locked = access === 'login' || previewEnded;
  const onLockedPress = () => (access === 'login' ? openSheet({ kind: 'login', reason: 'Log in to watch live tournaments and replays.' }) : openSheet({ kind: 'paywall', tier, title: contentTitle }));

  return (
    <View style={styles.wrap}>
      <View style={styles.stage}>
        {!failed && !locked && (
          <VideoView
            player={player}
            style={StyleSheet.absoluteFill}
            contentFit="contain"
            nativeControls
            fullscreenOptions={{ enable: true }}
            allowsPictureInPicture
            startsPictureInPictureAutomatically
          />
        )}

        {(failed || locked) && (
          <Art hue={props.hue} title={props.label} sub={props.sub} style={StyleSheet.absoluteFill}>
            {failed && !locked && (
              <Pressable style={StyleSheet.absoluteFill} onPress={() => setFakePaused((p) => !p)} accessibilityRole="button" accessibilityLabel={fakePlaying ? 'Pause' : 'Play'}>
                <View style={styles.fakeBar}>
                  <Icon name={fakePlaying ? 'pause' : 'play'} size={20} />
                  <View style={styles.track}>
                    <View style={[styles.trackFill, { width: props.live ? '100%' : `${(fakePos % 600) / 6}%` }]} />
                  </View>
                  <Text style={styles.time}>{props.live ? '● LIVE' : fmtDuration(fakePos % 600)}</Text>
                </View>
              </Pressable>
            )}
          </Art>
        )}

        {props.live && (
          <View style={styles.topLeft} pointerEvents="none">
            <LiveBadge />
            {props.viewers && <Pill>{props.viewers}</Pill>}
          </View>
        )}

        {access === 'preview' && !previewEnded && (
          <View style={styles.previewBar} pointerEvents="none" accessibilityLabel="Preview">
            <Text style={styles.previewText}>Preview · {PREVIEW_SECONDS - elapsed}s left</Text>
            <View style={styles.previewTrack}>
              <View style={[styles.previewFill, { width: `${(elapsed / PREVIEW_SECONDS) * 100}%` }]} />
            </View>
          </View>
        )}

        {locked && (
          <Pressable style={styles.lockLayer} onPress={onLockedPress} accessibilityRole="button" accessibilityLabel={access === 'login' ? 'Log in to watch' : 'Subscribe to keep watching'}>
            <View style={styles.lockCircle}>
              <Icon name="lock" size={24} />
            </View>
            <Text style={styles.lockText}>{access === 'login' ? 'Log in to watch' : `Preview ended · WSOP+ ${tier === 'premium' ? 'Premium' : 'Basic'} required`}</Text>
          </Pressable>
        )}

        {failed && !locked && (
          <Corner at="tr">
            <Pill>Simulated playback</Pill>
          </Corner>
        )}
      </View>
      <Text style={styles.note}>{TEST_STREAM_NOTE}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: '#000' },
  stage: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000', overflow: 'hidden' },
  topLeft: { position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  previewBar: { position: 'absolute', left: 10, right: 10, top: 40, padding: 8, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.65)' },
  previewText: { color: colors.text, fontSize: 12, fontWeight: '700', marginBottom: 6 },
  previewTrack: { height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)' },
  previewFill: { height: 3, borderRadius: 2, backgroundColor: colors.gold },
  lockLayer: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: 'rgba(0,0,0,0.45)' },
  lockCircle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', borderWidth: 1, borderColor: colors.lineStrong },
  lockText: { color: colors.text, fontSize: 13, fontWeight: '700' },
  fakeBar: { position: 'absolute', left: 10, right: 10, bottom: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  track: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.25)' },
  trackFill: { height: 3, borderRadius: 2, backgroundColor: colors.gold },
  time: { color: colors.text, fontSize: 12, fontWeight: '700' },
  note: { color: colors.subtle, fontSize: 10.5, paddingHorizontal: 12, paddingVertical: 4, backgroundColor: colors.bg },
});
