import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/lib/api';
import { book, formatDuration, formatPrice, formatStart, listMyBikes, listSlots, listWorkshops, type Service, type Workshop } from '@/lib/oficinas';

/** RF26, RF27: escolhe serviço, bike e horário livre da grade; o atleta decide se compartilha o histórico. */
export default function OficinaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const [shop, setShop] = useState<Workshop | null>(null);
  const [bikes, setBikes] = useState<{ id: string; name: string }[]>([]);
  const [service, setService] = useState<Service | null>(null);
  const [bikeId, setBikeId] = useState<string | null>(null);
  const [starts, setStarts] = useState<string[] | null>(null);
  const [startsAt, setStartsAt] = useState<string | null>(null);
  const [share, setShare] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([listWorkshops(null), listMyBikes()])
      .then(([shops, myBikes]) => {
        setShop(shops.find((w) => w.id === id) ?? null);
        setBikes(myBikes);
        if (myBikes.length === 1) setBikeId(myBikes[0].id);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Erro ao carregar'));
  }, [id]);

  async function pickService(s: Service) {
    setService(s);
    setStartsAt(null);
    setStarts(null);
    try {
      setStarts(await listSlots(id, s.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar horários');
    }
  }

  async function confirm() {
    if (!service || !bikeId || !startsAt) return;
    setBusy(true);
    setError(null);
    try {
      await book({ workshopId: id, serviceId: service.id, bikeId, startsAt, shareHistory: share });
      router.replace('/oficinas/agendamentos');
    } catch (e) {
      setError(e instanceof ApiError && e.status === 409 ? 'Esse horário acabou de ser ocupado. Escolha outro.' : e instanceof Error ? e.message : 'Erro ao agendar');
      if (service) void pickService(service);
    } finally {
      setBusy(false);
    }
  }

  if (!shop) {
    return (
      <ThemedView style={styles.center}>
        {error ? <ThemedText>{error}</ThemedText> : <ActivityIndicator />}
      </ThemedView>
    );
  }

  const chip = (selected: boolean) => [styles.chip, { backgroundColor: selected ? theme.backgroundSelected : theme.backgroundElement }];

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <ThemedText type="title">{shop.name}</ThemedText>
        {shop.description && <ThemedText themeColor="textSecondary">{shop.description}</ThemedText>}

        <ThemedText type="subtitle">1. Serviço</ThemedText>
        {shop.services.map((s) => (
          <Pressable key={s.id} onPress={() => pickService(s)} style={chip(service?.id === s.id)}>
            <ThemedText type="smallBold">{s.name}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {formatPrice(s.priceCents)} · {formatDuration(s.durationMin)}
            </ThemedText>
            {s.includes ? <ThemedText type="small">{s.includes.split('\n').join(' · ')}</ThemedText> : null}
          </Pressable>
        ))}

        <ThemedText type="subtitle">2. Bike</ThemedText>
        {bikes.length === 0 ? (
          <ThemedText themeColor="textSecondary">Cadastre uma bike no Painel para agendar.</ThemedText>
        ) : (
          bikes.map((b) => (
            <Pressable key={b.id} onPress={() => setBikeId(b.id)} style={chip(bikeId === b.id)}>
              <ThemedText>{b.name}</ThemedText>
            </Pressable>
          ))
        )}

        <ThemedText type="subtitle">3. Horário</ThemedText>
        {!service ? (
          <ThemedText themeColor="textSecondary">Escolha um serviço para ver os horários livres.</ThemedText>
        ) : !starts ? (
          <ActivityIndicator />
        ) : starts.length === 0 ? (
          <ThemedText themeColor="textSecondary">Sem horários livres nos próximos 14 dias.</ThemedText>
        ) : (
          <ThemedView style={styles.wrap}>
            {starts.slice(0, 60).map((s) => (
              <Pressable key={s} onPress={() => setStartsAt(s)} style={chip(startsAt === s)}>
                <ThemedText type="small">{formatStart(s)}</ThemedText>
              </Pressable>
            ))}
          </ThemedView>
        )}

        <ThemedView style={styles.row}>
          <ThemedView style={{ flex: 1 }}>
            <ThemedText type="smallBold">Compartilhar o histórico desta bike</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              A oficina vê os dados da bike, as peças instaladas e o histórico de manutenção só se você aceitar.
            </ThemedText>
          </ThemedView>
          <Switch value={share} onValueChange={setShare} />
        </ThemedView>

        {error && <ThemedText style={{ color: '#d33' }}>{error}</ThemedText>}

        <Pressable
          disabled={busy || !service || !bikeId || !startsAt}
          onPress={confirm}
          style={[styles.button, { opacity: busy || !service || !bikeId || !startsAt ? 0.4 : 1 }]}>
          <ThemedText style={{ color: '#fff' }} type="smallBold">
            {busy ? 'Agendando…' : 'Confirmar agendamento'}
          </ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  chip: { borderRadius: 12, padding: 12, gap: 2 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, backgroundColor: 'transparent' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'transparent' },
  button: { backgroundColor: '#2563eb', borderRadius: 12, padding: 14, alignItems: 'center' },
});
