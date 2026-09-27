import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, RefreshControl, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { getAttendanceForUser } from '../../services/database';
import { resolvePhotoUri } from '../../services/fileSystem';
import { AttendanceRecord } from '../../types';
import { formatTime, formatDate } from '../../utils/dateFormat';

export function HistoryScreen() {
  const { user } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = async () => {
    if (user) {
      const data = await getAttendanceForUser(user.id);
      setRecords(data);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadHistory();
    }, [user])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: AttendanceRecord }) => {
    const selfieUri = resolvePhotoUri(item.selfieUri);

    return (
      <View style={styles.card}>
        <View style={styles.cardMainRow}>
          {/* Selfie Thumbnail */}
          <View style={styles.thumbContainer}>
            {selfieUri ? (
              <Image source={{ uri: selfieUri }} style={styles.thumbImage} />
            ) : (
              <Ionicons 
                name={item.type === 'check_in' ? 'log-in-outline' : 'log-out-outline'} 
                size={24} 
                color={item.type === 'check_in' ? Colors.secondary : Colors.primary} 
              />
            )}
          </View>

          {/* Details */}
          <View style={styles.cardDetails}>
            <View style={styles.titleRow}>
              <View style={[
                styles.typeBadge, 
                item.type === 'check_in' ? styles.typeCheckIn : styles.typeCheckOut
              ]}>
                <Text style={[
                  styles.typeBadgeText, 
                  item.type === 'check_in' ? styles.textCheckIn : styles.textCheckOut
                ]}>
                  {item.type === 'check_in' ? 'CHECK IN' : 'CHECK OUT'}
                </Text>
              </View>
              <Text style={styles.timeText}>{formatTime(item.timestamp)}</Text>
            </View>

            <Text style={styles.dateText}>{formatDate(item.timestamp)}</Text>

            {item.address && (
              <Text style={styles.addressText} numberOfLines={1}>
                📍 {item.address}
              </Text>
            )}
          </View>

          {/* Match Score */}
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreNumber}>
              {Math.round(item.matchConfidence * 100)}%
            </Text>
            <Text style={styles.scoreLabel}>Verified</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Attendance History</Text>
        <Text style={styles.headerSubtitle}>Verified punch records & location logs</Text>
      </View>

      <FlatList
        data={records}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={56} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No Attendance Records Yet</Text>
            <Text style={styles.emptySubtext}>Mark attendance from the punch screen to see your history.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  listContainer: {
    padding: Spacing.md,
    flexGrow: 1,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: Spacing.md,
  },
  thumbImage: {
    width: 48,
    height: 48,
  },
  cardDetails: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginRight: Spacing.sm,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  typeCheckIn: {
    backgroundColor: '#E6FFFA',
  },
  typeCheckOut: {
    backgroundColor: '#EFF6FF',
  },
  typeBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
  },
  textCheckIn: {
    color: '#0D9488',
  },
  textCheckOut: {
    color: '#2563EB',
  },
  timeText: {
    ...Typography.bodySemiBold,
    color: Colors.textPrimary,
  },
  dateText: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  addressText: {
    ...Typography.small,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  scoreContainer: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  scoreNumber: {
    ...Typography.captionMedium,
    color: '#0084FF',
  },
  scoreLabel: {
    fontSize: 9,
    color: Colors.textTertiary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xxl * 2,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  emptySubtext: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
});
