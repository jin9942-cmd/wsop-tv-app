// Broadcast graphics over the picture (web demo v2 features/player/Stage.tsx), laid out the way poker TV does it:
//  top right: event bug · bottom left: the two players in the hand (Pro adds hole cards and equity) ·
//  bottom right: pot (Pro adds the board) · Pro only, left: chip-count leaderboard in big blinds. Off = clean picture.
import { StyleSheet, Text, View } from 'react-native';

import type { CurrentHand } from '@/data/hand';
import { playerById } from '@/data/mock';
import type { OverlayLevel } from '@/data/types';
import { chips } from '@/lib/format';
import { EQUITY, type SeatStack } from '@/state/stacks';
import { colors, type } from '@/theme';

export interface StageInfo {
  event: string;
  day: string;
  level?: number;
  blinds?: { sb: number; bb: number; ante: number };
  left?: number;
}

const lastName = (id: string) => playerById(id).name.split(' ').slice(-1)[0];
const isRed = (c: string) => c.includes('♥') || c.includes('♦');

function Card({ c, md }: { c: string; md?: boolean }) {
  return (
    <View style={[styles.card, md ? { width: 18, height: 24 } : { width: 15, height: 20 }]}>
      <Text style={[styles.cardText, { color: isRed(c) ? '#c0262d' : colors.ink, fontSize: md ? 10 : 9 }]}>{c}</Text>
    </View>
  );
}

/** Overlay layer only — the picture (video or still) is drawn underneath by the player. */
export function StageOverlay({ overlay, seats, phase, info, hand, caption, compact }: { overlay: OverlayLevel; seats: SeatStack[]; phase: number; info?: StageInfo; hand: CurrentHand; caption?: string | null; compact?: boolean }) {
  const h = hand;
  const eq = EQUITY[phase];
  const shownBoard = h.board.slice(0, phase === 0 ? 3 : phase === 1 ? 4 : 5);
  const stackOf = (id: string) => seats.find((s) => s.playerId === id)?.stack ?? 0;
  const bb = info?.blinds?.bb;
  const inBb = (n: number) => (bb ? `${Math.round(n / bb)} bb` : '');
  const leaders = [...seats].sort((x, y) => y.stack - x.stack);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {compact && overlay !== 'off' && (
        <View style={[styles.box, { position: 'absolute', right: 6, bottom: 6, paddingHorizontal: 5, paddingVertical: 2 }]}>
          <Text style={[styles.small, type.tnum, { fontWeight: '800' }]}>Pot {chips(h.pots[phase])}</Text>
        </View>
      )}
      {!compact && overlay !== 'off' && (
        <>
          {info && (
            <View style={styles.bug}>
              <Text style={styles.bugTop} numberOfLines={1}>
                {`${info.event} · ${info.day}`.toUpperCase()}
              </Text>
              <Text style={[styles.bugBottom, type.tnum]} numberOfLines={1}>
                {info.level ? `Level ${info.level}` : ''}
                {info.blinds && `${info.level ? ' · ' : ''}${chips(info.blinds.sb)}/${chips(info.blinds.bb)} (${chips(info.blinds.ante)} ante)`}
                {info.left ? ` · ${info.left} left` : ''}
              </Text>
            </View>
          )}

          {overlay === 'pro' && (
            <View style={styles.leaders}>
              <Text style={styles.leadersHead}>CHIP COUNTS</Text>
              {leaders.slice(0, 5).map((s, i) => (
                <View key={s.playerId} style={styles.leaderRow}>
                  <Text style={[styles.small, { width: 10, color: 'rgba(255,255,255,0.5)' }]}>{i + 1}</Text>
                  <Text style={[styles.small, { flex: 1, fontWeight: '700', color: s.playerId === h.a || s.playerId === h.b ? colors.goldStrong : colors.text }]} numberOfLines={1}>
                    {lastName(s.playerId)}
                  </Text>
                  <Text style={[styles.small, type.tnum]}>{bb ? inBb(s.stack) : chips(s.stack)}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.handBox}>
            {[
              { id: h.a, cards: h.aCards, eq: eq.a },
              { id: h.b, cards: h.bCards, eq: eq.b },
            ].map((row, i) => (
              <View key={row.id} style={[styles.handRow, i === 0 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.15)' }]}>
                {overlay === 'pro' && (
                  <View style={{ flexDirection: 'row', gap: 2 }}>
                    {row.cards.split(' ').map((c) => (
                      <Card key={c} c={c} md />
                    ))}
                  </View>
                )}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.small, { fontWeight: '800', fontSize: 11 }]} numberOfLines={1}>
                    {playerById(row.id).name}
                  </Text>
                  <Text style={[styles.small, type.tnum, { color: 'rgba(255,255,255,0.65)' }]} numberOfLines={1}>
                    {chips(stackOf(row.id))}
                    {bb ? ` · ${inBb(stackOf(row.id))}` : ''}
                  </Text>
                </View>
                {overlay === 'pro' && <Text style={[type.tnum, { fontSize: 13, fontWeight: '900', color: row.eq >= 50 ? colors.goldStrong : 'rgba(255,255,255,0.8)' }]}>{row.eq}%</Text>}
              </View>
            ))}
          </View>

          <View style={styles.pot}>
            {overlay === 'pro' && (
              <View style={{ flexDirection: 'row', gap: 2, justifyContent: 'flex-end', paddingHorizontal: 6, paddingTop: 5, paddingBottom: 3 }}>
                {shownBoard.map((c) => (
                  <Card key={c} c={c} />
                ))}
              </View>
            )}
            <Text style={[styles.potText, type.tnum]}>
              <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: '700' }}>POT </Text>
              {chips(h.pots[phase])}
            </Text>
          </View>
        </>
      )}
      {caption && !compact && (
        <View style={styles.caption}>
          <Text style={{ color: '#fff', fontSize: 12.5, textAlign: 'center' }}>{caption}</Text>
        </View>
      )}
    </View>
  );
}

const glass = 'rgba(0,0,0,0.8)';
const styles = StyleSheet.create({
  small: { color: colors.text, fontSize: 10 },
  box: { backgroundColor: 'rgba(0,0,0,0.75)', borderRadius: 3 },
  bug: { position: 'absolute', top: 8, right: 8, borderRadius: 4, overflow: 'hidden', maxWidth: '62%' },
  bugTop: { backgroundColor: colors.gold, color: colors.ink, fontSize: 9, fontWeight: '900', letterSpacing: 0.6, paddingHorizontal: 8, paddingVertical: 3, textAlign: 'right' },
  bugBottom: { backgroundColor: glass, color: 'rgba(255,255,255,0.9)', fontSize: 9, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, textAlign: 'right' },
  leaders: { position: 'absolute', top: 44, left: 8, width: '30%', borderRadius: 4, overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.75)' },
  leadersHead: { backgroundColor: 'rgba(255,255,255,0.1)', color: colors.goldStrong, fontSize: 8, fontWeight: '800', letterSpacing: 0.8, paddingHorizontal: 6, paddingVertical: 2 },
  leaderRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 1.5 },
  handBox: { position: 'absolute', left: 8, bottom: 8, width: '50%', borderRadius: 4, overflow: 'hidden' },
  handRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: glass, paddingHorizontal: 6, paddingVertical: 3 },
  card: { borderRadius: 3, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  cardText: { fontWeight: '800' },
  pot: { position: 'absolute', right: 8, bottom: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: glass },
  potText: { color: colors.text, fontSize: 14, fontWeight: '900', paddingHorizontal: 8, paddingVertical: 3, textAlign: 'right' },
  caption: { position: 'absolute', left: '12%', right: '12%', bottom: '40%', alignItems: 'center' },
});
