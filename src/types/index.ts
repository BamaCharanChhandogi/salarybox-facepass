// ─── User & Auth ──────────────────────────────────────────────
export type UserRole = 'admin' | 'staff';
export type AttendanceType = 'check_in' | 'check_out';

export interface User {
  id: number;
  employeeId: string;
  name: string;
  role: UserRole;
  password: string;
  profilePhotoUri?: string | null;
  createdAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

// ─── Face Recognition ─────────────────────────────────────────
export interface FaceEnrollment {
  id: number;
  userId: number;
  faceEmbedding: number[]; // 128 or 192-dim float array
  enrollmentPhotoUri: string;
  enrolledAt: string;
}

export interface FaceDetectionResult {
  detected: boolean;
  faceCount: number;
  bounds?: FaceBounds;
  yawAngle?: number;
  pitchAngle?: number;
  rollAngle?: number;
  leftEyeOpenProbability?: number;
  rightEyeOpenProbability?: number;
}

export interface FaceBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FaceMatchResult {
  matched: boolean;
  confidence: number;
  rawConfidence?: number;
  embedding?: number[];
  error?: string;
}

// ─── Attendance ───────────────────────────────────────────────
export interface AttendanceRecord {
  id: number;
  userId: number;
  type: AttendanceType;
  selfieUri: string;
  latitude: number;
  longitude: number;
  address?: string | null;
  matchConfidence: number;
  timestamp: string;
}

// ─── Navigation ───────────────────────────────────────────────
export type RootStackParamList = {
  Login: undefined;
  AdminTabs: undefined;
  StaffTabs: undefined;
};

export type AdminStackParamList = {
  Dashboard: undefined;
  StaffList: undefined;
  AddStaff: undefined;
  StaffProfile: { staffId: number };
  FaceEnroll: { staffId: number; staffName: string };
};

export type StaffStackParamList = {
  Attendance: undefined;
  History: undefined;
};

// ─── Component Props ──────────────────────────────────────────
export interface StaffWithEnrollment extends User {
  isEnrolled: boolean;
  enrollmentPhotoUri?: string | null;
}
