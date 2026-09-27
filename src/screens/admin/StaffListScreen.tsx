import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView, 
  ActivityIndicator, 
  RefreshControl,
  TextInput,
  Image
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
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
            <Ionicons name="person" size={24} color="white" />
          )}
        </View>

        <View style={styles.staffInfo}>
          <Text style={styles.staffName}>{item.name}</Text>
          <Text style={styles.employeeId}>ID: {item.employeeId}</Text>
        </View>

        <View style={[styles.badge, item.isEnrolled ? styles.badgeEnrolled : styles.badgeNotEnrolled]}>
          <Ionicons 
            name={item.isEnrolled ? "checkmark-circle" : "alert-circle"} 
            size={12} 
            color={item.isEnrolled ? "#059669" : "#D97706"} 
            style={{ marginRight: 3 }}
          />
          <Text style={[styles.badgeText, item.isEnrolled ? styles.badgeTextEnrolled : styles.badgeTextNotEnrolled]}>
            {item.isEnrolled ? 'Enrolled' : 'Pending'}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Search Header */}
      <View style={styles.searchBarContainer}>
        <Ionicons name="search" size={20} color={Colors.textSecondary} style={{ marginRight: Spacing.sm }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or Employee ID..."
          placeholderTextColor={Colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={filteredStaff}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={56} color={Colors.textTertiary} />
              <Text style={styles.emptyText}>
                {searchQuery ? 'No matching staff members' : 'No staff members found'}
              </Text>
              <Text style={styles.emptySubtext}>
                {searchQuery ? 'Try a different search term' : 'Tap the + button below to add staff.'}
              </Text>
            </View>
          }
        />
      )}
      
      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('AddStaff')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: Spacing.m,
    marginTop: Spacing.m,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.textPrimary,
  },
  listContainer: {
    padding: Spacing.m,
    paddingBottom: Spacing.xxl + 20,
    flexGrow: 1,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  staffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.m,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: Spacing.m,
  },
  avatarImage: {
    width: 48,
    height: 48,
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    ...Typography.bodySemiBold,
    color: Colors.textPrimary,
  },
  employeeId: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.s,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  badgeEnrolled: {
    backgroundColor: '#D1FAE5',
  },
  badgeNotEnrolled: {
    backgroundColor: '#FEF3C7',
  },
  badgeText: {
    ...Typography.smallMedium,
  },
  badgeTextEnrolled: {
    color: '#059669',
  },
  badgeTextNotEnrolled: {
    color: '#D97706',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyText: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginTop: Spacing.m,
  },
  emptySubtext: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.xl,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#0084FF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg,
  },
});
