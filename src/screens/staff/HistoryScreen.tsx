import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Clock, MapPin, Calendar, CheckCircle2, ScanFace } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { getAttendanceForUser } from '../../services/database';
import { resolvePhotoUri } from '../../services/fileSystem';
import { AttendanceRecord } from '../../types';
import { formatTime, formatDate } from '../../utils/dateFormat';

export function HistoryScreen() {
  const insets = useSafeAreaInsets();
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
    const isCheckIn = item.type === 'check_in';

    return (
      <View style={styles.card}>
        <View style={styles.cardMainRow}>
          {/* Selfie Thumbnail */}
          <View style={styles.thumbContainer}>
            {selfieUri ? (
              <Image source={{ uri: selfieUri }} style={styles.thumbImage} />
            ) : (
              <View style={[styles.typeIconBox, isCheckIn ? styles.typeCheckInBox : styles.typeCheckOutBox]}>
                <Clock size={20} color={isCheckIn ? '#059669' : '#0284C7'} />
              </View>
            )}
          </View>

          {/* Details */}
          <View style={styles.cardDetails}>
            <View style={styles.titleRow}>
              <View style={[
                styles.typeBadge, 
                isCheckIn ? styles.typeCheckIn : styles.typeCheckOut
              ]}>
                <Text style={[
                  styles.typeBadgeText, 
                  isCheckIn ? styles.textCheckIn : styles.textCheckOut
                ]}>
                  {isCheckIn ? 'CHECK IN' : 'CHECK OUT'}
                </Text>
              </View>
              <Text style={styles.timeText}>{formatTime(item.timestamp)}</Text>
            </View>

            <Text style={styles.dateText}>{formatDate(item.timestamp)}</Text>

            {item.address ? (
              <View style={styles.locationRow}>
                <MapPin size={11} color="#64748B" style={{ marginRight: 3, marginTop: 1 }} />
                <Text style={styles.addressText} numberOfLines={1}>
                  {item.address}
                </Text>
              </View>
            ) : null}
          </View>

          {/* AI Match Score */}
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreNumber}>
              {Math.round(item.matchConfidence * 100)}%
            </Text>
            <Text style={styles.scoreLabel}>AI Match</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Attendance History</Text>
          <Text style={styles.headerSubtitle}>Verified punch records & location logs</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{records.length} logs</Text>
        </View>
      </View>

      <FlatList
        data={records}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContainer, { paddingBottom: Math.max(insets.bottom, 16) + 30 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Calendar size={48} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Attendance Records Yet</Text>
            <Text style={styles.emptySubtext}>Mark attendance from the punch screen to see your history.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  countBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  listContainer: {
    padding: Spacing.md,
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.xs + 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Shadows.sm,
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbContainer: {
    marginRight: Spacing.md,
  },
  thumbImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  typeIconBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeCheckInBox: {
    backgroundColor: '#ECFDF5',
  },
  typeCheckOutBox: {
    backgroundColor: '#F0F9FF',
  },
  cardDetails: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeCheckIn: {
    backgroundColor: '#DCFCE7',
  },
  typeCheckOut: {
    backgroundColor: '#E0F2FE',
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  textCheckIn: {
    color: '#15803D',
  },
  textCheckOut: {
    color: '#0369A1',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  dateText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressText: {
    fontSize: 11,
    color: '#64748B',
    flex: 1,
  },
  scoreContainer: {
    alignItems: 'center',
    paddingLeft: 8,
  },
  scoreNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  scoreLabel: {
    fontSize: 10,
    color: '#94A3B8',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 32,
  },
});
