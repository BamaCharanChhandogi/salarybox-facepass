import { detectFace, compareFaces, FACE_CONFIDENCE_THRESHOLD } from './faceApi';
import { FaceMatchResult } from '../types';

/**
 * Validates face presence and quality for face enrollment.
 * Uses Face++ API to verify that exactly 1 clear face exists.
 */
export async function validateEnrollmentPhoto(photoUri: string): Promise<{ valid: boolean; error?: string; faceToken?: string }> {
  const result = await detectFace(photoUri);
  if (!result.success) {
    return {
      valid: false,
      error: result.error || 'Face validation failed. Please retake photo.',
    };
  }
  return {
    valid: true,
    faceToken: result.faceToken,
  };
}

/**
 * Compares the captured live selfie against the stored enrollment photo.
 * Uses Face++ API 1:1 facial comparison.
 */
export async function verifyFaceMatch(
  liveSelfieUri: string,
  enrolledPhotoUri: string
): Promise<FaceMatchResult> {
  const result = await compareFaces(liveSelfieUri, enrolledPhotoUri);

  return {
    matched: result.isMatch,
    confidence: result.confidence,
    rawConfidence: result.rawConfidence,
    error: result.error,
  };
}
