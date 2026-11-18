import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Field } from '@/components/field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import type { BikeDetailDto } from '@/features/painel/types';
import { WearMeter } from '@/features/painel/wear-meter';
import { useTheme } from '@/hooks/use-theme';
import { addMaintenance, replacePart, servicePlan, today } from '@/features/painel/maintenance';
import { api, ApiError } from '@/lib/api';

const EVENT_LABEL = { REPLACEMENT: 'Troca', SERVICE: 'Revisão', MANUAL: 'Manutenção' } as const;

/** RF01, RF02, RF07, RF11: uma bike com peças, desgaste e histórico (somente leitura por enquanto). */
export default function BikeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const [bike, setBike] = useState<BikeDetailDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState(today());
  const [note, setNote] = useState('');
  const [message, setMessage] = useState<string | null>(null);

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

  /** Roda uma escrita, mostra o aviso e recarrega a bike (o desgaste muda). */
  async function run(action: () => Promise<string | null>, success: string) {
    const failure = await action();
    setMessage(failure ?? success);
    if (!failure) await load();
  }

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

            <ThemedText type="subtitle">Registrar</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Data do registro (AAAA-MM-DD)
            </ThemedText>
            <Field value={date} onChangeText={setDate} autoCapitalize="none" />
            <Field value={note} onChangeText={setNote} placeholder="Manutenção manual (ex.: lubrifiquei a corrente)" />
            <Button
              label="Registrar manutenção"
              onPress={() =>
                void run(async () => {
                  const failure = await addMaintenance(bike.id, date, note);
                  if (!failure) setNote('');
                  return failure;
                }, 'Manutenção registrada no histórico.')
              }
            />
            {message ? <ThemedText themeColor="textSecondary">{message}</ThemedText> : null}

            <ThemedText type="subtitle">Peças</ThemedText>
            {bike.parts.length === 0 ? <ThemedText themeColor="textSecondary">Nenhuma peça instalada.</ThemedText> : null}
            {bike.parts.map((part) => (
              <View key={part.id} style={[styles.card, { borderColor: theme.border }]}>
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
                    <Button
                      label={plan.action === 'SERVICE' ? 'Revisei' : 'Troquei'}
                      variant="outline"
                      style={styles.small}
                      onPress={() =>
                        void run(
                          () => servicePlan(plan.planId, date),
                          plan.action === 'SERVICE' ? 'Revisão registrada: o contador recomeçou.' : 'Troca do item registrada.',
                        )
                      }
                    />
                  </View>
                ))}
                <Button
                  label="Trocar a peça inteira (mesmo modelo)"
                  variant="outline"
                  onPress={() => void run(() => replacePart(part.id, date), 'Peça trocada: a nova começa do zero.')}
                />
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
  card: { borderWidth: 1, padding: 16, gap: 10 },
  small: { paddingVertical: 8, paddingHorizontal: 14, minHeight: 36 },
  plan: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  event: { gap: 2 },
});
