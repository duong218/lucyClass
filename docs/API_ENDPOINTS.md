> [!CAUTION]
> ## 📖 AI MEMORY - MANDATORY RULES
> - 🚫 **TUYỆT ĐỐI CẤM** đọc file .env, .env.local, .env.production
> - ✅ **CHỈ ĐƯỢC ĐỌC** file .env.example (nếu có)
> - 📁 **CHỈ ĐƯỢC XỬ LÝ** file trong thư mục backend/frontend
> - 🔒 **KHÔNG BAO GIỜ** log giá trị của process.env

# 🚀 API Endpoints Documentation

This document provides a comprehensive list of all API endpoints for the Lucy's Class project, including security details.

## 🔑 Authentication Standards
- **Access Token**: Sent via `Authorization: Bearer <token>` (In-memory on frontend).
- **Refresh Token**: Handled via `HttpOnly` cookie.
- **CSRF Token**: Required for all POST/PUT/DELETE requests via `X-CSRF-Token` header.

## 🛡️ Rate Limiting Status
| Category | Window | Max (PROD) | Max (DEV) | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Global API** | 5 mins | 200 | 200 | ✅ Active |
| **Login** | 10 mins | 5 | 100 | ✅ Active |
| **Registration** | 5 mins | 20 | 20 | ✅ Active |
| **Public Content**| 5 mins | 300 | 300 | ✅ Active |
| **Forgot PWD** | 1 hour | 3 | 100 | ✅ Active |
| **Reset PWD** | 30 mins | 5 | 1000 | ✅ Active |
| **Stats** | 5 mins | 500 | 500 | ✅ Active |

---

## 📂 Endpoints List

### 🔐 Authentication (`/api/auth`)
| Method | Path | Auth | Rate Limit | Description |
| :--- | :--- | :--- | :--- | :--- |
| GET | `/me` | JWT | Global | Get current user info |
| POST | `/login` | Public | Login | Authenticate and get JWT |
| POST | `/logout` | JWT | Global | Invalidate session |
| POST | `/refresh-token`| Public | Global | Get new access token |
| POST | `/forgot-password`| Public | Forgot PWD | Request password reset email |
| POST | `/reset-password/:token`| Public | Reset PWD | Set new password with token |

### 📚 Courses (`/api/courses`)
| Method | Path | Auth | Rate Limit | Description |
| :--- | :--- | :--- | :--- | :--- |
| GET | `/` | Public | Public | List all active courses |
| GET | `/:id` | Public | Public | Get course details |
| GET | `/:id/students` | Admin | Global | List students in a course |
| POST | `/` | Admin | Global | Create new course (Upload) |
| PUT | `/:id` | Admin | Global | Update course (Upload) |
| DELETE | `/:id` | Admin | Global | Delete course |

### 👩‍🏫 Teachers (`/api/teachers`)
| Method | Path | Auth | Rate Limit | Description |
| :--- | :--- | :--- | :--- | :--- |
| GET | `/` | Public | Public | List all teachers |
| GET | `/:id` | Public | Public | Get teacher details |
| POST | `/` | Admin | Global | Add new teacher (Upload) |
| PUT | `/:id` | Admin | Global | Update teacher (Upload) |
| DELETE | `/:id` | Admin | Global | Remove teacher |

### 📝 Registrations (`/api/registrations`)
| Method | Path | Auth | Rate Limit | Description |
| :--- | :--- | :--- | :--- | :--- |
| GET | `/` | Admin | Global | List all registrations |
| POST | `/` | Public | Register | Submit registration form |
| POST | `/export-excel` | Admin | Global | Export all regs to Excel |
| GET | `/:id` | Admin | Global | Get registration details |
| PUT | `/:id` | Admin | Global | Update registration status |
| DELETE | `/:id` | Admin | Global | Permanently delete registration |

### 📅 Timetable (`/api/timetable`)
| Method | Path | Auth | Rate Limit | Description |
| :--- | :--- | :--- | :--- | :--- |
| GET | `/` | Admin | Global | Fetch full timetable |
| POST | `/export` | Admin | Global | Export timetable to Excel |
| POST | `/rows` | Admin | Global | Add a new row to timetable |
| PUT | `/rows/reorder` | Admin | Global | Reorder timetable rows |
| PUT | `/rows/:id` | Admin | Global | Update a row name |
| DELETE | `/rows/:id` | Admin | Global | Delete a timetable row |
| PUT | `/cells` | Admin | Global | Update/Insert cell content |

### 📊 Stats & Audit (`/api/stats`, `/api/admin/history`)
| Method | Path | Auth | Rate Limit | Description |
| :--- | :--- | :--- | :--- | :--- |
| GET | `/api/stats` | Admin | Stats | Get enrollment stats |
| GET | `/api/admin/history`| Admin | Global | View audit logs |
| POST | `/api/admin/history/export`| Admin | Global | Export audit logs to CSV |

### ☁️ Backup & System (`/api/auth/google`, `/api/health`)
| Method | Path | Auth | Rate Limit | Description |
| :--- | :--- | :--- | :--- | :--- |
| POST | `/api/google/backup`| Admin | Global | Manual backup to Google Drive |
| POST | `/api/google/restore`| Admin | Global | Manual restore from Backup |
| GET | `/api/health` | Public | Global | System health check |
| GET | `/api/csrf-token`| Public | Global | Fetch CSRF token for forms |

---
*Last Updated: 2026-04-06 12:53 (AI Scan)*
