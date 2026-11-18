import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import type { BikeDetailDto } from '@/features/painel/types';
import { WearMeter } from '@/features/painel/wear-meter';
import { useTheme } from '@/hooks/use-theme';
import { api, ApiError } from '@/lib/api';

const EVENT_LABEL = { REPLACEMENT: 'Troca', SERVICE: 'Revisão', MANUAL: 'Manutenção' } as const;

/** RF01, RF02, RF07, RF11: uma bike com peças, desgaste e histórico (somente leitura por enquanto). */
export default function BikeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const [bike, setBike] = useState<BikeDetailDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setBike(await api<BikeDetailDto>(`/api/bikes/${id}`));
    } catch (e) {
      setError(e instanceof ApiError && e.status === 404 ? 'Bike não encontrada.' : 'Não foi possível carregar a bike.');
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <ThemedView style={styles.flex}>
      <Stack.Screen options={{ headerShown: true, title: bike?.name ?? 'Bike' }} />
      <ScrollView contentContainerStyle={styles.content}>
        {error ? <ThemedText themeColor="textSecondary">{error}</ThemedText> : null}
        {!bike && !error ? <ThemedText themeColor="textSecondary">Carregando…</ThemedText> : null}
        {bike ? (
          <>
            <ThemedText themeColor="textSecondary">
              {Math.round(bike.totals.km)} km · {bike.totals.hours.toFixed(1)} h · {bike.totals.rides} pedais
            </ThemedText>

            <ThemedText type="subtitle">Peças</ThemedText>
            {bike.parts.length === 0 ? <ThemedText themeColor="textSecondary">Nenhuma peça instalada.</ThemedText> : null}
            {bike.parts.map((part) => (
              <View key={part.id} style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText type="smallBold">{part.label}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {part.componentLabel}
                </ThemedText>
                {part.plans.map((plan) => (
                  <View key={plan.planId} style={styles.plan}>
                    <ThemedText type="small" style={styles.flex}>
                      {plan.planName}
                    </ThemedText>
                    <WearMeter plan={plan} />
                  </View>
                ))}
              </View>
            ))}
            {bike.removedCount > 0 ? (
              <ThemedText type="small" themeColor="textSecondary">
                {bike.removedCount} peças trocadas no histórico.
              </ThemedText>
            ) : null}

            <ThemedText type="subtitle">Histórico</ThemedText>
            {bike.events.length === 0 ? <ThemedText themeColor="textSecondary">Sem manutenções registradas.</ThemedText> : null}
            {bike.events.map((e) => (
              <View key={e.id} style={styles.event}>
                <ThemedText type="smallBold">
                  {EVENT_LABEL[e.type]} · {new Date(e.date).toLocaleDateString('pt-BR')}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {e.note}
                  {e.shop ? ` (${e.shop})` : ''}
                </ThemedText>
              </View>
            ))}
          </>
        ) : null}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 24, gap: 12 },
  card: { borderRadius: 16, padding: 16, gap: 8 },
  plan: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  event: { gap: 2 },
});
