import { Pressable, TextInput } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export function Btn({ label, onPress }: { label: string; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} style={{ backgroundColor: t.text, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14, alignSelf: 'flex-start' }}>
      <ThemedText type="smallBold" style={{ color: t.background }}>{label}</ThemedText>
    </Pressable>
  );
}

export function Field(props: React.ComponentProps<typeof TextInput>) {
  const t = useTheme();
  return <TextInput placeholderTextColor={t.textSecondary} {...props} style={[{ borderWidth: 1, borderColor: t.textSecondary, borderRadius: 8, padding: 10, color: t.text }, props.style]} />;
}
