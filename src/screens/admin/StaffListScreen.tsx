import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl,
  TextInput,
  Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { 
  Search, 
  User, 
  UserPlus, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight,
  Sparkles
} from 'lucide-react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { getAllStaff } from '../../services/database';
import { resolvePhotoUri } from '../../services/fileSystem';
import { AdminStackParamList, StaffWithEnrollment } from '../../types';

type NavigationProp = NativeStackNavigationProp<AdminStackParamList, 'StaffList'>;

export default function StaffListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [staff, setStaff] = useState<StaffWithEnrollment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStaff = async () => {
    try {
      const data = await getAllStaff();
      setStaff(data);
    } catch (error) {
      console.error('Failed to load staff:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadStaff();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadStaff();
  };

  const filteredStaff = staff.filter(item => {
    const q = searchQuery.toLowerCase();
    return item.name.toLowerCase().includes(q) || item.employeeId.toLowerCase().includes(q);
  });

  const renderItem = ({ item }: { item: StaffWithEnrollment }) => {
    const photoUri = resolvePhotoUri(item.enrollmentPhotoUri);

    return (
      <TouchableOpacity 
        style={styles.staffCard}
        onPress={() => navigation.navigate('StaffProfile', { staffId: item.id })}
        activeOpacity={0.8}
      >
        <View style={styles.avatarContainer}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarFallback}>
              <User size={20} color="#94A3B8" />
            </View>
          )}
        </View>

        <View style={styles.staffInfo}>
          <Text style={styles.staffName}>{item.name}</Text>
          <Text style={styles.employeeId}>ID: {item.employeeId}</Text>
        </View>

        <View style={[styles.badge, item.isEnrolled ? styles.badgeEnrolled : styles.badgeNotEnrolled]}>
          {item.isEnrolled ? (
            <CheckCircle2 size={12} color="#059669" style={{ marginRight: 4 }} />
          ) : (
            <AlertCircle size={12} color="#D97706" style={{ marginRight: 4 }} />
          )}
          <Text style={[styles.badgeText, item.isEnrolled ? styles.badgeTextEnrolled : styles.badgeTextNotEnrolled]}>
            {item.isEnrolled ? 'Enrolled' : 'Pending'}
          </Text>
        </View>

        <ChevronRight size={18} color="#CBD5E1" />
      </TouchableOpacity>
    );
  };

  const insets = useSafeAreaInsets();

  return (
    <View style={styles.safeArea}>
      {/* Search Header */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBox}>
          <Search size={18} color="#94A3B8" style={{ marginRight: 10 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search staff by name or ID..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredStaff}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom, 16) + 40 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <User size={48} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No Staff Found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery ? 'No matching staff members found.' : 'Add your first staff member to get started.'}
              </Text>
            </View>
          }
        />
      )}

      {/* Floating Add Staff Button */}
      <TouchableOpacity 
        style={[styles.fab, { bottom: Math.max(insets.bottom, 16) + 16 }]}
        onPress={() => navigation.navigate('AddStaff')}
        activeOpacity={0.85}
      >
        <UserPlus size={22} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  searchBarContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  listContent: {
    padding: Spacing.md,
    flexGrow: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  staffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xs + 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Shadows.sm,
  },
  avatarContainer: {
    marginRight: Spacing.md,
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  employeeId: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 8,
  },
  badgeEnrolled: {
    backgroundColor: '#DCFCE7',
  },
  badgeNotEnrolled: {
    backgroundColor: '#FEF3C7',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  badgeTextEnrolled: {
    color: '#15803D',
  },
  badgeTextNotEnrolled: {
    color: '#B45309',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 32,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
});
