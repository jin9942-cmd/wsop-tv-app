import { View } from 'react-native';

import type { Notice } from '@/data/types';
import { colors } from '@/theme';

import { Tag } from './ui';

const TYPE_COLOR = { Service: colors.tierBasic, Event: colors.gold, Maintenance: colors.delayed } as const;

export function NoticeTags({ n }: { n: Notice }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {n.pinned && <Tag color={colors.live}>Pinned</Tag>}
      <Tag color={TYPE_COLOR[n.type]}>{n.type}</Tag>
      {n.audiences?.length ? <Tag>Members</Tag> : null}
    </View>
  );
}
