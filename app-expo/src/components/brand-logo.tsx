import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

/** Símbolo do GearLog (coroa de bicicleta) + nome. O furo central é transparente no tema. */
export function BrandLogo({ size = 40, showName = true }: { size?: number; showName?: boolean }) {
  return (
    <View style={styles.row} accessibilityRole="image" accessibilityLabel="GearLog">
      <Image source={require('../../assets/images/gearlog-mark.png')} style={{ width: size, height: size }} contentFit="contain" />
      {showName ? <ThemedText type="subtitle">GEARLOG</ThemedText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
