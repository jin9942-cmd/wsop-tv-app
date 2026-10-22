import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/ui';
import { hapticSelection } from '@/lib/haptics';
import { colors } from '@/theme';

// Bottom tabs: Home · Live · Schedule · VOD · My (web demo v2 mobile menu + app screens, see docs/web-demo-map.md).
const TABS: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'Home', icon: 'home' },
  { name: 'live', title: 'Live', icon: 'live' },
  { name: 'schedule', title: 'Schedule', icon: 'calendar' },
  { name: 'vod', title: 'VOD', icon: 'vod' },
  { name: 'my', title: 'My', icon: 'user' },
];

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.line, height: 60 + insets.bottom, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        sceneStyle: { backgroundColor: colors.bg },
      }}
      screenListeners={{ tabPress: () => hapticSelection() }}>
      {TABS.map((t) => (
        <Tabs.Screen key={t.name} name={t.name} options={{ title: t.title, tabBarIcon: ({ color }) => <Icon name={t.icon} size={24} color={String(color)} /> }} />
      ))}
    </Tabs>
  );
}
