// Linear channel bits shared by the Live > Channels tab and the channel player.
import { StyleSheet, Text, View } from 'react-native';

import type { Program } from '@/data/channels';
import { colors, radius, space, type } from '@/theme';

import { TierBadge } from './ui';

export function ProgramLive() {
  return (
    <View style={styles.liveTag}>
      <Text style={styles.liveTagText}>● LIVE</Text>
    </View>
  );
}

/** Studio / highlights / classics are free for everyone; live and replay keep the broadcast's tier. */
export function AccessBadge({ p }: { p: Program }) {
  return p.access === 'open' ? <TierBadge tier="free" open /> : <TierBadge tier={p.access} />;
}

export function AboutChannels() {
  return (
    <View style={styles.about}>
      <Text style={[type.label, { color: colors.gold, marginBottom: 6 }]}>How channels work</Text>
      {[
        'Each channel runs 24/7 on a fixed schedule — no rewind. To start over, open the broadcast.',
        'Studio, highlight and classic programmes are free to watch.',
        'Live and replay programmes need the same membership as the broadcast they carry.',
        'If live coverage starts late or drops out, the channel stays on with highlights.',
      ].map((t) => (
        <Text key={t} style={[type.small, { marginTop: 4 }]}>
          · {t}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  liveTag: { backgroundColor: colors.live, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  liveTagText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  about: { margin: space.gutter, marginTop: 24, padding: 14, borderRadius: radius.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
});
