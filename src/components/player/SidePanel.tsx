// Broadcast panel (web demo v2 features/player/SidePanel.tsx): Chip Counts / Current Hand / Tables.
// On phones it opens as a bottom sheet from "Chip counts & tables".
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { CurrentHand } from '@/data/hand';
import { playerById } from '@/data/mock';
import type { StreamStatus, TableFeed } from '@/data/types';
import { tableDelay, tableStatus } from '@/lib/broadcast';
import { chips } from '@/lib/format';
import { fmtTime } from '@/lib/time';
import { useApp } from '@/state/app';
import { EQUITY, type SeatStack } from '@/state/stacks';
import { colors, radius, type } from '@/theme';

import { Avatar, CountryCode, ErrorState, Icon, Spoiler, StatusBadge, Tabs } from '../ui';

type Tab = 'chips' | 'hand' | 'tables';

export function SidePanel({
  stacks,
  phase,
  tables,
  dayStatus,
  mainTable,
  onSelectTable,
  spoilerKey,
  bb,
  hand,
  live = true,
}: {
  stacks: SeatStack[];
  phase: number;
  tables: TableFeed[];
  dayStatus: StreamStatus;
  mainTable: string;
  onSelectTable: (id: string) => void;
  spoilerKey: string;
  bb?: number;
  hand: CurrentHand;
  live?: boolean;
}) {
  const [tab, setTab] = useState<Tab>('chips');
  return (
    <View style={{ flex: 1 }}>
      <Tabs<Tab>
        label="Panel"
        value={tab}
        onChange={setTab}
        tabs={[{ value: 'chips', label: 'Chip Counts' }, { value: 'hand', label: 'Current Hand' }, ...(live ? [{ value: 'tables' as Tab, label: 'Tables' }] : [])]}
      />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 12 }}>
        {tab === 'chips' && <ChipCounts stacks={stacks} spoilerKey={spoilerKey} bb={bb} live={live} />}
        {tab === 'hand' && <CurrentHandTab phase={phase} hand={hand} />}
        {tab === 'tables' && <Tables tables={tables} dayStatus={dayStatus} mainTable={mainTable} onSelect={onSelectTable} />}
      </ScrollView>
    </View>
  );
}

function ChipCounts({ stacks, spoilerKey, bb, live }: { stacks: SeatStack[]; spoilerKey: string; bb?: number; live?: boolean }) {
  const max = stacks[0]?.stack ?? 1;
  return (
    <View>
      <View style={styles.between}>
        <Text style={type.small}>{live ? `${stacks.length} players at the table` : 'Chip counts at this point of the replay'}</Text>
        {live && (
          <View style={styles.inline}>
            <View style={[styles.dot, { backgroundColor: colors.live }]} />
            <Text style={type.small}>Updating</Text>
          </View>
        )}
      </View>
      <Spoiler k={`${spoilerKey}-chips`} label="Chip standings hidden">
        <View style={{ gap: 6, marginTop: 8 }}>
          {stacks.map((s, i) => {
            const p = playerById(s.playerId);
            return (
              <View key={s.playerId} style={styles.chipRow}>
                <View style={[styles.chipBar, { width: `${(s.stack / max) * 100}%` }]} />
                <Text style={[type.small, type.tnum, { width: 16, color: colors.subtle, fontWeight: '800' }]}>{i + 1}</Text>
                <Avatar name={p.name} hue={p.hue} size={26} />
                <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                  <Text style={[type.small, { color: colors.text, fontWeight: '700' }]} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <CountryCode cc={p.cc} />
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[type.body, type.tnum, { fontWeight: '800' }]}>
                    {chips(s.stack)}
                    {bb ? <Text style={[type.small, { fontWeight: '700' }]}> {Math.round(s.stack / bb)} bb</Text> : null}
                  </Text>
                  {s.delta !== 0 && (
                    <Text style={[type.tnum, { fontSize: 11, color: s.delta > 0 ? colors.ok : colors.muted }]}>
                      {s.delta > 0 ? '▲' : '▼'} {chips(Math.abs(s.delta))}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </Spoiler>
    </View>
  );
}

function CurrentHandTab({ phase, hand }: { phase: number; hand: CurrentHand }) {
  const h = hand;
  const eq = EQUITY[phase];
  const a = playerById(h.a);
  const b = playerById(h.b);
  return (
    <View style={{ gap: 14 }}>
      <View style={styles.between}>
        <Text style={[type.label, { color: colors.gold }]}>Hand #{h.number}</Text>
        <Text style={type.small}>{eq.phase}</Text>
      </View>
      {[
        { p: a, cards: h.aCards, eq: eq.a },
        { p: b, cards: h.bCards, eq: eq.b },
      ].map((x) => (
        <View key={x.p.id} style={styles.seat}>
          <Avatar name={x.p.name} hue={x.p.hue} size={34} />
          <View style={{ flex: 1 }}>
            <Text style={[type.body, { fontWeight: '700' }]} numberOfLines={1}>
              {x.p.name}
            </Text>
            <Text style={[type.small, type.tnum, { color: colors.goldStrong }]}>{x.cards}</Text>
          </View>
          <Text style={[type.tnum, { color: colors.text, fontSize: 18, fontWeight: '900' }]}>{x.eq}%</Text>
        </View>
      ))}
      <View>
        <Text style={[type.label, { marginBottom: 6 }]}>Board</Text>
        <View style={styles.inline}>
          {h.board.map((c, i) => {
            const shown = i < (phase === 0 ? 3 : phase === 1 ? 4 : 5);
            return (
              <View key={c} style={[styles.boardCard, shown ? { backgroundColor: '#fff' } : { borderWidth: 1, borderStyle: 'dashed', borderColor: colors.lineStrong }]}>
                <Text style={[type.tnum, { fontWeight: '800', color: shown ? (c.includes('♥') || c.includes('♦') ? '#c0262d' : colors.ink) : 'transparent' }]}>{c}</Text>
              </View>
            );
          })}
        </View>
      </View>
      <View>
        <Text style={[type.label, { marginBottom: 6 }]}>
          Pot <Text style={[type.tnum, { color: colors.text }]}>{chips(h.pots[phase])}</Text>
        </Text>
        <View style={{ borderLeftWidth: 1, borderLeftColor: colors.line, paddingLeft: 12, gap: 4 }}>
          {h.actions.slice(0, 3 + phase).map((x) => (
            <Text key={x} style={type.small}>
              {x}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

function Tables({ tables, dayStatus, mainTable, onSelect }: { tables: TableFeed[]; dayStatus: StreamStatus; mainTable: string; onSelect: (id: string) => void }) {
  const { state } = useApp();
  const [recovered, setRecovered] = useState<string[]>([]);
  return (
    <View style={{ gap: 8 }}>
      {tables.map((t) => {
        const st = tableStatus(t, dayStatus);
        if (t.failing && !recovered.includes(t.id))
          return <ErrorState key={t.id} title={`${t.name}: feed unavailable`} body="The outer-table feed dropped. Other tables are unaffected." onRetry={() => setRecovered((r) => [...r, t.id])} />;
        const on = t.id === mainTable;
        return (
          <Pressable key={t.id} onPress={() => onSelect(t.id)} accessibilityRole="button" accessibilityState={{ selected: on }} style={[styles.table, on && { borderColor: colors.gold, backgroundColor: colors.goldDim }]}>
            <Icon name="tv" size={18} color={colors.muted} />
            <View style={{ flex: 1 }}>
              <Text style={[type.body, { fontWeight: '700' }]}>{t.name}</Text>
              <Text style={type.small}>
                {st === 'late' ? `Late start${t.expected ? ` · expected ${fmtTime(t.expected, state.tz)}` : ''}` : st === 'interrupted' ? 'Temporarily off air' : t.main ? 'Commentary · English / Spanish' : 'Natural sound'}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <StatusBadge status={st} delayMin={tableDelay(t, dayStatus) || 30} size="sm" />
              {on && <Text style={[type.label, { color: colors.gold, fontSize: 10 }]}>Main</Text>}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  chipRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: radius.chip, backgroundColor: colors.surface2, paddingHorizontal: 10, paddingVertical: 8, overflow: 'hidden' },
  chipBar: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: 'rgba(201,169,97,0.1)' },
  seat: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: radius.chip, backgroundColor: colors.surface2, padding: 10 },
  boardCard: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 4 },
  table: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: radius.chip, borderWidth: 1, borderColor: colors.line, padding: 12 },
});
