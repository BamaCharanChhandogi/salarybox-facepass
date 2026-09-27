import { TextStyle } from 'react-native';

// ─── Colors (SalaryBox Design System) ─────────────────────────
export const Colors = {
  primary: '#0084FF',
  primaryDark: '#0066CC',
  primaryLight: '#EBF5FF',
  primaryMuted: '#D0E7FF',
  secondary: '#00D2B4',
  secondaryDark: '#00A890',
  secondaryLight: '#E6FAF7',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSubtle: '#F1F5F9',
  card: '#FFFFFF',
  text: '#0F172A',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  textMuted: '#CBD5E1',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  errorText: '#DC2626',
  success: '#10B981',
  successLight: '#ECFDF5',
  successText: '#059669',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  warningText: '#D97706',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  borderFocus: '#0084FF',
  disabled: '#CBD5E1',
  overlay: 'rgba(15, 23, 42, 0.65)',
  white: '#FFFFFF',
  black: '#000000',
} as const;

// ─── Typography (High-end Inter Hierarchy) ─────────────────────
export const Typography: Record<string, TextStyle> = {
  h1: { fontFamily: 'Inter_700Bold', fontSize: 24, lineHeight: 30, letterSpacing: -0.7 },
  h2: { fontFamily: 'Inter_600SemiBold', fontSize: 19, lineHeight: 25, letterSpacing: -0.5 },
  h3: { fontFamily: 'Inter_600SemiBold', fontSize: 16, lineHeight: 22, letterSpacing: -0.3 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20 },
  bodyMedium: { fontFamily: 'Inter_500Medium', fontSize: 14, lineHeight: 20 },
  bodySemiBold: { fontFamily: 'Inter_600SemiBold', fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 16 },
  captionMedium: { fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 16 },
  small: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 14 },
  smallMedium: { fontFamily: 'Inter_500Medium', fontSize: 11, lineHeight: 14, letterSpacing: 0.2 },
  button: { fontFamily: 'Inter_600SemiBold', fontSize: 14, lineHeight: 18, letterSpacing: -0.2 },
  badge: { fontFamily: 'Inter_600SemiBold', fontSize: 11, lineHeight: 14, letterSpacing: 0.3 },
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

// ─── Shadows (Subtle, Modern Elevation) ───────────────────────
export const Shadows = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  small: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  medium: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  large: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
} as const;
