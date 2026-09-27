import * as Location from 'expo-location';

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  isMocked?: boolean;
}

/**
 * Requests foreground location permission.
 * Returns true if granted.
 */
export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

/**
 * Gets current GPS coordinates with optional reverse geocoding and mock detection.
 */
export async function getCurrentLocation(): Promise<LocationData> {
  const hasPermission = await requestLocationPermission();
  if (!hasPermission) {
    throw new Error('Location permission not granted');
  }

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  const { latitude, longitude } = location.coords;
  const isMocked = (location as any).mocked === true;

  // Attempt reverse geocoding for a human-readable address
  let address: string | undefined;
  try {
    const [geo] = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (geo) {
      const parts = [geo.name, geo.street, geo.city, geo.region].filter(Boolean);
      address = parts.join(', ');
    }
  } catch {
    // Reverse geocoding is optional, silently fail
  }

  return { latitude, longitude, address, isMocked };
}
