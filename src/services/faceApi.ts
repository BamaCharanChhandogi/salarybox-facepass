import * as FileSystem from 'expo-file-system';
import { resolvePhotoUri } from './fileSystem';

const FACE_API_KEY = process.env.EXPO_PUBLIC_FACE_API_KEY || '8XvG4fDJOoX3Z0rhyns476B3ppHgsyjb';
const FACE_API_SECRET = process.env.EXPO_PUBLIC_FACE_API_SECRET || 'LoLeHQgrr_b2bpNpykoxmRks3P8O5TjL';
const FACE_API_BASE_URL = process.env.EXPO_PUBLIC_FACE_API_URL || 'https://api-us.faceplusplus.com/facepp/v3';

// Match threshold (Face++ recommends 70-75 for 1e-4 false acceptance rate)
export const FACE_CONFIDENCE_THRESHOLD = 70.0;

export interface FaceDetectResult {
  success: boolean;
  faceCount: number;
  faceToken?: string;
  error?: string;
}

export interface FaceCompareResult {
  isMatch: boolean;
  confidence: number; // 0.0 to 1.0 (normalized)
  rawConfidence: number; // 0.0 to 100.0 (Face++ output)
  error?: string;
}

/**
 * Converts a local file URI to a Base64 string for API submission
 */
async function uriToBase64(uri: string): Promise<string> {
  const resolved = resolvePhotoUri(uri) || uri;
  const base64 = await FileSystem.readAsStringAsync(resolved, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return base64;
}

/**
 * Validates face presence and quality in a photo using Face++ /detect
 */
export async function detectFace(photoUri: string): Promise<FaceDetectResult> {
  try {
    const base64 = await uriToBase64(photoUri);

    const formData = new URLSearchParams();
    formData.append('api_key', FACE_API_KEY);
    formData.append('api_secret', FACE_API_SECRET);
    formData.append('image_base64', base64);
    formData.append('return_attributes', 'headpose,eyestatus,facequality');

    const response = await fetch(`${FACE_API_BASE_URL}/detect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const data = await response.json();

    if (!response.ok || data.error_message) {
      console.warn('[FaceAPI] detect error:', data.error_message);
      return {
        success: false,
        faceCount: 0,
        error: data.error_message || 'Face detection service error',
      };
    }

    const faceCount = data.faces ? data.faces.length : 0;
    if (faceCount === 0) {
      return {
        success: false,
        faceCount: 0,
        error: 'No face detected in photo. Please ensure good lighting and face camera directly.',
      };
    }

    if (faceCount > 1) {
      return {
        success: false,
        faceCount,
        error: 'Multiple faces detected. Please make sure only one person is in frame.',
      };
    }

    return {
      success: true,
      faceCount: 1,
      faceToken: data.faces[0]?.face_token,
    };
  } catch (error: any) {
    console.error('[FaceAPI] detectFace network error:', error);
    return {
      success: false,
      faceCount: 0,
      error: error.message || 'Network error while contacting face recognition service',
    };
  }
}

/**
 * Compares two face photos (e.g. live attendance selfie vs enrolled photo)
 * Returns confidence score and match boolean based on threshold.
 */
export async function compareFaces(
  liveSelfieUri: string,
  enrolledPhotoUri: string
): Promise<FaceCompareResult> {
  try {
    const [base64_1, base64_2] = await Promise.all([
      uriToBase64(liveSelfieUri),
      uriToBase64(enrolledPhotoUri),
    ]);

    const formData = new URLSearchParams();
    formData.append('api_key', FACE_API_KEY);
    formData.append('api_secret', FACE_API_SECRET);
    formData.append('image_base64_1', base64_1);
    formData.append('image_base64_2', base64_2);

    const response = await fetch(`${FACE_API_BASE_URL}/compare`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const data = await response.json();

    if (!response.ok || data.error_message) {
      console.warn('[FaceAPI] compare error:', data.error_message);
      return {
        isMatch: false,
        confidence: 0,
        rawConfidence: 0,
        error: data.error_message || 'Comparison failed. Ensure both photos contain visible faces.',
      };
    }

    const rawConfidence = data.confidence !== undefined ? Number(data.confidence) : 0;
    const isMatch = rawConfidence >= FACE_CONFIDENCE_THRESHOLD;

    return {
      isMatch,
      confidence: rawConfidence / 100.0,
      rawConfidence,
    };
  } catch (error: any) {
    console.error('[FaceAPI] compareFaces error:', error);
    return {
      isMatch: false,
      confidence: 0,
      rawConfidence: 0,
      error: error.message || 'Network error during face verification',
    };
  }
}
