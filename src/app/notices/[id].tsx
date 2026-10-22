import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { SubHead } from '@/components/headers';
import { Missing } from '@/components/missing';
import { NoticeTags } from '@/components/notice';
import { Button, Row } from '@/components/ui';
import { notices } from '@/data/home';
import { linkHref } from '@/lib/nav';
import { fmtDate } from '@/lib/time';
import { useApp } from '@/state/app';
import { colors, space, type } from '@/theme';

export default function NoticeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tz, toast } = useApp();
  const n = notices.find((x) => x.id === id);
  if (!n) return <Missing />;
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SubHead title="Notice" />
      <ScrollView contentContainerStyle={{ padding: space.gutter, gap: 10 }}>
        <NoticeTags n={n} />
        <Text style={type.h2}>{n.title}</Text>
        <Text style={type.small}>{fmtDate(n.date, tz)}</Text>
        <Text style={[type.body, { lineHeight: 22 }]}>{n.body}</Text>
        {n.attachment && (
          <Row onPress={() => toast(`${n.attachment} (demo)`)} style={{ paddingHorizontal: 0 }}>
            <Text style={type.body}>Attachment · {n.attachment}</Text>
          </Row>
        )}
        {n.link && <Button title={n.link.label} variant="outline" block onPress={() => router.push(linkHref(n.link!.to))} />}
      </ScrollView>
    </View>
  );
}
