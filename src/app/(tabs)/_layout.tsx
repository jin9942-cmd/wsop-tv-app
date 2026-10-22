import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/ui';
import { hapticSelection } from '@/lib/haptics';
import { colors } from '@/theme';

// Bottom tabs = the web demo v2 mobile bottom menu: Home · Live · Schedule · Hands · More.
const TABS: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'Home', icon: 'home' },
  { name: 'live', title: 'Live', icon: 'live' },
  { name: 'schedule', title: 'Schedule', icon: 'calendar' },
  { name: 'hands', title: 'Hands', icon: 'hands' },
  { name: 'more', title: 'More', icon: 'more' },
];

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: 'rgba(11,12,14,0.95)', borderTopColor: colors.line, height: 58 + insets.bottom, paddingTop: 4 },
        tabBarLabelStyle: { fontSize: 10.5, fontWeight: '700' },
        sceneStyle: { backgroundColor: colors.bg },
      }}
      screenListeners={{ tabPress: () => hapticSelection() }}>
      {TABS.map((t) => (
        <Tabs.Screen key={t.name} name={t.name} options={{ title: t.title, tabBarIcon: ({ color }) => <Icon name={t.icon} size={22} color={String(color)} /> }} />
      ))}
    </Tabs>
  );
}
