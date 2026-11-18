import { Pressable, StyleSheet } from 'react-native';

import { useAuth } from '@/auth/auth-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';

export default function LoginScreen() {
  const { signInWithGoogle, error } = useAuth();
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">GearLog</ThemedText>
      <ThemedText themeColor="textSecondary">Suas bikes, seu desgaste, sua oficina.</ThemedText>
      <Pressable
        accessibilityRole="button"
        onPress={() => void signInWithGoogle()}
        style={[styles.button, { backgroundColor: theme.text }]}>
        <ThemedText style={{ color: theme.background }}>Entrar com Google</ThemedText>
      </Pressable>
      {error ? <ThemedText themeColor="textSecondary">{error}</ThemedText> : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  button: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, minWidth: 220, alignItems: 'center' },
});
