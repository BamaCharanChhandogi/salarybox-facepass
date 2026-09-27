import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator, 
  Alert,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { getAllStaff } from '../../services/database';
import { StaffWithEnrollment } from '../../types';

export function LoginScreen() {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [staffList, setStaffList] = useState<StaffWithEnrollment[]>([]);
  const { login } = useAuth();

  useEffect(() => {
    loadStaffList();
  }, []);

  const loadStaffList = async () => {
    try {
      const staff = await getAllStaff();
      setStaffList(staff);
    } catch (e) {
      console.warn('Failed to load staff list on login screen', e);
    }
  };

  const handleLogin = async (idToUse?: string, passToUse?: string) => {
    const id = idToUse || employeeId.trim();
    const pass = passToUse || password.trim();

    if (!id || !pass) {
      Alert.alert('Required Fields', 'Please enter your Employee ID and Password to sign in.');
      return;
    }

    setLoading(true);
    try {
      const success = await login(id, pass);
      if (!success) {
        Alert.alert(
          'Login Failed', 
          'Invalid credentials. Please verify your Employee ID and Password, or use the quick demo buttons below.'
        );
      }
    } catch (error: any) {
      Alert.alert('Login Error', error.message || 'Unable to authenticate');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoAdmin = () => {
    setEmployeeId('ADMIN001');
    setPassword('admin123');
    handleLogin('ADMIN001', 'admin123');
  };

  const handleQuickDemoStaff = () => {
    setEmployeeId('EMP001');
    setPassword('staff123');
    handleLogin('EMP001', 'staff123');
  };

  const handleSelectStaffChip = (staff: StaffWithEnrollment) => {
    setEmployeeId(staff.employeeId);
    setPassword(staff.password || 'staff123');
    handleLogin(staff.employeeId, staff.password || 'staff123');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo & Header */}
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <View style={styles.logoLeftWing} />
              <View style={styles.logoRightWing} />
            </View>
            <View style={styles.brandTitleRow}>
              <Text style={styles.brandPrimary}>SalaryBox</Text>
              <Text style={styles.brandSecondary}>FacePass</Text>
            </View>
            <Text style={styles.subtitle}>
              Smart Biometric Attendance & Workforce System
            </Text>
          </View>

          {/* Standard Interactive Form */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Sign In to Account</Text>

            <View style={styles.inputField}>
              <Ionicons name="person-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Employee ID (e.g. ADMIN001 or EMP001)"
                placeholderTextColor={Colors.textTertiary}
                value={employeeId}
                onChangeText={setEmployeeId}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputField}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Password"
                placeholderTextColor={Colors.textTertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color={Colors.textSecondary} 
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.signInButton, loading && styles.buttonDisabled]} 
              onPress={() => handleLogin()}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.signInButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Quick Demo Evaluation Section */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ONE-TAP DEMO SIGN IN</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.quickButtonsGrid}>
            <TouchableOpacity 
              style={styles.quickDemoAdminBtn}
              onPress={handleQuickDemoAdmin}
              disabled={loading}
              activeOpacity={0.8}
            >
              <View style={styles.quickIconCircleAdmin}>
                <Ionicons name="shield-checkmark" size={20} color={Colors.primary} />
              </View>
              <View style={styles.quickTextGroup}>
                <Text style={styles.quickTitleAdmin}>Demo Admin</Text>
                <Text style={styles.quickSubtitleAdmin}>ID: ADMIN001 (Full control)</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickDemoStaffBtn}
              onPress={handleQuickDemoStaff}
              disabled={loading}
              activeOpacity={0.8}
            >
              <View style={styles.quickIconCircleStaff}>
                <Ionicons name="person" size={20} color="#0D9488" />
              </View>
              <View style={styles.quickTextGroup}>
                <Text style={styles.quickTitleStaff}>Demo Staff</Text>
                <Text style={styles.quickSubtitleStaff}>ID: EMP001 (Attendance punch)</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Quick Picker for Registered Staff Members */}
          {staffList.length > 0 && (
            <View style={styles.registeredStaffSection}>
              <Text style={styles.registeredStaffTitle}>
                Registered Employees in Database ({staffList.length}):
              </Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.staffChipsContainer}
              >
                {staffList.map((staff) => (
                  <TouchableOpacity
                    key={staff.id}
                    style={styles.staffChip}
                    onPress={() => handleSelectStaffChip(staff)}
                  >
                    <Ionicons 
                      name={staff.isEnrolled ? "checkmark-circle" : "alert-circle"} 
                      size={14} 
                      color={staff.isEnrolled ? "#0D9488" : "#F59E0B"} 
                      style={{ marginRight: 4 }}
                    />
                    <Text style={styles.staffChipName}>{staff.name}</Text>
                    <Text style={styles.staffChipId}>({staff.employeeId})</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  logoBadge: {
    width: 52,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  logoLeftWing: {
    width: 14,
    height: 28,
    backgroundColor: '#0084FF',
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
    marginRight: 2,
  },
  logoRightWing: {
    width: 14,
    height: 28,
    backgroundColor: '#00D2B4',
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandPrimary: {
    ...Typography.h1,
    color: '#0084FF',
  },
  brandSecondary: {
    ...Typography.h1,
    color: '#00D2B4',
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.md,
  },
  formTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  textInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    ...Typography.body,
    color: Colors.textPrimary,
  },
  eyeBtn: {
    padding: Spacing.xs,
  },
  signInButton: {
    backgroundColor: '#0084FF',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  signInButtonText: {
    ...Typography.button,
    color: 'white',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    ...Typography.smallMedium,
    color: Colors.textTertiary,
    paddingHorizontal: Spacing.md,
    letterSpacing: 0.5,
  },
  quickButtonsGrid: {
    gap: Spacing.md,
  },
  quickDemoAdminBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  quickIconCircleAdmin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  quickDemoStaffBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  quickIconCircleStaff: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  quickTextGroup: {
    flex: 1,
  },
  quickTitleAdmin: {
    ...Typography.bodySemiBold,
    color: '#0369A1',
  },
  quickSubtitleAdmin: {
    ...Typography.small,
    color: '#0284C7',
  },
  quickTitleStaff: {
    ...Typography.bodySemiBold,
    color: '#15803D',
  },
  quickSubtitleStaff: {
    ...Typography.small,
    color: '#16A34A',
  },
  registeredStaffSection: {
    marginTop: Spacing.xl,
  },
  registeredStaffTitle: {
    ...Typography.captionMedium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  staffChipsContainer: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingVertical: 4,
  },
  staffChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  staffChipName: {
    ...Typography.smallMedium,
    color: Colors.textPrimary,
    marginRight: 4,
  },
  staffChipId: {
    ...Typography.small,
    color: Colors.textTertiary,
  },
});
