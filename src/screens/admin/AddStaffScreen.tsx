import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { addStaffMember, isEmployeeIdTaken } from '../../services/database';

export default function AddStaffScreen() {
  const navigation = useNavigation();
  const [employeeId, setEmployeeId] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
      const isTaken = await isEmployeeIdTaken(employeeId);
      if (isTaken) {
        setErrors({ employeeId: 'Employee ID is already taken' });
        return;
      }
      
      const newStaffId = await addStaffMember(employeeId, name, password);
      Alert.alert(
        'Staff Added! 🎉', 
        `Staff member ${name} (${employeeId}) created successfully.\nWould you like to enrol their face biometrics now?`, 
        [
          { text: 'Later', onPress: () => navigation.goBack() },
          { 
            text: 'Enrol Face Now', 
            onPress: () => {
              (navigation as any).replace('FaceEnroll', { staffId: newStaffId, staffName: name });
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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Employee ID</Text>
          <TextInput
            style={[styles.input, errors.employeeId && styles.inputError]}
            value={employeeId}
            onChangeText={(text) => {
              setEmployeeId(text);
              if (errors.employeeId) setErrors({ ...errors, employeeId: '' });
            }}
            placeholder="e.g. EMP001"
            placeholderTextColor={Colors.textSecondary}
            autoCapitalize="characters"
          />
          {errors.employeeId ? <Text style={styles.errorText}>{errors.employeeId}</Text> : null}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (errors.name) setErrors({ ...errors, name: '' });
            }}
            placeholder="e.g. John Doe"
            placeholderTextColor={Colors.textSecondary}
          />
          {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Password</Text>
          <View style={[styles.passwordContainer, errors.password && styles.inputError]}>
            <TextInput
              style={styles.passwordInput}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors({ ...errors, password: '' });
              }}
              placeholder="Minimum 6 characters"
              placeholderTextColor={Colors.textSecondary}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity 
              style={styles.eyeIcon} 
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons 
                name={showPassword ? "eye-off-outline" : "eye-outline"} 
                size={24} 
                color={Colors.textSecondary} 
              />
            </TouchableOpacity>
          </View>
          {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleAddStaff}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.surface} />
          ) : (
            <Text style={styles.submitButtonText}>Add Staff Member</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    padding: Spacing.m,
  },
  formGroup: {
    marginBottom: Spacing.l,
  },
  label: {
    ...Typography.bodyMedium,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: BorderRadius.m,
    padding: Spacing.m,
    ...Typography.body,
    color: Colors.text,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: BorderRadius.m,
  },
  passwordInput: {
    flex: 1,
    padding: Spacing.m,
    ...Typography.body,
    color: Colors.text,
  },
  eyeIcon: {
    padding: Spacing.m,
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.m,
    borderRadius: BorderRadius.m,
    alignItems: 'center',
    marginTop: Spacing.m,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    ...Typography.button,
    color: Colors.surface,
  },
});
