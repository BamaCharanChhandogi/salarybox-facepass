import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { AttendanceRecord } from '../../types';
import { formatDateTime } from '../../utils/dateFormat';
import { formatConfidence, formatCoordinates } from '../../utils/validators';
import { resolvePhotoUri } from '../../services/fileSystem';
import { Colors, Typography, Spacing } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface AttendanceCardProps {
  record: AttendanceRecord;
}

export const AttendanceCard: React.FC<AttendanceCardProps> = ({ record }) => {
  const isCheckIn = record.type === 'check_in';
  const selfieUri = resolvePhotoUri(record.selfieUri);

  return (
    <Card variant="default" style={styles.container}>
      <View style={styles.header}>
        <View style={styles.typeContainer}>
          <Badge 
            label={isCheckIn ? 'Check In' : 'Check Out'} 
            variant={isCheckIn ? 'success' : 'info'} 
          />
          <Text style={styles.time}>{formatDateTime(record.timestamp)}</Text>
        </View>
        <Avatar source={selfieUri} size="sm" name="Selfie" />
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={16} color={Colors.text} style={styles.icon} />
          <Text style={styles.detailText} numberOfLines={2}>
            {record.address || formatCoordinates(record.latitude, record.longitude)}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="scan-outline" size={16} color={Colors.text} style={styles.icon} />
          <Text style={styles.detailText}>
            Match Confidence: {formatConfidence(record.matchConfidence)}
          </Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  time: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  details: {
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: Spacing.sm,
    opacity: 0.6,
  },
  detailText: {
    ...Typography.caption,
    color: Colors.text,
    opacity: 0.8,
    flex: 1,
  },
});
