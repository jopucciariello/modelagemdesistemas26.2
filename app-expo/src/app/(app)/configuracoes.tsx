import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/auth-context';
import { Btn, Field } from '@/components/market-ui';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ApiError, api } from '@/lib/api';

export default function ConfiguracoesScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [confirm, setConfirm] = useState('');
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
