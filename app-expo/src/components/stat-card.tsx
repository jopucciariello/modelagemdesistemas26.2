import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

/** Cartão de número com borda fina, como os destaques do portfólio. */
export function StatCard({ value, label, color }: { value: number; label: string; color?: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.card, { borderColor: theme.border }]}>
      <ThemedText type="title" style={{ color: color ?? theme.text }}>
        {value}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, borderWidth: 1, padding: 14, gap: 4, minWidth: 96 },
});
