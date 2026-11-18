import { Link } from 'expo-router';
import * as Linking from 'expo-linking';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet } from 'react-native';

import { useAuth } from '@/auth/auth-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { currentPosition, formatDistance, formatPrice, listWorkshops, osmUrl, type Workshop } from '@/lib/oficinas';

/** #69: oficinas próximas, da mais perto para a mais longe, com serviços, valor, site e mapa. */
export default function OficinasScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const [shops, setShops] = useState<Workshop[] | null>(null);
  const [located, setLocated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const origin = await currentPosition();
      setLocated(origin != null);
      setShops(await listWorkshops(origin));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível carregar as oficinas');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText>{error}</ThemedText>
        <Pressable onPress={load}>
          <ThemedText type="link">Tentar de novo</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }
  if (!shops) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <FlatList
        data={shops}
        keyExtractor={(w) => w.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListHeaderComponent={
          <ThemedView style={{ gap: 4, marginBottom: 4 }}>
            <ThemedView style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap', backgroundColor: 'transparent' }}>
              <Link href="/oficinas/agendamentos" asChild>
                <Pressable>
                  <ThemedText type="link">Meus agendamentos</ThemedText>
                </Pressable>
              </Link>
              <Link href="/oficinas/minha-oficina" asChild>
                <Pressable>
                  <ThemedText type="link">Sou uma oficina</ThemedText>
                </Pressable>
              </Link>
              {user?.role === 'ADMIN' && (
                <Link href="/oficinas/admin" asChild>
                  <Pressable>
                    <ThemedText type="link">Pedidos de oficina (admin)</ThemedText>
                  </Pressable>
                </Link>
              )}
            </ThemedView>
            {!located && <ThemedText themeColor="textSecondary" type="small">Sem localização: mostrando por ordem alfabética.</ThemedText>}
          </ThemedView>
        }
        ListEmptyComponent={<ThemedText themeColor="textSecondary">Nenhuma oficina cadastrada ainda.</ThemedText>}
        renderItem={({ item: w }) => {
          const map = osmUrl(w);
          const dist = formatDistance(w.distanceKm);
          const prices = w.services.map((s) => s.priceCents).filter((p): p is number => p != null);
          return (
            <ThemedView style={[styles.card, { borderColor: theme.border }]}>
              <ThemedText type="subtitle">{w.name}</ThemedText>
              {dist && <ThemedText themeColor="textSecondary">{dist}</ThemedText>}
              {w.address && <ThemedText themeColor="textSecondary">{w.address}</ThemedText>}
              <ThemedText type="small">
                {w.services.length} serviço(s){prices.length > 0 ? ` · a partir de ${formatPrice(Math.min(...prices))}` : ''}
              </ThemedText>
              <ThemedView style={{ flexDirection: 'row', gap: 16, backgroundColor: 'transparent' }}>
                <Link href={{ pathname: '/oficinas/[id]', params: { id: w.id } }} asChild>
                  <Pressable>
                    <ThemedText type="linkPrimary">Ver e agendar</ThemedText>
                  </Pressable>
                </Link>
                {w.website && (
                  <Pressable onPress={() => Linking.openURL(w.website!)}>
                    <ThemedText type="link">Site</ThemedText>
                  </Pressable>
                )}
                {map && (
                  <Pressable onPress={() => Linking.openURL(map)}>
                    <ThemedText type="link">Mapa</ThemedText>
                  </Pressable>
                )}
              </ThemedView>
            </ThemedView>
          );
        }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  card: { borderWidth: 1, padding: 16, gap: 6 },
});
