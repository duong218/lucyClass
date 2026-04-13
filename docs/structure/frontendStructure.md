# Frontend Architecture Documentation - Lucy's Class

## 🌐 System Overview
The **Lucy's Class** frontend is a modern SPA (Single Page Application) built with **React** and **Vite**. It provides a premium, interactive interface for both students and administrators.

- **Backend Interaction**: Connects to the Node.js backend via a secure, centralized API client.
- **Tech Stack**:
    - **UI**: React 18, Tailwind CSS for utility styling.
    - **Animations**: Framer Motion for smooth transitions and interactive elements.
    - **Icons**: Lucide React.
- **Assets**: Images are served via **Cloudinary**, while static assets reside in `public/`.

---

## 🚀 API Integration Flow

The frontend centralizes all network communication in `src/services/api.js` to ensure security and consistency.

### 🛠️ Centralized Axios Client
-   **Instance**: A configured Axios instance with `withCredentials: true` for cookie-based session tracking.
-   **Security**: Implements high-level security measures:
    -   **CSRF Protection**: Automatically fetches and attaches `X-CSRF-Token` headers to state-changing requests (POST, PUT, DELETE).
    -   **JWT Management**: Handles Bearer tokens stored in-memory, rotating them via an automated refresh flow.

### 🔁 Automatic Token Refresh
1.  If a request fails with a **401 Unauthorized** error, the interceptor pauses the request queue.
2.  It attempts to call `/auth/refresh-token` to obtain a new access token using the HttpOnly refresh cookie.
3.  Upon success, it retries all queued requests with the new token.
4.  Upon failure (e.g., session expired), it triggers a global logout event.

---

## 📁 Folder Structure

```text
frontend/
├── public/             # Static assets (favicons, manifest)
├── src/
│   ├── assets/         # Global styles, fonts, and images
│   ├── components/     # Reusable UI components
│   │   ├── common/     # Modals, Buttons, Inputs (Generic)
│   │   └── Timetable/  # Feature-specific components
│   ├── config/         # App constants and environment settings
│   ├── contexts/       # React Context providers (Auth, Theme)
│   ├── hooks/          # Custom hooks (useAuth, useFetch)
│   ├── layouts/        # Shared layouts (AdminLayout, MainLayout)
│   ├── pages/          # Full page components and view logic
│   ├── services/       # API client and feature-specific services
│   ├── utils/          # Formatting helpers and validation
│   ├── App.jsx         # Root component and router
│   └── main.jsx        # Entry point
└── vite.config.js      # Build and proxy configuration
```

---

## 🔍 Detailed Component Analysis

### `components/`
-   **`TeachersSection.jsx`**: A complex, interactive carousel showing faculty details.
-   **`RegistrationForm.jsx`**: Multi-step form with real-time validation for student enrollment.
-   **`RecaptchaBox.jsx`**: Centralized Google reCAPTCHA v2 wrapper.

### `pages/` (Admin)
-   **`Dashboard.jsx`**: Central hub with statistics and quick actions.
-   **`CourseStudentList.jsx`**: Advanced data tables for managing enrollment by course.
-   **`TimetableEditor.jsx`**: A drag-and-drop/grid-based interface for managing class schedules.

### `services/`
-   **`api.js`**: The core communication layer described in the API Integration Flow.
-   **`timetableService.js`**: Specialized logic for complex grid data transformations.

### `layouts/`
-   **`AdminLayout.jsx`**: Provides the sidebar navigation and authenticated wrapper for management pages.
-   **`Topbar.jsx`**: Handles user profile actions and global search.
