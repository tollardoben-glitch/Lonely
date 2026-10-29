import { Tabs } from 'expo-router/js-tabs';
import { Text } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;
}

export default function TabsLayout() {
  const theme = useTheme();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: { backgroundColor: theme.card, borderTopColor: theme.border },
        headerStyle: { backgroundColor: theme.background },
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '800' },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Entdecken', tabBarIcon: ({ focused }) => <TabIcon emoji="🧭" focused={focused} /> }}
      />
      <Tabs.Screen
        name="dinner"
        options={{ title: 'Dinner', tabBarIcon: ({ focused }) => <TabIcon emoji="🍽️" focused={focused} /> }}
      />
      <Tabs.Screen
        name="groups"
        options={{ title: 'Gruppen', tabBarIcon: ({ focused }) => <TabIcon emoji="👥" focused={focused} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profil', tabBarIcon: ({ focused }) => <TabIcon emoji="🙂" focused={focused} /> }}
      />
    </Tabs>
  );
}
