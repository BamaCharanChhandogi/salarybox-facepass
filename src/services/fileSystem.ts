import { Paths, File, Directory } from 'expo-file-system';
import { FACE_PHOTOS_DIR, SELFIE_DIR } from '../constants/config';

/**
 * Ensures required directories exist in the app's document storage.
 */
export async function ensureDirectories(): Promise<void> {
  const faceDir = new Directory(Paths.document, FACE_PHOTOS_DIR);
  if (!faceDir.exists) {
    faceDir.create();
  }

  const selfieDir = new Directory(Paths.document, SELFIE_DIR);
  if (!selfieDir.exists) {
    selfieDir.create();
  }
}

/**
 * Saves a face enrollment photo. Returns the relative path (for SQLite storage).
 */
export async function saveFacePhoto(
  userId: number,
  sourceUri: string
): Promise<string> {
  await ensureDirectories();
  const filename = `${userId}_${Date.now()}.jpg`;
  const relativePath = `${FACE_PHOTOS_DIR}${filename}`;
  
  const source = new File(sourceUri);
  const dest = new File(Paths.document, relativePath);
  await source.copy(dest);

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
  const filename = `${userId}_${Date.now()}.jpg`;
  const relativePath = `${SELFIE_DIR}${filename}`;
  
  const source = new File(sourceUri);
  const dest = new File(Paths.document, relativePath);
  await source.copy(dest);

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
  const file = new File(Paths.document, relativePath);
  return file.uri;
}

/**
 * Deletes a photo file by its relative path.
 */
export async function deletePhoto(relativePath: string): Promise<void> {
  const fullUri = resolvePhotoUri(relativePath);
  if (fullUri) {
    const file = new File(fullUri);
    if (file.exists) {
      file.delete();
    }
  }
}
