> [!CAUTION]
> ## 📖 AI MEMORY - MANDATORY RULES
> - 🚫 **TUYỆT ĐỐI CẤM** đọc file .env, .env.local, .env.production
> - ✅ **CHỈ ĐƯỢC ĐỌC** file .env.example (nếu có)
> - 📁 **CHỈ ĐƯỢC XỬ LÝ** file trong thư mục backend/frontend
> - 🔒 **KHÔNG BAO GIỜ** log giá trị của process.env

# 📂 Files Manifest

Comprehensive list of critical project files, their functions, and security relevance.

---

## 🏗️ Backend Core Files

### 🖥️ `backend/server.js`
- **Type**: Main Entry Point
- **Functions**: App initialization, global middleware stack, route registration, database connection.
- **Security Notes**: Configures CORS, Helmet, Mongo Sanitize, XSS-Clean. Sets up body parser limits and starts cron jobs.
- **Dependencies**: `express`, `cors`, `helmet`, `dotenv`, `mongoose`.

### 🛡️ `backend/middlewares/rateLimiter.js`
- **Type**: Security Middleware
- **Functions**: Defines multiple rate limiting tiers (Global, Auth, Public, Stats).
- **Security Notes**: Essential for brute-force protection and DoS mitigation. Uses `express-rate-limit`.
- **Dependencies**: `express-rate-limit`, `winston`.

### 🔏 `backend/middlewares/csrf.js`
- **Type**: Security Middleware
- **Functions**: Implements CSRF protection using `csurf`.
- **Security Notes**: Validates the `X-CSRF-Token` header for all state-changing requests (POST/PUT/DELETE).
- **Dependencies**: `csurf`.

### 📁 `backend/middlewares/upload.js`
- **Type**: Utility Middleware
- **Functions**: Handles file uploads via `multer`.
- **Security Notes**: Implements memory storage, file filtering (extensions/mimetype), and **Magic Number** (file-type) validation before saving to disk.
- **Dependencies**: `multer`, `file-type`, `uuid`.

---

## 🎨 Frontend Core Files

### 🚀 `frontend/src/services/api.js`
- **Type**: API Client Service
- **Functions**: Axios instance configuration, token management (Access/Refresh), CSRF fetching, request/response interceptors.
- **Security Notes**: Stores `accessToken` in-memory. Uses `withCredentials: true` for Secure HttpOnly Cookies. Automatically fetches CSRF token on startup.
- **Dependencies**: `axios`.

### 📊 `frontend/src/pages/Dashboard.jsx`
- **Type**: Core Page
- **Functions**: Displays analytics, registrations, and admin tools.
- **Security Notes**: Contains one instance of `dangerouslySetInnerHTML` for dynamic styles. Protected by auth logic.
- **Dependencies**: `react`, `react-router-dom`, `api`.

### 🔑 `frontend/src/contexts/AuthContext.jsx` (Implicit)
- **Type**: State Management
- **Functions**: Manages login/logout state and user profile synchronization.
- **Security Notes**: Handles auth-related events like `session:conflict` and `auth:logout`.

---

## ⚙️ Configuration & Scripts

### ⏰ `backend/config/cron.js`
- **Type**: Scheduled Tasks
- **Functions**: Daily database and file backups at 2:00 AM.
- **Security Notes**: Automatically uploads auto-backups to Google Drive and logs the result to Audit Log.

### 📝 `backend/validators/`
- **Type**: Data Validation
- **Functions**: Defines `express-validator` rules for registration, teacher, and course creation.
- **Security Notes**: First line of defense against malformed data or NoSQL injection.

---

*Last AI Update: 2026-04-06 12:55*
