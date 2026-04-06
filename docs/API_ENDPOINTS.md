# API ENDPOINTS

> [!CAUTION]
> ## 📖 AI MEMORY - MANDATORY RULES
> - 🚫 **TUYỆT ĐỐI CẤM** đọc file .env, .env.local, .env.production
> - ✅ **CHỈ ĐƯỢC ĐỌC** file .env.example (nếu có)
> - 📁 **CHỈ ĐƯỢC XỬ LÝ** file trong thư mục backend/frontend
> - 🔒 **KHÔNG BAO GIỜ** log giá trị của process.env

## 🔐 AUTHENTICATION (/api/auth)
| Method | Path | Auth | Rate Limited | Description |
|---|---|---|---|---|
| GET | /api/auth/me | JWT | ⚠️ Nên thêm | Get current user's data |
| POST | /api/auth/login | - | ✅ (5-100 lần) | Handle login and set cookies |
| POST | /api/auth/logout | JWT | ⚠️ Nên thêm | Clear session and cookies |
| POST | /api/auth/refresh-token | - | ⚠️ Nên thêm | Refresh current access token |
| POST | /api/auth/forgot-password | CSRF | ✅ (3-100 lần/h) | Initiate password reset flow |
| POST | /api/auth/reset-password/:token | CSRF | ✅ (5-1000 lần) | Complete password reset |
| GET | /api/auth/check-session | JWT | ⚠️ Nên thêm | Check for session conflict |

## 📅 TIMETABLE (/api/timetable)
| Method | Path | Auth | Rate Limited | Description |
|---|---|---|---|---|
| GET | /api/timetable | JWT | ⚠️ Nên thêm | Fetch timetable for week |
| POST | /api/timetable/export | JWT + CSRF | ✅ (Global) | Export timetable to Excel (POST) |
| PUT | /api/timetable/cells | JWT + CSRF | ⚠️ Nên thêm | Save cell data (new or update) |
| GET | /api/timetable/rows | JWT | ⚠️ Nên thêm | Get row configuration |
| POST | /api/timetable/rows | JWT + CSRF | ⚠️ Nên thêm | Create/Update row config |

## 📚 COURSES (/api/courses)
| Method | Path | Auth | Rate Limited | Description |
|---|---|---|---|---|
| GET | /api/courses | - | ⚠️ Nên thêm | List all courses |
| POST | /api/courses | JWT (Admin) + CSRF | ⚠️ Nên thêm | Create/Update course data |

## 👥 REGISTRATIONS (/api/registrations)
| Method | Path | Auth | Rate Limited | Description |
|---|---|---|---|---|
| POST | /api/submit | Captcha | ✅ (Global) | Website form submission (Google Sheets sync) |
| GET | /api/registrations | JWT | ⚠️ Nên thêm | List recent registrations |
| POST | /api/registrations/export-excel | JWT + CSRF | ✅ (Global) | Export registrations to Excel (POST) |
| PATCH | /api/registrations/:id | JWT + CSRF | ⚠️ Nên thêm | Update registration status |

## 🛠️ ADMIN HISTORY (/api/admin/history)
| Method | Path | Auth | Rate Limited | Description |
|---|---|---|---|---|
| GET | /api/admin/history | JWT (Admin) | ⚠️ Nên thêm | Full audit trail of admin actions |
| POST | /api/admin/history/export | JWT + CSRF | ✅ (Global) | Export audit logs to CSV (POST) |

## 🛡️ CORE / SECURITY
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /api/csrf-token | - | Fetch fresh CSRF token |
| GET | /api/health | - | Server health check (status: OK) |
| GET | /api/auth/google/callback | - | OAuth callback handler |
