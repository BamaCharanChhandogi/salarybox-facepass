// ─── Face Recognition Config ──────────────────────────────────
export const FACE_MATCH_THRESHOLD = 0.70; // Cosine similarity threshold
export const FACE_DETECTION_FPS = 4; // Throttle frame processor to 4 FPS
export const MOBILEFACENET_INPUT_SIZE = 112; // Model expects 112x112 RGB
export const MOBILEFACENET_EMBEDDING_DIM = 192; // Output embedding dimensions
export const FACE_YAW_LIMIT = 15; // Max yaw angle for valid face
export const FACE_PITCH_LIMIT = 15; // Max pitch angle for valid face
export const EYE_OPEN_THRESHOLD = 0.5; // Min eye-open probability

// ─── App Config ───────────────────────────────────────────────
export const DB_NAME = 'salarybox_attendance.db';
export const FACE_PHOTOS_DIR = 'face_profiles/';
export const SELFIE_DIR = 'attendance_selfies/';
export const APP_NAME = 'SalaryBox Attendance';
