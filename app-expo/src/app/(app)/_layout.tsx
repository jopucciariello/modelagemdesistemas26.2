import { Tabs } from 'expo-router';

/** Navegação principal. Oficinas (M2) e Mercado (M3) entram nas abas já existentes. */
export default function AppLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Painel' }} />
      <Tabs.Screen name="oficinas" options={{ title: 'Oficinas' }} />
      <Tabs.Screen name="mercado" options={{ title: 'Mercado' }} />
      <Tabs.Screen name="configuracoes" options={{ title: 'Configurações' }} />
      <Tabs.Screen name="bike/[id]" options={{ href: null }} />
    </Tabs>
  );
}
