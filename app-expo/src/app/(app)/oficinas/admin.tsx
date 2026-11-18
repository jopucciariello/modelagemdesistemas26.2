import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet } from 'react-native';

import { StatusColors } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { decideRequest, listRequests, type AdminRequest } from '@/lib/oficinas-staff';

/** RF25, RB17: o administrador aprova ou recusa os pedidos de cadastro de oficina. */
export default function AdminOficinasScreen() {
  const theme = useTheme();
  const [items, setItems] = useState<AdminRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setItems(await listRequests());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar');
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  async function decide(id: string, decision: 'approve' | 'reject') {
    setError(null);
    try {
      await decideRequest(id, decision);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível decidir');
    }
  }

  if (!items) {
    return <ThemedView style={styles.center}>{error ? <ThemedText>{error}</ThemedText> : <ActivityIndicator />}</ThemedView>;
  }
  return (
    <ThemedView style={{ flex: 1 }}>
      <FlatList
        data={items}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListHeaderComponent={error ? <ThemedText style={{ color: StatusColors.due }}>{error}</ThemedText> : undefined}
        ListEmptyComponent={<ThemedText themeColor="textSecondary">Nenhum pedido de oficina.</ThemedText>}
        renderItem={({ item: r }) => (
          <ThemedView style={[styles.card, { borderColor: theme.border }]}>
            <ThemedText type="subtitle">{r.name}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">{r.ownerEmail}{r.contact ? ` · ${r.contact}` : ''}</ThemedText>
            {r.requestText && <ThemedText>{r.requestText}</ThemedText>}
            {r.status === 'PENDING' ? (
              <ThemedView style={{ flexDirection: 'row', gap: 16, backgroundColor: 'transparent' }}>
                <Pressable onPress={() => decide(r.id, 'approve')}><ThemedText type="linkPrimary">Aprovar</ThemedText></Pressable>
                <Pressable onPress={() => decide(r.id, 'reject')}><ThemedText type="link">Recusar</ThemedText></Pressable>
              </ThemedView>
            ) : (
              <ThemedText type="small" themeColor="textSecondary">Recusado</ThemedText>
            )}
          </ThemedView>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { borderWidth: 1, padding: 16, gap: 6 },
});
