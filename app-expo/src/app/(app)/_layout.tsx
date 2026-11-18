import { Ionicons } from '@expo/vector-icons';
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
      <Tabs.Screen
        name="index"
        options={{ title: 'Painel', tabBarIcon: ({ color, size }) => <Ionicons name="speedometer" size={size} color={color as string} /> }}
      />
      <Tabs.Screen
        name="pedais"
        options={{ title: 'Pedais', tabBarIcon: ({ color, size }) => <Ionicons name="bicycle" size={size} color={color as string} /> }}
      />
      <Tabs.Screen
        name="oficinas"
        options={{ title: 'Oficinas', tabBarIcon: ({ color, size }) => <Ionicons name="construct" size={size} color={color as string} /> }}
      />
      <Tabs.Screen
        name="mercado"
        options={{ title: 'Mercado', tabBarIcon: ({ color, size }) => <Ionicons name="pricetag" size={size} color={color as string} /> }}
      />
      <Tabs.Screen
        name="avisos"
        options={{ title: 'Avisos', tabBarIcon: ({ color, size }) => <Ionicons name="notifications" size={size} color={color as string} /> }}
      />
      <Tabs.Screen
        name="configuracoes"
        options={{ title: 'Ajustes', tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color as string} /> }}
      />
      <Tabs.Screen name="bike/[id]" options={{ href: null }} />
    </Tabs>
  );
}
