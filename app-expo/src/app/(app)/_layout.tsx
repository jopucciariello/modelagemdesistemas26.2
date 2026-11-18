import { Tabs } from 'expo-router';

import { FontFamily } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Navegação principal. Oficinas (M2) e Mercado (M3) entram nas abas já existentes. */
export default function AppLayout() {
  const theme = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: { backgroundColor: theme.background, borderTopColor: theme.border },
        tabBarLabelStyle: { fontFamily: FontFamily.bodyMedium },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Painel' }} />
      <Tabs.Screen name="pedais" options={{ title: 'Pedais' }} />
      <Tabs.Screen name="oficinas" options={{ title: 'Oficinas' }} />
      <Tabs.Screen name="mercado" options={{ title: 'Mercado' }} />
      <Tabs.Screen name="configuracoes" options={{ title: 'Ajustes' }} />
      <Tabs.Screen name="bike/[id]" options={{ href: null }} />
    </Tabs>
  );
}
