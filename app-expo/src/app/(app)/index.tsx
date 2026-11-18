import { Link } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/auth/auth-context';
import type { DashboardDto } from '@/features/painel/types';
import { WearMeter } from '@/features/painel/wear-meter';
import { api } from '@/lib/api';
import { useTheme } from '@/hooks/use-theme';

/** RF15: painel com um cartão por bike e as peças mais gastas primeiro. */
export default function PainelScreen() {
  const { user } = useAuth();
  const theme = useTheme();
  const [data, setData] = useState<DashboardDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await api<DashboardDto>('/api/dashboard'));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível carregar o painel.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await load();
                setRefreshing(false);
              }}
            />
          }>
          <ThemedText type="title">Olá, {user?.name.split(' ')[0]}</ThemedText>
          {error ? <ThemedText themeColor="textSecondary">{error}</ThemedText> : null}
          {!data && !error ? <ThemedText themeColor="textSecondary">Carregando…</ThemedText> : null}

          {data ? (
            <>
              <View style={styles.counts}>
                <Count label="pedem troca/revisão" value={data.counts.due} color="#d64545" />
                <Count label="perto do limite" value={data.counts.near} color="#d9a400" />
                <Count label="em dia" value={data.counts.ok} color="#2e9e5b" />
              </View>

              {data.bikes.length === 0 ? (
                <ThemedText themeColor="textSecondary">
                  Nenhuma bike ainda. Cadastre a primeira e instale as peças para acompanhar o desgaste.
                </ThemedText>
              ) : null}

              {data.bikes.map((bike) => (
                <View key={bike.id} style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
                  <Link href={{ pathname: '/bike/[id]', params: { id: bike.id } }}>
                    <ThemedText type="subtitle">{bike.name}</ThemedText>
                  </Link>
                  <ThemedText type="small" themeColor="textSecondary">
                    {bike.plans.length === 0
                      ? 'Sem peças instaladas'
                      : bike.alerts === 0
                        ? 'Tudo em dia'
                        : `${bike.alerts} ${bike.alerts === 1 ? 'alerta' : 'alertas'}`}
                  </ThemedText>
                  {bike.plans.map((plan) => (
                    <View key={plan.planId} style={styles.plan}>
                      <View style={styles.flex}>
                        <ThemedText type="smallBold">{plan.partLabel}</ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          {plan.planName} · {plan.componentLabel}
                        </ThemedText>
                      </View>
                      <WearMeter plan={plan} />
                    </View>
                  ))}
                </View>
              ))}
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function Count({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.count}>
      <ThemedText type="title" style={{ color }}>
        {value}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 24, gap: 16 },
  counts: { flexDirection: 'row', gap: 16 },
  count: { flex: 1 },
  card: { borderRadius: 16, padding: 16, gap: 12 },
  plan: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
