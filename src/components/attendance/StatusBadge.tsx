import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AttendanceRecord } from '../../types';
import { formatDateTime } from '../../utils/dateFormat';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';

interface StatusBadgeProps {
  latestRecord: AttendanceRecord | null;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ latestRecord }) => {
  const getStatus = () => {
    if (!latestRecord) {
      return {
        label: 'Not Checked In',
        color: Colors.text + '20',
        textColor: Colors.text,
        time: null,
      };
    }

    const isCheckIn = latestRecord.type === 'check_in';
    return {
      label: isCheckIn ? 'Checked In' : 'Checked Out',
      color: isCheckIn ? Colors.secondary + '20' : Colors.primary + '20',
      textColor: isCheckIn ? Colors.secondary : Colors.primary,
      time: formatDateTime(latestRecord.timestamp),
    };
  };

  const status = getStatus();

  return (
    <View style={[styles.container, { backgroundColor: status.color }]}>
      <Text style={[styles.label, { color: status.textColor }]}>
        {status.label}
      </Text>
      {status.time && (
        <Text style={[styles.time, { color: status.textColor }]}>
          {status.time}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  label: {
    ...Typography.bodyMedium,
  },
  time: {
    ...Typography.captionMedium,
  },
});
