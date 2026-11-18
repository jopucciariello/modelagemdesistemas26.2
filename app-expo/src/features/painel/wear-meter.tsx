import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import type { PlanDto } from '@/features/painel/types';

const STATUS_COLOR = { ok: '#2e9e5b', near: '#d9a400', due: '#d64545' } as const;

/** RF07/RF08: barra de desgaste (verde, amarela a partir do aviso, vermelha no limite). */
export function WearMeter({ plan }: { plan: PlanDto }) {
  const theme = useTheme();
  const pct = Math.round(plan.ratio * 100);
  return (
    <View style={styles.wrap} accessibilityLabel={`Desgaste ${pct}%`}>
      <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
        <View style={[styles.fill, { width: `${Math.min(pct, 100)}%`, backgroundColor: STATUS_COLOR[plan.status] }]} />
      </View>
      <ThemedText type="small" style={styles.pct}>
        {pct}%
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 120 },
  track: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: 8 },
  pct: { width: 40, textAlign: 'right' },
});
