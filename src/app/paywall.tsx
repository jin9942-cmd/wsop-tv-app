// WSOP+ plans (web demo SCR-10 Paywall). Example policy — subscribing only switches the demo member state.
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { goBack, SubHead } from '@/components/headers';
import { Button } from '@/components/ui';
import { MEMBER_LABEL, PLAN_ROWS, TIER_LABEL } from '@/data/plans';
import type { Tier } from '@/data/types';
import { hapticSuccess } from '@/lib/haptics';
import { useApp } from '@/state/app';
import { colors, radius, space, type } from '@/theme';

const COLS: Tier[] = ['free', 'basic', 'premium'];

export default function Paywall() {
  const { member, set, toast } = useApp();
  const choose = (t: Tier) => {
    set({ member: t });
    if (t === 'free') toast('Switched to WSOP+ Free (demo)');
    else {
      hapticSuccess();
      toast(`Subscribed to WSOP+ ${TIER_LABEL[t]} (demo)`);
    }
    goBack();
  };
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SubHead title="Choose your plan" />
      <ScrollView contentContainerStyle={{ padding: space.gutter, paddingBottom: 40 }}>
        <Text style={type.h2}>Watch every table of the World Series of Poker, live and on demand.</Text>
        <Text style={styles.policy}>WSOP TV is included with WSOP+ · Example policy · not final</Text>

        <View style={styles.table} accessibilityRole="summary">
          <View style={[styles.tr, styles.thead]}>
            <Text style={[styles.th, styles.label]} />
            {COLS.map((t) => (
              <Text key={t} style={[styles.th, member === t && styles.current]}>
                {TIER_LABEL[t]}
              </Text>
            ))}
          </View>
          {PLAN_ROWS.map((r) => (
            <View key={r.label} style={styles.tr}>
              <Text style={[styles.td, styles.label]}>{r.label}</Text>
              {COLS.map((t) => (
                <Text key={t} style={[styles.td, member === t && styles.current]}>
                  {r.values[t]}
                </Text>
              ))}
            </View>
          ))}
        </View>

        {(['premium', 'basic', 'free'] as Tier[]).map((t) => (
          <Button
            key={t}
            block
            variant={t === 'premium' ? 'gold' : 'outline'}
            disabled={member === t}
            title={member === t ? `Current plan · ${MEMBER_LABEL[t]}` : t === 'free' ? (member === 'guest' ? 'Continue with GGPass (Free)' : 'Switch to Free') : `Subscribe to WSOP+ ${TIER_LABEL[t]}`}
            onPress={() => choose(t)}
          />
        ))}
        <Button title="Restore purchases" variant="ghost" block onPress={() => toast('No purchases to restore (demo)')} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  policy: { color: colors.subtle, fontSize: 12, marginTop: 8, marginBottom: 16 },
  table: { borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, overflow: 'hidden', marginBottom: 12 },
  tr: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  thead: { backgroundColor: colors.surface2 },
  th: { flex: 1, color: colors.text, fontWeight: '800', fontSize: 13, padding: 10, textAlign: 'center' },
  td: { flex: 1, color: colors.muted, fontSize: 12, padding: 10, textAlign: 'center' },
  label: { flex: 0.9, textAlign: 'left', color: colors.subtle, fontWeight: '700' },
  current: { color: colors.goldStrong, backgroundColor: colors.goldDim },
});
