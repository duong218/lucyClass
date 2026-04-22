# MERN Security Audit Report

## 1) Security Score

**Overall Rating: D (High risk)**

The project has solid baseline controls (JWT expiry, HttpOnly refresh token cookie, role checks on most admin routes, upload mime/magic-number checks, Redis cache clearing after restore), but there are still high-impact gaps that can lead to account/session abuse, PII exposure, and service-level DoS.

---

## 2) Findings

### Finding 1: Public streak endpoints expose user PII by phone number
- **Severity**: High
- **File path**: `backend/routes/streakRoutes.js`, `backend/controllers/streakController.js`
- **Code snippet**:
```javascript
router.get('/me', streakLimiter, controller.getStreak);
```
```javascript
const phone = normalizePhone(req.query.phone);
const user = await Streak.findOne({ phone });
...
data: formatUser(user) // includes email
```
- **Why it is a problem**: `GET /api/streak/me` is unauthenticated and takes only `phone`. `formatUser()` returns `email`, `name`, and streak data.
- **Real-world risk**: Anyone can enumerate phone numbers and harvest personal data (name/email) and user activity metadata.

**Exact code fix (before/after)**:

```javascript
// BEFORE (backend/routes/streakRoutes.js)
router.get('/me', streakLimiter, controller.getStreak);
```

```javascript
// AFTER (backend/routes/streakRoutes.js)
const streakAuth = require('../middlewares/streakAuth');
router.get('/me', streakLimiter, streakAuth, controller.getStreak);
```

```javascript
// BEFORE (backend/controllers/streakController.js)
const phone = normalizePhone(req.query.phone);
const user = await Streak.findOne({ phone });
```

```javascript
// AFTER (backend/controllers/streakController.js)
const user = await Streak.findById(req.user.streakUserId);
if (!user) return res.status(404).json({ success: false, data: null, message: 'User not found' });
```

---

### Finding 2: CSRF origin check uses prefix matching (`startsWith`) and can be bypassed
- **Severity**: High
- **File path**: `backend/middlewares/securityMiddleware.js`
- **Code snippet**:
```javascript
if (!origin || !allowedOrigins.some(o => origin.startsWith(o))) {
```
- **Why it is a problem**: Prefix checks are unsafe for origin validation (`https://trusted.com.attacker.tld` passes `startsWith('https://trusted.com')`).
- **Real-world risk**: Forged cross-site state-changing requests can pass custom CSRF middleware in production.

**Exact code fix (before/after)**:

```javascript
// BEFORE
if (!origin || !allowedOrigins.some(o => origin.startsWith(o))) {
```

```javascript
// AFTER
const normalizedOrigin = String(origin || '').trim().replace(/\/$/, '');
if (!normalizedOrigin || !allowedOrigins.includes(normalizedOrigin)) {
```

---

### Finding 3: Heavy backup/restore operations are admin-only but not specifically rate-limited
- **Severity**: Medium
- **File path**: `backend/routes/googleRoutes.js`, `backend/middlewares/rateLimiter.js`
- **Code snippet**:
```javascript
router.post('/backup', auth, isAdmin, csrfProtection, catchAsync(googleController.backupToDrive));
router.post('/restore', auth, isAdmin, csrfProtection, catchAsync(restoreController.restoreBackup));
```
- **Why it is a problem**: These endpoints launch expensive operations (`mongodump`, zip/encrypt, Drive I/O, restore pipeline). Existing global limiter skips admin users.
- **Real-world risk**: A compromised admin session can repeatedly trigger expensive jobs and degrade/deny service.

**Exact code fix (before/after)**:

```javascript
// AFTER (backend/middlewares/rateLimiter.js)
const heavyAdminOpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
});
```

```javascript
// AFTER (backend/routes/googleRoutes.js)
const { heavyAdminOpLimiter } = require('../middlewares/rateLimiter');
router.post('/backup', auth, isAdmin, heavyAdminOpLimiter, csrfProtection, catchAsync(googleController.backupToDrive));
router.post('/restore', auth, isAdmin, heavyAdminOpLimiter, csrfProtection, catchAsync(restoreController.restoreBackup));
```

---

### Finding 4: Weak password policy for staff bootstrap/reset flows
- **Severity**: Medium
- **File path**: `backend/models/StaffAccount.js`, `backend/controllers/authController.js`
- **Code snippet**:
```javascript
// 8-char random password
const bytes = crypto.randomBytes(8);
```
```javascript
// reset accepts any password without strength check
const { password } = req.body;
user.password = password;
```
- **Why it is a problem**: 8-character bootstrap credentials and no server-side complexity check increase brute-force/password stuffing success.
- **Real-world risk**: Staff accounts are easier to take over if initial/reset passwords are weak or reused.

**Exact code fix (before/after)**:

```javascript
// BEFORE (backend/models/StaffAccount.js)
const bytes = crypto.randomBytes(8);
for (let i = 0; i < 8; i++) {
```

```javascript
// AFTER (backend/models/StaffAccount.js)
const bytes = crypto.randomBytes(12);
for (let i = 0; i < 12; i++) {
```

```javascript
// AFTER (backend/controllers/authController.js - inside resetPassword)
const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{12,64}$/;
if (!strongPassword.test(password || '')) {
  return res.status(400).json({
    message: 'Mật khẩu phải dài 12+ ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt'
  });
}
```

---

### Finding 5: Known high-severity vulnerable dependency (`xlsx`)
- **Severity**: High
- **File path**: `backend/package.json`
- **Evidence**: `npm.cmd audit --json` reports:
  - GHSA-4r6h-8v6p-xvw6 (Prototype Pollution)
  - GHSA-5pgg-2g8v-p4x9 (ReDoS)
- **Why it is a problem**: Excel export/import package has unresolved advisories.
- **Real-world risk**: Crafted workbook content can trigger denial-of-service or unsafe object behavior depending on usage paths.

**Exact code fix (before/after)**:

```json
// BEFORE (backend/package.json)
"xlsx": "^0.18.5"
```

```json
// AFTER (backend/package.json)
"xlsx": "^0.20.2"
```

If upgrade is blocked, replace `xlsx` usage in `registrationController.exportExcel` with `exceljs` (already installed).

---

### Finding 6: Additional vulnerable dependencies from audit
- **Severity**: Medium
- **File path**: `backend/package.json`, `frontend/package.json`
- **Evidence**:
  - Backend: `file-type` vulnerable (GHSA-5v7r-6r5c-r473), currently `^16.5.4`
  - Frontend: `vite`/`esbuild` moderate advisories (`vite <= 6.4.1`, `esbuild <= 0.24.2`)
- **Why it is a problem**: Known issues remain unpatched in dependency tree.
- **Real-world risk**: Primarily impacts build/dev tooling and file parsing edge-cases, but still increases attack surface.

**Exact code fix (before/after)**:

```json
// BEFORE (backend/package.json)
"file-type": "^16.5.4"
```

```json
// AFTER (backend/package.json)
"file-type": "^22.0.1"
```

```json
// BEFORE (frontend/package.json)
"vite": "^5.4.6"
```

```json
// AFTER (frontend/package.json)
"vite": "^6.4.2"
```

---

## 3) Frontend Security Notes

- No direct `dangerouslySetInnerHTML` usage found in `frontend/src` (good baseline against reflected/stored XSS).
- Access token is in-memory in `frontend/src/services/api.js`, not persisted in `localStorage` (good).
- `localStorage` is used for non-secret flags/state (`hasSession`, UI state, streak UI data), which is acceptable.
- No hardcoded API secret keys found in frontend source.

---

## 4) Priority Fix List (Top 5)

1. Lock down `GET /api/streak/me` with authenticated identity, remove phone-based lookup.
2. Fix CSRF origin validation (`startsWith` -> strict normalized equality).
3. Add strict limiter for `/api/auth/google/backup` and `/api/auth/google/restore`.
4. Enforce strong password policy on reset and increase generated staff password length.
5. Patch vulnerable dependencies immediately: `xlsx`, `file-type`, `vite`/`esbuild`.

---

## 5) Audit Scope and Constraints

- Backend reviewed: auth, authorization, API routes, restore/backup, upload validation, Redis cache behaviors, dependency security.
- Frontend reviewed: token handling, route protection, XSS sinks, endpoint configuration, secret exposure patterns.
- Dependency results come from live local commands:
  - `npm.cmd audit --json` (backend/frontend)
  - `npm.cmd outdated --json` (backend/frontend)
