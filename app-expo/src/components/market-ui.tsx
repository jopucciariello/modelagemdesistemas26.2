import { TextInput } from 'react-native';

import { Button } from '@/components/button';
import { FontFamily } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { View } from 'react-native';

/** Botão do Mercado: pílula laranja do design do app, alinhada à esquerda para ficar em linha com outros. */
export function Btn({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <View style={{ alignSelf: 'flex-start' }}>
      <Button label={label} onPress={onPress} style={{ paddingVertical: 10, paddingHorizontal: 18, minHeight: 40 }} />
    </View>
  );
}

/** Campo com borda fina, no estilo do portfólio. */
export function Field(props: React.ComponentProps<typeof TextInput>) {
  const t = useTheme();
  return (
    <TextInput
      placeholderTextColor={t.textSecondary}
      {...props}
      style={[{ borderWidth: 1, borderColor: t.border, padding: 12, fontSize: 16, color: t.text, fontFamily: FontFamily.body }, props.multiline && { minHeight: 72 }, props.style]}
    />
  );
}
