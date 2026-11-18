import { Stack } from 'expo-router';

import { FontFamily } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function OficinasLayout() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.accent,
        headerTitleStyle: { fontFamily: FontFamily.display, color: theme.text },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: theme.background },
      }}>
      <Stack.Screen name="index" options={{ title: 'Oficinas' }} />
      <Stack.Screen name="[id]" options={{ title: 'Oficina' }} />
      <Stack.Screen name="agendamentos" options={{ title: 'Meus agendamentos' }} />
      <Stack.Screen name="minha-oficina" options={{ title: 'Minha oficina' }} />
      <Stack.Screen name="atendimento" options={{ title: 'Atendimento' }} />
      <Stack.Screen name="admin" options={{ title: 'Pedidos de oficina' }} />
    </Stack>
  );
}
