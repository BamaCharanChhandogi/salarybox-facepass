import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme, StatusBarStyle } from 'react-native';
import { Colors, Shadows } from '../constants/theme';

// ─── Light Theme Colors ────────────────────────────────────────
const LightThemeColors = {
  // Core Surfaces
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSubtle: '#F1F5F9',
  card: '#FFFFFF',
  // Text
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  textMuted: '#CBD5E1',
  // Borders
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  // Input
  inputBackground: '#FFFFFF',
  inputBorder: '#E2E8F0',
  inputPlaceholder: '#94A3B8',
  // Labels
  labelColor: '#475569',
  // Search
  searchBackground: '#F8FAFC',
  searchBarBackground: '#FFFFFF',
  // Modal
  modalOverlay: 'rgba(15, 23, 42, 0.65)',
  modalBackground: '#FFFFFF',
  modalDragHandle: '#CBD5E1',
  // KPI Accent Backgrounds
  kpiBlueBg: '#EFF6FF',
  kpiGreenBg: '#ECFDF5',
  kpiTealBg: '#F0FDFA',
  // Badge
  badgeEnrolledBg: '#ECFDF5',
  badgeEnrolledBgAlt: '#DCFCE7',
  badgePendingBg: '#FEF3C7',
  badgeEnrolledText: '#059669',
  badgeEnrolledTextAlt: '#15803D',
  badgePendingText: '#D97706',
  badgePendingTextAlt: '#B45309',
  // Pill / Filter
  filterInactiveBg: '#F1F5F9',
  filterActiveText: '#FFFFFF',
  // Date Box
  dateBoxBg: '#EFF6FF',
  dateBoxBorder: '#DBEAFE',
  // Punch Cards
  punchCardBg: '#FFFFFF',
  checkInCardBorder: '#CCFBF1',
  checkOutCardBorder: '#E0F2FE',
  checkInIconBg: '#F0FDFA',
  checkOutIconBg: '#F0F9FF',
  // History
  historyCardBg: '#FFFFFF',
  historyCardBorder: '#F1F5F9',
  typeCheckInBg: '#DCFCE7',
  typeCheckOutBg: '#E0F2FE',
  typeCheckInText: '#15803D',
  typeCheckOutText: '#0369A1',
  // Active Shift Banner
  activeShiftBg: '#F0FDF4',
  activeShiftBorder: '#BBF7D0',
  activeShiftDotBg: '#DCFCE7',
  activeShiftDotInner: '#16A34A',
  activeShiftTitle: '#15803D',
  activeShiftTimerBg: '#DCFCE7',
  activeShiftTimerText: '#15803D',
  activeShiftDesc: '#166534',
  // Unenrolled Banner
  unenrolledBg: '#FFFBEB',
  unenrolledBorder: '#FDE68A',
  unenrolledIconBg: '#FEF3C7',
  unenrolledTitle: '#92400E',
  unenrolledDesc: '#B45309',
  // State Pills
  statePillReadyBg: '#CCFBF1',
  statePillReadyText: '#0F766E',
  statePillActiveBg: '#E0F2FE',
  statePillActiveText: '#0369A1',
  statePillLockedBg: '#F1F5F9',
  statePillLockedText: '#64748B',
  // Disabled
  punchCardDisabledBg: '#F8FAFC',
  punchCardDisabledBorder: '#E2E8F0',
  punchIconDisabledBg: '#E2E8F0',
  punchTitleDisabled: '#64748B',
  // Hint Banner (Add Staff)
  hintBannerBg: '#F0FDF4',
  hintBannerBorder: '#DCFCE7',
  hintBannerText: '#166534',
  // Icon Circle (Add Staff)
  iconCircleBg: '#EBF5FF',
  // Logout / Status
  logoutBg: '#F8FAFC',
  logoutBorder: '#E2E8F0',
  logoutText: '#64748B',
  logoutIcon: '#64748B',
  // Status Dot
  statusDotActive: '#10B981',
  statusDotInactive: '#94A3B8',
  statusPillBg: '#F8FAFC',
  statusPillBorder: '#E2E8F0',
  statusPillText: '#475569',
  // Avatar Fallback
  avatarFallbackBg: '#F1F5F9',
  avatarBorder: '#E2E8F0',
  // Primary stays the same
  primary: Colors.primary,
  // Delete / Eye / Secondary Icons
  iconSubtle: '#94A3B8',
  iconMedium: '#64748B',
  // Header (Navigator)
  headerBg: '#FFFFFF',
  tabBarBg: '#FFFFFF',
  tabBarBorder: '#F1F5F9',
  tabBarInactive: '#94A3B8',
  // Empty States
  emptyCardBg: '#FFFFFF',
  emptyCardBorder: '#F1F5F9',
  // Punctuality
  shiftEndedColor: '#0369A1',
  shiftEndedBg: '#E0F2FE',
  onTimeColor: '#059669',
  onTimeBg: '#ECFDF5',
  lateColor: '#D97706',
  lateBg: '#FEF3C7',
  halfDayColor: '#EA580C',
  halfDayBg: '#FFEDD5',
  // StatusBar
  statusBarStyle: 'dark-content' as StatusBarStyle,
};

// ─── Dark Theme Colors ─────────────────────────────────────────
const DarkThemeColors: typeof LightThemeColors = {
  // Core Surfaces
  background: '#0F172A',
  surface: '#1E293B',
  surfaceSubtle: '#334155',
  card: '#1E293B',
  // Text
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  textMuted: '#475569',
  // Borders
  border: '#334155',
  borderLight: '#1E293B',
  // Input
  inputBackground: '#1E293B',
  inputBorder: '#334155',
  inputPlaceholder: '#64748B',
  // Labels
  labelColor: '#94A3B8',
  // Search
  searchBackground: '#1E293B',
  searchBarBackground: '#0F172A',
  // Modal
  modalOverlay: 'rgba(0, 0, 0, 0.75)',
  modalBackground: '#1E293B',
  modalDragHandle: '#475569',
  // KPI Accent Backgrounds
  kpiBlueBg: 'rgba(0, 132, 255, 0.15)',
  kpiGreenBg: 'rgba(16, 185, 129, 0.15)',
  kpiTealBg: 'rgba(13, 148, 136, 0.15)',
  // Badge
  badgeEnrolledBg: 'rgba(5, 150, 105, 0.15)',
  badgeEnrolledBgAlt: 'rgba(5, 150, 105, 0.2)',
  badgePendingBg: 'rgba(245, 158, 11, 0.15)',
  badgeEnrolledText: '#34D399',
  badgeEnrolledTextAlt: '#34D399',
  badgePendingText: '#FBBF24',
  badgePendingTextAlt: '#FBBF24',
  // Pill / Filter
  filterInactiveBg: '#334155',
  filterActiveText: '#FFFFFF',
  // Date Box
  dateBoxBg: 'rgba(0, 132, 255, 0.15)',
  dateBoxBorder: 'rgba(0, 132, 255, 0.25)',
  // Punch Cards
  punchCardBg: '#1E293B',
  checkInCardBorder: 'rgba(13, 148, 136, 0.35)',
  checkOutCardBorder: 'rgba(14, 165, 233, 0.35)',
  checkInIconBg: 'rgba(13, 148, 136, 0.15)',
  checkOutIconBg: 'rgba(14, 165, 233, 0.15)',
  // History
  historyCardBg: '#1E293B',
  historyCardBorder: '#334155',
  typeCheckInBg: 'rgba(5, 150, 105, 0.2)',
  typeCheckOutBg: 'rgba(14, 165, 233, 0.2)',
  typeCheckInText: '#34D399',
  typeCheckOutText: '#38BDF8',
  // Active Shift Banner
  activeShiftBg: 'rgba(16, 185, 129, 0.1)',
  activeShiftBorder: 'rgba(16, 185, 129, 0.3)',
  activeShiftDotBg: 'rgba(16, 185, 129, 0.2)',
  activeShiftDotInner: '#34D399',
  activeShiftTitle: '#34D399',
  activeShiftTimerBg: 'rgba(16, 185, 129, 0.2)',
  activeShiftTimerText: '#34D399',
  activeShiftDesc: '#6EE7B7',
  // Unenrolled Banner
  unenrolledBg: 'rgba(245, 158, 11, 0.1)',
  unenrolledBorder: 'rgba(245, 158, 11, 0.3)',
  unenrolledIconBg: 'rgba(245, 158, 11, 0.2)',
  unenrolledTitle: '#FBBF24',
  unenrolledDesc: '#FCD34D',
  // State Pills
  statePillReadyBg: 'rgba(13, 148, 136, 0.2)',
  statePillReadyText: '#2DD4BF',
  statePillActiveBg: 'rgba(14, 165, 233, 0.2)',
  statePillActiveText: '#38BDF8',
  statePillLockedBg: '#334155',
  statePillLockedText: '#64748B',
  // Disabled
  punchCardDisabledBg: '#1E293B',
  punchCardDisabledBorder: '#334155',
  punchIconDisabledBg: '#334155',
  punchTitleDisabled: '#64748B',
  // Hint Banner (Add Staff)
  hintBannerBg: 'rgba(16, 185, 129, 0.1)',
  hintBannerBorder: 'rgba(16, 185, 129, 0.25)',
  hintBannerText: '#6EE7B7',
  // Icon Circle (Add Staff)
  iconCircleBg: 'rgba(0, 132, 255, 0.15)',
  // Logout / Status
  logoutBg: '#334155',
  logoutBorder: '#475569',
  logoutText: '#94A3B8',
  logoutIcon: '#94A3B8',
  // Status Dot
  statusDotActive: '#34D399',
  statusDotInactive: '#64748B',
  statusPillBg: '#334155',
  statusPillBorder: '#475569',
  statusPillText: '#94A3B8',
  // Avatar Fallback
  avatarFallbackBg: '#334155',
  avatarBorder: '#475569',
  // Primary stays the same
  primary: Colors.primary,
  // Delete / Eye / Secondary Icons
  iconSubtle: '#64748B',
  iconMedium: '#94A3B8',
  // Header (Navigator)
  headerBg: '#1E293B',
  tabBarBg: '#1E293B',
  tabBarBorder: '#334155',
  tabBarInactive: '#64748B',
  // Empty States
  emptyCardBg: '#1E293B',
  emptyCardBorder: '#334155',
  // Punctuality
  shiftEndedColor: '#38BDF8',
  shiftEndedBg: 'rgba(14, 165, 233, 0.15)',
  onTimeColor: '#34D399',
  onTimeBg: 'rgba(16, 185, 129, 0.15)',
  lateColor: '#FBBF24',
  lateBg: 'rgba(245, 158, 11, 0.15)',
  halfDayColor: '#FB923C',
  halfDayBg: 'rgba(234, 88, 12, 0.15)',
  // StatusBar
  statusBarStyle: 'light-content' as StatusBarStyle,
};

// ─── Dark Shadows (subtle for dark backgrounds) ────────────────
const DarkShadows = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  small: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  medium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  large: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

// ─── Theme Type ────────────────────────────────────────────────
export type ThemeColors = typeof LightThemeColors;

type ShadowSet = {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
};

export type ThemeShadows = {
  sm: ShadowSet;
  small: ShadowSet;
  md: ShadowSet;
  medium: ShadowSet;
  lg: ShadowSet;
  large: ShadowSet;
};

interface ThemeContextValue {
  isDark: boolean;
  colors: ThemeColors;
  shadows: ThemeShadows;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,
  colors: LightThemeColors,
  shadows: Shadows,
});

// ─── Provider ──────────────────────────────────────────────────
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const value = useMemo<ThemeContextValue>(() => ({
    isDark,
    colors: isDark ? DarkThemeColors : LightThemeColors,
    shadows: isDark ? DarkShadows : Shadows,
  }), [isDark]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────
export function useTheme() {
  return useContext(ThemeContext);
}
