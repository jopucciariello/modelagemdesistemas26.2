import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/auth-context';
import { BrandLogo } from '@/components/brand-logo';
import { Btn, Field } from '@/components/market-ui';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { admin, type AdminCatalog } from '@/lib/admin';
import { ApiError } from '@/lib/api';

const msg = (e: unknown) => (e instanceof ApiError ? e.message : 'Algo deu errado.');
const num = (s: string) => { const n = Number(s.replace(',', '.')); return Number.isFinite(n) && n > 0 ? n : undefined; };

/** RF30, RF31, RF37, RB15, RB16: catalog families/components, admins and model requests (admin only). */
export default function AdminScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const t = useTheme();
  const [data, setData] = useState<AdminCatalog | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const set = (k: string) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const load = useCallback(() => admin.catalog().then(setData).catch((e) => Alert.alert('Erro', msg(e))), []);
  useEffect(() => { if (user?.role === 'ADMIN') void load(); }, [user, load]);
  const run = (p: Promise<unknown>, clear: string[] = []) =>
    p.then(() => { setForm((f) => { const n = { ...f }; clear.forEach((k) => delete n[k]); return n; }); return load(); }).catch((e) => Alert.alert('Erro', msg(e)));

  if (user?.role !== 'ADMIN') {
    return <ThemedView style={{ flex: 1, padding: 24 }}><ThemedText>Acesso restrito ao administrador.</ThemedText></ThemedView>;
  }
  const card = { gap: 6, padding: 16, borderWidth: 1, borderColor: t.border } as const;

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }} keyboardShouldPersistTaps="handled">
          <BrandLogo size={32} />
          <Pressable onPress={() => router.back()}><ThemedText type="link">‹ Voltar</ThemedText></Pressable>
          <ThemedText type="title">Admin</ThemedText>
          {!data && <ThemedText themeColor="textSecondary">Carregando…</ThemedText>}
          {data && (
            <>
              <View style={{ gap: 10 }}>
                <ThemedText type="subtitle">Pedidos de modelo</ThemedText>
                {data.modelRequests.length === 0 && <ThemedText themeColor="textSecondary">Nenhum pedido aberto.</ThemedText>}
                {data.modelRequests.map((r) => (
                  <View key={r.id} style={card}>
                    <ThemedText type="smallBold">{r.kind === 'BIKE' ? 'Bike' : 'Componente'}{r.family ? ` · ${r.family}` : ''} · {r.user.name}</ThemedText>
                    <ThemedText type="small">{r.text}</ThemedText>
                    <Field placeholder="Resposta (obrigatória para recusar)" value={form[`r${r.id}`] ?? ''} onChangeText={set(`r${r.id}`)} />
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <Btn label="Cadastrado" onPress={() => run(admin.answerRequest(r.id, { status: 'REGISTERED', reply: form[`r${r.id}`] || undefined }), [`r${r.id}`])} />
                      <Btn label="Recusar" onPress={() => run(admin.answerRequest(r.id, { status: 'REJECTED', reply: form[`r${r.id}`] }), [`r${r.id}`])} />
                    </View>
                  </View>
                ))}
              </View>

              <View style={{ gap: 10 }}>
                <ThemedText type="subtitle">Catálogo</ThemedText>
                <View style={card}>
                  <ThemedText type="smallBold">Nova família</ThemedText>
                  <Field placeholder="Nome (ex.: Transmissão)" value={form.catName ?? ''} onChangeText={set('catName')} />
                  <Btn label="Criar família" onPress={() => run(admin.createCategory({ name: form.catName ?? '' }), ['catName'])} />
                </View>
                {data.categories.map((c) => (
                  <View key={c.id} style={card}>
                    <Pressable onPress={() => setOpen(open === c.id ? null : c.id)}>
                      <ThemedText type="smallBold">{open === c.id ? '▾' : '▸'} {c.name}{c.active ? '' : ' (inativa)'} · {c.components.length} componentes</ThemedText>
                    </Pressable>
                    {open === c.id && (
                      <View style={{ gap: 8 }}>
                        <ThemedText type="small" themeColor="textSecondary">Planos de manutenção</ThemedText>
                        {c.plans.length === 0 && <ThemedText type="small">Sem planos (sem desgaste regular).</ThemedText>}
                        {c.plans.map((p) => (
                          <View key={p.id} style={{ flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            <ThemedText type="small">{p.name}: {p.intervalKm ? `${p.intervalKm} km` : ''}{p.intervalKm && p.intervalHours ? ' / ' : ''}{p.intervalHours ? `${p.intervalHours} h` : ''} ({p.action === 'SERVICE' ? 'revisão' : 'troca'})</ThemedText>
                            <Pressable onPress={() => run(admin.deletePlan(p.id))}><ThemedText type="link">remover</ThemedText></Pressable>
                          </View>
                        ))}
                        <Field placeholder="Novo plano: nome" value={form[`pn${c.id}`] ?? ''} onChangeText={set(`pn${c.id}`)} />
                        <Field placeholder="Intervalo em km" keyboardType="numeric" value={form[`pk${c.id}`] ?? ''} onChangeText={set(`pk${c.id}`)} />
                        <Field placeholder="Intervalo em horas" keyboardType="numeric" value={form[`ph${c.id}`] ?? ''} onChangeText={set(`ph${c.id}`)} />
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <Btn label="Plano de troca" onPress={() => run(admin.addPlan(c.id, { name: form[`pn${c.id}`] ?? '', intervalKm: num(form[`pk${c.id}`] ?? ''), intervalHours: num(form[`ph${c.id}`] ?? ''), action: 'REPLACE' }), [`pn${c.id}`, `pk${c.id}`, `ph${c.id}`])} />
                          <Btn label="Plano de revisão" onPress={() => run(admin.addPlan(c.id, { name: form[`pn${c.id}`] ?? '', intervalKm: num(form[`pk${c.id}`] ?? ''), intervalHours: num(form[`ph${c.id}`] ?? ''), action: 'SERVICE' }), [`pn${c.id}`, `pk${c.id}`, `ph${c.id}`])} />
                        </View>
                        <Btn label={c.active ? 'Desativar família' : 'Ativar família'} onPress={() => run(admin.updateCategory(c.id, { active: !c.active }))} />

                        <ThemedText type="small" themeColor="textSecondary">Componentes</ThemedText>
                        {c.components.map((m) => (
                          <View key={m.id} style={{ flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            <ThemedText type="small">{m.code ? `${m.code} · ` : ''}{m.brand} {m.model}{m.active ? '' : ' (inativo)'}</ThemedText>
                            <Pressable onPress={() => run(admin.toggleComponent(m.id))}><ThemedText type="link">{m.active ? 'desativar' : 'ativar'}</ThemedText></Pressable>
                          </View>
                        ))}
                        <Field placeholder="Marca" value={form[`cb${c.id}`] ?? ''} onChangeText={set(`cb${c.id}`)} />
                        <Field placeholder="Modelo" value={form[`cm${c.id}`] ?? ''} onChangeText={set(`cm${c.id}`)} />
                        <Field placeholder="Código (opcional, ex.: TRX-018)" autoCapitalize="characters" value={form[`cc${c.id}`] ?? ''} onChangeText={set(`cc${c.id}`)} />
                        <Btn label="Adicionar componente" onPress={() => run(admin.createComponent({ categoryId: c.id, brand: form[`cb${c.id}`] ?? '', model: form[`cm${c.id}`] ?? '', code: form[`cc${c.id}`] || undefined }), [`cb${c.id}`, `cm${c.id}`, `cc${c.id}`])} />
                      </View>
                    )}
                  </View>
                ))}
              </View>

              <View style={{ gap: 10 }}>
                <ThemedText type="subtitle">Administradores</ThemedText>
                {data.admins.root.map((e) => <ThemedText key={e} type="small">{e} (raiz)</ThemedText>)}
                {data.admins.added.map((e) => (
                  <View key={e} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                    <ThemedText type="small">{e}</ThemedText>
                    <Pressable onPress={() => run(admin.removeAdmin(e))}><ThemedText type="link">remover</ThemedText></Pressable>
                  </View>
                ))}
                <Field placeholder="E-mail do novo administrador" autoCapitalize="none" keyboardType="email-address" value={form.adminEmail ?? ''} onChangeText={set('adminEmail')} />
                <Btn label="Incluir administrador" onPress={() => run(admin.addAdmin(form.adminEmail ?? ''), ['adminEmail'])} />
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}
