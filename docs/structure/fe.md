# 📁 Frontend Structure (FE)

---

## 🌳 System Architecture Tree

```text
frontend/
├── 📁 public/ (Static assets served directly without processing)
│   ├── 🖼️ favicon.ico → browser tab icon
│   └── 🖼️ logo.png → school brand logo
├── 📁 src/ (Main application source code)
│   ├── 📁 assets/ (Static images and graphic assets used in React)
│   │   ├── 🖼️ 404-9x16.png → mobile-optimized background for 404 page
│   │   ├── 🖼️ 404.png → desktop background for 404 page
│   │   ├── 🖼️ announcement-bg.png → background pattern for news banners
│   │   ├── 🖼️ flame.png → main asset for the daily streak icon
│   │   ├── 🖼️ hero-bg.png → background image for the main landing section
│   │   ├── 🖼️ hero-mobile.png → optimized hero image for mobile devices
│   │   ├── 🖼️ why-us-main.png → central image for the "Why Choose Us" section
│   │   ├── 🖼️ why-us-step1.png → icon/illustration for the first feature step
│   │   ├── 🖼️ why-us-step2.png → icon/illustration for the second feature step
│   │   └── 🖼️ why-us-step3.png → icon/illustration for the third feature step
│   ├── 📁 components/ (Reusable UI modules and functional blocks)
│   │   ├── 📁 Timetable/ (Components specific to the class schedule system)
│   │   │   ├── 🧩 CellPopover.jsx → interactive details popup for a specific class slot
│   │   │   ├── 🧩 RowManager.jsx → logic for adding/removing time rows in the editor
│   │   │   └── 🧩 WeekSelector.jsx → control to switch between different study weeks
│   │   ├── 📁 common/ (Generic UI components used across multiple pages)
│   │   │   ├── 🧩 ConfirmModal.jsx → generic popup for action confirmations (Yes/No)
│   │   │   └── 🧩 PrimaryButton.jsx → standardized styled button with loading state
│   │   ├── 🧩 ActivitiesSection.jsx → displays the "Activities" grid on the homepage
│   │   ├── 🧩 ActivityPopup.jsx → detailed modal for specific extracurricular activities
│   │   ├── 🧩 AnnouncementModal.jsx → popup display for important school news
│   │   ├── 🧩 AnnouncementSection.jsx → scrolling marquee or grid of current announcements
│   │   ├── 🧩 CourseDetailModal.jsx → informational modal showing course curriculum and price
│   │   ├── 🧩 CoursesSection.jsx → the main landing page course catalog
│   │   ├── 🧩 CreatorPopup.jsx → informational modal about the system developers
│   │   ├── 🧩 Fireworks.jsx → canvas-based animation for successful check-ins
│   │   ├── 🧩 FlameButton.jsx → floating "streak" button with complex drag/drop and state
│   │   ├── 🧩 HeartRain.jsx → subtle background animation for specific celebrations
│   │   ├── 🧩 HeroSection.jsx → the main "above-the-fold" landing page area
│   │   ├── 🧩 LearningJourney.jsx → visual timeline of student progress at the center
│   │   ├── 🧩 ProtectedRoute.jsx → wrapper component for routes requiring authentication
│   │   ├── 🧩 RecaptchaBox.jsx → container for the Google reCAPTCHA v2 challenge
│   │   ├── 🧩 RecaptchaProvider.jsx → context provider for reCAPTCHA enterprise/v3
│   │   ├── 🧩 RegistrationForm.jsx → the primary student enrollment form with validation
│   │   ├── 🧩 ScrollHintButton.jsx → subtle indicator to scroll for more content
│   │   ├── 🧩 TeachersSection.jsx → interactive grid of teacher cards and bios
│   │   ├── 🧩 TestimonialsSection.jsx → slider/grid of parent and student feedback
│   │   └── 🧩 WhyChooseUs.jsx → feature highlight section explaining school benefits
│   ├── 📁 config/ (Frontend environment and global settings)
│   │   └── ⚙️ api.js → base configuration for API URLs and timeouts
│   ├── 📁 contexts/ (React Context Providers for global state)
│   │   └── 🔐 AuthContext.jsx → Manages user authentication, login/logout, and session persistence
│   ├── 📁 hooks/ (Custom React hooks for shared logic)
│   │   └── ⚓ useLockBodyScroll.js → prevents scrolling when modals or popups are active
│   ├── 📁 i18n/ (Internationalization and multi-language support)
│   │   ├── 🌐 en.json → English language translations
│   │   ├── 🌐 index.js → initialization logic for i18next
│   │   ├── 🌐 vi.json → Vietnamese language translations
│   │   └── 🌐 zh.json → Chinese language translations
│   ├── 📁 layouts/ (Structural shell components that wrap page content)
│   │   ├── 🖼️ AdminLayout.jsx → layout with sidebar for the Admin control panel
│   │   ├── 🖼️ Footer.jsx → common footer with contact info and social links
│   │   ├── 🖼️ Navbar.jsx → main navigation bar with mobile/desktop variants
│   │   └── 🖼️ StaffLayout.jsx → simplified layout for Teacher and Staff dashboards
│   ├── 📁 pages/ (Primary page components mapping to application routes)
│   │   ├── 📁 Marketing/
│   │   │   └── 📄 MarketingDashboard.jsx → dashboard specialized for lead tracking and ads
│   │   ├── 📁 NotFound/ (The 404 error page experience)
│   │   │   ├── 📜 GameLogic.js → interactive game logic for the 404 page easter egg
│   │   │   ├── 🎨 NotFound.css → specific styling for the immersive 404 experience
│   │   │   └── 📄 NotFound.jsx → the main 404 page component
│   │   ├── 📁 Teacher/
│   │   │   └── 📄 TeacherDashboard.jsx → specialized view for teachers to see their classes
│   │   ├── 📄 AccountManagement.jsx → admin interface for managing staff logins
│   │   ├── 📄 AdminHistory.jsx → viewer for the system-wide audit logs
│   │   ├── 📄 AdminLogin.jsx → dedicated login page for administrative staff
│   │   ├── 📄 AnnouncementManagement.jsx → CRUD interface for homepage announcements
│   │   ├── 📄 CourseManagement.jsx → admin interface for creating/editing courses
│   │   ├── 📄 CourseStudentList.jsx → detailed student roster management for a specific class
│   │   ├── 📄 Dashboard.jsx → main overview page with stats and quick actions
│   │   ├── 📄 FeedbackManagement.jsx → interface to moderate and view parent feedback
│   │   ├── 📄 ForgotPassword.jsx → request page for account password recovery
│   │   ├── 📄 HomePage.jsx → the primary public-facing landing page
│   │   ├── 📄 RegistrationManagement.jsx → lead management and enrollment processing
│   │   ├── 📄 ResetPassword.jsx → entry point for users coming from a reset email link
│   │   ├── 📄 Statistics.jsx → data visualization page for registrations and streaks
│   │   ├── 📄 StudentManagement.jsx → comprehensive search and edit for all students
│   │   ├── 📄 TeacherManagement.jsx → admin interface for managing teacher profiles
│   │   └── 📄 TimetableEditor.jsx → drag-and-drop tool for managing class schedules
│   ├── 📁 services/ (Logic layer for API communication)
│   │   ├── 🌐 api.js → Axios instance with JWT interceptors and error handling
│   │   ├── 🌐 streakService.js → functions for streak check-ins, leaderboards, and revives
│   │   └── 🌐 timetableService.js → functions for fetching and saving schedule data
│   ├── 📁 utils/ (Pure functions and frontend helper utilities)
│   │   ├── 🧰 dateUtils.js → timezone-aware date formatting and comparison (VN Time)
│   │   ├── 🧰 deviceId.js → manages persistent unique device identification for streaks
│   │   ├── 🧰 draggableStreak.js → math and event logic for the draggable Flame button
│   │   ├── 🧰 getImageUrl.js → resolves local vs Cloudinary image paths
│   │   ├── 🧰 keepAlive.js → logic to prevent the server from sleeping (if on free tier)
│   │   ├── 🧰 modalScrollLock.js → utility to handle scroll behavior during modal open
│   │   ├── 🧰 popupActivityData.js → static data and content for activity popups
│   │   └── 🎨 toastUtils.jsx → standardized configuration for UI notifications
│   ├── ⚛️ App.jsx → root component; defines routes and global providers
│   ├── 🌐 i18n.js → main internationalization configuration file
│   ├── 🎨 index.css → entry point for CSS; includes Tailwind directives
│   └── ⚛️ main.jsx → application entry point; renders React to the DOM
├── 📄 .env.example → template for client-side environment variables
├── 📄 index.html → the main HTML entry point for the Vite app
├── 📦 package.json → project metadata and frontend dependencies
├── ⚙️ tailwind.config.js → configuration for Tailwind CSS themes and plugins
└── ⚙️ vite.config.js → configuration for the Vite build tool and proxy
```

---

## 📂 Summary

*   **UI/UX**: Components (🧩) and layouts (🖼️) are built with React and Tailwind CSS.
*   **State**: Authentication is centralized in `AuthContext` (🔐).
*   **Language**: Support for VI, EN, and ZH is handled via `i18n/` (🌐).
*   **API**: All backend communication is abstracted into `services/` (🌐).
