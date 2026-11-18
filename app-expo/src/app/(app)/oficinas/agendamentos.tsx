import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { cancelAppointment, formatStart, listAppointments, type Appointment } from '@/lib/oficinas';

const STATUS = { SCHEDULED: 'Agendado', COMPLETED: 'Concluído', CANCELLED: 'Cancelado' } as const;

/** RF26, RF29: agendamentos do atleta; cancelar avisa a oficina no app e por e-mail. */
export default function AgendamentosScreen() {
  const theme = useTheme();
  const [items, setItems] = useState<Appointment[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setItems(await listAppointments());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function cancel(a: Appointment) {
    setError(null);
    try {
      await cancelAppointment(a.id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível cancelar');
    }
  }

  if (!items) {
    return (
      <ThemedView style={styles.center}>
        {error ? <ThemedText>{error}</ThemedText> : <ActivityIndicator />}
      </ThemedView>
    );
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <FlatList
        data={items}
        keyExtractor={(a) => a.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListHeaderComponent={error ? <ThemedText style={{ color: '#d33' }}>{error}</ThemedText> : null}
        ListEmptyComponent={<ThemedText themeColor="textSecondary">Você ainda não agendou nenhuma revisão.</ThemedText>}
        renderItem={({ item: a }) => (
          <ThemedView style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="subtitle">{a.workshop.name}</ThemedText>
            <ThemedText>{formatStart(a.startsAt)} · {a.bike}</ThemedText>
            {a.service && <ThemedText themeColor="textSecondary">{a.service.name}</ThemedText>}
            <ThemedText type="small" themeColor="textSecondary">
              {STATUS[a.status]} · histórico {a.shareHistory ? 'compartilhado' : 'não compartilhado'}
            </ThemedText>
            {a.status === 'SCHEDULED' && (
              <Pressable onPress={() => cancel(a)}>
                <ThemedText type="link">Cancelar agendamento</ThemedText>
              </Pressable>
            )}
          </ThemedView>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { borderRadius: 16, padding: 16, gap: 4 },
});
