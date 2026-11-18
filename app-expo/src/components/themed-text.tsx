import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { FontFamily, Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  const color = themeColor ?? (type === 'link' || type === 'linkPrimary' ? 'accent' : 'text');
  return <Text style={[{ color: theme[color] }, styles[type], style]} {...rest} />;
}

const styles = StyleSheet.create({
  small: { fontSize: 14, lineHeight: 20, fontFamily: FontFamily.bodyMedium },
  smallBold: { fontSize: 14, lineHeight: 20, fontFamily: FontFamily.bodyBold },
  default: { fontSize: 16, lineHeight: 24, fontFamily: FontFamily.body },
  /** Título de seção: condensado, pesado e em caixa alta, como no portfólio. */
  title: { fontSize: 44, lineHeight: 48, fontFamily: FontFamily.display, textTransform: 'uppercase', letterSpacing: -0.5 },
  subtitle: { fontSize: 24, lineHeight: 30, fontFamily: FontFamily.display, textTransform: 'uppercase' },
  link: { lineHeight: 30, fontSize: 14, fontFamily: FontFamily.bodyBold },
  linkPrimary: { lineHeight: 30, fontSize: 14, fontFamily: FontFamily.bodyBold },
  code: { fontFamily: Fonts.mono, fontWeight: Platform.select({ android: 700 }) ?? 500, fontSize: 12 },
});
