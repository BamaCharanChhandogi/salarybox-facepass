import * as FileSystem from 'expo-file-system';
import { FACE_PHOTOS_DIR, SELFIE_DIR } from '../constants/config';

/**
 * Ensures required directories exist in the app's document storage.
 */
export async function ensureDirectories(): Promise<void> {
  const dirs = [
    `${FileSystem.documentDirectory}${FACE_PHOTOS_DIR}`,
    `${FileSystem.documentDirectory}${SELFIE_DIR}`,
  ];

  for (const dir of dirs) {
    const info = await FileSystem.getInfoAsync(dir);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }
  }
}

/**
 * Saves a face enrollment photo. Returns the relative path (for SQLite storage).
 * We store relative paths to avoid iOS document directory path changes on reinstall.
 */
export async function saveFacePhoto(
  userId: number,
  sourceUri: string
): Promise<string> {
  await ensureDirectories();
  const relativePath = `${FACE_PHOTOS_DIR}${userId}_${Date.now()}.jpg`;
  const destUri = `${FileSystem.documentDirectory}${relativePath}`;
  await FileSystem.copyAsync({ from: sourceUri, to: destUri });
  return relativePath;
}

/**
 * Saves an attendance selfie. Returns the relative path.
 */
export async function saveSelfie(
  userId: number,
  sourceUri: string
): Promise<string> {
  await ensureDirectories();
  const relativePath = `${SELFIE_DIR}${userId}_${Date.now()}.jpg`;
  const destUri = `${FileSystem.documentDirectory}${relativePath}`;
  await FileSystem.copyAsync({ from: sourceUri, to: destUri });
  return relativePath;
}

/**
 * Resolves a relative path to a full file:// URI for display.
 */
export function resolvePhotoUri(relativePath: string | null | undefined): string | null {
  if (!relativePath) return null;
  // If it's already an absolute URI, return as-is
  if (relativePath.startsWith('file://') || relativePath.startsWith('content://')) {
    return relativePath;
  }
  return `${FileSystem.documentDirectory}${relativePath}`;
}

/**
 * Deletes a photo file by its relative path.
 */
export async function deletePhoto(relativePath: string): Promise<void> {
  const uri = resolvePhotoUri(relativePath);
  if (uri) {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) {
      await FileSystem.deleteAsync(uri);
    }
  }
}
