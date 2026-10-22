// Watchlist row: one saved item rendered by type (web demo MyList ItemRow).
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { scheduleById } from '@/data/schedules';
import { seriesById } from '@/data/series';
import type { MyListItem } from '@/data/types';
import { playerById, vodById } from '@/data/vods';
import { statusOf } from '@/lib/access';
import { fmtDateTime, fmtDuration, fmtSeriesDates } from '@/lib/time';
import { useApp, useNow } from '@/state/app';
import { colors, space, type } from '@/theme';

import { Art, Avatar, Icon, TierBadge } from './ui';

export function WatchlistRow({ item, removable }: { item: MyListItem; removable?: boolean }) {
  const { tz, toggleMyList, toast } = useApp();
  const now = useNow(30_000);
  let thumb = null;
  let title = '';
  let sub = '';
  let tier = null;
  let open = () => {};

  if (item.kind === 'vod') {
    const v = vodById(item.id);
    if (!v) return null;
    thumb = <Art hue={(seriesById(v.seriesId)?.hue ?? 200) + 20} style={styles.thumb} />;
    title = v.title;
    sub = `Video · ${fmtDuration(v.durationSec)}`;
    tier = v.tier;
    open = () => router.push({ pathname: '/vod/[id]', params: { id: v.id } });
  } else if (item.kind === 'live') {
    const s = scheduleById(item.id);
    if (!s) return null;
    const st = statusOf(s, now);
    thumb = <Art hue={seriesById(s.seriesId)?.hue ?? 200} style={styles.thumb} />;
    title = s.title;
    sub = `${st === 'live' ? '● LIVE now' : st === 'ended' ? 'Ended · replay' : `Live · ${fmtDateTime(s.start, tz)}`} · ${s.lang}`;
    tier = s.tier;
    open = () => (st === 'ended' && s.vodId ? router.push({ pathname: '/vod/[id]', params: { id: s.vodId } }) : router.push({ pathname: '/live/[id]', params: { id: s.id } }));
  } else if (item.kind === 'player') {
    const p = playerById(item.id);
    if (!p) return null;
    thumb = (
      <View style={[styles.thumb, { alignItems: 'center', justifyContent: 'center' }]}>
        <Avatar name={p.name} hue={p.hue} size={40} />
      </View>
    );
    title = p.name;
    sub = `Player · ${p.flag} ${p.country}`;
    open = () => router.push({ pathname: '/player/[id]', params: { id: p.id } });
  } else {
    const se = seriesById(item.id);
    if (!se) return null;
    thumb = <Art hue={se.hue} style={styles.thumb} />;
    title = se.name;
    sub = `Tournament · ${fmtSeriesDates(se.start, se.end)}`;
    open = () => router.push({ pathname: '/tournaments/[id]', params: { id: se.id } });
  }

  return (
    <View style={styles.row}>
      <Pressable style={styles.open} onPress={open} accessibilityRole="button" accessibilityLabel={title}>
        {thumb}
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={[type.body, { fontWeight: '700' }]} numberOfLines={2}>
            {title}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={type.small} numberOfLines={1}>
              {sub}
            </Text>
            {tier && <TierBadge tier={tier} />}
          </View>
        </View>
      </Pressable>
      {removable && (
        <Pressable
          onPress={() => {
            toggleMyList(item.kind, item.id);
            toast('Removed from Watchlist');
          }}
          accessibilityRole="button"
          accessibilityLabel="Remove from Watchlist"
          style={styles.remove}>
          <Icon name="close" size={18} color={colors.muted} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.gutter, paddingVertical: 8, gap: 8 },
  open: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 96, aspectRatio: 16 / 9, borderRadius: 8 },
  remove: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});
