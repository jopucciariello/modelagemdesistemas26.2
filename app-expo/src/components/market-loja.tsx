// RF18: the user asks to become a merchant; an approved merchant picks the families they sell and the shop link.
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { Btn, Field } from '@/components/market-ui';
import { ThemedText } from '@/components/themed-text';
import { ApiError } from '@/lib/api';
import { market } from '@/lib/market';

const msg = (e: unknown) => (e instanceof ApiError ? e.message : 'Algo deu errado.');
type Me = Awaited<ReturnType<typeof market.merchantMe>>;

export function LojaTab() {
  const [me, setMe] = useState<Me | null>(null);
  const load = useCallback(() => market.merchantMe().then(setMe).catch((e) => Alert.alert('Erro', msg(e))), []);
  useEffect(() => { load(); }, [load]);
  if (!me) return <ThemedText themeColor="textSecondary">Carregando…</ThemedText>;
  if (me.merchant) return <Profile me={me} onSaved={load} />;
  if (me.pendingRequest) return <ThemedText>Seu pedido está em análise. Avisaremos quando o administrador decidir.</ThemedText>;
  return <RequestForm onSent={load} />;
}

function RequestForm({ onSent }: { onSent: () => void }) {
  const [storeName, setStoreName] = useState('');
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [shopUrl, setShopUrl] = useState('');
  return (
    <View style={{ gap: 10 }}>
      <ThemedText type="small" themeColor="textSecondary">Peça para vender como loja. O administrador confere que a loja existe e aprova.</ThemedText>
      <Field placeholder="Nome da loja" value={storeName} onChangeText={setStoreName} />
      <Field placeholder="Conte quem é a loja e o que vende" value={message} onChangeText={setMessage} multiline />
      <Field placeholder="Contato (telefone, e-mail ou Instagram)" value={contact} onChangeText={setContact} />
      <Field placeholder="Link da loja (opcional)" value={shopUrl} onChangeText={setShopUrl} autoCapitalize="none" keyboardType="url" />
      <Btn label="Enviar pedido" onPress={() => market.requestMerchant({ storeName, message, contact, shopUrl: shopUrl || undefined }).then(onSent).catch((e) => Alert.alert('Erro', msg(e)))} />
    </View>
  );
}

function Profile({ me, onSaved }: { me: Me; onSaved: () => void }) {
  const merchant = me.merchant!;
  const [cats, setCats] = useState<{ id: string; name: string }[]>([]);
  const [picked, setPicked] = useState<string[]>(merchant.families.map((f) => f.categoryId));
  const [shopUrl, setShopUrl] = useState(merchant.shopUrl ?? '');
  useEffect(() => { market.categories().then(setCats).catch(() => {}); }, []);
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  return (
    <View style={{ gap: 10 }}>
      <ThemedText type="smallBold">{merchant.name}{merchant.verified ? ' ✓ verificado' : ' (aguardando selo do administrador)'}</ThemedText>
      <Field placeholder="Link da loja" value={shopUrl} onChangeText={setShopUrl} autoCapitalize="none" keyboardType="url" />
      <ThemedText type="small" themeColor="textSecondary">Famílias que você vende:</ThemedText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {cats.map((c) => (
          <Pressable key={c.id} onPress={() => toggle(c.id)}><ThemedText type={picked.includes(c.id) ? 'smallBold' : 'small'} themeColor={picked.includes(c.id) ? 'text' : 'textSecondary'}>{picked.includes(c.id) ? '✓ ' : ''}{c.name}</ThemedText></Pressable>
        ))}
      </View>
      <Btn label="Salvar perfil" onPress={() => market.saveMerchantProfile({ categoryIds: picked, shopUrl }).then(() => { Alert.alert('Salvo'); onSaved(); }).catch((e) => Alert.alert('Erro', msg(e)))} />
    </View>
  );
}
