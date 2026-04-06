# FOLDER TREE

> [!CAUTION]
> ## 📖 AI MEMORY - MANDATORY RULES
> - 🚫 **TUYỆT ĐỐI CẤM** đọc file .env, .env.local, .env.production
> - ✅ **CHỈ ĐƯỢC ĐỌC** file .env.example (nếu có)
> - 📁 **CHỈ ĐƯỢC XỬ LÝ** file trong thư mục backend/frontend
> - 🔒 **KHÔNG BAO GIỜ** log giá trị của process.env

```
backend/
├── config/
│   ├── db.js
│   └── cron.js
├── controllers/
│   ├── authController.js
│   ├── timetableController.js
│   └── ...
├── middlewares/
│   ├── auth.js
│   ├── csrf.js
│   ├── rateLimiter.js
│   └── ...
├── models/
│   ├── User.js
│   ├── Registration.js
│   ├── Course.js
│   ├── TimetableRow.js
│   └── TimetableCell.js
├── routes/
│   ├── authRoutes.js
│   ├── timetableRoutes.js
│   ├── courseRoutes.js
│   └── ...
├── services/
│   ├── timetableService.js
│   └── ...
├── utils/
├── validators/
└── server.js
frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   ├── Timetable/
│   │   └── ...
│   ├── contexts/
│   │   └── AuthContext.jsx
│   ├── hooks/
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── TimetableEditor.jsx
│   │   └── ...
│   ├── services/
│   │   ├── authService.js
│   │   └── timetableService.js
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── package.json
└── vite.config.js
```
