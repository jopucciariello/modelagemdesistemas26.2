import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { formatStart } from '@/lib/oficinas';
import {
  CONDITION_LABEL, concludeAppointment, getStaffAppointment, todayInSaoPaulo, type Condition, type ConcludeBody, type StaffAppointment, type VisitAction,
} from '@/lib/oficinas-staff';

type RowState = { action: VisitAction | ''; condition: Condition | '' };
const ACTIONS: { value: VisitAction; label: string }[] = [
  { value: 'check', label: 'Verificado' },
  { value: 'reset', label: 'Zerar contador' },
  { value: 'replace', label: 'Trocada' },
];
const CONDITIONS = Object.keys(CONDITION_LABEL) as Condition[];

/** RF27, RF28: a oficina vê a bike (histórico só se o atleta compartilhou) e conclui o serviço. */
export default function AtendimentoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const [appt, setAppt] = useState<StaffAppointment | null>(null);
  const [rows, setRows] = useState<Record<string, RowState>>({});
  const [free, setFree] = useState([{ label: '', replace: false }, { label: '', replace: false }, { label: '', replace: false }]);
  const [date, setDate] = useState(todayInSaoPaulo());
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getStaffAppointment(id)
      .then((a) => {
        setAppt(a);
        setNote(a.service?.name ?? '');
        const included = a.service?.includes ? a.service.includes.split('\n') : [];
        setFree((cur) => cur.map((f, i) => ({ ...f, label: included[i] ?? '' })));
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Erro ao carregar'));
  }, [id]);

  if (!appt) {
    return <ThemedView style={styles.center}>{error ? <ThemedText>{error}</ThemedText> : <ActivityIndicator />}</ThemedView>;
  }
  const open = appt.status === 'SCHEDULED';
  const chip = (on: boolean) => [styles.chip, { backgroundColor: on ? theme.backgroundSelected : theme.backgroundElement }];

  async function conclude() {
    if (!appt) return;
    const body: ConcludeBody = {
      date,
      note,
      items: appt.rows.flatMap((r) => {
        const s = rows[r.key];
        return s && (s.action || s.condition) ? [{ key: r.key, action: s.action || 'check', ...(s.condition ? { condition: s.condition } : {}) }] : [];
      }),
      free: free.filter((f) => f.label.trim()).map((f) => ({ label: f.label.trim(), action: f.replace ? 'replace' : 'check' })),
    };
    setBusy(true);
    setError(null);
    try {
      await concludeAppointment(id, body);
      router.replace('/oficinas/minha-oficina');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível concluir');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} keyboardShouldPersistTaps="handled">
        <ThemedText type="title">{appt.bike.name}</ThemedText>
        <ThemedText themeColor="textSecondary">
          {[appt.bike.brand, appt.bike.model, appt.bike.year].filter(Boolean).join(' ')} · {appt.athlete} · {formatStart(appt.startsAt)}
        </ThemedText>
        {appt.service && <ThemedText type="smallBold">Serviço: {appt.service.name}</ThemedText>}
        <ThemedText type="small" themeColor="textSecondary">
          {appt.shareHistory
            ? 'O atleta compartilhou o histórico desta bike. O acesso é somente leitura e termina se o agendamento for cancelado.'
            : 'O atleta não compartilhou o histórico: você vê só o agendamento e registra o serviço em itens livres.'}
        </ThemedText>

        {appt.shareHistory && (
          <>
            <ThemedText type="subtitle">Peças instaladas</ThemedText>
            {appt.parts.length === 0 && <ThemedText themeColor="textSecondary">Nenhuma peça cadastrada.</ThemedText>}
            {appt.parts.map((p) => (
              <ThemedText key={p.id} type="small">{p.name}: {p.component}</ThemedText>
            ))}
            <ThemedText type="subtitle">Histórico</ThemedText>
            {appt.history.length === 0 && <ThemedText themeColor="textSecondary">Sem registros.</ThemedText>}
            {appt.history.slice(0, 10).map((h) => (
              <ThemedText key={h.id} type="small">{h.date.slice(0, 10)} · {h.note}</ThemedText>
            ))}
          </>
        )}

        {open && (
          <>
            <ThemedText type="subtitle">Concluir serviço</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">Marque o que foi feito. Itens revisados ou trocados zeram o contador e todos vão para o histórico da bike.</ThemedText>
            <TextInput value={date} onChangeText={setDate} placeholder="AAAA-MM-DD" placeholderTextColor={theme.textSecondary} style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]} />
            <TextInput value={note} onChangeText={setNote} placeholder="Observação geral" placeholderTextColor={theme.textSecondary} style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]} />

            {appt.rows.map((r) => {
              const s = rows[r.key] ?? { action: '', condition: '' };
              const set = (patch: Partial<RowState>) => setRows((cur) => ({ ...cur, [r.key]: { ...s, ...patch } }));
              return (
                <ThemedView key={r.key} style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
                  <ThemedText type="smallBold">{r.label}</ThemedText>
                  <ThemedView style={styles.wrap}>
                    {ACTIONS.filter((a) => a.value !== 'reset' || r.canReset).map((a) => (
                      <Pressable key={a.value} style={chip(s.action === a.value)} onPress={() => set({ action: s.action === a.value ? '' : a.value })}>
                        <ThemedText type="small">{a.value === 'reset' ? r.resetLabel : a.label}</ThemedText>
                      </Pressable>
                    ))}
                  </ThemedView>
                  <ThemedView style={styles.wrap}>
                    {CONDITIONS.map((c) => (
                      <Pressable key={c} style={chip(s.condition === c)} onPress={() => set({ condition: s.condition === c ? '' : c })}>
                        <ThemedText type="small">{CONDITION_LABEL[c]}</ThemedText>
                      </Pressable>
                    ))}
                  </ThemedView>
                </ThemedView>
              );
            })}

            <ThemedText type="smallBold">Outros itens do serviço</ThemedText>
            {free.map((f, i) => (
              <ThemedView key={i} style={{ gap: 6, backgroundColor: 'transparent' }}>
                <TextInput
                  value={f.label}
                  onChangeText={(v) => setFree((cur) => cur.map((x, j) => (j === i ? { ...x, label: v } : x)))}
                  placeholder="Item do serviço"
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
                />
                <Pressable style={chip(f.replace)} onPress={() => setFree((cur) => cur.map((x, j) => (j === i ? { ...x, replace: !x.replace } : x)))}>
                  <ThemedText type="small">{f.replace ? 'Trocado' : 'Verificado / ajustado'} (toque para alternar)</ThemedText>
                </Pressable>
              </ThemedView>
            ))}

            {error && <ThemedText style={{ color: '#d33' }}>{error}</ThemedText>}
            <Pressable onPress={conclude} disabled={busy} style={[styles.button, { opacity: busy ? 0.4 : 1 }]}>
              <ThemedText style={{ color: '#fff' }} type="smallBold">{busy ? 'Concluindo…' : 'Concluir serviço'}</ThemedText>
            </Pressable>
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  input: { borderRadius: 12, padding: 12, fontSize: 16 },
  card: { borderRadius: 12, padding: 12, gap: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, backgroundColor: 'transparent' },
  chip: { borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 },
  button: { backgroundColor: '#2563eb', borderRadius: 12, padding: 14, alignItems: 'center' },
});
