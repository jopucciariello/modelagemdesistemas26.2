import { Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/auth-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function ConfiguracoesScreen() {
  const { user, signOut } = useAuth();
  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, padding: 24, gap: 12 }}>
        <ThemedText type="title">Configurações</ThemedText>
        <ThemedText themeColor="textSecondary">{user ? `${user.name} (${user.email})` : ''}</ThemedText>
        <Pressable accessibilityRole="button" onPress={() => void signOut()}>
          <ThemedText type="link">Sair</ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}
