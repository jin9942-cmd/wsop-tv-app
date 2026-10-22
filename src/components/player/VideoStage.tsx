// The picture: CC poker footage on expo-video (native controls: play / pause / seek / full screen / PiP), the
// broadcast graphics on top, and the app-only 10-second preview. If the footage can't play, the still stays with a
// simulated progress bar. Landscape uses expo-video's own full screen (no orientation lock).
import { useEvent, useEventListener } from 'expo';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { PREVIEW_SECONDS } from '@/data/policy';
import { duration } from '@/lib/format';
import { colors, type } from '@/theme';

import { Icon } from '../ui';

export function VideoStage({
  url,
  start = 0,
  poster,
  overlay,
  preview,
  onPreviewEnd,
  onPosition,
  live,
}: {
  url: string;
  /** Seconds into the footage to start from. */
  start?: number;
  poster: number;
  /** Broadcast graphics and badges drawn over the picture (not touchable). */
  overlay?: ReactNode;
  /** App-only: play a 10-second preview, then call onPreviewEnd. */
  preview?: boolean;
  onPreviewEnd?: () => void;
  /** Footage position in seconds (replays: Continue Watching). */
  onPosition?: (sec: number, len: number) => void;
  live?: boolean;
}) {
  const player = useVideoPlayer(url, (p) => {
    p.loop = true;
    // Browsers block unmuted autoplay; viewers unmute from the controls.
    p.muted = Platform.OS === 'web';
    p.timeUpdateEventInterval = 1;
  });
  const { status } = useEvent(player, 'statusChange', { status: player.status });
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const failed = status === 'error';
  const [fakePaused, setFakePaused] = useState(false);
  const [fakePos, setFakePos] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const ended = !!preview && elapsed >= PREVIEW_SECONDS;
  const playing = failed ? !fakePaused && !ended : isPlaying;
  const told = useRef(false);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      if (preview) setElapsed((e) => Math.min(PREVIEW_SECONDS, e + 1));
      if (failed) setFakePos((p) => p + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [playing, preview, failed]);

  useEffect(() => {
    if (!ended || told.current) return;
    told.current = true;
    if (!failed) player.pause();
    onPreviewEnd?.();
  }, [ended, failed, player, onPreviewEnd]);

  // Start from the right point once the footage has loaded (browsers ignore play() before that).
  const started = useRef(false);
  useEventListener(player, 'statusChange', ({ status: s }) => {
    if (s !== 'readyToPlay' || started.current) return;
    started.current = true;
    if (start) player.seekBy(start);
    player.play();
  });

  useEventListener(player, 'timeUpdate', ({ currentTime }) => onPosition?.(currentTime, player.duration));

  return (
    <View style={styles.stage}>
      {!failed && !ended && (
        <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls fullscreenOptions={{ enable: true }} allowsPictureInPicture startsPictureInPictureAutomatically />
      )}
      {/* The still covers the picture until the footage plays (no black frame while it loads). */}
      {(failed || ended || (!isPlaying && status !== 'readyToPlay')) && <Image source={poster} style={StyleSheet.absoluteFill} contentFit="cover" pointerEvents="none" />}
      {overlay}
      {failed && !ended && (
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setFakePaused((p) => !p)} accessibilityRole="button" accessibilityLabel={playing ? 'Pause' : 'Play'}>
          <View style={styles.fakeBar}>
            <Icon name={playing ? 'pause' : 'play'} size={20} />
            <View style={styles.track}>
              <View style={[styles.trackFill, { width: live ? '100%' : `${(fakePos % 600) / 6}%` }]} />
            </View>
            <Text style={[styles.time, type.tnum]}>{live ? '● LIVE' : duration(fakePos % 600)}</Text>
          </View>
          <Text style={styles.simulated}>SIMULATED PLAYBACK</Text>
        </Pressable>
      )}
      {preview && !ended && (
        <View style={styles.previewBar} pointerEvents="none" accessibilityLabel="Preview">
          <Text style={styles.previewText}>Preview · {PREVIEW_SECONDS - elapsed}s left</Text>
          <View style={styles.previewTrack}>
            <View style={[styles.previewFill, { width: `${(elapsed / PREVIEW_SECONDS) * 100}%` }]} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { ...StyleSheet.absoluteFill, backgroundColor: '#000' },
  fakeBar: { position: 'absolute', left: 10, right: 10, bottom: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  track: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.25)' },
  trackFill: { height: 3, borderRadius: 2, backgroundColor: colors.gold },
  time: { color: colors.text, fontSize: 12, fontWeight: '700' },
  simulated: { position: 'absolute', top: 8, right: 8, color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  previewBar: { position: 'absolute', left: 10, right: 10, top: 40, padding: 8, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.7)' },
  previewText: { color: colors.text, fontSize: 12, fontWeight: '700', marginBottom: 6 },
  previewTrack: { height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)' },
  previewFill: { height: 3, borderRadius: 2, backgroundColor: colors.gold },
});
