import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Colors, Typography } from '../../constants/theme';

export interface AvatarProps {
  source?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  badge?: 'success' | 'error';
}

const SIZE_MAP = {
  sm: 32,
  md: 48,
  lg: 72,
  xl: 96,
};

export const Avatar: React.FC<AvatarProps> = ({ source, name, size = 'md', badge }) => {
  const pixelSize = SIZE_MAP[size];

  const getInitials = (name?: string) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <View style={[styles.container, { width: pixelSize, height: pixelSize, borderRadius: pixelSize / 2 }]}>
      {source ? (
        <Image 
          source={{ uri: source }} 
          style={[styles.image, { width: pixelSize, height: pixelSize, borderRadius: pixelSize / 2 }]} 
        />
      ) : (
        <View style={[styles.fallback, { width: pixelSize, height: pixelSize, borderRadius: pixelSize / 2 }]}>
          <Text style={[styles.initials, { fontSize: pixelSize * 0.4 }]}>
            {getInitials(name)}
          </Text>
        </View>
      )}
      
      {badge && (
        <View style={[
          styles.badge, 
          { 
            backgroundColor: badge === 'success' ? Colors.secondary : Colors.error,
            width: pixelSize * 0.25,
            height: pixelSize * 0.25,
            borderRadius: pixelSize * 0.125,
            right: 0,
            bottom: 0,
            borderWidth: 2,
            borderColor: Colors.surface,
          }
        ]} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: Colors.text + '20',
  },
  image: {
    resizeMode: 'cover',
  },
  fallback: {
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    ...Typography.bodySemiBold,
    color: Colors.surface,
  },
  badge: {
    position: 'absolute',
  },
});
