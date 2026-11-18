import { Link } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';

import { FontFamily, StatusColors } from '@/constants/theme';
import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { formatDuration, formatPrice, formatStart } from '@/lib/oficinas';
import {
  addService, formatDayWindows, getMyWorkshop, inviteMember, parseDayWindows, parsePriceCents, removeMember, removeService, requestWorkshop,
  saveHours, saveProfile, WEEKDAYS, type StaffView,
} from '@/lib/oficinas-staff';

type Workshop = Extract<StaffView, { workshop: { id: string } }>;

/** RF25, RB21: a oficina pede cadastro; aprovada, o responsável (ou mecânico) cuida do perfil, serviços e grade. */
export default function MinhaOficinaScreen() {
  const [view, setView] = useState<StaffView | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setView(await getMyWorkshop());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar');
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  if (!view) {
    return <ThemedView style={styles.center}>{error ? <ThemedText>{error}</ThemedText> : <ActivityIndicator />}</ThemedView>;
  }
  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
        {error && <ThemedText style={styles.error}>{error}</ThemedText>}
        {view.workshop ? <Backoffice view={view as Workshop} reload={load} onError={setError} /> : <Request view={view} reload={load} onError={setError} />}
      </ScrollView>
    </ThemedView>
  );
}

function Field(props: { label: string; value: string; onChangeText: (v: string) => void; placeholder?: string; multiline?: boolean; keyboardType?: 'default' | 'numeric' | 'email-address' }) {
  const theme = useTheme();
  return (
    <ThemedView style={{ gap: 4 }}>
      <ThemedText type="small" themeColor="textSecondary">{props.label}</ThemedText>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor={theme.textSecondary}
        multiline={props.multiline}
        keyboardType={props.keyboardType}
        autoCapitalize={props.keyboardType === 'email-address' ? 'none' : 'sentences'}
        style={[styles.input, { color: theme.text, borderColor: theme.border }, props.multiline && { minHeight: 72 }]}
      />
    </ThemedView>
  );
}

type Props = { reload: () => Promise<void>; onError: (m: string | null) => void };

async function run(fn: () => Promise<unknown>, { reload, onError }: Props) {
  try {
    onError(null);
    await fn();
    await reload();
  } catch (e) {
    onError(e instanceof Error ? e.message : 'Não foi possível salvar');
  }
}

function Request({ view, ...p }: { view: StaffView } & Props) {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [text, setText] = useState('');
  const status = view.workshop === null ? view.request?.status : null;

  if (status === 'PENDING') {
    return (
      <>
        <ThemedText type="title">Pedido enviado</ThemedText>
        <ThemedText themeColor="textSecondary">O administrador está analisando o cadastro da sua oficina. Você será liberado aqui assim que for aprovado.</ThemedText>
      </>
    );
  }
  return (
    <>
      <ThemedText type="title">Cadastrar minha oficina</ThemedText>
      {status === 'REJECTED' && <ThemedText themeColor="textSecondary">O último pedido foi recusado. Você pode enviar de novo.</ThemedText>}
      <Field label="Nome da oficina" value={name} onChangeText={setName} />
      <Field label="Contato (telefone ou e-mail)" value={contact} onChangeText={setContact} />
      <Field label="Fale sobre a oficina" value={text} onChangeText={setText} multiline />
      <Button label="Enviar pedido" onPress={() => run(() => requestWorkshop({ name, contact, requestText: text }), p)} />
    </>
  );
}

function Backoffice({ view, ...p }: { view: Workshop } & Props) {
  const w = view.workshop;
  const theme = useTheme();
  const [name, setName] = useState(w.name);
  const [description, setDescription] = useState(w.description ?? '');
  const [address, setAddress] = useState(w.address ?? '');
  const [phone, setPhone] = useState(w.phone ?? '');
  const [website, setWebsite] = useState(w.website ?? '');
  const [lat, setLat] = useState(w.latitude?.toString() ?? '');
  const [lng, setLng] = useState(w.longitude?.toString() ?? '');
  const [days, setDays] = useState(WEEKDAYS.map((_, i) => formatDayWindows(view.hours, i)));
  const [sName, setSName] = useState('');
  const [sMin, setSMin] = useState('60');
  const [sPrice, setSPrice] = useState('');
  const [sIncludes, setSIncludes] = useState('');
  const [email, setEmail] = useState('');

  const num = (s: string) => (s.trim() ? Number(s.replace(',', '.')) : null);

  function submitHours() {
    const all = days.map((d, i) => parseDayWindows(d, i));
    if (all.some((d) => d === null)) return p.onError('Horário inválido. Use o formato 09:00-12:00, 14:00-18:00 (de 30 em 30 minutos).');
    return run(() => saveHours(all.flatMap((d) => d!)), p);
  }

  return (
    <>
      <ThemedText type="title">{w.name}</ThemedText>

      <ThemedText type="subtitle">Perfil</ThemedText>
      <Field label="Nome" value={name} onChangeText={setName} />
      <Field label="Descrição" value={description} onChangeText={setDescription} multiline />
      <Field label="Endereço" value={address} onChangeText={setAddress} />
      <Field label="Telefone" value={phone} onChangeText={setPhone} />
      <Field label="Site (https://…)" value={website} onChangeText={setWebsite} />
      <Field label="Latitude (para aparecer por distância)" value={lat} onChangeText={setLat} keyboardType="numeric" placeholder="-23.5505" />
      <Field label="Longitude" value={lng} onChangeText={setLng} keyboardType="numeric" placeholder="-46.6333" />
      <Button
        label="Salvar perfil"
        onPress={() => run(() => saveProfile({ name, description, address, phone, website, latitude: num(lat), longitude: num(lng) }), p)}
      />

      <ThemedText type="subtitle">Grade semanal</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">Horários de atendimento por dia, ex.: 09:00-12:00, 14:00-18:00. Deixe vazio para fechado.</ThemedText>
      {WEEKDAYS.map((d, i) => (
        <Field key={d} label={d} value={days[i]} onChangeText={(v) => setDays((cur) => cur.map((x, j) => (j === i ? v : x)))} />
      ))}
      <Button label="Salvar grade" onPress={submitHours} />

      <ThemedText type="subtitle">Serviços</ThemedText>
      {view.services.map((s) => (
        <ThemedView key={s.id} style={[styles.card, { borderColor: theme.border }]}>
          <ThemedText type="smallBold">{s.name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">{formatPrice(s.priceCents)} · {formatDuration(s.durationMin)}</ThemedText>
          <Pressable onPress={() => run(() => removeService(s.id), p)}><ThemedText type="link">Remover</ThemedText></Pressable>
        </ThemedView>
      ))}
      <Field label="Novo serviço" value={sName} onChangeText={setSName} placeholder="Revisão completa" />
      <Field label="Duração estimada (minutos, de 15 em 15)" value={sMin} onChangeText={setSMin} keyboardType="numeric" />
      <Field label="Valor em R$ (opcional)" value={sPrice} onChangeText={setSPrice} keyboardType="numeric" />
      <Field label="O que inclui (um item por linha)" value={sIncludes} onChangeText={setSIncludes} multiline />
      <Button
        label="Adicionar serviço"
        onPress={() =>
          run(async () => {
            await addService({ name: sName, durationMin: Number(sMin), priceCents: parsePriceCents(sPrice), includes: sIncludes });
            setSName('');
            setSPrice('');
            setSIncludes('');
          }, p)
        }
      />

      {w.isOwner && (
        <>
          <ThemedText type="subtitle">Mecânicos</ThemedText>
          {view.members.map((m) => (
            <ThemedView key={m.id} style={[styles.card, { borderColor: theme.border }]}>
              <ThemedText>{m.email}</ThemedText>
              <Pressable onPress={() => run(() => removeMember(m.id), p)}><ThemedText type="link">Remover</ThemedText></Pressable>
            </ThemedView>
          ))}
          <Field label="Convidar mecânico (e-mail do login Google)" value={email} onChangeText={setEmail} keyboardType="email-address" />
          <Button label="Convidar" onPress={() => run(async () => { await inviteMember(email); setEmail(''); }, p)} />
        </>
      )}

      <ThemedText type="subtitle">Próximos agendamentos</ThemedText>
      {view.appointments.length === 0 && <ThemedText themeColor="textSecondary">Nenhum agendamento.</ThemedText>}
      {view.appointments.map((a) => (
        <ThemedView key={a.id} style={[styles.card, { borderColor: theme.border }]}>
          <ThemedText type="smallBold">{formatStart(a.startsAt)} · {a.athlete}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">{a.bike}{a.service ? ` · ${a.service}` : ''}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">Histórico {a.shareHistory ? 'compartilhado' : 'não compartilhado'}</ThemedText>
          <Link href={{ pathname: '/oficinas/atendimento', params: { id: a.id } }} asChild>
            <Pressable><ThemedText type="link">Abrir e concluir</ThemedText></Pressable>
          </Link>
        </ThemedView>
      ))}

      <ThemedText type="subtitle">Avisos</ThemedText>
      {view.notices.length === 0 && <ThemedText themeColor="textSecondary">Sem avisos.</ThemedText>}
      {view.notices.map((n) => (
        <ThemedView key={n.id} style={[styles.card, { borderColor: theme.border }]}>
          {n.urgent && <ThemedText type="smallBold" style={styles.error}>Urgente</ThemedText>}
          <ThemedText type="small">{n.message}</ThemedText>
        </ThemedView>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  input: { borderWidth: 1, padding: 12, fontSize: 16, fontFamily: FontFamily.body },
  card: { borderWidth: 1, padding: 12, gap: 2 },
  error: { color: StatusColors.due },
});
