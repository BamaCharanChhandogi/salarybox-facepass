# 📱 SalaryBox FacePass — Smart Biometric Attendance System

A production-grade, selfie-based biometric attendance mobile application built with **React Native (Expo SDK 52)** and powered by **Face++ Cognitive Services AI** for genuine 1:1 facial recognition and verification.

---

## 🚀 Key Features

### 1. Smart Hybrid Authentication
- **Full Interactive Form:** Standard input fields for Employee ID and Password allowing any newly created employee to log in immediately.
- **One-Tap Quick Demo Buttons:** Instant 1-tap sign in for both **Demo Admin** (`ADMIN001`) and **Demo Staff** (`EMP001`).
- **Dynamic Staff Picker:** Horizontal chip selector of all registered staff in the database for effortless evaluation without memorizing IDs.

### 2. Admin Workspace
- **Overview Dashboard:** Live KPI cards showing Total Staff, Face Enrollment Status, and Today's Check-ins.
- **Staff Directory & Search:** Filter employees by name or Employee ID, displaying enrolled face thumbnails and enrollment badges.
- **Add Staff:** Register new employees with name, auto-formatted ID, and credentials, with an instant prompt to enrol their face biometrics.
- **Biometric Face Enrolment:** Camera with an oval framing HUD. Performs real-time face detection and quality validation via Face++ `/detect` (verifying exactly 1 clear face before saving).
- **Visual Attendance Audit:** Inspect complete chronological attendance logs with side-by-side verification (selfie snapshot, timestamp, reverse-geocoded address, and match score).

### 3. Staff Biometric Attendance
- **Live Status Header:** Shows real-time check-in status for today ("Currently Checked In" vs "Not Checked In Today").
- **Biometric Punch:** Full-screen camera with guided facial oval.
- **1:1 Face Verification:** Compares the live attendance selfie against the staff's enrolled biometric photo via Face++ `/compare`. Requires $\ge 70\%$ confidence threshold. Face mismatches are strictly rejected.
- **GPS & Reverse Geocoding:** Automatically captures GPS coordinates and converts them into street and city names (e.g. *"Indiranagar, Bengaluru"*).
- **Attendance History:** Chronological log of past punches with selfie thumbnails, punch type (Check In / Check Out), timestamps, and AI confidence ratings.

---

## 🔑 Demo Credentials

| Role | Employee ID | Password | Access / Capabilities |
| :--- | :--- | :--- | :--- |
| **Admin** | `ADMIN001` | `admin123` | Full admin controls, staff directory, face enrolment, attendance audits |
| **Staff** | `EMP001` | `staff123` | Biometric attendance punch (Check-in/Check-out), history |
| **Staff** | `EMP002` | `staff456` | Secondary staff profile |

*Note: You can also create any new staff member in the Admin panel and log in immediately using their assigned ID.*

---

## 🛠️ Technology Stack & Architecture

- **Framework:** React Native `0.76.9` with Expo SDK `~52.0.0`
- **Language:** TypeScript 5.3+ (Strict mode, 100% type-safe with 0 compilation errors)
- **Local Database:** `expo-sqlite` (WAL mode enabled, storing users, biometric tokens, and attendance logs)
- **Camera & Biometrics:** `expo-camera` with custom HUD Face Viewfinder
- **AI Face Recognition:** Face++ Cloud Cognitive Services (v3 `/detect` and `/compare`)
- **Location & Geocoding:** `expo-location` with `reverseGeocodeAsync`
- **File Storage:** `expo-file-system` for secure local photo persistence
- **Typography:** Inter (`@expo-google-fonts/inter`: 400, 500, 600, 700)
- **Design System:** SalaryBox Brand Colors (Primary Blue `#0084FF`, Secondary Teal `#00D2B4`, Slate backgrounds)

---

## 🧠 Face Recognition Pipeline Explained

```
[ Admin Enrolment ]
1. Camera captures staff photo
2. Face++ /detect checks:
   - Exactly 1 face detected?
   - Quality / Head pose acceptable?
3. Photo saved to local file system
4. Record linked in SQLite face_enrollments

[ Staff Attendance Punch ]
1. Staff captures live selfie
2. Live selfie + Enrolled photo sent to Face++ /compare
3. Confidence score calculated:
   - If Score >= 70%: Approved! Attendance recorded with GPS & timestamp.
   - If Score < 70%: Blocked! "Face Mismatch" alert shown.
```

---

## 💻 How to Run the App

### Prerequisites
- Node.js (v18 or v20 recommended)
- Android Studio / Android Emulator OR physical Android phone with **Expo Go**

### Setup Steps
```bash
# 1. Navigate to the project directory
cd "D:\Programming\TEMP\salarybox-facepass"

# 2. Start the Expo development server
npx expo start

# 3. Press 'a' in the terminal to launch on connected Android device/emulator,
#    or scan the QR code using the Expo Go app.
```

---

## ⚙️ Assumptions & Design Decisions
1. **Network Connectivity:** A network connection is utilized exclusively during the face verification step to query Face++ AI. All user records, attendance logs, and photo files remain stored locally on the device in SQLite and app document storage for maximum privacy.
2. **Quality Enforcement:** Enrolment prevents blurred or empty frames by requiring positive face confirmation before saving.
3. **Graceful Fallback:** If GPS or reverse geocoding is unavailable or permission is denied, the app records raw coordinates or marks the location as unavailable without crashing.
