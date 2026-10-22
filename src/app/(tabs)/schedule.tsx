// Schedule (web demo SCR-03). Upcoming → reminder, LIVE → player, Ended → replay. Times in the display time zone.
import { useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ScheduleRow } from '@/components/cards';
import { AppHeader } from '@/components/headers';
import { Chip, Empty, Seg } from '@/components/ui';
import { outputChannels, schedules } from '@/data/schedules';
import { series } from '@/data/series';
import { schedulesOnDay } from '@/lib/access';
import { addDays, dateKey, fmtKey, tzAbbr, tzCity } from '@/lib/time';
import { useApp, useNow } from '@/state/app';
import { colors, space } from '@/theme';

const OFFSETS = ['-1', '0', '1', '2', '3'] as const;
const LANGS = ['EN', 'ES', 'PT'];

export default function ScheduleScreen() {
  const { tz } = useApp();
  const now = useNow(1000);
  const today = dateKey(now, tz);
  const [offset, setOffset] = useState<(typeof OFFSETS)[number]>('0');
  const [seriesId, setSeriesId] = useState('');
  const [channel, setChannel] = useState('');
  const [lang, setLang] = useState('');
  const day = addDays(today, Number(offset));
  const list = schedulesOnDay(schedules, day, tz).filter((s) => (!seriesId || s.seriesId === seriesId) && (!channel || s.channelId === channel) && (!lang || s.lang === lang));
  const label = (o: string) => (o === '0' ? 'Today' : o === '1' ? 'Tomorrow' : o === '-1' ? 'Yesterday' : fmtKey(addDays(today, Number(o))).split(', ')[1]);

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      data={list}
      keyExtractor={(s) => s.id}
      renderItem={({ item }) => <ScheduleRow s={item} now={now} />}
      ListHeaderComponent={
        <>
          <AppHeader title="Schedule" />
          <Seg value={offset} options={OFFSETS} label={label} onChange={setOffset} />
          <Filters label="Tournament" value={seriesId} onChange={setSeriesId} options={series.map((x) => ({ v: x.id, l: x.name.replace('2026 ', '') }))} all="All tournaments" />
          <Filters label="Channel" value={channel} onChange={setChannel} options={outputChannels.map((c) => ({ v: c.id, l: c.id }))} all="All channels" />
          <Filters label="Language" value={lang} onChange={setLang} options={LANGS.map((l) => ({ v: l, l }))} all="All languages" />
          <Text style={styles.tz}>
            Times in {tzCity(tz)} ({tzAbbr(tz)})
          </Text>
        </>
      }
      ListEmptyComponent={<Empty text="No broadcasts match these filters." />}
      contentContainerStyle={{ paddingBottom: 24 }}
    />
  );
}

function Filters({ label, value, onChange, options, all }: { label: string; value: string; onChange: (v: string) => void; options: { v: string; l: string }[]; all: string }) {
  return (
    <View accessibilityLabel={label}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label={all} on={!value} onPress={() => onChange('')} />
        {options.map((o) => (
          <Chip key={o.v} label={o.l} on={value === o.v} onPress={() => onChange(o.v)} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { gap: 8, paddingHorizontal: space.gutter, paddingBottom: 8 },
  tz: { color: colors.subtle, fontSize: 12, paddingHorizontal: space.gutter, paddingVertical: 6 },
});
