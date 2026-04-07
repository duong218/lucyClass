const express = require('express');
const systemLogger = require('./utils/systemLogger');

// 🛑 GLOBAL PROCESS EXCEPTION HANDLERS
process.on('uncaughtException', (err) => {
  systemLogger.error(`UNCAUGHT EXCEPTION! 💥 Shutting down...`, { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  systemLogger.error(`UNHANDLED REJECTION! 💥 Shutting down...`, { error: err.message, stack: err.stack });
  // In production, we might want to close the server first
  process.exit(1);
});
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const axios = require('axios');
const Registration = require('./models/Registration');
const Course = require('./models/Course');
const { appendToSheet } = require('./googleSheets');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const connectDB = require('./config/db');
const { verifyCSRF } = require('./middlewares/securityMiddleware');

// --- 🎯 ABSOLUTE PRIORITY MIDDLEWARE ---
const app = express();

// 1. Trust proxy for rate limiting
app.set("trust proxy", 1);

// 2. Cookie Parsing (MUST be first)
app.use(cookieParser(process.env.COOKIE_SECRET));

// 3. CORS Configuration
const allowedOrigins = (process.env.CORS_ORIGINS || process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim().replace(/\/$/, ''));

/*app.use(cors({
  origin: function (origin, callback) {
    console.log("Origin request:", origin);
    console.log("Allowed:", allowedOrigins);
    // Allow requests with no origin (server-to-server, curl, mobile apps)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.warn(`[CORS] Blocked origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token']
})); */   //code 

//chatgpt sửa
app.use(cors({
  origin: function (origin, callback) {
    console.log("Origin request:", origin);
    console.log("Allowed:", allowedOrigins);

    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      origin.endsWith(".vercel.app")
    ) {
      return callback(null, true);
    }

    console.warn(`[CORS] Blocked origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token']
}));

// --- 🛡️ CUSTOM CSRF PROTECTION ---
app.use(verifyCSRF);

// 4. Body Parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 5. Security & Sanitize
app.use(helmet({ crossOriginResourcePolicy: false, crossOriginEmbedderPolicy: false }));
app.use(mongoSanitize());
app.use(xss());

// 6. Routes & Dependencies
const authRoutes = require('./routes/authRoutes');
const csrfProtection = require('./middlewares/csrf');
const courseRoutes = require('./routes/courseRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const statsRoutes = require('./routes/statsRoutes');
const auditRoutes = require('./routes/auditRoutes');
const googleRoutes = require('./routes/googleRoutes');
const restoreRoutes = require('./routes/restoreRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const timetableRoutes = require('./routes/timetableRoutes');
const initCronJobs = require('./config/cron');
const userIdentifier = require('./middlewares/userIdentifier');
const { apiLimiter } = require('./middlewares/rateLimiter');
const errorHandler = require('./middlewares/errorHandler');

// 7. Global Logic
app.use(userIdentifier);
app.use('/api', apiLimiter);

// 8. Endpoints
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

const uploadDir = path.resolve(process.env.UPLOAD_PATH || './uploads');
const backupDir = path.resolve(process.env.BACKUP_PATH || './backups');
[uploadDir, backupDir].forEach(dir => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); });

app.use('/uploads', express.static(uploadDir, {
  setHeaders: (res) => {
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/students', registrationRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/admin/history', auditRoutes);
app.use('/api/auth/google', googleRoutes);
app.use('/api/restore', restoreRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/timetable', timetableRoutes);

// --- 📊 GOOGLE SHEETS SUBMISSION ENDPOINT ---
app.post('/api/submit', async (req, res) => {
  try {
    // 🔐 LỚP BẢO MẬT 1: Lấy data và captchaToken
    // 🔐 LỚP BẢO MẬT 1: Lấy data và captchaToken
    const { parentName, phone, childName, childAge, course, email, message, captchaToken } = req.body;

    // 🔐 LỚP BẢO MẬT 2: Kiểm tra captcha
    if (!captchaToken || typeof captchaToken !== 'string') {
      return res.status(400).json({ success: false, message: 'Captcha không hợp lệ' });
    }

    // 🔐 LỚP BẢO MẬT 3: Xác thực reCAPTCHA với Google
    const recaptchaRes = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      new URLSearchParams({
        secret: process.env.RECAPTCHA_SECRET_KEY,
        response: captchaToken
      }),
      { timeout: 5000 }
    );

    if (!recaptchaRes.data.success) {
      return res.status(400).json({ success: false, message: 'Xác thực captcha thất bại, vui lòng thử lại' });
    }

    // 🔐 LỚP BẢO MẬT 4: Kiểm tra required fields
    if (!parentName || !phone) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
    }

    // 🔐 LỚP BẢO MẬT 5: Sanitize input (chống XSS)
    const sanitizedParentName = String(parentName || '').trim().replace(/[<>]/g, '');
    const sanitizedChildName = String(childName || '').trim().replace(/[<>]/g, '');
    const sanitizedPhone = String(phone || '').trim();
    const sanitizedEmail = String(email || '').trim().toLowerCase();
    const sanitizedMessage = String(message || '').trim().replace(/[<>]/g, '');
    const sanitizedCourse = String(course || '').trim();

    // 🔐 LỚP BẢO MẬT 6: Validate số điện thoại Việt Nam
    const phoneRegex = /^(0|\+84)(3|5|7|8|9)\d{8}$/;
    if (!phoneRegex.test(sanitizedPhone)) {
      return res.status(400).json({ success: false, message: 'Số điện thoại không hợp lệ' });
    }

    // 🔐 LỚP BẢO MẬT 7: Validate email (nếu có)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (sanitizedEmail && !emailRegex.test(sanitizedEmail)) {
      return res.status(400).json({ success: false, message: 'Email không hợp lệ' });
    }

    // 🔐 LỚP BẢO MẬT 8: Validate độ dài
    if (sanitizedParentName.length > 100) {
      return res.status(400).json({ success: false, message: 'Tên phụ huynh quá dài' });
    }
    if (sanitizedChildName.length > 100) {
      return res.status(400).json({ success: false, message: 'Tên học sinh quá dài' });
    }
    if (sanitizedMessage.length > 1000) {
      return res.status(400).json({ success: false, message: 'Tin nhắn quá dài' });
    }

    // 🔐 LỚP BẢO MẬT 9: Kiểm tra age (nếu có)
    const ageNum = Number(childAge);
    if (childAge && (isNaN(ageNum) || ageNum < 3 || ageNum > 18)) {
      return res.status(400).json({ success: false, message: 'Tuổi phải từ 3-18' });
    }

    // 🔐 LỚP BẢO MẬT 10: Chống spam - kiểm tra duplicate trong 5 phút
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const existingRegistration = await Registration.findOne({
      phone: sanitizedPhone,
      createdAt: { $gte: fiveMinutesAgo }
    });

    if (existingRegistration) {
      return res.status(429).json({
        success: false,
        message: 'Bạn đã gửi đăng ký trước đó, vui lòng chờ 5 phút'
      });
    }

    // 1. Basic Validation - redundant but kept for flow
    if (!sanitizedParentName || !sanitizedPhone) {
      return res.status(400).json({ success: false, message: 'Missing required field: parentName or phone' });
    }

    // 2. Data Lookup (Map course name to courseId if needed)
    let courseId = null;
    if (sanitizedCourse) {
      const courseDoc = await Course.findOne({ name: sanitizedCourse });
      if (courseDoc) courseId = courseDoc._id;
    }

    // 3. Save to MongoDB
    const registrationData = {
      parentName: sanitizedParentName,
      phone: sanitizedPhone,
      childName: sanitizedChildName,
      childAge: ageNum || null,
      courseId,
      email: sanitizedEmail,
      message: sanitizedMessage,
      status: 'not_contacted'
    };

    const savedRecord = await Registration.create(registrationData);

    // 4. Record to Google Sheets (DO NOT await - non-blocking)
    // We pass the full body (including course name) to appendToSheet
    appendToSheet(req.body).catch(err => console.error('[Sheets] Background Sync Failed:', err));

    // 5. Success response
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: savedRecord
    });

  } catch (error) {
    console.error('[SUBMIT] Error:', error);
    res.status(500).json({ success: false, message: 'Server Internal Error'});
  }
});

app.get('/api/test-error', (req, res) => {
  throw new Error('This is a sensitive internal error message');
});

app.get('/api/health', (req, res) => res.json({ status: 'OK' }));
app.use(errorHandler);

console.log("CORS_ORIGINS:", process.env.CORS_ORIGINS);

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  initCronJobs();
  app.listen(PORT, () => console.log(`🚀 Lucy's Class Server running on port ${PORT}`));
});
