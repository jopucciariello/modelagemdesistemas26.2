import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { today } from '@/features/painel/maintenance';
import { addRide, chooseBike, syncRides } from '@/features/painel/rides';
import type { RidesDto } from '@/features/painel/types';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';

const SOURCE_LABEL = { MANUAL: 'lançamento manual', STRAVA: 'API do Strava', CONNECTOR: 'conector' } as const;

/** RF06, RF13, RF14, OPEN-20: pedais recentes, sincronização e lançamento manual. */
export default function PedaisScreen() {
  const theme = useTheme();
  const [data, setData] = useState<RidesDto | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [bikeId, setBikeId] = useState('');
  const [date, setDate] = useState(today());
  const [km, setKm] = useState('');
  const [hours, setHours] = useState('');

  const load = useCallback(async () => {
    try {
      const next = await api<RidesDto>('/api/rides');
      setData(next);
      setBikeId((current) => current || next.bikes[0]?.id || '');
    } catch {
      setMessage('Não foi possível carregar os pedais.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const input = [styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }];

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="title">Pedais</ThemedText>
          {data ? (
            <ThemedText themeColor="textSecondary">Fonte: {SOURCE_LABEL[data.source]}</ThemedText>
          ) : null}
          {message ? <ThemedText themeColor="textSecondary">{message}</ThemedText> : null}

          {data && data.source !== 'MANUAL' ? (
            <Pressable
              accessibilityRole="button"
              onPress={async () => {
                const result = await syncRides();
                setMessage('error' in result ? result.error : `${result.imported} pedais novos.`);
                await load();
              }}>
              <ThemedText type="link">Sincronizar agora</ThemedText>
            </Pressable>
          ) : null}

          <ThemedText type="subtitle">Lançar pedal</ThemedText>
          <View style={styles.row}>
            {data?.bikes.map((b) => (
              <Pressable key={b.id} onPress={() => setBikeId(b.id)} accessibilityRole="button">
                <ThemedText type={bikeId === b.id ? 'smallBold' : 'small'} themeColor={bikeId === b.id ? 'text' : 'textSecondary'}>
                  {b.name}
                </ThemedText>
              </Pressable>
            ))}
          </View>
          <TextInput value={date} onChangeText={setDate} autoCapitalize="none" placeholder="AAAA-MM-DD" placeholderTextColor={theme.textSecondary} style={input} />
          <TextInput value={km} onChangeText={setKm} keyboardType="decimal-pad" placeholder="Distância (km)" placeholderTextColor={theme.textSecondary} style={input} />
          <TextInput value={hours} onChangeText={setHours} keyboardType="decimal-pad" placeholder="Tempo em movimento (h)" placeholderTextColor={theme.textSecondary} style={input} />
          <Pressable
            accessibilityRole="button"
            onPress={async () => {
              const failure = await addRide({ bikeId, date, distanceKm: km, movingHours: hours });
              setMessage(failure ?? 'Pedal salvo.');
              if (!failure) {
                setKm('');
                setHours('');
                await load();
              }
            }}>
            <ThemedText type="link">Salvar pedal</ThemedText>
          </Pressable>

          <ThemedText type="subtitle">Recentes</ThemedText>
          {data?.rides.length === 0 ? <ThemedText themeColor="textSecondary">Nenhum pedal ainda.</ThemedText> : null}
          {data?.rides.map((r) => (
            <View key={r.id} style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="smallBold">
                {new Date(r.date).toLocaleDateString('pt-BR')} · {r.distanceKm.toFixed(1)} km · {r.movingHours.toFixed(1)} h
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {r.bikeName ?? 'Sem bike'}
              </ThemedText>
              {r.canChooseBike ? (
                <View style={styles.row}>
                  {data.bikes.map((b) => (
                    <Pressable
                      key={b.id}
                      accessibilityRole="button"
                      onPress={async () => {
                        const failure = await chooseBike(r.id, b.id);
                        setMessage(failure ?? 'Bike escolhida.');
                        await load();
                      }}>
                      <ThemedText type="link">{b.name}</ThemedText>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 24, gap: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  input: { borderRadius: 12, padding: 12, fontSize: 16 },
  card: { borderRadius: 16, padding: 16, gap: 6 },
});
