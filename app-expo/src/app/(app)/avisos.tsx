import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandLogo } from '@/components/brand-logo';
import { Btn } from '@/components/market-ui';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { market, type Notice } from '@/lib/market';

/** RF21, RF29, RF14: in-app notices (wear, dream alerts, cancellations), unread first. */
export default function AvisosScreen() {
  const router = useRouter();
  const [rows, setRows] = useState<Notice[] | null>(null);
  const [failed, setFailed] = useState(false);

  useFocusEffect(
    useCallback(() => {
      market.notices().then((r) => { setRows(r); setFailed(false); }).catch(() => setFailed(true));
    }, []),
  );

  const unread = (rows ?? []).filter((n) => !n.readAt);
  const sorted = [...unread, ...(rows ?? []).filter((n) => n.readAt)];
  const markAll = () =>
    market.readNotices().then(() => setRows((r) => (r ?? []).map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() }))));

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 24, gap: 12 }}>
          <BrandLogo size={32} />
          <ThemedText type="title">Avisos</ThemedText>
          {failed && <ThemedText themeColor="textSecondary">Não foi possível carregar os avisos.</ThemedText>}
          {rows && (
            <ThemedText themeColor="textSecondary">
              {unread.length === 0 ? 'Nenhum aviso novo.' : `${unread.length} ${unread.length === 1 ? 'aviso novo' : 'avisos novos'}.`}
            </ThemedText>
          )}
          {unread.length > 0 && <Btn label="Marcar todos como lidos" onPress={() => void markAll()} />}
          {rows?.length === 0 && <ThemedText themeColor="textSecondary">Você ainda não recebeu avisos.</ThemedText>}
          {sorted.map((n) => (
            <Pressable key={n.id} disabled={!n.href} onPress={() => n.href && router.push(n.href as never)}>
              <View style={{ gap: 2 }}>
                <ThemedText type={n.readAt ? 'small' : 'smallBold'}>{n.message}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">{new Date(n.createdAt).toLocaleDateString('pt-BR')}</ThemedText>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}
