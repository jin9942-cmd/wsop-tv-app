// WSOP+ membership comparison (web demo v2 features/auth/Plans.tsx). WSOP TV has no plans or payments of its own:
// it shows what each WSOP+ tier includes on WSOP TV and sends the viewer to WSOP+ to join or upgrade.
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { SubHead } from '@/components/headers';
import { Button, Icon, Placeholder } from '@/components/ui';
import { INCLUDED_FROM_LABEL, MEMBERSHIP_PRICES, TIER_NAME, atLeast, requiredTier, tierFull, tvCoverage, type PaidTier, type Tier } from '@/data/policy';
import type { Access } from '@/data/types';
import { memberTier, useApp } from '@/state/app';
import { colors, radius, space, type } from '@/theme';

const COLUMNS: Exclude<Tier, 'free'>[] = ['wsopFree', 'basic', 'premium'];

export default function Plans() {
  const params = useLocalSearchParams<{ required?: Tier; access?: Access; returnTo?: string }>();
  const { state, toast, signedIn, requireLogin } = useApp();
  const returnTo = params.returnTo ?? '/';
  const required: Tier | undefined = params.required ?? (params.access ? requiredTier(params.access, state.includedFrom) : undefined);
  const have = memberTier(state);
  const ended = state.scenario === 'expired';

  const go = (tier: PaidTier) => {
    if (!signedIn) return requireLogin('WSOP+ runs on your GGPass account. Sign in first, then choose a membership.');
    router.push({ pathname: '/wsop-plus/join', params: { tier, return: returnTo } });
  };
  const cta = (tier: Exclude<Tier, 'free'>) => {
    if (tier === 'wsopFree') return signedIn ? null : { label: 'Sign in with GGPass', onPress: () => requireLogin('Sign in with GGPass to get WSOP+ Free.') };
    if (ended && tier === state.paidTier) return { label: `Renew ${TIER_NAME[tier]}`, onPress: () => go(tier) };
    if (atLeast(have, tier)) return null;
    return { label: have === 'basic' || (ended && state.paidTier === 'basic') ? `Upgrade to ${TIER_NAME[tier]}` : `Join ${tierFull(tier)}`, onPress: () => go(tier) };
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SubHead />
      <ScrollView contentContainerStyle={{ padding: space.gutter, paddingBottom: 40 }}>
        <Text style={[type.label, { color: colors.gold }]}>WSOP+ membership</Text>
        <Text style={[type.title, { marginTop: 4 }]}>WSOP TV is included with WSOP+</Text>
        <Text style={[type.small, { marginTop: 6, lineHeight: 19 }]}>One GGPass account, one membership. Joining, billing and cancelling all happen in WSOP+ — WSOP TV simply reads your tier.</Text>
        <View style={[styles.inline, { marginTop: 8, flexWrap: 'wrap' }]}>
          <Placeholder />
          <Text style={type.caption}>
            Tier names, prices and what each tier covers aren’t final · WSOP TV currently included from: <Text style={{ color: colors.muted, fontWeight: '700' }}>{INCLUDED_FROM_LABEL[state.includedFrom]}</Text>
          </Text>
        </View>

        <View style={{ gap: 12, marginTop: 20 }}>
          {COLUMNS.map((tier) => {
            const current = signedIn && !ended && have === tier;
            const needed = required === tier;
            const action = cta(tier);
            return (
              <View key={tier} style={[styles.card, needed ? { borderColor: colors.gold, backgroundColor: colors.goldDim } : current ? { borderColor: colors.lineStrong } : null]} accessibilityLabel={tierFull(tier)}>
                <View style={[styles.inline, { minHeight: 22 }]}>
                  {current && <Tag text="Current plan" />}
                  {needed && <Tag text="Required to watch this" gold />}
                  {ended && tier === state.paidTier && <Tag text="Ended" />}
                </View>
                <Text style={[type.h2, { marginTop: 6 }]}>
                  WSOP<Text style={{ color: colors.gold }}>+</Text> {TIER_NAME[tier]}
                </Text>
                <Text style={[type.tnum, { color: colors.text, fontSize: 28, fontWeight: '900', marginTop: 6 }]}>
                  {MEMBERSHIP_PRICES[tier].monthly}
                  <Text style={[type.small, { fontWeight: '700' }]}> / month</Text>
                </Text>
                <Text style={type.caption}>{tier === 'wsopFree' ? 'Included with every GGPass account' : 'Pricing to be confirmed'}</Text>
                <Text style={[type.label, { fontSize: 10, marginTop: 16 }]}>On WSOP TV</Text>
                <View style={{ gap: 6, marginTop: 8 }}>
                  {tvCoverage(tier, state.includedFrom).map((x) => (
                    <View key={x} style={[styles.inline, { alignItems: 'flex-start' }]}>
                      <Icon name="check" size={16} color={colors.gold} />
                      <Text style={[type.body, { flex: 1 }]}>{x}</Text>
                    </View>
                  ))}
                </View>
                <Text style={[type.small, styles.benefits]}>
                  Plus other WSOP+ benefits ·{' '}
                  <Text style={{ color: colors.gold, fontWeight: '700' }} onPress={() => toast('WSOP+ benefits page (demo)')}>
                    See WSOP+
                  </Text>
                </Text>
                <View style={{ marginTop: 14 }}>
                  {action ? (
                    <Button variant={needed || tier === 'basic' ? 'primary' : 'outline'} block title={action.label} onPress={action.onPress} />
                  ) : (
                    <View style={styles.included}>
                      <Text style={[type.small, { fontWeight: '700' }]}>{current ? 'Your current plan' : 'Included'}</Text>
                    </View>
                  )}
                  {action && tier !== 'wsopFree' && (
                    <View style={[styles.inline, { justifyContent: 'center', marginTop: 8, flexWrap: 'wrap' }]}>
                      <Text style={type.caption}>Opens WSOP+ in your browser</Text>
                      <Placeholder />
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
        <Text style={[type.caption, { marginTop: 20, lineHeight: 16 }]}>Continue to WSOP+ to join or upgrade; you’ll come straight back and WSOP TV re-checks your membership. No payment is taken in this demo.</Text>
      </ScrollView>
    </View>
  );
}

function Tag({ text, gold }: { text: string; gold?: boolean }) {
  return (
    <View style={[styles.tag, gold ? { backgroundColor: colors.gold } : { backgroundColor: colors.surface3 }]}>
      <Text style={{ color: gold ? colors.ink : colors.text, fontSize: 10, fontWeight: '800', letterSpacing: 0.6 }}>{text.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  inline: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  card: { padding: 20, borderRadius: radius.panel, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  tag: { borderRadius: 3, paddingHorizontal: 6, paddingVertical: 2 },
  benefits: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.line },
  included: { minHeight: 40, borderRadius: radius.chip, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
});
