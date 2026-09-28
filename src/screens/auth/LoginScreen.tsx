import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Platform, 
  ActivityIndicator, 
  Alert, 
  ScrollView, 
  Image, 
  Keyboard 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  Users,
  RefreshCw,
  X
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { getAllStaff, authenticateUser } from '../../services/database';
import { resolvePhotoUri } from '../../services/fileSystem';
import { StaffWithEnrollment } from '../../types';

export function LoginScreen() {
  const { colors, shadows, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = React.useMemo(() => createStyles(colors, shadows, isDark), [colors, shadows, isDark]);
  const { login, loginDirectly } = useAuth();

  const [staffList, setStaffList] = useState<StaffWithEnrollment[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [authenticatingId, setAuthenticatingId] = useState<string | null>(null);

  // Manual form state
  const [showManualForm, setShowManualForm] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<'id' | 'password' | null>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Dynamically fetch all staff members from SQLite database with visual feedback cue
  const loadStaff = useCallback(async () => {
    try {
      setLoadingStaff(true);
      const [data] = await Promise.all([
        getAllStaff(),
        new Promise((resolve) => setTimeout(resolve, 550))
      ]);
      setStaffList(data);
    } catch (err) {
      console.error('Failed to load staff list for tap-to-login:', err);
    } finally {
      setLoadingStaff(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStaff();
    }, [loadStaff])
  );

  // 1-Tap Instant Admin Login
  const handleAdminTapLogin = async () => {
    try {
      setAuthenticatingId('ADMIN001');
      const adminUser = await authenticateUser('ADMIN001', 'admin123');
      if (adminUser) {
        loginDirectly(adminUser);
      } else {
        await login('ADMIN001', 'admin123');
      }
    } catch (err: any) {
      Alert.alert('Login Error', err.message || 'Unable to log in as Admin');
    } finally {
      setAuthenticatingId(null);
    }
  };

  // 1-Tap Instant Staff Login
  const handleStaffTapLogin = async (staff: StaffWithEnrollment) => {
    try {
      setAuthenticatingId(staff.employeeId);
      // Direct login bypassing credential friction
      loginDirectly(staff);
    } catch (err: any) {
      Alert.alert('Login Error', err.message || `Unable to log in as ${staff.name}`);
    } finally {
      setAuthenticatingId(null);
    }
  };

  // Manual login handler
  const handleManualLogin = async () => {
    const id = employeeId.trim();
    const pass = password.trim();

    if (!id || !pass) {
      Alert.alert('Required Fields', 'Please enter your Employee ID and Password to continue.');
      return;
    }

    setManualLoading(true);
    try {
      const success = await login(id, pass);
      if (!success) {
        Alert.alert(
          'Authentication Failed', 
          'Invalid credentials. Please verify your Employee ID and Password.'
        );
      }
    } catch (error: any) {
      Alert.alert('Login Error', error.message || 'Unable to authenticate right now');
    } finally {
      setManualLoading(false);
    }
  };

  const topSafeAreaPadding = Math.max(insets.top, 24) + Spacing.sm;

  return (
    <View style={styles.container}>
      <ScrollView 
        ref={scrollViewRef}
        contentContainerStyle={[
          styles.scrollContent, 
          { 
            paddingTop: topSafeAreaPadding,
            paddingBottom: showManualForm && focusedField ? 340 : Math.max(insets.bottom, 20) + 40, 
            flexGrow: 1 
          }
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
          {/* Header & Logo with generous status-bar clearance */}
          <View style={styles.header}>
            <View style={styles.brandLogoContainer}>
              <Image 
                source={require('../../../assets/icon.png')} 
                style={styles.brandLogoImage} 
                resizeMode="contain"
              />
            </View>
            <View style={styles.brandTitleRow}>
              <Text style={styles.brandPrimary}>SalaryBox</Text>
              <Text style={styles.brandSecondary}>FacePass</Text>
            </View>
            <Text style={styles.subtitle}>
              Biometric Workforce & Attendance Platform
            </Text>
          </View>

          {/* ════════════════════════════════════════════════════════════ */}
          {/* SECTION 1: PROMINENT ADMIN LOGIN CARD                      */}
          {/* ════════════════════════════════════════════════════════════ */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>ADMINISTRATOR</Text>
          </View>

          <TouchableOpacity 
            style={[
              styles.adminCard, 
              authenticatingId === 'ADMIN001' && styles.cardActive
            ]}
            onPress={handleAdminTapLogin}
            disabled={!!authenticatingId}
            activeOpacity={0.85}
          >
            <View style={styles.adminCardLeft}>
              <View style={styles.adminIconBox}>
                <ShieldCheck size={26} color="#0084FF" />
              </View>
              <View style={styles.adminInfo}>
                <View style={styles.adminRoleRow}>
                  <Text style={styles.adminName}>Admin Portal</Text>
                  <View style={styles.adminBadge}>
                    <Text style={styles.adminBadgeText}>ADMIN</Text>
                  </View>
                </View>
                <Text style={styles.adminDesc}>
                  ADMIN001 • Add staff, enrol faces & audit logs
                </Text>
              </View>
            </View>

            <View style={styles.enterButton}>
              {authenticatingId === 'ADMIN001' ? (
                <ActivityIndicator size="small" color="#0084FF" />
              ) : (
                <View style={styles.enterButtonInner}>
                  <Text style={styles.enterButtonText}>Enter</Text>
                  <ArrowRight size={14} color="#0084FF" />
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* ════════════════════════════════════════════════════════════ */}
          {/* SECTION 2: STAFF LIST DIRECTORY (TAP TO LOGIN)             */}
          {/* ════════════════════════════════════════════════════════════ */}
          <View style={[styles.sectionHeaderRow, { marginTop: Spacing.xl }]}>
            <View style={styles.sectionTitleLeft}>
              <Text style={styles.sectionTitle}>STAFF MEMBERS</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{staffList.length}</Text>
              </View>
            </View>
            <TouchableOpacity 
              onPress={loadStaff} 
              hitSlop={10} 
              style={[styles.refreshBtn, loadingStaff && styles.refreshBtnActive]}
              disabled={loadingStaff}
              activeOpacity={0.7}
            >
              {loadingStaff ? (
                <ActivityIndicator size="small" color="#0084FF" style={{ marginRight: 4 }} />
              ) : (
                <RefreshCw size={13} color={colors.textSecondary} style={{ marginRight: 4 }} />
              )}
              <Text style={[styles.refreshBtnText, loadingStaff && styles.refreshBtnTextActive]}>
                {loadingStaff ? 'Refreshing...' : 'Refresh'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.staffListHint}>
            Tap any staff member to test selfie facial attendance punch
          </Text>

          {loadingStaff && staffList.length === 0 ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingBoxText}>Loading staff directory...</Text>
            </View>
          ) : staffList.length === 0 ? (
            <View style={styles.emptyStaffBox}>
              <Users size={32} color={colors.textTertiary} />
              <Text style={styles.emptyStaffTitle}>No Staff Members Registered</Text>
              <Text style={styles.emptyStaffSubtitle}>
                Log in as Admin above to register your first staff member.
              </Text>
            </View>
          ) : (
            <View style={styles.staffGrid}>
              {staffList.map((item) => {
                const photoUri = resolvePhotoUri(item.enrollmentPhotoUri);
                const isLoggingIn = authenticatingId === item.employeeId;

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.staffCard,
                      isLoggingIn && styles.cardActive
                    ]}
                    onPress={() => handleStaffTapLogin(item)}
                    disabled={!!authenticatingId}
                    activeOpacity={0.82}
                  >
                    {/* Avatar */}
                    <View style={styles.staffAvatarWrap}>
                      {photoUri ? (
                        <Image source={{ uri: photoUri }} style={styles.staffAvatarImg} />
                      ) : (
                        <View style={styles.staffAvatarFallback}>
                          <User size={20} color={colors.textTertiary} />
                        </View>
                      )}
                      <View style={[
                        styles.avatarMiniBadge,
                        item.isEnrolled ? styles.avatarMiniBadgeEnrolled : styles.avatarMiniBadgePending
                      ]}>
                        {item.isEnrolled ? (
                          <CheckCircle2 size={10} color="#FFFFFF" />
                        ) : (
                          <AlertCircle size={10} color="#FFFFFF" />
                        )}
                      </View>
                    </View>

                    {/* Staff Info */}
                    <View style={styles.staffInfo}>
                      <Text style={styles.staffNameText} numberOfLines={1}>{item.name}</Text>
                      <View style={styles.staffSubRow}>
                        <View style={styles.empIdBadge}>
                          <Text style={styles.empIdBadgeText}>{item.employeeId}</Text>
                        </View>
                        <View style={[
                          styles.enrollStatusPill,
                          item.isEnrolled ? styles.enrollStatusPillSuccess : styles.enrollStatusPillWarning
                        ]}>
                          <Text style={[
                            styles.enrollStatusText,
                            item.isEnrolled ? styles.enrollStatusTextSuccess : styles.enrollStatusTextWarning
                          ]}>
                            {item.isEnrolled ? 'Face Enrolled' : 'Face Pending'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Action Pill */}
                    <View style={styles.staffActionBox}>
                      {isLoggingIn ? (
                        <ActivityIndicator size="small" color="#0D9488" />
                      ) : (
                        <View style={styles.staffEnterPill}>
                          <Text style={styles.staffEnterText}>Punch</Text>
                          <ArrowRight size={12} color="#0D9488" />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* ════════════════════════════════════════════════════════════ */}
          {/* SECTION 3: MANUAL SIGN IN ACCORDION                         */}
          {/* ════════════════════════════════════════════════════════════ */}
          <View style={styles.manualSection}>
            <TouchableOpacity 
              style={styles.manualAccordionBtn}
              onPress={() => {
                const nextState = !showManualForm;
                setShowManualForm(nextState);
                if (nextState) {
                  setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                  }, 120);
                }
              }}
              activeOpacity={0.8}
            >
              <Lock size={15} color={Colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.manualAccordionText}>
                {showManualForm ? 'Hide Manual Sign In' : 'Sign In with Custom ID & Password'}
              </Text>
              {showManualForm ? (
                <ChevronUp size={16} color={colors.textSecondary} />
              ) : (
                <ChevronDown size={16} color={colors.textSecondary} />
              )}
            </TouchableOpacity>

            {/* Inline Expandable Form Card */}
            {showManualForm && (
              <View style={styles.manualCard}>
                <View style={styles.manualCardHeader}>
                  <Text style={styles.manualCardTitle}>Manual Sign In</Text>
                  <Text style={styles.manualCardSubtitle}>Enter your Employee ID or Name & Password</Text>
                </View>

                {/* Employee ID */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Employee ID or Name</Text>
                  <View style={[
                    styles.inputWrapper,
                    focusedField === 'id' && styles.inputWrapperFocused
                  ]}>
                    <User size={18} color={focusedField === 'id' ? Colors.primary : colors.textTertiary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. ADMIN001 or EMP001"
                      placeholderTextColor={colors.textTertiary}
                      value={employeeId}
                      onChangeText={setEmployeeId}
                      onFocus={() => {
                        setFocusedField('id');
                        setTimeout(() => {
                          scrollViewRef.current?.scrollToEnd({ animated: true });
                        }, 150);
                      }}
                      onBlur={() => setFocusedField(null)}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      returnKeyType="next"
                      onSubmitEditing={() => passwordInputRef.current?.focus()}
                      blurOnSubmit={false}
                    />
                  </View>
                </View>

                {/* Password */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Password</Text>
                  <View style={[
                    styles.inputWrapper,
                    focusedField === 'password' && styles.inputWrapperFocused
                  ]}>
                    <Lock size={18} color={focusedField === 'password' ? Colors.primary : colors.textTertiary} style={styles.inputIcon} />
                    <TextInput
                      ref={passwordInputRef}
                      style={styles.textInput}
                      placeholder="Enter account password"
                      placeholderTextColor={colors.textTertiary}
                      value={password}
                      onChangeText={setPassword}
                      onFocus={() => {
                        setFocusedField('password');
                        setTimeout(() => {
                          scrollViewRef.current?.scrollToEnd({ animated: true });
                        }, 150);
                      }}
                      onBlur={() => setFocusedField(null)}
                      secureTextEntry={!showPassword}
                      returnKeyType="done"
                      onSubmitEditing={handleManualLogin}
                    />
                    <TouchableOpacity 
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeBtn}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      {showPassword ? (
                        <EyeOff size={18} color={colors.textSecondary} />
                      ) : (
                        <Eye size={18} color={colors.textSecondary} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Sign In Button */}
                <TouchableOpacity 
                  style={[styles.primaryButton, manualLoading && styles.buttonDisabled]} 
                  onPress={handleManualLogin}
                  disabled={manualLoading}
                  activeOpacity={0.88}
                >
                  {manualLoading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Sign In with Credentials</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

        </ScrollView>
      </View>
    );
  }

const createStyles = (colors: any, shadows: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  brandLogoContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0066FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    ...shadows.md,
  },
  brandLogoImage: {
    width: 60,
    height: 60,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  brandPrimary: {
    ...Typography.h1,
    color: '#0084FF',
    fontWeight: '800',
    letterSpacing: -0.7,
  },
  brandSecondary: {
    ...Typography.h1,
    color: '#00D2B4',
    fontWeight: '800',
    letterSpacing: -0.7,
  },
  subtitle: {
    ...Typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  evaluatorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.kpiBlueBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.dateBoxBorder,
  },
  evaluatorChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0084FF',
    letterSpacing: -0.2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.labelColor,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  countBadge: {
    backgroundColor: colors.border,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.labelColor,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.surfaceSubtle,
  },
  refreshBtnActive: {
    backgroundColor: colors.kpiBlueBg,
    borderWidth: 1,
    borderColor: colors.dateBoxBorder,
  },
  refreshBtnText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  refreshBtnTextActive: {
    color: '#0066FF',
    fontWeight: '700',
  },
  staffListHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  adminCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: colors.dateBoxBorder,
    ...shadows.sm,
  },
  adminCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  adminIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.kpiBlueBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  adminInfo: {
    flex: 1,
  },
  adminRoleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adminName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  adminBadge: {
    backgroundColor: colors.kpiBlueBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.dateBoxBorder,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0084FF',
  },
  adminDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 3,
  },
  enterButton: {
    paddingLeft: 6,
  },
  enterButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.kpiBlueBg,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.lg,
    gap: 4,
  },
  enterButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0084FF',
  },
  cardActive: {
    borderColor: '#0084FF',
    backgroundColor: isDark ? colors.surfaceSubtle : '#F0F7FF',
  },
  loadingBox: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingBoxText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  emptyStaffBox: {
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  emptyStaffTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 10,
  },
  emptyStaffSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  staffGrid: {
    gap: 10,
  },
  staffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  staffAvatarWrap: {
    position: 'relative',
    marginRight: Spacing.md,
  },
  staffAvatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colors.avatarBorder,
  },
  staffAvatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.avatarFallbackBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarMiniBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  avatarMiniBadgeEnrolled: {
    backgroundColor: colors.statusDotActive,
  },
  avatarMiniBadgePending: {
    backgroundColor: Colors.warning,
  },
  staffInfo: {
    flex: 1,
  },
  staffNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  staffSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  empIdBadge: {
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  empIdBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.labelColor,
  },
  enrollStatusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  enrollStatusPillSuccess: {
    backgroundColor: colors.badgeEnrolledBgAlt,
  },
  enrollStatusPillWarning: {
    backgroundColor: colors.badgePendingBg,
  },
  enrollStatusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  enrollStatusTextSuccess: {
    color: colors.badgeEnrolledTextAlt,
  },
  enrollStatusTextWarning: {
    color: colors.badgePendingTextAlt,
  },
  staffActionBox: {
    paddingLeft: 8,
  },
  staffEnterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.checkInIconBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    gap: 3,
    borderWidth: 1,
    borderColor: colors.checkInCardBorder,
  },
  staffEnterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D9488',
  },
  manualSection: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  manualAccordionBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  manualAccordionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  manualCard: {
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginTop: 6,
    ...shadows.sm,
  },
  fieldGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.labelColor,
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    borderRadius: BorderRadius.lg,
    height: 48,
    paddingHorizontal: Spacing.md,
  },
  inputWrapperFocused: {
    borderColor: Colors.primary,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    height: '100%',
    paddingVertical: 0,
  },
  eyeBtn: {
    padding: 6,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    height: 48,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xs,
    ...shadows.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  manualCardHeader: {
    marginBottom: Spacing.md,
  },
  manualCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  manualCardSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
