import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

type ButtonProps = Omit<PressableProps, 'children'> & { label: string; variant?: 'primary' | 'outline' };

/** Botão em pílula: laranja (principal) ou com contorno, como no portfólio. */
export function Button({ label, variant = 'primary', style, ...rest }: ButtonProps) {
  const theme = useTheme();
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      style={(state) => [
        styles.base,
        primary ? { backgroundColor: theme.accent } : { borderColor: theme.border, borderWidth: 1 },
        state.pressed && { opacity: 0.8 },
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}>
      <ThemedText type="smallBold" style={{ color: primary ? theme.onAccent : theme.text }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 999, paddingVertical: 14, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center', minHeight: 48 },
});
