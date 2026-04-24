# 📁 Frontend Documentation (FE)

## 🧭 Overview
* **Tech Stack**: React, Vite, Tailwind CSS
* **App Structure**: Component-based architecture with centralized state (Context Providers) and decoupled API communication services.

## 🔗 Data Flow
* **UI → Service → API → Backend**:
  * React Components (UI) capture user actions (e.g., clicking a button).
  * The component calls a dedicated method in the `services/` layer.
  * The service uses Axios to format and send HTTP requests to the backend API endpoints.
  * The backend responds with data, which the service returns to the component to update local React state or global Context, triggering a UI re-render.

## 📁 Folder Breakdown & File Structure

```text
frontend/
├── 📁 src/
│   ├── 📁 components/
│   │   ├── 📁 Timetable/
│   │   │   * 🧠 Purpose: Components specific to the class schedule system
│   │   │   * 🔗 Relationships: React
│   │   ├── 📁 common/
│   │   │   * 🧠 Purpose: Generic UI components used across multiple pages
│   │   │   * 🔗 Relationships: React
│   │   ├── 🎨 ActivitiesSection.jsx
│   │   │   * 🧠 Purpose: Displays the Activities grid
│   │   │   * 🔗 Relationships: React
│   │   ├── 🎨 ActivityPopup.jsx
│   │   │   * 🧠 Purpose: Detailed modal for extracurricular activities
│   │   │   * 🔗 Relationships: React
│   │   ├── 🎨 AnnouncementListModal.jsx
│   │   │   * 🧠 Purpose: Modal showing a list of all announcements
│   │   │   * 🔗 Relationships: React
│   │   ├── 🎨 AnnouncementModal.jsx
│   │   │   * 🧠 Purpose: Popup display for a single important school news
│   │   │   * 🔗 Relationships: React
│   │   ├── 🎨 AnnouncementSection.jsx
│   │   │   * 🧠 Purpose: Scrolling marquee or grid of current announcements
│   │   │   * 🔗 Relationships: React
│   │   ├── 🎨 CourseDetailModal.jsx
│   │   │   * 🧠 Purpose: Informational modal showing course curriculum and price
│   │   │   * 🔗 Relationships: React
│   │   ├── 🎨 CoursesSection.jsx
│   │   │   * 🧠 Purpose: The main landing page course catalog
│   │   │   * 🔗 Relationships: React
│   │   ├── 🎨 CreatorPopup.jsx
│   │   │   * 🧠 Purpose: Informational modal about the developers
│   │   │   * 🔗 Relationships: React
│   │   ├── 🎨 Fireworks.jsx
│   │   │   * 🧠 Purpose: Canvas-based animation for successful check-ins
│   │   │   * 🔗 Relationships: React
│   │   ├── 🎨 FlameButton.jsx
│   │   │   * 🧠 Purpose: Floating streak button with drag/drop state
│   │   │   * 🔗 Relationships: react-use-gesture, streakService
│   │   ├── 🎨 HeartRain.jsx
│   │   │   * 🧠 Purpose: Background animation for celebrations
│   │   │   * 🔗 Relationships: React
│   │   ├── 🎨 HeroSection.jsx
│   │   │   * 🧠 Purpose: The main above-the-fold landing page area
│   │   │   * 🔗 Relationships: React
│   │   ├── 🎨 LearningJourney.jsx
│   │   │   * 🧠 Purpose: Visual timeline of student progress
│   │   │   * 🔗 Relationships: React
│   │   ├── 🎨 NotificationBell.jsx
│   │   │   * 🧠 Purpose: Interactive bell icon with unread count and dropdown
│   │   │   * 🔗 Relationships: React, contexts
│   │   ├── 🔐 ProtectedRoute.jsx
│   │   │   * 🧠 Purpose: Wrapper component for routes requiring authentication
│   │   │   * 🔗 Relationships: react-router-dom, AuthContext
│   │   ├── 🎨 RecaptchaBox.jsx
│   │   │   * 🧠 Purpose: Container for the Google reCAPTCHA
│   │   │   * 🔗 Relationships: react-google-recaptcha
│   │   ├── 🧠 RecaptchaProvider.jsx
│   │   │   * 🧠 Purpose: Context provider for reCAPTCHA v3
│   │   │   * 🔗 Relationships: React Context
│   │   ├── 🎨 RegistrationForm.jsx
│   │   │   * 🧠 Purpose: Primary student enrollment form
│   │   │   * 🔗 Relationships: React Hook Form
│   │   ├── 🎨 ScrollHintButton.jsx
│   │   │   * 🧠 Purpose: Subtle indicator to scroll
│   │   │   * 🔗 Relationships: React
│   │   ├── 🎨 TeachersSection.jsx
│   │   │   * 🧠 Purpose: Interactive grid of teacher cards
│   │   │   * 🔗 Relationships: React
│   │   ├── 🎨 TestimonialsSection.jsx
│   │   │   * 🧠 Purpose: Slider/grid of parent and student feedback
│   │   │   * 🔗 Relationships: React
│   │   └── 🎨 WhyChooseUs.jsx
│   │       * 🧠 Purpose: Feature highlight section
│   │       * 🔗 Relationships: React
│   ├── 📁 config/
│   │   └── ⚙️ api.js
│   │       * 🧠 Purpose: Backend URL and basic API configuration
│   │       * 🔗 Relationships: App constants
│   ├── 📁 contexts/
│   │   └── 🧠 AuthContext.jsx
│   │       * 🧠 Purpose: Manages authentication state and persistence
│   │       * 🔗 Relationships: React, authService
│   ├── 📁 hooks/
│   │   ├── ⚙️ useLockBodyScroll.js
│   │   │   * 🧠 Purpose: Prevents page scrolling when modal is active
│   │   │   * 🔗 Relationships: React
│   │   └── ⚙️ useNotifications.js
│   │       * 🧠 Purpose: Hook to manage unread notifications and bell state
│   │       * 🔗 Relationships: React
│   ├── 📁 i18n/
│   │   ├── 📄 en.json
│   │   │   * 🧠 Purpose: English translations
│   │   │   * 🔗 Relationships: i18next
│   │   ├── ⚙️ index.js
│   │   │   * 🧠 Purpose: i18next initialization and language resources
│   │   │   * 🔗 Relationships: i18next
│   │   ├── 📄 vi.json
│   │   │   * 🧠 Purpose: Vietnamese translations
│   │   │   * 🔗 Relationships: i18next
│   │   └── 📄 zh.json
│   │       * 🧠 Purpose: Chinese translations
│   │       * 🔗 Relationships: i18next
│   ├── 📁 layouts/
│   │   ├── 🎨 AdminLayout.jsx
│   │   │   * 🧠 Purpose: Shell layout for admin users
│   │   │   * 🔗 Relationships: react-router-dom, Navbar
│   │   ├── 🎨 Footer.jsx
│   │   │   * 🧠 Purpose: Common footer with contact info
│   │   │   * 🔗 Relationships: React
│   │   ├── 🎨 Navbar.jsx
│   │   │   * 🧠 Purpose: Main navigation bar
│   │   │   * 🔗 Relationships: react-router-dom, AuthContext
│   │   └── 🎨 StaffLayout.jsx
│   │       * 🧠 Purpose: Shell layout for teacher and staff users
│   │       * 🔗 Relationships: react-router-dom, Navbar
│   ├── 📁 pages/
│   │   ├── 📁 Admin/
│   │   │   * 🧠 Purpose: Admin specific feature pages
│   │   │   * 🔗 Relationships: React
│   │   ├── 📁 Attendance/
│   │   │   * 🧠 Purpose: Attendance specific feature pages
│   │   │   * 🔗 Relationships: React
│   │   ├── 📁 Marketing/
│   │   │   * 🧠 Purpose: Dashboard and tools for marketing tracking
│   │   │   * 🔗 Relationships: React
│   │   ├── 📁 NotFound/
│   │   │   * 🧠 Purpose: The 404 error page experience
│   │   │   * 🔗 Relationships: React
│   │   ├── 📁 Teacher/
│   │   │   * 🧠 Purpose: Teacher specific dashboard and tools
│   │   │   * 🔗 Relationships: React
│   │   ├── 🎨 AccountManagement.jsx
│   │   │   * 🧠 Purpose: Interface to manage staff logins
│   │   │   * 🔗 Relationships: staffService
│   │   ├── 🎨 AdminHistory.jsx
│   │   │   * 🧠 Purpose: Viewer for system-wide audit logs
│   │   │   * 🔗 Relationships: auditService
│   │   ├── 🎨 AdminLogin.jsx
│   │   │   * 🧠 Purpose: Login page for administrative staff
│   │   │   * 🔗 Relationships: AuthContext, authService
│   │   ├── 🎨 AnnouncementManagement.jsx
│   │   │   * 🧠 Purpose: CRUD interface for announcements
│   │   │   * 🔗 Relationships: announcementService
│   │   ├── 🎨 CourseManagement.jsx
│   │   │   * 🧠 Purpose: Admin interface for creating/editing courses
│   │   │   * 🔗 Relationships: courseService
│   │   ├── 🎨 CourseStudentList.jsx
│   │   │   * 🧠 Purpose: Detailed student roster management
│   │   │   * 🔗 Relationships: courseService
│   │   ├── 🎨 Dashboard.jsx
│   │   │   * 🧠 Purpose: Main overview page with stats
│   │   │   * 🔗 Relationships: statsService, Chart.js
│   │   ├── 🎨 FeedbackManagement.jsx
│   │   │   * 🧠 Purpose: Interface to moderate feedback
│   │   │   * 🔗 Relationships: feedbackService
│   │   ├── 🎨 ForgotPassword.jsx
│   │   │   * 🧠 Purpose: Account password recovery request
│   │   │   * 🔗 Relationships: authService
│   │   ├── 🎨 HomePage.jsx
│   │   │   * 🧠 Purpose: Primary public-facing landing page
│   │   │   * 🔗 Relationships: HeroSection, CoursesSection
│   │   ├── 🎨 RegistrationManagement.jsx
│   │   │   * 🧠 Purpose: Lead management and enrollment processing
│   │   │   * 🔗 Relationships: registrationService
│   │   ├── 🎨 ResetPassword.jsx
│   │   │   * 🧠 Purpose: Entry point for password reset emails
│   │   │   * 🔗 Relationships: authService
│   │   ├── 🎨 Statistics.jsx
│   │   │   * 🧠 Purpose: Data visualization for registrations
│   │   │   * 🔗 Relationships: statsService
│   │   ├── 🎨 StudentManagement.jsx
│   │   │   * 🧠 Purpose: Comprehensive search and edit for all students
│   │   │   * 🔗 Relationships: studentService
│   │   ├── 🎨 TeacherManagement.jsx
│   │   │   * 🧠 Purpose: Admin interface for managing teacher profiles
│   │   │   * 🔗 Relationships: teacherService
│   │   └── 🎨 TimetableEditor.jsx
│   │       * 🧠 Purpose: Drag-and-drop tool for managing class schedules
│   │       * 🔗 Relationships: timetableService
│   ├── 📁 services/
│   │   ├── 🌐 api.js
│   │   │   * 🧠 Purpose: Axios instance with JWT interceptors
│   │   │   * 🔗 Relationships: axios
│   │   ├── 🌐 attendanceService.js
│   │   │   * 🧠 Purpose: API calls for fetching and modifying attendance
│   │   │   * 🔗 Relationships: api.js
│   │   ├── 🌐 streakService.js
│   │   │   * 🧠 Purpose: API calls for streak logic
│   │   │   * 🔗 Relationships: api.js
│   │   └── 🌐 timetableService.js
│   │       * 🧠 Purpose: API calls for fetching and saving schedule data
│   │       * 🔗 Relationships: api.js
│   ├── 📁 utils/
│   │   ├── ⚙️ dateUtils.js
│   │   │   * 🧠 Purpose: Timezone-aware date formatting
│   │   │   * 🔗 Relationships: Date methods
│   │   ├── ⚙️ deviceId.js
│   │   │   * 🧠 Purpose: Manages persistent device identification
│   │   │   * 🔗 Relationships: localStorage
│   │   ├── ⚙️ draggableStreak.js
│   │   │   * 🧠 Purpose: Math and event logic for the Flame button
│   │   │   * 🔗 Relationships: browser DOM
│   │   ├── ⚙️ getImageUrl.js
│   │   │   * 🧠 Purpose: Resolves local vs remote image paths
│   │   │   * 🔗 Relationships: string parsing
│   │   ├── ⚙️ keepAlive.js
│   │   │   * 🧠 Purpose: Ping server to prevent sleep on free tiers
│   │   │   * 🔗 Relationships: fetch
│   │   ├── ⚙️ modalScrollLock.js
│   │   │   * 🧠 Purpose: DOM class toggling to lock scrolling
│   │   │   * 🔗 Relationships: browser DOM
│   │   ├── ⚙️ popupActivityData.js
│   │   │   * 🧠 Purpose: Static data for activity popups
│   │   │   * 🔗 Relationships: none
│   │   └── 🎨 toastUtils.jsx
│   │       * 🧠 Purpose: Standardized UI notification config
│   │       * 🔗 Relationships: React Toastify
│   ├── 🎨 App.jsx
│   │   * 🧠 Purpose: Main app component defining routes and context providers
│   │   * 🔗 Relationships: React Router, Contexts, Pages
│   ├── ⚙️ i18n.js
│   │   * 🧠 Purpose: Main initialization for internationalization
│   │   * 🔗 Relationships: i18next
│   ├── 🎨 index.css
│   │   * 🧠 Purpose: Global stylesheet and Tailwind imports
│   │   * 🔗 Relationships: Tailwind CSS
│   └── ⚙️ main.jsx
│       * 🧠 Purpose: React DOM entry point, renders App to the DOM
│       * 🔗 Relationships: react-dom, App.jsx
├── 🔐 .env.example
│   * 🧠 Purpose: Safe template for frontend environment variables
│   * 🔗 Relationships: dotenv
├── 📄 index.html
│   * 🧠 Purpose: Main HTML entry point for the Vite app
│   * 🔗 Relationships: main.jsx
├── 📄 package.json
│   * 🧠 Purpose: Project dependencies and Vite scripts
│   * 🔗 Relationships: npm
├── 📄 package-lock.json
│   * 🧠 Purpose: Locked frontend dependency versions
│   * 🔗 Relationships: npm
├── ⚙️ postcss.config.js
│   * 🧠 Purpose: PostCSS configuration for styling
│   * 🔗 Relationships: tailwindcss, autoprefixer
├── ⚙️ tailwind.config.js
│   * 🧠 Purpose: Tailwind CSS theme overrides and plugins
│   * 🔗 Relationships: Tailwind
├── ⚙️ vercel.json
│   * 🧠 Purpose: Vercel deployment and routing configuration
│   * 🔗 Relationships: Vercel Hosting
└── ⚙️ vite.config.js
    * 🧠 Purpose: Vite bundler and development proxy config
    * 🔗 Relationships: vite, react plugin
```
