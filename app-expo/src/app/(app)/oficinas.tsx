import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function OficinasScreen() {
  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, padding: 24, gap: 8 }}>
        <ThemedText type="title">Oficinas</ThemedText>
        <ThemedText themeColor="textSecondary">Oficinas próximas e agendamento (milestone M2).</ThemedText>
      </SafeAreaView>
    </ThemedView>
  );
}
