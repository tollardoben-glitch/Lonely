export const Colors = {
  light: {
    text: '#2B2118',
    textSecondary: '#7A6A5C',
    background: '#FFF8F2',
    card: '#FFFFFF',
    border: '#EFE2D6',
    primary: '#E8664A',
    primaryText: '#FFFFFF',
    primarySoft: '#FCE3DA',
    success: '#3E9B6E',
    danger: '#C8423B',
  },
  dark: {
    text: '#F7EFE8',
    textSecondary: '#B5A797',
    background: '#16110D',
    card: '#221B16',
    border: '#3A2F27',
    primary: '#F07A5E',
    primaryText: '#1A120D',
    primarySoft: '#3D251D',
    success: '#5CC291',
    danger: '#F0716A',
  },
} as const;

export type ThemeColors = { [K in keyof typeof Colors.light]: string };

export const Spacing = {
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
} as const;

export const Radius = {
  small: 10,
  medium: 16,
  large: 24,
  pill: 999,
} as const;
