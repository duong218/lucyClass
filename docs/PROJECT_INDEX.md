> [!CAUTION]
> ## 📖 AI MEMORY - MANDATORY RULES
> - 🚫 **TUYỆT ĐỐI CẤM** đọc file .env, .env.local, .env.production
> - ✅ **CHỈ ĐƯỢC ĐỌC** file .env.example (nếu có)
> - 📁 **CHỈ ĐƯỢC XỬ LÝ** file trong thư mục backend/frontend
> - 🔒 **KHÔNG BAO GIỜ** log giá trị của process.env

# 📊 Project Index

Comprehensive overview of the Lucy's Class project, including technology stack and core security status.

---

## 🏗️ Tech Stack

### Backend
- **Core**: Node.js v18+, Express.js v4.21
- **Database**: MongoDB v8.6.0 (Mongoose)
- **Security**: 
  - `express-rate-limit` v8.3.1
  - `csurf` v1.11.0
  - `helmet` v8.1.0
  - `bcryptjs` v2.4.3
- **Storage/Upload**: `multer`, `file-type`, `google-auth-library`.
- **Utilities**: `node-cron`, `nodemailer`, `winston`.

### Frontend
- **Framework**: React v18.3.1 (Vite v5.4.6)
- **Styling**: Tailwind CSS v3.4.11
- **Animations**: Framer Motion v12.38.0
- **Routing**: React Router DOM v6.26.2
- **State/API**: Axios v1.7.7, i18next v23.15.1.
- **Charts**: Chart.js v4.4.4.

---

## 🛡️ Security Overview

| Layer | Implementation | Status |
| :--- | :--- | :--- |
| **Rate Limiting** | `express-rate-limit` (Multiple Tiers) | ✅ Enabled |
| **CSRF** | `csurf` (X-CSRF-Token Headers) | ✅ Enabled |
| **Authentication** | JWT (HttpOnly Cookies + In-memory) | ✅ Secure |
| **Input Sanitization** | `mongoSanitize`, `xss-clean` | ✅ Global |
| **File Security** | Magic Number Validation (`file-type`) | ✅ Enforced |
| **Backups** | Automated Daily 2 AM Backups | ✅ Operational |

---

## 📜 Available Scripts

### Backend
- `npm run dev`: Starts development server with `nodemon`.
- `npm start`: Starts production server with `node`.

### Frontend
- `npm run dev`: Starts Vite development server.
- `npm run build`: Generates production build.
- `npm run preview`: Previews production build locally.

---
*Last AI Index: 2026-04-06 (Automated Scan)*
