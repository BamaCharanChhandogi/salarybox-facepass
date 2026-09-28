import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { UserPlus, User, IdCard, Lock, Eye, EyeOff, ShieldCheck, Sparkles } from 'lucide-react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { addStaffMember, isEmployeeIdTaken } from '../../services/database';
import { useTheme } from '../../context/ThemeContext';

export default function AddStaffScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { colors, shadows } = useTheme();
  const [employeeId, setEmployeeId] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!employeeId.trim()) newErrors.employeeId = 'Employee ID is required';
    if (!name.trim()) newErrors.name = 'Full Name is required';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddStaff = async () => {
    if (!validate()) return;
    
    setLoading(true);
    try {
      const isTaken = await isEmployeeIdTaken(employeeId.trim());
      if (isTaken) {
        setErrors({ employeeId: 'This Employee ID is already registered' });
        return;
      }
      
      const newStaffId = await addStaffMember(employeeId.trim(), name.trim(), password);
      
      Alert.alert(
        'Staff Member Created', 
        `Successfully registered ${name.trim()} (${employeeId.trim().toUpperCase()}).\n\nWould you like to enrol their face biometrics now?`, 
        [
          { text: 'Later', onPress: () => navigation.goBack(), style: 'cancel' },
          { 
            text: 'Enrol Face Now', 
            onPress: () => {
              (navigation as any).replace('FaceEnroll', { staffId: newStaffId, staffName: name.trim() });
            } 
          }
        ]
      );
    } catch (error) {
      console.error('Failed to add staff:', error);
      Alert.alert('Error', 'Failed to add staff member. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={[styles.container, { paddingBottom: Math.max(insets.bottom, 16) + 30 }]} 
          keyboardShouldPersistTaps="handled"
        >
          
          {/* Hero Banner */}
          <View style={[styles.headerCard, { backgroundColor: colors.surface, borderColor: colors.surfaceSubtle, ...shadows.sm }]}>
            <View style={[styles.iconCircle, { backgroundColor: colors.iconCircleBg }]}>
              <UserPlus size={24} color={Colors.primary} />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>New Staff Member</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                Create credentials for attendance tracking & biometric verification.
              </Text>
            </View>
          </View>

          {/* Form Card */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceSubtle, ...shadows.sm }]}>
            
            {/* Employee ID */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.labelColor }]}>Employee ID</Text>
              <View style={[
                styles.inputWrapper,
                { backgroundColor: colors.surface, borderColor: colors.border },
                focusedField === 'employeeId' && styles.inputWrapperFocused,
                errors.employeeId && styles.inputWrapperError
              ]}>
                <View style={styles.inputIconContainer}>
                  <IdCard size={18} color={focusedField === 'employeeId' ? Colors.primary : colors.iconSubtle} />
                </View>
                <TextInput
                  style={styles.input}
                  value={employeeId}
                  onChangeText={(text) => {
                    setEmployeeId(text);
                    if (errors.employeeId) setErrors({ ...errors, employeeId: '' });
                  }}
                  onFocus={() => setFocusedField('employeeId')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="e.g. EMP002"
                  placeholderTextColor={colors.iconSubtle}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
              </View>
              {errors.employeeId ? <Text style={styles.errorText}>{errors.employeeId}</Text> : null}
            </View>

            {/* Full Name */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.labelColor }]}>Full Name</Text>
              <View style={[
                styles.inputWrapper,
                { backgroundColor: colors.surface, borderColor: colors.border },
                focusedField === 'name' && styles.inputWrapperFocused,
                errors.name && styles.inputWrapperError
              ]}>
                <View style={styles.inputIconContainer}>
                  <User size={18} color={focusedField === 'name' ? Colors.primary : colors.iconSubtle} />
                </View>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (errors.name) setErrors({ ...errors, name: '' });
                  }}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="e.g. Alex Morgan"
                  placeholderTextColor={colors.iconSubtle}
                  autoCapitalize="words"
                />
              </View>
              {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
            </View>

            {/* Password */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.labelColor }]}>Password</Text>
              <View style={[
                styles.inputWrapper,
                { backgroundColor: colors.surface, borderColor: colors.border },
                focusedField === 'password' && styles.inputWrapperFocused,
                errors.password && styles.inputWrapperError
              ]}>
                <View style={styles.inputIconContainer}>
                  <Lock size={18} color={focusedField === 'password' ? Colors.primary : colors.iconSubtle} />
                </View>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) setErrors({ ...errors, password: '' });
                  }}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="At least 6 characters"
                  placeholderTextColor={colors.iconSubtle}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity 
                  style={styles.eyeButton} 
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={12}
                >
                  {showPassword ? (
                    <EyeOff size={18} color={colors.iconMedium} />
                  ) : (
                    <Eye size={18} color={colors.iconMedium} />
                  )}
                </TouchableOpacity>
              </View>
              {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
            </View>

            {/* Biometric enrollment hint banner */}
            <View style={[styles.hintBanner, { backgroundColor: colors.hintBannerBg, borderColor: colors.hintBannerBorder }]}>
              <Sparkles size={16} color={Colors.secondary} style={{ marginTop: 2 }} />
              <Text style={[styles.hintBannerText, { color: colors.hintBannerText }]}>
                After adding, you will be prompted to snap and register their face biometrics for 1:1 attendance verification.
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity 
              style={[styles.submitButton, { ...shadows.sm }, loading && styles.submitButtonDisabled]}
              onPress={handleAddStaff}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.submitButtonContent}>
                  <ShieldCheck size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.submitButtonText}>Register Staff Member</Text>
                </View>
              )}
            </TouchableOpacity>

          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: Spacing.md,
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
  },
  formGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: BorderRadius.lg,
    height: 48,
    paddingHorizontal: 12,
  },
  inputWrapperFocused: {
    borderColor: Colors.primary,
  },
  inputWrapperError: {
    borderColor: Colors.error,
  },
  inputIconContainer: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    height: '100%',
  },
  eyeButton: {
    padding: 6,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
    fontWeight: '500',
  },
  hintBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
    gap: 8,
  },
  hintBannerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: Colors.primary,
    height: 50,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
});
