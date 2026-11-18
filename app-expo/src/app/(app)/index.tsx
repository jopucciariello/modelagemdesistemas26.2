import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function PainelScreen() {
  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, padding: 24, gap: 8 }}>
        <ThemedText type="title">Painel</ThemedText>
        <ThemedText themeColor="textSecondary">Suas bikes e o desgaste das peças chegam aqui (issue #64).</ThemedText>
      </SafeAreaView>
    </ThemedView>
  );
}
