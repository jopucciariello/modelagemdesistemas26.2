import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function MercadoScreen() {
  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, padding: 24, gap: 8 }}>
        <ThemedText type="title">Mercado</ThemedText>
        <ThemedText themeColor="textSecondary">Anúncios e sonhos (milestone M3).</ThemedText>
      </SafeAreaView>
    </ThemedView>
  );
}
