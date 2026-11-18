import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/auth-context';
import { BrandLogo } from '@/components/brand-logo';
import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';

export default function LoginScreen() {
  const { signInWithGoogle, error } = useAuth();
  const theme = useTheme();

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <View style={styles.container}>
          <BrandLogo size={56} showName={false} />
          <ThemedText type="small" themeColor="textSecondary">
            Ciclismo · desgaste · oficina
          </ThemedText>
          <ThemedText type="title" style={styles.hero}>
            GearLog
          </ThemedText>
          <View style={[styles.rule, { backgroundColor: theme.accent }]} />
          <ThemedText themeColor="textSecondary" style={styles.tagline}>
            Suas bikes, seus pedais do Strava e o desgaste de cada peça. Quando a revisão chegar, agende na oficina parceira.
          </ThemedText>
          <Button label="Entrar com Google" onPress={() => void signInWithGoogle()} />
          {error ? <ThemedText themeColor="textSecondary">{error}</ThemedText> : null}
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', gap: 16, padding: 24, maxWidth: 560, width: '100%', alignSelf: 'center' },
  hero: { fontSize: 72, lineHeight: 76 },
  rule: { height: 2, width: 64 },
  tagline: { fontSize: 18, lineHeight: 26 },
});
