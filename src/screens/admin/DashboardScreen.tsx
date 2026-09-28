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
  Image,
  Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { 
  Users, 
  UserCheck, 
  Clock, 
  Plus, 
  Search, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight,
  LogOut,
  Trash2,
  User as UserIcon
} from 'lucide-react-native';
import { Typography, Spacing, BorderRadius } from '../../constants/theme';
import { 
  getTotalStaffCount, 
  getEnrolledCount, 
  getTodayAttendanceCount, 
  getAllStaff,
  deleteStaffMember
} from '../../services/database';
import { resolvePhotoUri } from '../../services/fileSystem';
import { useAuth } from '../../context/AuthContext';
import { AdminStackParamList, StaffWithEnrollment } from '../../types';
import { useTheme } from '../../context/ThemeContext';

type NavigationProp = NativeStackNavigationProp<AdminStackParamList, 'Dashboard'>;

export default function DashboardScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const topSpacing = Math.max(insets.top, 24) + Spacing.sm;
  const { colors, shadows } = useTheme();
  
  const [stats, setStats] = useState({ total: 0, enrolled: 0, today: 0 });
  const [staff, setStaff] = useState<StaffWithEnrollment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'enrolled' | 'pending'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAllData = async () => {
    try {
      const [total, enrolled, today, staffList] = await Promise.all([
        getTotalStaffCount(),
        getEnrolledCount(),
        getTodayAttendanceCount(),
        getAllStaff()
      ]);
      setStats({ total, enrolled, today });
      setStaff(staffList);
    } catch (error) {
      console.error('Failed to load admin dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadAllData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadAllData();
  };

  // Filter staff by search and tab
  const filteredStaff = staff.filter(item => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = item.name.toLowerCase().includes(q) || item.employeeId.toLowerCase().includes(q);
    if (!matchesSearch) return false;

    if (activeFilter === 'enrolled') return item.isEnrolled;
    if (activeFilter === 'pending') return !item.isEnrolled;
    return true;
  });

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of the Admin Portal?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleConfirmDelete = (item: StaffWithEnrollment) => {
    Alert.alert(
      'Delete Staff Member',
      `Are you sure you want to remove ${item.name} (${item.employeeId})? This will permanently delete their profile, face biometrics, and all attendance logs.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteStaffMember(item.id);
              await loadAllData();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete staff member');
            }
          }
        },
      ]
    );
  };

  const renderHeader = () => (
    <View style={[styles.headerSection, { paddingTop: topSpacing }]}>
      {/* Top Greeting Bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={[styles.adminNameText, { color: colors.textPrimary }]}>Workspace Admin</Text>
          <Text style={[styles.welcomeText, { color: colors.textTertiary }]}>ADMIN001 • CONTROL & AUDIT</Text>
        </View>
        <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={handleLogout} activeOpacity={0.8} hitSlop={8}>
          <LogOut size={15} color={colors.iconMedium} style={{ marginRight: 4 }} />
          <Text style={[styles.logoutBtnText, { color: colors.textSecondary }]}>Exit</Text>
        </TouchableOpacity>
      </View>

      {/* Summary KPI Cards */}
      <View style={styles.kpiGrid}>
        <View style={[styles.kpiCard, shadows.sm, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.kpiIconWrap, { backgroundColor: colors.kpiBlueBg }]}>
            <Users size={18} color={colors.primary} />
          </View>
          <Text style={[styles.kpiValue, { color: colors.textPrimary }]}>{stats.total}</Text>
          <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>Total Staff</Text>
        </View>

        <View style={[styles.kpiCard, shadows.sm, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.kpiIconWrap, { backgroundColor: colors.kpiGreenBg }]}>
            <UserCheck size={18} color="#10B981" />
          </View>
          <Text style={[styles.kpiValue, { color: colors.textPrimary }]}>{stats.enrolled}</Text>
          <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>Faces Enrolled</Text>
        </View>

        <View style={[styles.kpiCard, shadows.sm, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.kpiIconWrap, { backgroundColor: colors.kpiTealBg }]}>
            <Clock size={18} color="#0D9488" />
          </View>
          <Text style={[styles.kpiValue, { color: colors.textPrimary }]}>{stats.today}</Text>
          <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>Punches Today</Text>
        </View>
      </View>

      {/* Staff Directory Header */}
      <View style={styles.directoryHeaderRow}>
        <View>
          <Text style={[styles.directoryTitle, { color: colors.textPrimary }]}>Staff Directory</Text>
          <Text style={[styles.directorySubtitle, { color: colors.textSecondary }]}>{filteredStaff.length} employees</Text>
        </View>
        <TouchableOpacity 
          style={[styles.addStaffHeaderBtn, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('AddStaff')}
          activeOpacity={0.85}
        >
          <Plus size={16} color="white" style={{ marginRight: 4 }} />
          <Text style={styles.addStaffHeaderText}>Add Staff</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input Bar */}
      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Search size={16} color={colors.textTertiary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Search staff by name or employee ID..."
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <X size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabsRow}>
        {(['all', 'enrolled', 'pending'] as const).map((filter) => {
          const isActive = activeFilter === filter;
          const label = filter === 'all' ? 'All Staff' : filter === 'enrolled' ? 'Enrolled' : 'Pending Face';
          return (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterTab, 
                { backgroundColor: isActive ? colors.primary : colors.surfaceSubtle }
              ]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[
                styles.filterTabText, 
                { color: isActive ? 'white' : colors.textSecondary }
              ]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderStaffItem = ({ item }: { item: StaffWithEnrollment }) => {
    const photoUri = resolvePhotoUri(item.enrollmentPhotoUri);

    return (
      <TouchableOpacity 
        style={[styles.staffCard, shadows.sm, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => navigation.navigate('StaffProfile', { staffId: item.id })}
        activeOpacity={0.85}
      >
        <View style={[styles.avatarWrap, { borderColor: colors.border }]}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.avatarImg} />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: colors.avatarFallbackBg || colors.surfaceSubtle }]}>
              <UserIcon size={20} color={colors.textSecondary} />
            </View>
          )}
        </View>

        <View style={styles.staffDetails}>
          <Text style={[styles.staffName, { color: colors.textPrimary }]}>{item.name}</Text>
          <Text style={[styles.employeeId, { color: colors.textSecondary }]}>ID: {item.employeeId}</Text>
        </View>

        <View style={[
          styles.badge, 
          { backgroundColor: item.isEnrolled ? colors.badgeEnrolledBg : colors.badgePendingBg }
        ]}>
          {item.isEnrolled ? (
            <CheckCircle2 size={12} color={colors.badgeEnrolledText} style={{ marginRight: 3 }} />
          ) : (
            <AlertCircle size={12} color={colors.badgePendingText} style={{ marginRight: 3 }} />
          )}
          <Text style={[
            styles.badgeText, 
            { color: item.isEnrolled ? colors.badgeEnrolledText : colors.badgePendingText }
          ]}>
            {item.isEnrolled ? 'Enrolled' : 'Pending'}
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.deleteStaffBtn}
          onPress={(e) => {
            handleConfirmDelete(item);
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <Trash2 size={16} color={colors.iconSubtle} />
        </TouchableOpacity>

        <ChevronRight size={16} color={colors.textTertiary} style={{ marginLeft: 2 }} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredStaff}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={renderHeader}
          renderItem={renderStaffItem}
          contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom, 16) + 30 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Users size={40} color={colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                {searchQuery ? 'No matching staff members' : 'No staff members registered'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                {searchQuery ? 'Try adjusting your search query' : 'Tap the "Add Staff" button to register your first employee.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  headerSection: {
    paddingTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  welcomeText: {
    ...Typography.badge,
  },
  adminNameText: {
    ...Typography.h2,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  logoutBtnText: {
    ...Typography.captionMedium,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: Spacing.xs + 2,
    marginBottom: Spacing.xl,
  },
  kpiCard: {
    flex: 1,
    borderRadius: BorderRadius.m,
    padding: Spacing.md,
    borderWidth: 1,
  },
  kpiIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  kpiValue: {
    ...Typography.h1,
    fontSize: 20,
    lineHeight: 24,
  },
  kpiLabel: {
    ...Typography.small,
    marginTop: 2,
  },
  directoryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  directoryTitle: {
    ...Typography.h3,
  },
  directorySubtitle: {
    ...Typography.caption,
    marginTop: 1,
  },
  addStaffHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.m,
  },
  addStaffHeaderText: {
    ...Typography.button,
    fontSize: 13,
    color: 'white',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.m,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    height: 44,
    marginBottom: Spacing.sm,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    fontSize: 14,
    paddingVertical: 0,
  },
  filterTabsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  filterTab: {
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  filterTabText: {
    ...Typography.captionMedium,
    fontSize: 12,
  },
  staffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.m,
    padding: Spacing.md,
    marginBottom: Spacing.xs + 3,
    borderWidth: 1,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    marginRight: Spacing.md,
    borderWidth: 1,
  },
  avatarImg: {
    width: 44,
    height: 44,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffDetails: {
    flex: 1,
  },
  staffName: {
    ...Typography.bodySemiBold,
    fontSize: 14,
  },
  employeeId: {
    ...Typography.small,
    fontSize: 12,
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    ...Typography.badge,
    fontSize: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyTitle: {
    ...Typography.bodySemiBold,
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    ...Typography.caption,
    marginTop: Spacing.xs,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  deleteStaffBtn: {
    padding: 6,
    borderRadius: 6,
    marginLeft: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

