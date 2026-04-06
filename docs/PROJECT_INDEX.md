# PROJECT INDEX

> [!CAUTION]
> ## 📖 AI MEMORY - MANDATORY RULES
> - 🚫 **TUYỆT ĐỐI CẤM** đọc file .env, .env.local, .env.production
> - ✅ **CHỈ ĐƯỢC ĐỌC** file .env.example (nếu có)
> - 📁 **CHỈ ĐƯỢC XỬ LÝ** file trong thư mục backend/frontend
> - 🔒 **KHÔNG BAO GIỜ** log giá trị của process.env

## 🏢 BACKEND (backend/)
- **Name**: lucys-class-backend
- **Version**: 1.0.0
- **Description**: Lucy's Class English Center - Backend API
- **Tech Stack**: Node.js, Express, MongoDB (Mongoose), Redis, ioredis, JWT, winston, winston-daily-rotate-file (logging), node-cron, nodemailer, googleapis.
- **Main Scripts**: start, dev.

## 🎨 FRONTEND (frontend/)
- **Name**: lucys-class-frontend
- **Version**: 1.0.0
- **Tech Stack**: React 18, Vite, Tailwind CSS, Framer Motion, Axios, i18next, Chart.js, React Router, React Toastify, Lucide React, Swiper.
- **Main Scripts**: dev, build, preview.

## 🔐 SECURITY OVERVIEW
- **Authentication**: JWT with cookie-based Refresh Token.
- **Protection**: Helmet, CORS, CSRF, Rate Limiting (Redis), XSS Clean, MongoDB Sanitize.
- **Google Integration**: reCAPTCHA v2, Google Sheets API.
- **Audit**: Admin history logging for sensitive actions.

## ⏱️ RATE LIMITING STATUS (Updated)
| Endpoint | DEV | PROD | Status |
|----------|-----|------|--------|
| POST /login | 100/1p | 5/10p | ✅ Active |
| POST /forgot-password | 100/1h | 3/1h | ✅ Active |
| POST /reset-password | 1000/1h | 5/30p | ✅ Active |
| Global API | 200/5p | 200/5p | ✅ Active |
