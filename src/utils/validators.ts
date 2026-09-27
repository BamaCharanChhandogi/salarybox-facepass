/**
 * Validates employee ID format: alphanumeric, 3-10 chars.
 */
export function isValidEmployeeId(id: string): boolean {
  return /^[A-Za-z0-9]{3,10}$/.test(id.trim());
}

/**
 * Validates a name: at least 2 characters, letters and spaces only.
 */
export function isValidName(name: string): boolean {
  return /^[A-Za-z\s]{2,50}$/.test(name.trim());
}

/**
 * Validates password: at least 4 characters.
 */
export function isValidPassword(password: string): boolean {
  return password.length >= 4;
}

/**
 * Formats a confidence score as a percentage string.
 * Example: 0.876 → "87.6%"
 */
export function formatConfidence(confidence: number): string {
  return `${(confidence * 100).toFixed(1)}%`;
}

/**
 * Formats GPS coordinates for display.
 * Example: "12.9716° N, 77.5946° E"
 */
export function formatCoordinates(lat: number, lon: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lon).toFixed(4)}° ${lonDir}`;
}
