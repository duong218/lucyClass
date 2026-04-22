# 📁 Detailed Frontend Structure

This document provides a full, recursive scan of the frontend `src/` directory.

---

## 📂 Root Directory: `frontend/src/`
→ React application entry points and core logic.

### 📄 Root Files
* `App.jsx` → Main application component; defines routing and providers.
* `i18n.js` → Initialization of `react-i18next` for multi-language support.
* `index.css` → Global styles and Tailwind CSS directives.
* `main.jsx` → React entry point; renders `App` into the DOM.

---

## 📁 `assets/`
→ Static media assets used throughout the UI.

* `404-9x16.png` → Mobile version of the 404 page background.
* `404.png` → Desktop version of the 404 page background.
* `announcement-bg.png` → Background for announcement modals.
* `flame.png` → Streak flame icon asset.
* `hero-bg.png` → Desktop hero section background image.
* `hero-mobile.png` → Mobile hero section background image.
* `why-us-main.png` → Main image for the "Why Choose Us" section.
* `why-us-step1.png` → Step 1 illustration.
* `why-us-step2.png` → Step 2 illustration.
* `why-us-step3.png` → Step 3 illustration.

---

## 📁 `components/`
→ Reusable UI components categorized by function.

* `ActivitiesSection.jsx` → Section displaying extracurricular activities.
* `ActivityPopup.jsx` → Modal for detailed activity information.
* `AnnouncementModal.jsx` → Popup for viewing system announcements.
* `AnnouncementSection.jsx` → Landing page section for latest news.
* `CourseDetailModal.jsx` → Detailed view for course descriptions.
* `CoursesSection.jsx` → Grid/List of available courses.
* `CreatorPopup.jsx` → Credits/Developer information popup.
* `Fireworks.jsx` → Visual effect component for celebrations.
* `FlameButton.jsx` → Complex draggable floating button for streaks.
* `HeartRain.jsx` → Animation component for high streak milestones.
* `HeroSection.jsx` → Main landing page banner.
* `LearningJourney.jsx` → Visual timeline of student progress.
* `ProtectedRoute.jsx` → Component to guard private routes.
* `RecaptchaBox.jsx` → UI wrapper for Google reCAPTCHA.
* `RecaptchaProvider.jsx` → Context provider for reCAPTCHA state.
* `RegistrationForm.jsx` → Multi-step student enrollment form.
* `ScrollHintButton.jsx` → UI hint to encourage scrolling.
* `TeachersSection.jsx` → Profiles and descriptions of teaching staff.
* `TestimonialsSection.jsx` → Student and parent feedback display.
* `WhyChooseUs.jsx` → Marketing section highlighting key benefits.

### 📁 `components/Timetable/`
* `CellPopover.jsx` → Detailed view when clicking a schedule block.
* `RowManager.jsx` → Logic for managing rows in the timetable editor.
* `WeekSelector.jsx` → Component to toggle between different weeks.

### 📁 `components/common/`
* `ConfirmModal.jsx` → Generic confirmation dialog.
* `PrimaryButton.jsx` → Standardized styled button component.

---

## 📁 `config/`
→ Application-level configuration.

* `api.js` → Base URL and environment settings for API requests.

---

## 📁 `contexts/`
→ Global state management using React Context.

* `AuthContext.jsx` → Manages user login state, tokens, and roles.

---

## 📁 `hooks/`
→ Custom reusable React logic.

* `useLockBodyScroll.js` → Prevents background scrolling when modals are open.

---

## 📁 `i18n/`
→ Localization files and translations.

* `en.json` → English translation strings.
* `index.js` → Aggregator for all language JSON files.
* `vi.json` → Vietnamese translation strings.
* `zh.json` → Chinese translation strings.

---

## 📁 `layouts/`
→ Wrapper components for page-wide structures.

* `AdminLayout.jsx` → Sidebar and header for the admin dashboard.
* `Footer.jsx` → Common site footer.
* `Navbar.jsx` → Main navigation bar for students.
* `StaffLayout.jsx` → Simplified layout for staff-specific views.

---

## 📁 `pages/`
→ Full-page components mapped to specific routes.

* `AccountManagement.jsx` → Admin page for managing user accounts.
* `AdminHistory.jsx` → Audit log viewer for administrators.
* `AdminLogin.jsx` → Secure login page for staff/admins.
* `AnnouncementManagement.jsx` → CRUD interface for announcements.
* `CourseManagement.jsx` → Interface for updating course details.
* `CourseStudentList.jsx` → Viewer for students enrolled in specific courses.
* `Dashboard.jsx` → Main administrative overview with charts.
* `FeedbackManagement.jsx` → Interface for reviewing user feedback.
* `ForgotPassword.jsx` → Password recovery request page.
* `HomePage.jsx` → Student landing page (aggregates sections).
* `RegistrationManagement.jsx` → Interface for processing enrollments.
* `ResetPassword.jsx` → Page for setting a new password via token.
* `Statistics.jsx` → Detailed reports and data visualization.
* `StudentManagement.jsx` → Database viewer for all registered students.
* `TeacherManagement.jsx` → Interface for editing teacher profiles.
* `TimetableEditor.jsx` → Drag-and-drop or grid editor for schedules.

### 📁 `pages/Marketing/`
* `MarketingDashboard.jsx` → Specialized dashboard for marketing metrics.

### 📁 `pages/NotFound/`
* `GameLogic.js` → Logic for the "hidden game" on the 404 page.
* `NotFound.css` → Custom styles for the 404 view.
* `NotFound.jsx` → Interactive error page.

### 📁 `pages/Teacher/`
* `TeacherDashboard.jsx` → Overview and schedule for logged-in teachers.

---

## 📁 `services/`
→ API communication layer using Axios.

* `api.js` → Centralized axios instance with auth interceptors.
* `streakService.js` → Methods for interacting with streak endpoints.
* `timetableService.js` → Methods for fetching and updating schedules.

---

## 📁 `utils/`
→ Common utility functions for the frontend.

* `dateUtils.js` → Formatting and calculation of dates/times.
* `deviceId.js` → Logic for generating/retrieving unique device IDs.
* `draggableStreak.js` → Physics and clamping logic for the Flame Button.
* `getImageUrl.js` → Helper to resolve local vs. remote image paths.
* `keepAlive.js` → Logic to prevent session timeouts.
* `modalScrollLock.js` → Utility to toggle body scroll during modals.
* `popupActivityData.js` → Static/Helper data for activity popups.
* `toastUtils.jsx` → Wrapper for standardized UI notifications (Toasts).
