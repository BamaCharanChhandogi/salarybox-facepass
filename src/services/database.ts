import * as SQLite from 'expo-sqlite';
import { DB_NAME } from '../constants/config';
import { SEED_USERS } from '../constants/dummyCredentials';
import { User, FaceEnrollment, AttendanceRecord, StaffWithEnrollment } from '../types';
import { nowISO } from '../utils/dateFormat';

let db: SQLite.SQLiteDatabase | null = null;

// ─── Initialization ───────────────────────────────────────────

export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  db = await SQLite.openDatabaseAsync(DB_NAME);

  // Enable WAL for better concurrent read performance
  await db.execAsync('PRAGMA journal_mode = WAL;');

  // Create tables
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'staff')),
      password TEXT NOT NULL,
      profile_photo_uri TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS face_enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      face_embedding TEXT NOT NULL,
      enrollment_photo_uri TEXT NOT NULL,
      enrolled_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS attendance_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('check_in', 'check_out')),
      selfie_uri TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      address TEXT,
      match_confidence REAL NOT NULL,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Seed dummy users if table is empty
  const count = await db.getFirstAsync<{ cnt: number }>(
    'SELECT COUNT(*) as cnt FROM users'
  );
  if (count && count.cnt === 0) {
    for (const user of SEED_USERS) {
      await db.runAsync(
        `INSERT INTO users (employee_id, name, role, password, profile_photo_uri, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [user.employeeId, user.name, user.role, user.password, user.profilePhotoUri ?? null, nowISO()]
      );
    }
  }

  return db;
}

export function getDb(): SQLite.SQLiteDatabase {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.');
  return db;
}

// ─── User Queries ─────────────────────────────────────────────

export async function authenticateUser(
  employeeId: string,
  password: string
): Promise<User | null> {
  const row = await getDb().getFirstAsync<any>(
    'SELECT * FROM users WHERE employee_id = ? AND password = ?',
    [employeeId, password]
  );
  return row ? mapRowToUser(row) : null;
}

export async function getAllStaff(): Promise<StaffWithEnrollment[]> {
  const rows = await getDb().getAllAsync<any>(
    `SELECT u.*, 
            CASE WHEN fe.id IS NOT NULL THEN 1 ELSE 0 END as is_enrolled,
            fe.enrollment_photo_uri
     FROM users u
     LEFT JOIN face_enrollments fe ON u.id = fe.user_id
     WHERE u.role = 'staff'
     ORDER BY u.created_at DESC`
  );
  return rows.map((row) => ({
    ...mapRowToUser(row),
    isEnrolled: row.is_enrolled === 1,
    enrollmentPhotoUri: row.enrollment_photo_uri ?? null,
  }));
}

export async function getStaffById(id: number): Promise<StaffWithEnrollment | null> {
  const row = await getDb().getFirstAsync<any>(
    `SELECT u.*, 
            CASE WHEN fe.id IS NOT NULL THEN 1 ELSE 0 END as is_enrolled,
            fe.enrollment_photo_uri
     FROM users u
     LEFT JOIN face_enrollments fe ON u.id = fe.user_id
     WHERE u.id = ?`,
    [id]
  );
  if (!row) return null;
  return {
    ...mapRowToUser(row),
    isEnrolled: row.is_enrolled === 1,
    enrollmentPhotoUri: row.enrollment_photo_uri ?? null,
  };
}

export async function addStaffMember(
  employeeId: string,
  name: string,
  password: string
): Promise<number> {
  const result = await getDb().runAsync(
    `INSERT INTO users (employee_id, name, role, password, created_at)
     VALUES (?, ?, 'staff', ?, ?)`,
    [employeeId, name, password, nowISO()]
  );
  return result.lastInsertRowId;
}

export async function isEmployeeIdTaken(employeeId: string): Promise<boolean> {
  const row = await getDb().getFirstAsync<{ cnt: number }>(
    'SELECT COUNT(*) as cnt FROM users WHERE employee_id = ?',
    [employeeId]
  );
  return (row?.cnt ?? 0) > 0;
}

// ─── Face Enrollment Queries ──────────────────────────────────

export async function enrollFace(
  userId: number,
  embedding: number[],
  photoUri: string
): Promise<void> {
  const embeddingJson = JSON.stringify(embedding);
  // Upsert: replace if already enrolled
  await getDb().runAsync(
    `INSERT OR REPLACE INTO face_enrollments (user_id, face_embedding, enrollment_photo_uri, enrolled_at)
     VALUES (?, ?, ?, ?)`,
    [userId, embeddingJson, photoUri, nowISO()]
  );
}

export async function getFaceEnrollment(
  userId: number
): Promise<FaceEnrollment | null> {
  const row = await getDb().getFirstAsync<any>(
    'SELECT * FROM face_enrollments WHERE user_id = ?',
    [userId]
  );
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    faceEmbedding: JSON.parse(row.face_embedding),
    enrollmentPhotoUri: row.enrollment_photo_uri,
    enrolledAt: row.enrolled_at,
  };
}

// ─── Attendance Queries ───────────────────────────────────────

export async function recordAttendance(
  userId: number,
  type: 'check_in' | 'check_out',
  selfieUri: string,
  latitude: number,
  longitude: number,
  matchConfidence: number,
  address?: string
): Promise<number> {
  const result = await getDb().runAsync(
    `INSERT INTO attendance_records (user_id, type, selfie_uri, latitude, longitude, address, match_confidence, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, type, selfieUri, latitude, longitude, address ?? null, matchConfidence, nowISO()]
  );
  return result.lastInsertRowId;
}

export async function getAttendanceForUser(
  userId: number,
  limit: number = 50
): Promise<AttendanceRecord[]> {
  const rows = await getDb().getAllAsync<any>(
    `SELECT * FROM attendance_records 
     WHERE user_id = ? 
     ORDER BY timestamp DESC 
     LIMIT ?`,
    [userId, limit]
  );
  return rows.map(mapRowToAttendance);
}

export async function getLatestAttendance(
  userId: number
): Promise<AttendanceRecord | null> {
  const row = await getDb().getFirstAsync<any>(
    `SELECT * FROM attendance_records 
     WHERE user_id = ? 
     ORDER BY timestamp DESC 
     LIMIT 1`,
    [userId]
  );
  return row ? mapRowToAttendance(row) : null;
}

export async function getTodayAttendanceCount(): Promise<number> {
  const row = await getDb().getFirstAsync<{ cnt: number }>(
    `SELECT COUNT(*) as cnt FROM attendance_records 
     WHERE date(timestamp) = date('now')`
  );
  return row?.cnt ?? 0;
}

export async function getTotalStaffCount(): Promise<number> {
  const row = await getDb().getFirstAsync<{ cnt: number }>(
    "SELECT COUNT(*) as cnt FROM users WHERE role = 'staff'"
  );
  return row?.cnt ?? 0;
}

export async function getEnrolledCount(): Promise<number> {
  const row = await getDb().getFirstAsync<{ cnt: number }>(
    'SELECT COUNT(*) as cnt FROM face_enrollments'
  );
  return row?.cnt ?? 0;
}

// ─── Row Mappers ──────────────────────────────────────────────

function mapRowToUser(row: any): User {
  return {
    id: row.id,
    employeeId: row.employee_id,
    name: row.name,
    role: row.role,
    password: row.password,
    profilePhotoUri: row.profile_photo_uri,
    createdAt: row.created_at,
  };
}

function mapRowToAttendance(row: any): AttendanceRecord {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    selfieUri: row.selfie_uri,
    latitude: row.latitude,
    longitude: row.longitude,
    address: row.address,
    matchConfidence: row.match_confidence,
    timestamp: row.timestamp,
  };
}
