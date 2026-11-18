import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { FontFamily } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Campo de texto com borda fina, no visual do portfólio. */
export function Field({ style, ...rest }: TextInputProps) {
  const theme = useTheme();
  return (
    <TextInput
      placeholderTextColor={theme.textSecondary}
      style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, fontFamily: FontFamily.body },
});
