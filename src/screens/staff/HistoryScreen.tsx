import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Clock, MapPin, Calendar, CheckCircle2, ScanFace } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { getAttendanceForUser } from '../../services/database';
import { resolvePhotoUri } from '../../services/fileSystem';
import { AttendanceRecord } from '../../types';
import { formatTime, formatDate } from '../../utils/dateFormat';
import { useTheme } from '../../context/ThemeContext';

export function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { colors, shadows } = useTheme();
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
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceSubtle, ...shadows.sm }]}>
        <View style={styles.cardMainRow}>
          {/* Selfie Thumbnail */}
          <View style={styles.thumbContainer}>
            {selfieUri ? (
              <Image source={{ uri: selfieUri }} style={[styles.thumbImage, { borderColor: colors.border }]} />
            ) : (
              <View style={[styles.typeIconBox, isCheckIn ? { backgroundColor: colors.badgeEnrolledBg } : { backgroundColor: colors.checkOutIconBg }]}>
                <Clock size={20} color={isCheckIn ? '#059669' : '#0284C7'} />
              </View>
            )}
          </View>

          {/* Details */}
          <View style={styles.cardDetails}>
            <View style={styles.titleRow}>
              <View style={[
                styles.typeBadge, 
                isCheckIn ? { backgroundColor: colors.badgeEnrolledBgAlt } : { backgroundColor: colors.checkOutCardBorder }
              ]}>
                <Text style={[
                  styles.typeBadgeText, 
                  isCheckIn ? { color: colors.badgeEnrolledTextAlt } : { color: colors.typeCheckOutText }
                ]}>
                  {isCheckIn ? 'CHECK IN' : 'CHECK OUT'}
                </Text>
              </View>
              <Text style={styles.timeText}>{formatTime(item.timestamp)}</Text>
            </View>

            <Text style={[styles.dateText, { color: colors.textSecondary }]}>{formatDate(item.timestamp)}</Text>

            {item.address ? (
              <View style={styles.locationRow}>
                <MapPin size={11} color={colors.iconMedium} style={{ marginRight: 3, marginTop: 1 }} />
                <Text style={[styles.addressText, { color: colors.textSecondary }]} numberOfLines={1}>
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
            <Text style={[styles.scoreLabel, { color: colors.textTertiary }]}>AI Match</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceSubtle }]}>
        <View>
          <Text style={styles.headerTitle}>Attendance History</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Verified punch records & location logs</Text>
        </View>
        <View style={[styles.countBadge, { backgroundColor: colors.kpiBlueBg, borderColor: colors.dateBoxBorder }]}>
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
            <Calendar size={48} color={colors.iconSubtle} />
            <Text style={styles.emptyTitle}>No Attendance Records Yet</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Mark attendance from the punch screen to see your history.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
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
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.xs + 2,
    borderWidth: 1,
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
  },
  typeIconBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
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
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  dateText: {
    fontSize: 12,
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressText: {
    fontSize: 11,
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
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 32,
  },
});
