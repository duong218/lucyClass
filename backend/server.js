require('dotenv').config();

const express = require('express');
const systemLogger = require('./utils/systemLogger');

// 9. GRACEFUL SHUTDOWN (defined early so process handlers can reference it)
let server;
const gracefulShutdown = () => {
  console.log('🛑 Shutting down...');
  
  const mongoose = require('mongoose');
  
  if (server) {
    server.close(async () => {
      console.log('✅ HTTP server closed');
      await mongoose.connection.close();
      console.log('✅ MongoDB connection closed');

      try {
        await redisClient.quit();
        console.log('✅ Redis connection closed');
      } catch (err) {
        console.warn('⚠️ Redis close error:', err.message);
      }
    
      process.exit(0);
    });
    
    // Force exit nếu quá 10s
    setTimeout(() => {
      console.error('⚠️ Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
    
  } else {
    process.exit(0);
  }
};

// 🛑 GLOBAL PROCESS EXCEPTION HANDLERS
process.on('uncaughtException', (err) => {
  systemLogger.error(`UNCAUGHT EXCEPTION! 💥 Shutting down...`, { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  systemLogger.error(`UNHANDLED REJECTION! 💥 Shutting down gracefully...`, { error: err.message, stack: err.stack });
  gracefulShutdown();
});
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// 🚨 ENV VALIDATION
const requiredEnvs = ['MONGO_URI', 'BACKUP_PATH', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET', 'BACKUP_ENCRYPTION_KEY', 'RECAPTCHA_SECRET_KEY'];
const missingEnvs = requiredEnvs.filter(env => !process.env[env]);
if (missingEnvs.length > 0) {
  console.error(`🚨 FATAL ERROR: Missing required environment variables: ${missingEnvs.join(', ')}`);
  process.exit(1);
}

const axios = require('axios');
const Registration = require('./models/Registration');
const Course = require('./models/Course');
const { appendToSheet } = require('./googleSheets');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const connectDB = require('./config/db');
const { verifyCSRF } = require('./middlewares/securityMiddleware');
const redisClient = require('./config/redis');

// --- 🎯 ABSOLUTE PRIORITY MIDDLEWARE ---
const app = express();

// 1. Trust proxy for rate limiting
app.set("trust proxy", 1);

// 2. Cookie Parsing (MUST be first)
app.use(cookieParser(process.env.COOKIE_SECRET));

// 3. CORS Configuration
const parseOrigins = (envVar) => {
  if (!envVar) return [];
  return envVar
    .split(',')
    .map(o => o.trim().replace(/\/$/, ''))
    .filter(o => o.length > 0);
};

const allowedOrigins = parseOrigins(
  process.env.CORS_ORIGINS || process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173,https://lucy-class.vercel.app'
);
console.log('[CORS] Allowed origins:', allowedOrigins);
const isDev = process.env.NODE_ENV === 'development';
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const normalizedOrigin = origin.trim().replace(/\/$/, '');
    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }
    console.warn(`Blocked by CORS: ${normalizedOrigin}`);
    return callback(null, false);
  },
  credentials: true
}));

// ✅ FIX: Helmet lên đây để mọi response (kể cả lỗi CSRF/body) đều có security headers
// 3.5. Security Headers (Helmet) — TRƯỚC verifyCSRF
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "img-src": ["'self'", "data:", "https://res.cloudinary.com"],
      "script-src": ["'self'", "'unsafe-inline'", "https://www.google.com/recaptcha/", "https://www.gstatic.com/recaptcha/"],
      "frame-src": ["'self'", "https://www.google.com/recaptcha/"],
      "connect-src": ["'self'", "https://api.cloudinary.com", "https://www.google.com/recaptcha/"]
    }
  },
  hsts: process.env.NODE_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true } : false
}));

// --- 🛡️ CUSTOM CSRF PROTECTION ---
app.use((req, res, next) => {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];

  if (safeMethods.includes(req.method.toUpperCase())) {
    return next();
  }

  try {
    verifyCSRF(req, res, (err) => {
      if (err) {
        return res.status(403).json({
          success: false,
          message: "Invalid CSRF token"
        });
      }
      return next();
    });
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: "Invalid CSRF token"
    });
  }
});

// 4. Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. Sanitize (sau body parsing để có req.body mà sanitize)
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
const rankingRoutes = require('./routes/rankingRoutes');
const initCronJobs = require('./config/cron');
const backupService = require('./services/backup.service');
const userIdentifier = require('./middlewares/userIdentifier');
const { apiLimiter } = require('./middlewares/rateLimiter');
const errorHandler = require('./middlewares/errorHandler');
const streakRoutes = require('./routes/streakRoutes');
const staffRoutes = require('./routes/staffRoutes');
const staffDashboardRoutes = require('./routes/staffDashboardRoutes');

// 7. Global Logic
app.use(userIdentifier);
app.use('/api', apiLimiter);

// 8. Endpoints
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

const backupDir = path.resolve(process.env.BACKUP_PATH || './backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// ⚠️ '/uploads' static route REMOVED as images are served via Cloudinary

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
app.use('/api/rankings', rankingRoutes);
app.use('/api/streak', streakRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/me', staffDashboardRoutes);

// --- 📊 GOOGLE SHEETS SUBMISSION ENDPOINT ---
// Helpers for /api/submit
const verifyCaptcha = async (captchaToken) => {
  if (!captchaToken || typeof captchaToken !== 'string') {
    throw new Error('Captcha không hợp lệ');
  }
  const recaptchaRes = await axios.post(
    'https://www.google.com/recaptcha/api/siteverify',
    new URLSearchParams({
      secret: process.env.RECAPTCHA_SECRET_KEY,
      response: captchaToken
    }),
    { timeout: 5000 }
  );
  if (!recaptchaRes.data.success) {
    throw new Error('Xác thực captcha thất bại, vui lòng thử lại');
  }
};

const sanitizeData = (raw) => {
  return {
    parentName: String(raw.parentName || '').trim().replace(/[<>]/g, ''),
    childName: String(raw.childName || '').trim().replace(/[<>]/g, ''),
    phone: String(raw.phone || '').trim(),
    email: String(raw.email || '').trim().toLowerCase(),
    message: String(raw.message || '').trim().replace(/[<>]/g, ''),
    course: String(raw.course || '').trim(),
    childAge: Number(raw.childAge)
  };
};

const validateInput = (sanitized) => {
  if (!sanitized.parentName || !sanitized.phone) {
    throw new Error('Thiếu thông tin bắt buộc');
  }
  const phoneRegex = /^(0|\+84)(3|5|7|8|9)\d{8}$/;
  if (!phoneRegex.test(sanitized.phone)) {
    throw new Error('Số điện thoại không hợp lệ');
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (sanitized.email && !emailRegex.test(sanitized.email)) {
    throw new Error('Email không hợp lệ');
  }
  if (sanitized.parentName.length > 100) throw new Error('Tên phụ huynh quá dài');
  if (sanitized.childName.length > 100) throw new Error('Tên học sinh quá dài');
  if (sanitized.message.length > 1000) throw new Error('Tin nhắn quá dài');
  if (sanitized.childAge && (isNaN(sanitized.childAge) || sanitized.childAge < 3 || sanitized.childAge > 18)) {
    throw new Error('Tuổi phải từ 3-18');
  }
};

const saveRegistration = async (sanitized) => {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const existingRegistration = await Registration.findOne({
    phone: sanitized.phone,
    createdAt: { $gte: fiveMinutesAgo }
  });

  if (existingRegistration) {
    const err = new Error('Bạn đã gửi đăng ký trước đó, vui lòng chờ 5 phút');
    err.status = 429;
    throw err;
  }

  let courseId = null;
  if (sanitized.course) {
    const courseDoc = await Course.findOne({ name: sanitized.course });
    if (courseDoc) courseId = courseDoc._id;
  }

  return await Registration.create({
    parentName: sanitized.parentName,
    phone: sanitized.phone,
    childName: sanitized.childName,
    childAge: sanitized.childAge || null,
    courseId,
    email: sanitized.email,
    message: sanitized.message,
    status: 'not_contacted'
  });
};

// --- 📊 GOOGLE SHEETS SUBMISSION ENDPOINT ---
app.post('/api/submit', async (req, res) => {
  try {
    try {
      await verifyCaptcha(req.body.captchaToken);
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    let sanitizedData;
    try {
      sanitizedData = sanitizeData(req.body);
      validateInput(sanitizedData);
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    let savedRecord;
    try {
      savedRecord = await saveRegistration(sanitizedData);
    } catch (err) {
      if (err.status === 429) {
        return res.status(429).json({ success: false, message: err.message });
      }
      throw err;
    }

    // 4. Record to Google Sheets (DO NOT await - non-blocking)
    appendToSheet(sanitizedData).catch(err => console.error('[Sheets] Background Sync Failed:', err));

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: savedRecord
    });

  } catch (error) {
    console.error('[SUBMIT] Error:', error);
    res.status(500).json({ success: false, message: 'Server Internal Error' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 2. GLOBAL ERROR HANDLER (CRITICAL)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

connectDB().then(async () => {
  // Retry any interrupted backup uploads on startup
  (async () => {
    try {
      await backupService.retryPendingUploads();
      console.log('[Startup] Pending backup uploads retried');
    } catch (err) {
      console.error('[Startup] Retry pending backups failed:', err.message);
    }
  })();

  try {
    await redisClient.connect();
    console.log('✅ Redis connected on startup');
  } catch (err) {
    console.warn('⚠️ Redis unavailable, caching disabled:', err.message);
  }

  initCronJobs();
  require('./utils/scheduledTasks');
  server = app.listen(PORT, () => console.log(`🚀 Lucy's Class Server running on port ${PORT}`));
});
