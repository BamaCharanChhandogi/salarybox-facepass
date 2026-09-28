# 📱 SalaryBox FacePass — Smart Biometric Attendance System

A production-grade, selfie-based biometric attendance mobile application built with **React Native (Expo SDK 57)** and powered by **Face++ Cognitive Services AI** for genuine 1:1 facial recognition and verification.

Designed with SalaryBox visual identity, **Inter** typography, **Lucide** iconography, and frictionless evaluator onboarding.

---

## 📦 Quick Links & Submission Deliverables

- 🤖 **Android Standalone APK (Install Link):** [Download Latest APK (Build 93b87a5d)](https://expo.dev/accounts/bama676s-team/projects/salarybox-facepass/builds/93b87a5d-5358-465c-b22c-e2ec5ee6fde4)
- 📋 **System Architecture & Decision Log:** [ARCHITECTURE_AND_DECISIONS.md](./ARCHITECTURE_AND_DECISIONS.md)
- 📄 **AI Conversation Export (JSON - As Requested):** [ai_conversation_transcript.json](./ai_conversation_transcript.json)
- 📖 **AI Conversation Export (Markdown):** [CHAT_EXPORT.md](./CHAT_EXPORT.md)
- 🐙 **GitHub Repository:** [https://github.com/BamaCharanChhandogi/salarybox-facepass](https://github.com/BamaCharanChhandogi/salarybox-facepass)

---

### 1. Frictionless Tap-to-Login & Evaluation
- **Instant Admin Access:** Single prominent card at the top allowing one-tap login as **Super Administrator** (`ADMIN001`) with zero credential typing.
- **Dynamic Staff Directory:** Directly below the Admin section, displays all registered staff in real time. Evaluators can tap any staff member to immediately test their biometric selfie punch.
- **Automatic Staff Sync:** When an Admin registers a new employee in the Admin portal, that new employee dynamically appears in the tap-to-login directory upon logout.
- **Collapsible Manual Sign-in:** Available under an accordion toggle for testing manual credentials.

### 2. Admin Workspace
- **Integrated Dashboard & Staff List:** Executive-grade KPI cards (*Total Staff*, *Faces Enrolled %*, *Today's Check-ins*), instant search bar, filter tabs (*All*, *Enrolled*, *Pending*), and direct staff management.
- **Add Staff:** Register new employees with name, auto-formatted ID, and credentials, with an automatic prompt to enrol their face biometrics.
- **Biometric Face Enrolment:** Full camera viewfinder with an oval framing HUD. Performs real-time face detection and quality validation via Face++ `/detect` (verifying exactly 1 clear face before saving).
- **Minimal Feedback State:** Clean, elegant confirmation card with zero technical data dumping.
- **Visual Attendance Audit:** Chronological attendance logs with side-by-side verification (selfie snapshot, timestamp, reverse-geocoded address, and match score).

### 3. Staff Biometric Attendance
- **Live Status Header:** Real-time check-in status for today with active status pill indicator.
- **Biometric Punch:** Dual action cards for *Punch Check In* (emerald teal accent) and *Punch Check Out* (sky blue accent).
- **1:1 Face Verification:** Compares the live attendance selfie against the staff's enrolled biometric photo via Face++ `/compare`. Requires $\ge 70\%$ confidence threshold. Face mismatches are strictly blocked with clear guidance.
- **GPS & Reverse Geocoding:** Automatically captures GPS coordinates and converts them into human-readable street and city names (e.g. *"Indiranagar, Bengaluru"*).
- **Subtle Modern Modals:** Replaces loud/scammy system alerts with clean receipt modals displaying Punch Type, Time Logged, AI Confidence %, and verified address.
- **Attendance History:** Chronological log of past punches with selfie thumbnails, punch type badges, timestamps, and AI confidence ratings.

---

## 🔑 Demo Credentials

| Role | Employee ID | Password | Access / Capabilities | Tap-to-Login |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `ADMIN001` | `admin123` | Full admin controls, staff directory, face enrolment, attendance audits | 1-Tap Available |
| **Staff** | `EMP001` | `staff123` | Biometric attendance punch (Check-in/Check-out), history | 1-Tap Available |
| **Staff** | `EMP002` | `staff456` | Secondary staff profile | 1-Tap Available |

*Note: You can also create any new staff member in the Admin panel and log in immediately using their assigned ID or tap card.*

---

## 🛠️ Technology Stack & Architecture

- **Framework:** React Native `0.86.3` with Expo SDK `57.0.25` (Expo Go & EAS compatible)
- **Language:** TypeScript 5.8+ (Strict mode, 100% type-safe with 0 compilation errors)
- **Iconography:** `lucide-react-native` (Modern vector outline icons)
- **Local Database:** `expo-sqlite` (WAL mode enabled, storing users, biometric tokens, and attendance logs)
- **Camera & Biometrics:** `expo-camera` with custom HUD Face Viewfinder
- **AI Face Recognition:** Face++ Cloud Cognitive Services (v3 `/detect` and `/compare`)
- **Location & Geocoding:** `expo-location` with `reverseGeocodeAsync`
- **File Storage:** `expo-file-system` for secure local photo persistence
- **Safe Area Insets:** `react-native-safe-area-context` for notch & status bar clearance
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
4. Record linked in SQLite face_enrollments table

[ Staff Attendance Punch ]
1. Staff captures live selfie
2. Live selfie + Enrolled photo sent to Face++ /compare
3. Confidence score calculated:
   - If Score >= 70%: Approved! Attendance recorded with GPS & timestamp.
   - If Score < 70%: Blocked! Friendly feedback modal shown.
```

---

## 💻 How to Run the App

### Prerequisites
- Node.js (v18 or v20 recommended)
- Physical phone with **Expo Go** (Android/iOS) or Android Emulator

### Setup Steps
```bash
# 1. Clone repository
git clone https://github.com/BamaCharanChhandogi/salarybox-facepass.git
cd salarybox-facepass

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Add your Face++ API credentials

# 4. Start Expo development server
npx expo start -c

# 5. Scan QR code in terminal using Expo Go on your phone.
```

---

## ⚙️ Assumptions & Design Decisions
1. **Network Connectivity:** A network connection is utilized exclusively during the face verification step to query Face++ AI. All user records, attendance logs, and photo files remain stored locally on the device in SQLite and app document storage for maximum privacy.
2. **Quality Enforcement:** Enrolment prevents blurred or empty frames by requiring positive face confirmation before saving.
3. **Graceful Fallback:** If GPS or reverse geocoding is unavailable or permission is denied, the app records raw coordinates or marks the location as unavailable without crashing.
