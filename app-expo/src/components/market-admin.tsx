// RF18, RF22, RF24: the admin approves merchant requests, grants the seal and the paid add-on, and moderates reports.
import { useCallback, useEffect, useState } from 'react';
import { Alert, View } from 'react-native';

import { Btn, Field } from '@/components/market-ui';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/lib/api';
import { market, type AdminOverview } from '@/lib/market';

const msg = (e: unknown) => (e instanceof ApiError ? e.message : 'Algo deu errado.');

export function AdminTab() {
  const t = useTheme();
  const [data, setData] = useState<AdminOverview | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const load = useCallback(() => market.adminOverview().then(setData).catch((e) => Alert.alert('Erro', msg(e))), []);
  useEffect(() => { load(); }, [load]);
  const run = (p: Promise<unknown>) => p.then(load).catch((e) => Alert.alert('Erro', msg(e)));
  if (!data) return <ThemedText themeColor="textSecondary">Carregando…</ThemedText>;
  return (
    <View style={{ gap: 20 }}>
      <View style={{ gap: 10 }}>
        <ThemedText type="subtitle">Pedidos de lojista</ThemedText>
        {data.requests.length === 0 && <ThemedText themeColor="textSecondary">Nenhum pedido pendente.</ThemedText>}
        {data.requests.map((r) => (
          <View key={r.id} style={{ gap: 4, padding: 16, borderWidth: 1, borderColor: t.border }}>
            <ThemedText type="smallBold">{r.storeName} · {r.user.name}</ThemedText>
            <ThemedText type="small">{r.message}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">Contato: {r.contact}{r.shopUrl ? ` · ${r.shopUrl}` : ''}</ThemedText>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Btn label="Aprovar" onPress={() => run(market.decideRequest(r.id, true))} />
              <Btn label="Recusar" onPress={() => run(market.decideRequest(r.id, false))} />
            </View>
          </View>
        ))}
      </View>

      <View style={{ gap: 10 }}>
        <ThemedText type="subtitle">Lojistas</ThemedText>
        {data.merchants.map((m) => (
          <View key={m.id} style={{ gap: 4, padding: 16, borderWidth: 1, borderColor: t.border }}>
            <ThemedText type="smallBold">{m.name}{m.verified ? ' ✓' : ''}</ThemedText>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              <Btn label={m.verified ? 'Revogar selo' : 'Conceder selo'} onPress={() => run(market.setMerchantFlags(m.id, { verified: !m.verified }))} />
              <Btn label={m.dreamAlerts ? 'Desativar alertas de sonho' : 'Ativar alertas de sonho (pago)'} onPress={() => run(market.setMerchantFlags(m.id, { dreamAlerts: !m.dreamAlerts }))} />
            </View>
          </View>
        ))}
      </View>

      <View style={{ gap: 10 }}>
        <ThemedText type="subtitle">Denúncias</ThemedText>
        {data.reports.length === 0 && <ThemedText themeColor="textSecondary">Nenhuma denúncia aberta.</ThemedText>}
        {data.reports.map((r) => (
          <View key={r.id} style={{ gap: 4, padding: 16, borderWidth: 1, borderColor: t.border }}>
            <ThemedText type="smallBold">{r.listing.title}</ThemedText>
            <ThemedText type="small">{r.reason}</ThemedText>
            <Field placeholder="Motivo da remoção" value={reasons[r.listing.id] ?? ''} onChangeText={(t) => setReasons((x) => ({ ...x, [r.listing.id]: t }))} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Btn label="Remover anúncio" onPress={() => run(market.resolveListing(r.listing.id, reasons[r.listing.id] ?? ''))} />
              <Btn label="Dispensar" onPress={() => run(market.resolveListing(r.listing.id, null))} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
