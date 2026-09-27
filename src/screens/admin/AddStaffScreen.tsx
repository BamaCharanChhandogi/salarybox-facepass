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
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { addStaffMember, isEmployeeIdTaken } from '../../services/database';

export default function AddStaffScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
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
    <View style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={[styles.container, { paddingBottom: Math.max(insets.bottom, 16) + 30 }]} 
          keyboardShouldPersistTaps="handled"
        >
          
          {/* Hero Banner */}
          <View style={styles.headerCard}>
            <View style={styles.iconCircle}>
              <UserPlus size={24} color={Colors.primary} />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>New Staff Member</Text>
              <Text style={styles.headerSubtitle}>
                Create credentials for attendance tracking & biometric verification.
              </Text>
            </View>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            
            {/* Employee ID */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Employee ID</Text>
              <View style={[
                styles.inputWrapper,
                focusedField === 'employeeId' && styles.inputWrapperFocused,
                errors.employeeId && styles.inputWrapperError
              ]}>
                <View style={styles.inputIconContainer}>
                  <IdCard size={18} color={focusedField === 'employeeId' ? Colors.primary : '#94A3B8'} />
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
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
              </View>
              {errors.employeeId ? <Text style={styles.errorText}>{errors.employeeId}</Text> : null}
            </View>

            {/* Full Name */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={[
                styles.inputWrapper,
                focusedField === 'name' && styles.inputWrapperFocused,
                errors.name && styles.inputWrapperError
              ]}>
                <View style={styles.inputIconContainer}>
                  <User size={18} color={focusedField === 'name' ? Colors.primary : '#94A3B8'} />
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
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="words"
                />
              </View>
              {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
            </View>

            {/* Password */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={[
                styles.inputWrapper,
                focusedField === 'password' && styles.inputWrapperFocused,
                errors.password && styles.inputWrapperError
              ]}>
                <View style={styles.inputIconContainer}>
                  <Lock size={18} color={focusedField === 'password' ? Colors.primary : '#94A3B8'} />
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
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity 
                  style={styles.eyeButton} 
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={12}
                >
                  {showPassword ? (
                    <EyeOff size={18} color="#64748B" />
                  ) : (
                    <Eye size={18} color="#64748B" />
                  )}
                </TouchableOpacity>
              </View>
              {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
            </View>

            {/* Biometric enrollment hint banner */}
            <View style={styles.hintBanner}>
              <Sparkles size={16} color={Colors.secondary} style={{ marginTop: 2 }} />
              <Text style={styles.hintBannerText}>
                After adding, you will be prompted to snap and register their face biometrics for 1:1 attendance verification.
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity 
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
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
    backgroundColor: '#F8FAFC',
  },
  container: {
    padding: Spacing.md,
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Shadows.sm,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#EBF5FF',
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
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Shadows.sm,
  },
  formGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
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
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
    gap: 8,
  },
  hintBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#166534',
    lineHeight: 18,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: Colors.primary,
    height: 50,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
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
