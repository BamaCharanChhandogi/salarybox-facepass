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
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { getAllStaff } from '../../services/database';
import { resolvePhotoUri } from '../../services/fileSystem';
import { AdminStackParamList, StaffWithEnrollment } from '../../types';
import { useTheme } from '../../context/ThemeContext';

type NavigationProp = NativeStackNavigationProp<AdminStackParamList, 'StaffList'>;

export default function StaffListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors, shadows } = useTheme();
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
        style={[styles.staffCard, { backgroundColor: colors.surface, borderColor: colors.surfaceSubtle, ...shadows.sm }]}
        onPress={() => navigation.navigate('StaffProfile', { staffId: item.id })}
        activeOpacity={0.8}
      >
        <View style={styles.avatarContainer}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={[styles.avatarImage, { borderColor: colors.border }]} />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: colors.surfaceSubtle }]}>
              <User size={20} color={colors.iconSubtle} />
            </View>
          )}
        </View>

        <View style={styles.staffInfo}>
          <Text style={styles.staffName}>{item.name}</Text>
          <Text style={[styles.employeeId, { color: colors.textSecondary }]}>ID: {item.employeeId}</Text>
        </View>

        <View style={[
          styles.badge, 
          item.isEnrolled ? { backgroundColor: colors.badgeEnrolledBgAlt } : { backgroundColor: colors.badgePendingBg }
        ]}>
          {item.isEnrolled ? (
            <CheckCircle2 size={12} color={colors.badgeEnrolledText} style={{ marginRight: 4 }} />
          ) : (
            <AlertCircle size={12} color={colors.badgePendingText} style={{ marginRight: 4 }} />
          )}
          <Text style={[
            styles.badgeText, 
            item.isEnrolled ? { color: colors.badgeEnrolledTextAlt } : { color: colors.badgePendingTextAlt }
          ]}>
            {item.isEnrolled ? 'Enrolled' : 'Pending'}
          </Text>
        </View>

        <ChevronRight size={18} color={colors.textMuted} />
      </TouchableOpacity>
    );
  };

  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Search Header */}
      <View style={[styles.searchBarContainer, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceSubtle }]}>
        <View style={[styles.searchBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Search size={18} color={colors.iconSubtle} style={{ marginRight: 10 }} />
          <TextInput
            style={[styles.searchInput, { color: Colors.textPrimary }]}
            placeholder="Search staff by name or ID..."
            placeholderTextColor={colors.iconSubtle}
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
              <User size={48} color={colors.iconSubtle} />
              <Text style={styles.emptyTitle}>No Staff Found</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                {searchQuery ? 'No matching staff members found.' : 'Add your first staff member to get started.'}
              </Text>
            </View>
          }
        />
      )}

      {/* Floating Add Staff Button */}
      <TouchableOpacity 
        style={[styles.fab, { bottom: Math.max(insets.bottom, 16) + 16, ...shadows.md }]}
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
  },
  searchBarContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
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
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xs + 2,
    borderWidth: 1,
  },
  avatarContainer: {
    marginRight: Spacing.md,
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
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
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 32,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
