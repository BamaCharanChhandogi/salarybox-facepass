import { TextStyle } from 'react-native';

// ─── Colors (from SalaryBox logo) ─────────────────────────────
export const Colors = {
  primary: '#0084FF',
  primaryDark: '#0066CC',
  primaryLight: '#E0F2FE',
  secondary: '#00D2B4',
  secondaryDark: '#00A890',
  secondaryLight: '#D1FAE5',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#0F172A',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  success: '#22C55E',
  successLight: '#DCFCE7',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  disabled: '#CBD5E1',
  overlay: 'rgba(0, 0, 0, 0.5)',
  white: '#FFFFFF',
  black: '#000000',
} as const;

// ─── Typography (Inter font family) ───────────────────────────
export const Typography: Record<string, TextStyle> = {
  h1: { fontFamily: 'Inter_700Bold', fontSize: 28, lineHeight: 34 },
  h2: { fontFamily: 'Inter_600SemiBold', fontSize: 22, lineHeight: 28 },
  h3: { fontFamily: 'Inter_600SemiBold', fontSize: 18, lineHeight: 24 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 16, lineHeight: 22 },
  bodyMedium: { fontFamily: 'Inter_500Medium', fontSize: 16, lineHeight: 22 },
  bodySemiBold: { fontFamily: 'Inter_600SemiBold', fontSize: 16, lineHeight: 22 },
  caption: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 18 },
  captionMedium: { fontFamily: 'Inter_500Medium', fontSize: 14, lineHeight: 18 },
  small: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 16 },
  smallMedium: { fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 16 },
  button: { fontFamily: 'Inter_600SemiBold', fontSize: 16, lineHeight: 20 },
};

// ─── Spacing ──────────────────────────────────────────────────
export const Spacing = {
  xs: 4,
  s: 8,
  sm: 8,
  m: 16,
  md: 16,
  l: 24,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// ─── Border Radius ────────────────────────────────────────────
export const BorderRadius = {
  s: 8,
  sm: 8,
  m: 12,
  md: 12,
  l: 16,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

// ─── Shadows ──────────────────────────────────────────────────
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
} as const;
