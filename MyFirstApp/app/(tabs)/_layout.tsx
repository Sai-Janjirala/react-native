import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? 'dark' : 'light';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[theme].tint,
        headerShown: false,
        tabBarButton: HapticTab as any,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Play',
          tabBarIcon: ({ color }: { color: any }) => <IconSymbol size={28} name="game" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Scores',
          tabBarIcon: ({ color }: { color: any }) => <IconSymbol size={28} name="trophy" color={color} />,
        }}
      />
    </Tabs>
  );
}
