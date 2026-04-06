> [!CAUTION]
> ## 📖 AI MEMORY - MANDATORY RULES
> - 🚫 **TUYỆT ĐỐI CẤM** đọc file .env, .env.local, .env.production
> - ✅ **CHỈ ĐƯỢC ĐỌC** file .env.example (nếu có)
> - 📁 **CHỈ ĐƯỢC XỬ LÝ** file trong thư mục backend/frontend
> - 🔒 **KHÔNG BAO GIỜ** log giá trị của process.env

# 📁 Folder Tree Structure

A visual guide to the project's organization, including key configuration and security files.

---

## 🏛️ Root Directory
```text
lucyClass-main/
├── backend/            # Express.js Backend
├── frontend/           # React + Vite Frontend
├── docs/               # Project Documentation (Current location)
├── README.md           # Project Overview
├── scan.js             # AI Assist Scan Script
└── vercel.json         # Deployment Config
```

## 🏗️ Backend Structure (`/backend`)
```text
backend/
├── config/             # DB & Cron Configuration
│   ├── db.js           # MongoDB Connection
│   └── cron.js         # Scheduled Backups (Daily 2:00 AM)
├── controllers/        # Business Logic
│   ├── authController.js
│   ├── courseController.js
│   ├── registrationController.js
│   └── ...
├── middlewares/        # Security & Utility Middlewares
│   ├── auth.js         # JWT Verification
│   ├── csrf.js         # CSRF Protection
│   ├── isAdmin.js      # Admin Role Check
│   ├── rateLimiter.js  # Brute-force/DoS Protection
│   ├── upload.js       # Secured File Upload
│   └── validate.js     # Validation Rules Handler
├── models/             # Mongoose Schemas (AuditLog, Registration, User...)
├── routes/             # API Route Definitions
├── services/           # External API & Backup Services
├── utils/              # Loggers and Email Services
├── validators/         # Input Schema Validation
├── server.js           # App Entry Point & Middleware Stack
├── package.json        # Backend Dependencies
└── .env.example        # Environment Variable Template
```

## 🎨 Frontend Structure (`/frontend`)
```text
frontend/
├── src/
│   ├── assets/         # Static Images & Media
│   ├── components/     # UI Building Blocks
│   ├── contexts/       # Auth & UI State
│   ├── hooks/          # Custom React Hooks
│   ├── layouts/        # Page Wrappers
│   ├── pages/          # Full Page Components
│   ├── services/       # API Connection & Interceptors
│   │   ├── api.js      # Main axios instance with security interceptors
│   │   └── ...
│   ├── utils/          # Frontend Helpers
│   ├── App.jsx         # Root Component
│   └── main.jsx        # App Entry Point
├── package.json        # Frontend Dependencies
└── vite.config.js      # Build & Proxy Config
```

---

## 🔑 Special Files Note
*   `/backend/middlewares/rateLimiter.js`: **Security Priority** - Defines DoS protection.
*   `/backend/middlewares/csrf.js`: **Security Priority** - Protects against CSRF attacks.
*   `/backend/config/cron.js`: **Functional Priority** - Handles data persistence and backups.

---
*Last Updated: 2026-04-06 (AI Scan)*
