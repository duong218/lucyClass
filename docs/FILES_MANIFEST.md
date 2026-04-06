# FILES MANIFEST

> [!CAUTION]
> ## 📖 AI MEMORY - MANDATORY RULES
> - 🚫 **TUYỆT ĐỐI CẤM** đọc file .env, .env.local, .env.production
> - ✅ **CHỈ ĐƯỢC ĐỌC** file .env.example (nếu có)
> - 📁 **CHỈ ĐƯỢC XỬ LÝ** file trong thư mục backend/frontend
> - 🔒 **KHÔNG BAO GIỜ** log giá trị của process.env

## 🏢 BACKEND (backend/)

### backend/server.js
- **Type**: API Gateway / Entry Point
- **Dependencies**: express, cors, helmet, mongoose, redis, csurf
- **Exports**: app (express instance)
- **Functions**: CSRF initialization, Route mounting, Error handling.
- **Security notes**: Đã fix NoSQL injection (sanitize), Rate limiting active, XSS clean, Helmet headers.
- **Last AI update**: 2026-04-03

### backend/routes/authRoutes.js
- **Type**: API Route
- **Dependencies**: express, authController, csrfProtection, rateLimiter
- **Exports**: router
- **API Routes**: POST /login, POST /logout, POST /refresh-token, POST /forgot-password, GET /me
- **Security notes**: CSRF skip chỉ dùng cho login/refresh-token. Áp dụng `loginLimiter`, `forgotPasswordLimiter`, `resetPasswordLimiter`.
- **Last AI update**: 2026-04-03

### backend/routes/timetableRoutes.js
- **Type**: API Route
- **Dependencies**: express, timetableController, auth
- **Exports**: router
- **API Routes**: GET /, POST /upsert, GET /export, GET /rows, POST /rows
- **Security notes**: All routes require JWT Authentication.
- **Last AI update**: 2026-04-02

### backend/controllers/authController.js
- **Type**: Controller Logic
- **Dependencies**: User, jsonwebtoken, bcryptjs
- **Exports**: login, logout, refreshToken, forgotPassword, resetPassword
- **Logic**: JWT Token generation, User validation.
- **Last AI update**: 2026-04-02

### backend/controllers/registrationController.js
- **Type**: Controller Logic
- **Dependencies**: Registration, Course, User
- **Exports**: createRegistration, getRegistrations, updateRegistration, deleteRegistration
- **Logic**: Handles student admissions and course enrollment tracking.
- **Last AI update**: 2026-04-02

### backend/controllers/teacherController.js
- **Type**: Controller Logic
- **Dependencies**: User, Teacher
- **Exports**: getTeachers, createTeacher, updateTeacher
- **Logic**: Management of teacher profiles and availability.
- **Last AI update**: 2026-04-02

### backend/middlewares/rateLimiter.js [NEW]
- **Type**: Security Middleware
- **Limiters**:
  - `loginLimiter`: Chống brute-force (DEV: 100/1p, PROD: 5/10p)
  - `forgotPasswordLimiter`: Chống spam email (DEV: 100/1h, PROD: 3/1h)
  - `resetPasswordLimiter`: Chống brute-force token (DEV: 1000/1h, PROD: 5/30p)
  - `apiLimiter`: Global API (200 requests / 5 mins)
  - `registerLimiter`: Chống form spam (20/5 mins)
  - `statsLimiter`: Analytical dashboards (500/5 mins)
  - `publicLimiter`: Public browsing (300/5 mins)
- **Status**: ✅ Active with Redis support.
- **Last AI update**: 2026-04-03

---

## 🎨 FRONTEND (frontend/)

### frontend/src/pages/TimetableEditor.jsx
- **Type**: React Component (Page)
- **Dependencies**: react, framer-motion, timetableService, WeekSelector, CellPopover
- **Hooks**: useState, useEffect, useCallback, useRef
- **Functions**: fetchTimetable, handleCellSave, handleExportExcel.
- **UI Logic**: Dynamic grid rendering, sticky headers, zebra striping.
- **Last AI update**: 2026-04-02

### frontend/src/services/timetableService.js
- **Type**: API Service Layer
- **Dependencies**: axios
- **Exports**: getTimetable, upsertCell, exportTimetable, getRows, updateRows
- **Logic**: Axios instance with withCredentials: true.
- **Last AI update**: 2026-04-02

### frontend/src/contexts/AuthContext.jsx
- **Type**: React Context Provider
- **Dependencies**: react, authService
- **Exports**: AuthContext, AuthProvider, useAuth
- **Logic**: Handles login state, user initialization, and session polling.
- **Last AI update**: 2026-04-02

### frontend/src/pages/RegistrationManagement.jsx
- **Type**: React Component (Admin)
- **Dependencies**: registrationService, DataTable, StatusBadge
- **Hooks**: useState, useEffect, useMemo
- **Logic**: Filtering and managing student registration statuses.
- **Last AI update**: 2026-04-02

### frontend/src/pages/CourseManagement.jsx
- **Type**: React Component (Admin)
- **Dependencies**: courseService, CourseModal
- **Hooks**: useState, useEffect
- **Logic**: Creating and editing center course offerings.
- **Last AI update**: 2026-04-02
