// Archive (web demo v2 pages/Archive.tsx): classics + replays of every broadcast day (guests see part of it).
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ArchiveCard, BroadcastCard, CardStack } from '@/components/cards';
import { SubHead } from '@/components/headers';
import { Button, PageHeader, SectionHeader } from '@/components/ui';
import { archive, events } from '@/data/mock';
import { useApp } from '@/state/app';
import { colors, radius, space, type } from '@/theme';

export default function Archive() {
  const { signedIn, requireLogin } = useApp();
  const replays = events.flatMap((e) => e.days.filter((d) => d.status === 'vod').map((d) => ({ e, d })));
  const visible = signedIn ? replays : replays.slice(0, 6);
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SubHead />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <PageHeader kicker="On demand" title="Archive" intro="Full replays of every broadcast day, plus classic final tables from past championships." />
        <View style={{ marginTop: 24 }}>
          <SectionHeader title="Classics" />
          <CardStack>
            {archive.map((a) => (
              <ArchiveCard key={a.id} item={a} />
            ))}
          </CardStack>
        </View>
        <View style={{ marginTop: 32 }}>
          <SectionHeader title="2026 Summer Championship replays" />
          <CardStack>
            {visible.map(({ e, d }) => (
              <BroadcastCard key={d.id} event={e} day={d} />
            ))}
          </CardStack>
          {!signedIn && (
            <View style={styles.more}>
              <Text style={[type.h3, { textAlign: 'center' }]}>{replays.length - visible.length} more replays in the archive</Text>
              <Button variant="primary" title="Continue with GGPASS" onPress={() => requireLogin('Sign in to browse the full archive.')} />
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  more: { margin: space.gutter, marginTop: 24, padding: 20, gap: 12, alignItems: 'center', borderRadius: radius.panel, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
});
