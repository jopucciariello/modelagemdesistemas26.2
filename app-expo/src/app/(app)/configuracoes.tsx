import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/auth-context';
import { Btn, Field } from '@/components/market-ui';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ApiError, api } from '@/lib/api';
import { API_URL } from '@/lib/config';

WebBrowser.maybeCompleteAuthSession();

type StravaStatus = { available: boolean; linked: boolean; source: string };

const STRAVA_ERRORS: Record<string, string> = {
  access_denied: 'Você não autorizou o acesso ao Strava.',
  missing_scope: 'Marque todas as permissões ao autorizar (perfil, bikes e atividades, inclusive privadas).',
  invalid_state: 'A autorização expirou. Tente de novo.',
  token_exchange_failed: 'O Strava recusou a autorização. Tente de novo mais tarde.',
};

export default function ConfiguracoesScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [strava, setStrava] = useState<StravaStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const loadStrava = useCallback(() => api<StravaStatus>('/api/strava').then(setStrava).catch(() => setStrava(null)), []);
  useEffect(() => { void loadStrava(); }, [loadStrava]);
  /** RF04: authorizes the GearLog app at Strava in the browser; the API returns to the app's deep link. */
  const connectStrava = async () => {
    if (!API_URL) return;
    setBusy(true);
    try {
      const redirect = Linking.createURL('configuracoes');
      const { url } = await api<{ url: string }>('/api/strava/start', { method: 'POST', body: JSON.stringify({ redirect }) });
      const result = await WebBrowser.openAuthSessionAsync(url, redirect);
      if (result.type === 'success') {
        const q = Linking.parse(result.url).queryParams ?? {};
        if (typeof q.erro === 'string') Alert.alert('Strava', STRAVA_ERRORS[q.erro] ?? 'Algo deu errado. Tente de novo.');
        else Alert.alert('Strava', 'Strava vinculado. Seus pedais entram sozinhos a partir de agora.');
      }
    } catch (e) {
      Alert.alert('Strava', e instanceof ApiError ? e.message : 'Não foi possível conectar.');
    } finally {
      setBusy(false);
      void loadStrava();
    }
  };
  /** RF32, RNF01: revokes access at Strava and deletes the tokens. */
  const disconnectStrava = () =>
    api('/api/strava/disconnect', { method: 'POST' })
      .then(loadStrava)
      .catch((e) => Alert.alert('Erro', e instanceof ApiError ? e.message : 'Não foi possível desconectar.'));
  /** RF40: deletes the account and every piece of data, then signs out. */
  const deleteAccount = () =>
    api('/api/me', { method: 'DELETE', body: JSON.stringify({ confirm }) })
      .then(() => signOut())
      .catch((e) => Alert.alert('Erro', e instanceof ApiError ? e.message : 'Não foi possível excluir.'));
  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, padding: 24, gap: 12 }}>
        <ThemedText type="title">Configurações</ThemedText>
        <ThemedText themeColor="textSecondary">{user ? `${user.name} (${user.email})` : ''}</ThemedText>
        {strava?.available && (
          <View style={{ gap: 8 }}>
            <ThemedText type="subtitle">Strava</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Lemos só data, esporte, distância, tempo em movimento e bike. {strava.linked ? 'Conta Strava vinculada.' : 'Nada é publicado no seu Strava.'}
            </ThemedText>
            {strava.linked ? (
              <Btn label="Desconectar o Strava e apagar os tokens" onPress={() => void disconnectStrava()} />
            ) : (
              <Btn label={busy ? 'Conectando…' : 'Conectar com o Strava'} onPress={() => void connectStrava()} />
            )}
          </View>
        )}
        {user?.role === 'ADMIN' && (
          <Pressable accessibilityRole="button" onPress={() => router.push('/admin')}>
            <ThemedText type="link">Administração (catálogo, admins, pedidos)</ThemedText>
          </Pressable>
        )}
        <Pressable accessibilityRole="button" onPress={() => void signOut()}>
          <ThemedText type="link">Sair</ThemedText>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => setDeleting((v) => !v)}>
          <ThemedText type="link">Excluir minha conta</ThemedText>
        </Pressable>
        {deleting && (
          <View style={{ gap: 8 }}>
            <ThemedText type="small">Isso apaga sua conta e todos os seus dados (bikes, peças, pedais, anúncios, agendamentos) e não pode ser desfeito. Digite EXCLUIR para confirmar.</ThemedText>
            <Field placeholder="EXCLUIR" autoCapitalize="characters" value={confirm} onChangeText={setConfirm} />
            <Btn label="Excluir definitivamente" onPress={() => void deleteAccount()} />
          </View>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}
