import { detectFace, compareFaces, FACE_CONFIDENCE_THRESHOLD } from './faceApi';
import { FaceMatchResult } from '../types';
import { getAllOtherEnrolledStaff } from './database';
import { resolvePhotoUri } from './fileSystem';

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  matchedStaffName?: string;
  matchedEmployeeId?: string;
  confidence?: number;
}

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

/**
 * Checks if a candidate face matches any existing enrolled employee face.
 * Performs a 1:N deduplication scan across the database.
 */
export async function checkDuplicateFace(
  newPhotoUri: string,
  excludeStaffId: number
): Promise<DuplicateCheckResult> {
  const otherEnrolled = await getAllOtherEnrolledStaff(excludeStaffId);
  
  for (let i = 0; i < otherEnrolled.length; i++) {
    const existing = otherEnrolled[i];
    if (existing.enrollmentPhotoUri) {
      const existingResolved = resolvePhotoUri(existing.enrollmentPhotoUri);
      if (existingResolved) {
        // Safe 300ms throttle between sequential Face++ calls to protect QPS limits
        if (i > 0) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }

        const result = await verifyFaceMatch(newPhotoUri, existingResolved);
        if (result.matched) {
          return {
            isDuplicate: true,
            matchedStaffName: existing.name,
            matchedEmployeeId: existing.employeeId,
            confidence: result.rawConfidence,
          };
        }
      }
    }
  }

  return { isDuplicate: false };
}
