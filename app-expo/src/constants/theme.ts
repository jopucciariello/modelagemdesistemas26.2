/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://unistyl.es/), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

/** Identidade do GearLog, inspirada no portfólio do João: fundo quase preto, laranja de destaque, linhas finas. */
export const ACCENT = '#FF5A1F';

export const Colors = {
  light: {
    text: '#0B0C0E',
    background: '#FFFFFF',
    backgroundElement: '#F3F3F1',
    backgroundSelected: '#E4E4E0',
    textSecondary: '#5B5F66',
    accent: ACCENT,
    onAccent: '#0B0C0E',
    border: '#D9D9D4',
  },
  dark: {
    text: '#FFFFFF',
    background: '#08090B',
    backgroundElement: '#101216',
    backgroundSelected: '#1C1F25',
    textSecondary: '#A3A8B0',
    accent: ACCENT,
    onAccent: '#0B0C0E',
    border: '#262A31',
  },
} as const;

/** Cores de estado do desgaste (RF08/RF09), iguais nos dois temas. */
export const StatusColors = { ok: '#2E9E5B', near: '#E0A800', due: '#E5484D' } as const;

/** Famílias carregadas em `_layout.tsx` (Anton para títulos, Inter para o texto). */
export const FontFamily = {
  display: 'Anton_400Regular',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodyBold: 'Inter_700Bold',
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
