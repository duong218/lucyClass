# 📁 Frontend Structure (FE)

Full recursive scan of the frontend project structure (src directory).

---

## 📂 frontend/
→ Root directory of the frontend application

### 📂 src/
→ Core source code of the React application

#### 📂 assets/
→ Static assets like images and icons
* `404-9x16.png` → Mobile-specific image for the 404 page
* `404.png` → General image for the 404 error page
* `announcement-bg.png` → Background image for announcement modals
* `flame.png` → Icon used for the streak system
* `hero-bg.png` → Background image for the desktop hero section
* `hero-mobile.png` → Background image for the mobile hero section
* `why-us-main.png` → Primary image for the "Why Choose Us" section
* `why-us-step1.png` → Illustration for step 1 of the process
* `why-us-step2.png` → Illustration for step 2 of the process
* `why-us-step3.png` → Illustration for step 3 of the process

#### 📂 components/
→ Reusable UI components categorized by feature
* `ActivitiesSection.jsx` → Component displaying the activities section on the landing page
* `ActivityPopup.jsx` → Modal popup for detailed activity information
* `AnnouncementModal.jsx` → Modal for displaying system announcements
* `AnnouncementSection.jsx` → Section displaying recent announcements
* `CourseDetailModal.jsx` → Modal showing detailed information about a course
* `CoursesSection.jsx` → Section listing available courses
* `CreatorPopup.jsx` → Popup acknowledging the site creator
* `Fireworks.jsx` → Animation component for visual celebrations
* `FlameButton.jsx` → Specialized interactive button for the streak system
* `HeartRain.jsx` → Animation component for high streak milestones
* `HeroSection.jsx` → Main banner section of the homepage
* `LearningJourney.jsx` → Component visualizing the student's progress
* `ProtectedRoute.jsx` → Wrapper for routes that require authentication
* `RecaptchaBox.jsx` → Component for handling Google reCAPTCHA
* `RecaptchaProvider.jsx` → Context provider for reCAPTCHA integration
* `RegistrationForm.jsx` → Complex form for new student enrollment
* `ScrollHintButton.jsx` → UI element indicating more content is available below
* `TeachersSection.jsx` → Section profiling the teaching staff
* `TestimonialsSection.jsx` → Section displaying user reviews and feedback
* `WhyChooseUs.jsx` → Section highlighting the platform's advantages

##### 📂 Timetable/
→ Components specifically for the timetable feature
* `CellPopover.jsx` → Popover for detailed information on a timetable cell
* `RowManager.jsx` → Logic for managing rows within the timetable editor
* `WeekSelector.jsx` → UI for selecting different weeks in the schedule

##### 📂 common/
→ Generic UI components used across the app
* `ConfirmModal.jsx` → Reusable confirmation dialog modal
* `PrimaryButton.jsx` → Standardized primary action button

#### 📂 config/
→ Frontend application configuration
* `api.js` → Base URL and common settings for API communication

#### 📂 contexts/
→ React Context for global state management
* `AuthContext.jsx` → Manages user authentication state, tokens, and roles

#### 📂 hooks/
→ Custom React hooks for shared logic
* `useLockBodyScroll.js` → Hook to prevent scrolling when a modal is open

#### 📂 i18n/
→ Internationalization configuration and translation files
* `en.json` → English translation strings
* `index.js` → i18next configuration and initialization
* `vi.json` → Vietnamese translation strings
* `zh.json` → Chinese translation strings

#### 📂 layouts/
→ Layout components for different user roles
* `AdminLayout.jsx` → Sidebar and navigation layout for admin pages
* `Footer.jsx` → Common footer component for all pages
* `Navbar.jsx` → Main navigation bar for the student-facing site
* `StaffLayout.jsx` → Layout optimized for staff dashboard views

#### 📂 pages/
→ Full-page components corresponding to routes
* `AccountManagement.jsx` → Page for admins to manage user accounts
* `AdminHistory.jsx` → Page for viewing administrative audit logs
* `AdminLogin.jsx` → Secure login page for administrators
* `AnnouncementManagement.jsx` → Page for managing system announcements
* `CourseManagement.jsx` → Page for creating and editing course details
* `CourseStudentList.jsx` → Detailed list of students enrolled in a specific course
* `Dashboard.jsx` → Overview dashboard for administrators
* `FeedbackManagement.jsx` → Page for reviewing and responding to feedback
* `ForgotPassword.jsx` → Page for requesting a password reset email
* `HomePage.jsx` → Main landing page aggregation component
* `RegistrationManagement.jsx` → Page for processing and approving enrollments
* `ResetPassword.jsx` → Page for setting a new password via token
* `Statistics.jsx` → Page displaying detailed system-wide analytics
* `StudentManagement.jsx` → Page for managing student records
* `TeacherManagement.jsx` → Page for managing teacher profiles
* `TimetableEditor.jsx` → Interactive editor for class schedules

##### 📂 Marketing/
→ Pages specifically for marketing purposes
* `MarketingDashboard.jsx` → Dashboard for tracking marketing campaign metrics

##### 📂 NotFound/
→ Error pages for missing routes
* `GameLogic.js` → Interactive logic for the 404 page hidden game
* `NotFound.css` → Styling for the 404 error page
* `NotFound.jsx` → Interactive 404 "Not Found" error page

##### 📂 Teacher/
→ Pages specifically for teachers
* `TeacherDashboard.jsx` → Personalized dashboard for teaching staff

#### 📂 services/
→ Logic for communicating with the backend API
* `api.js` → Axios instance and centralized API request logic
* `streakService.js` → Specialized methods for streak-related API calls
* `timetableService.js` → Specialized methods for timetable-related API calls

#### 📂 utils/
→ Shared utility functions for the frontend
* `dateUtils.js` → Helpers for date and time formatting
* `deviceId.js` → Logic for identifying unique user devices
* `draggableStreak.js` → Logic for the draggable interactive flame button
* `getImageUrl.js` → Helper to resolve local or external image URLs
* `keepAlive.js` → Logic to maintain the user's session active
* `modalScrollLock.js` → Utility to toggle body scroll locking
* `popupActivityData.js` → Static data used in activity popups
* `toastUtils.jsx` → Helpers for displaying UI notifications (toasts)

---

### 📄 Root Files
* `.env.example` → Template for environment variables (safe to read)
* `index.html` → Main HTML entry point for the React application
* `package.json` → Frontend metadata, dependencies, and script definitions
* `tailwind.config.js` → Configuration for Tailwind CSS styling
* `vite.config.js` → Configuration for the Vite build tool and development server
