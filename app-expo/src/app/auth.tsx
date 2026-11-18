import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

/**
 * Destino do deep link do login no navegador (web): a janela de login volta para cá com o token e
 * `WebBrowser.maybeCompleteAuthSession()` (em auth-context.tsx) devolve o resultado e fecha a janela.
 */
export default function AuthReturn() {
  return (
    <ThemedView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ThemedText themeColor="textSecondary">Concluindo o login…</ThemedText>
    </ThemedView>
  );
}
