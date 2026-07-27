import { Platform } from 'react-native';

export const colors = {
  primary: '#5a413f',
  primary50: '#f9f5f4',
  primary100: '#f0e8e7',
  primary200: '#e2d4d2',
  primary300: '#ccb4b1',
  primary400: '#b08d89',
  primary600: '#4e3735',
  primary700: '#43302e',
  primary800: '#3a2927',
  primary900: '#342523',

  gold: '#C9A84C',
  goldLight: '#E2C97E',
  goldDark: '#9C7E2A',

  roseGold: '#B76E79',
  roseGoldLight: '#D4A0A8',
  roseGoldDark: '#8F4F58',

  sage: '#7a9080',
  terracotta: '#8b6355',
  slate: '#6a7a8a',

  cream: '#FAF7F2',
  beige: '#F5EDE4',
  blush: '#F2E4E1',
  pearl: '#F8F8F0',
  champagne: '#F7E7CE',

  white: '#FFFFFF',
  black: '#000000',

  text: '#2f2422',
  textMuted: '#8a7a76',
  textFaint: '#b3a5a1',
  border: '#eee5e0',
  borderStrong: '#e2d4d2',
  surface: '#FFFFFF',
  surfaceAlt: '#faf6f2',

  success: '#10b981',
  successDark: '#059669',
  danger: '#e11d48',
  dangerLight: '#f43f5e',
  warning: '#d97706',
  warningSoft: '#fef3c7',
  star: '#fbbf24',
};

export const gradients = {
  primary: ['#5a413f', '#3a2927'],
  gold: ['#E2C97E', '#C9A84C'],
  goldDeep: ['#C9A84C', '#a07828'],
  rose: ['#D4A0A8', '#B76E79'],
  danger: ['#f43f5e', '#e11d48'],
  success: ['#10b981', '#059669'],
  muted: ['#9ca3af', '#6b7280'],
  page: ['#FAF7F2', '#F5EDE4'],
  champagne: ['#F7E7CE', '#F2E4E1'],
  heroFallback: ['#f5ede4', '#ecddd0', '#e8d5c4'],
  card: [
    ['rgba(201,168,76,0.28)', 'rgba(245,230,192,0.55)', '#f9f3ee'],
    ['rgba(183,110,121,0.24)', 'rgba(242,221,224,0.55)', '#fdf4f5'],
    ['rgba(90,65,63,0.18)', 'rgba(232,216,214,0.5)', '#fdf9f6'],
    ['rgba(139,111,107,0.2)', 'rgba(237,219,216,0.55)', '#faf6f5'],
  ],
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  card: 24,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

/**
 * Android ignores shadow offsets/radius, so every preset carries a matching
 * elevation value to keep depth consistent across both platforms.
 */
const shadow = (offsetY, blur, opacity, elevation) =>
  Platform.select({
    ios: {
      shadowColor: '#5a413f',
      shadowOffset: { width: 0, height: offsetY },
      shadowOpacity: opacity,
      shadowRadius: blur,
    },
    android: { elevation },
    default: {},
  });

export const shadows = {
  none: {},
  xs: shadow(1, 3, 0.07, 1),
  sm: shadow(3, 10, 0.09, 3),
  md: shadow(6, 18, 0.12, 6),
  lg: shadow(12, 30, 0.16, 12),
  gold: Platform.select({
    ios: {
      shadowColor: '#C9A84C',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
    },
    android: { elevation: 8 },
    default: {},
  }),
};

export const typography = {
  display: { fontSize: 30, fontWeight: '700', letterSpacing: -0.4, color: colors.text },
  h1: { fontSize: 24, fontWeight: '700', letterSpacing: -0.3, color: colors.text },
  h2: { fontSize: 20, fontWeight: '700', letterSpacing: -0.2, color: colors.text },
  h3: { fontSize: 17, fontWeight: '600', color: colors.text },
  body: { fontSize: 15, fontWeight: '400', color: colors.text, lineHeight: 22 },
  bodySm: { fontSize: 13, fontWeight: '400', color: colors.textMuted, lineHeight: 19 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text },
  caption: { fontSize: 11, fontWeight: '500', color: colors.textMuted },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    color: colors.goldDark,
  },
};

export const formatPrice = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '₹0';
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
};

export default { colors, gradients, radius, spacing, shadows, typography, formatPrice };
