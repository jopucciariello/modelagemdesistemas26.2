import { Stack } from 'expo-router';

export default function OficinasLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Oficinas' }} />
      <Stack.Screen name="[id]" options={{ title: 'Oficina' }} />
      <Stack.Screen name="agendamentos" options={{ title: 'Meus agendamentos' }} />
    </Stack>
  );
}
