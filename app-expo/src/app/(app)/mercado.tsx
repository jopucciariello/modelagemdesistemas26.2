import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Btn, Field } from '@/components/market-ui';
import { LojaTab } from '@/components/market-loja';
import { AdminTab } from '@/components/market-admin';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ApiError } from '@/lib/api';
import { brl, market, type Component, type Dream, type Listing, type Notice } from '@/lib/market';

type Tab = 'vitrine' | 'vender' | 'sonhos' | 'avisos' | 'loja' | 'admin';
const TABS: [Tab, string][] = [['vitrine', 'Vitrine'], ['vender', 'Vender'], ['sonhos', 'Sonhos'], ['avisos', 'Avisos'], ['loja', 'Minha loja']];
const msg = (e: unknown) => (e instanceof ApiError ? e.message : 'Algo deu errado.');
const toCents = (s: string) => Math.round(Number(s.replace(/\./g, '').replace(',', '.')) * 100);

/** RF21: picks a catalog model by searching brand or model. */
function ModelPicker({ onPick, picked }: { onPick: (c: Component) => void; picked: Component | null }) {
  const [q, setQ] = useState('');
  const [found, setFound] = useState<Component[]>([]);
  useEffect(() => {
    if (q.trim().length < 2) return setFound([]);
    const h = setTimeout(() => market.components(q.trim()).then(setFound).catch(() => setFound([])), 300);
    return () => clearTimeout(h);
  }, [q]);
  return (
    <View style={{ gap: 6 }}>
      <Field placeholder="Buscar modelo do catálogo (marca ou modelo)" value={q} onChangeText={setQ} />
      {picked && <ThemedText type="smallBold">Escolhido: {picked.brand} {picked.model}</ThemedText>}
      {found.map((c) => (
        <Pressable key={c.id} onPress={() => { onPick(c); setQ(''); setFound([]); }}>
          <ThemedText type="small">{c.brand} {c.model} · {c.category.name}</ThemedText>
        </Pressable>
      ))}
    </View>
  );
}

function Vitrine() {
  const [rows, setRows] = useState<Listing[]>([]);
  const [cond, setCond] = useState('');
  const [seller, setSeller] = useState('');
  const load = useCallback(() => market.listings({ ...(cond && { condicao: cond }), ...(seller && { vendedor: seller }) }).then(setRows).catch((e) => Alert.alert('Erro', msg(e))), [cond, seller]);
  useEffect(() => { load(); }, [load]);
  const chip = (label: string, on: boolean, set: () => void) => (
    <Pressable key={label} onPress={set}><ThemedText type={on ? 'smallBold' : 'small'} themeColor={on ? 'text' : 'textSecondary'}>{label}</ThemedText></Pressable>
  );
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
        {chip('Todas', !cond, () => setCond(''))}{chip('Novas', cond === 'NEW', () => setCond('NEW'))}{chip('Usadas', cond === 'USED', () => setCond('USED'))}
        {chip('Qualquer vendedor', !seller, () => setSeller(''))}{chip('Lojas', seller === 'loja', () => setSeller('loja'))}{chip('Atletas', seller === 'atleta', () => setSeller('atleta'))}
      </View>
      {rows.length === 0 && <ThemedText themeColor="textSecondary">Nenhum anúncio ainda.</ThemedText>}
      {rows.map((l) => (
        <View key={l.id} style={{ gap: 4, paddingBottom: 12 }}>
          <ThemedText type="smallBold">{l.title} · {brl(l.priceCents)}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {l.condition === 'NEW' ? 'Nova' : `Usada${l.usedKm != null ? ` · ${l.usedKm} km` : ''}`} · {l.category.name}{l.component ? ` · ${l.component.brand} ${l.component.model}` : ''}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">{l.merchant ? `${l.merchant.name}${l.merchant.verified ? ' ✓ verificado' : ''}` : l.seller.name}</ThemedText>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {l.contactUrl && <Btn label="WhatsApp do vendedor" onPress={() => Linking.openURL(l.contactUrl!)} />}
            {l.merchant?.shopUrl && <Btn label="Ir à loja" onPress={() => Linking.openURL(l.merchant!.shopUrl!)} />}
            <Btn label="Denunciar" onPress={() => Alert.prompt?.('Denunciar anúncio', 'Conte o motivo', (reason) => market.report(l.id, reason ?? '').then(() => Alert.alert('Obrigado', 'Denúncia enviada.')).catch((e) => Alert.alert('Erro', msg(e)))) ?? Alert.alert('Denunciar', 'Use o app no celular para denunciar.')} />
          </View>
        </View>
      ))}
    </View>
  );
}

function Vender() {
  const [model, setModel] = useState<Component | null>(null);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [used, setUsed] = useState(false);
  const [km, setKm] = useState('');
  const [desc, setDesc] = useState('');
  const [photos, setPhotos] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [wa, setWa] = useState('');
  useEffect(() => { market.contact().then((c) => setWa(c.whatsapp ?? '')).catch(() => {}); }, []);

  const pick = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: 3 - photos.length, quality: 0.6 });
    if (!r.canceled) setPhotos((p) => [...p, ...r.assets].slice(0, 3));
  };
  const submit = async () => {
    if (!model) return Alert.alert('Escolha o modelo do catálogo.');
    try {
      await market.saveContact({ whatsapp: wa });
      const { id } = await market.publish({ title, componentId: model.id, condition: used ? 'USED' : 'NEW', priceCents: toCents(price), description: desc || undefined, usedKm: used && km ? Number(km) : undefined });
      for (const p of photos) await market.uploadPhoto(id, p.uri, p.mimeType ?? 'image/jpeg');
      Alert.alert('Publicado!');
      setTitle(''); setPrice(''); setDesc(''); setKm(''); setPhotos([]); setModel(null);
    } catch (e) { Alert.alert('Erro', msg(e)); }
  };
  return (
    <View style={{ gap: 10 }}>
      <ModelPicker onPick={(c) => { setModel(c); if (!title) setTitle(`${c.brand} ${c.model}`); }} picked={model} />
      <Field placeholder="Título" value={title} onChangeText={setTitle} />
      <Field placeholder="Preço (R$)" value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Pressable onPress={() => setUsed(false)}><ThemedText type={used ? 'small' : 'smallBold'}>Nova</ThemedText></Pressable>
        <Pressable onPress={() => setUsed(true)}><ThemedText type={used ? 'smallBold' : 'small'}>Usada</ThemedText></Pressable>
      </View>
      {used && <Field placeholder="Km de uso (opcional)" value={km} onChangeText={setKm} keyboardType="decimal-pad" />}
      <Field placeholder="Descrição" value={desc} onChangeText={setDesc} multiline />
      <Field placeholder="Seu WhatsApp com DDD" value={wa} onChangeText={setWa} keyboardType="phone-pad" />
      <ThemedText type="small" themeColor="textSecondary">{photos.length}/3 fotos</ThemedText>
      {photos.length < 3 && <Btn label="Adicionar foto" onPress={pick} />}
      <Btn label="Publicar" onPress={submit} />
    </View>
  );
}

function Sonhos() {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [model, setModel] = useState<Component | null>(null);
  const [price, setPrice] = useState('');
  const load = useCallback(() => market.dreams().then(setDreams).catch((e) => Alert.alert('Erro', msg(e))), []);
  useEffect(() => { load(); }, [load]);
  return (
    <View style={{ gap: 10 }}>
      <ThemedText type="small" themeColor="textSecondary">Escolha um modelo do catálogo e o preço máximo. Avisamos quando aparecer um anúncio do modelo por esse preço ou menos.</ThemedText>
      <ModelPicker onPick={setModel} picked={model} />
      <Field placeholder="Preço máximo (R$)" value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
      <Btn label="Salvar sonho" onPress={() => model && market.addDream(model.id, toCents(price)).then(() => { setModel(null); setPrice(''); load(); }).catch((e) => Alert.alert('Erro', msg(e)))} />
      {dreams.map((d) => (
        <View key={d.id} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <ThemedText type="small">{d.component ? `${d.component.brand} ${d.component.model}` : 'Sonho antigo'} até {brl(d.maxPriceCents)}</ThemedText>
          <Pressable onPress={() => market.removeDream(d.id).then(load)}><ThemedText type="small" themeColor="textSecondary">Remover</ThemedText></Pressable>
        </View>
      ))}
    </View>
  );
}

function Avisos() {
  const [rows, setRows] = useState<Notice[]>([]);
  const [email, setEmail] = useState(false);
  useEffect(() => {
    market.notices().then(setRows).catch(() => {});
    market.contact().then((c) => setEmail(c.emailAlerts)).catch(() => {});
  }, []);
  return (
    <View style={{ gap: 10 }}>
      <Pressable onPress={() => { const v = !email; setEmail(v); market.saveContact({ emailAlerts: v }); }}>
        <ThemedText type="smallBold">{email ? '✓ ' : ''}Receber também por e-mail</ThemedText>
      </Pressable>
      {rows.length > 0 && <Btn label="Marcar todos como lidos" onPress={() => market.readNotices().then(() => setRows((r) => r.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() }))))} />}
      {rows.length === 0 && <ThemedText themeColor="textSecondary">Sem avisos.</ThemedText>}
      {rows.map((n) => <ThemedText key={n.id} type={n.readAt ? 'small' : 'smallBold'}>{n.message}</ThemedText>)}
    </View>
  );
}

export default function MercadoScreen() {
  const [tab, setTab] = useState<Tab>('vitrine');
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => { market.merchantMe().then((m) => setIsAdmin(m.isAdmin)).catch(() => {}); }, []);
  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }} keyboardShouldPersistTaps="handled">
          <ThemedText type="title">Mercado</ThemedText>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            {[...TABS, ...(isAdmin ? ([['admin', 'Admin']] as [Tab, string][]) : [])].map(([k, label]) => (
              <Pressable key={k} onPress={() => setTab(k)}><ThemedText type={tab === k ? 'smallBold' : 'small'} themeColor={tab === k ? 'text' : 'textSecondary'}>{label}</ThemedText></Pressable>
            ))}
          </View>
          {tab === 'vitrine' && <Vitrine />}
          {tab === 'vender' && <Vender />}
          {tab === 'sonhos' && <Sonhos />}
          {tab === 'avisos' && <Avisos />}
          {tab === 'loja' && <LojaTab />}
          {tab === 'admin' && isAdmin && <AdminTab />}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}
