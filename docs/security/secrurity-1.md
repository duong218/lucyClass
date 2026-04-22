# 🛡️ MERN Security Audit Report

## 1. Security Score
**Overall Rating: C (Moderate risk)**

**Summary**: The application implements several strong security practices, including HTTP-only cookies for refresh tokens, memory storage for access tokens, strict `multer` file validation, and custom CSRF origin checks. However, critical flaws in rate limiting logic and missing protections on the backup/restore endpoints introduce significant Denial of Service (DoS) and brute-force risks.

---

## 2. Priority Fix List
1. **Fix Admin Password Brute Force** on `/api/restore` by moving the anti-automation delay.
2. **Apply specific rate limits** to the `/backup` endpoint to prevent DoS via CPU/memory exhaustion.
3. **Patch Login CSRF** by removing the login whitelist from `securityMiddleware.js`.
4. **Enforce JWT Algorithms** in `auth.js` to prevent signature bypass attacks.
5. **Phase out deprecated packages** (`xss-clean` and `csurf`).

---

## 3. Findings & Fixes

### 🔴 Finding 1: Admin Password Brute Force via Restore Endpoint
* **Severity**: **High**
* **File**: `backend/controllers/restore.controller.js`
* **Why it is a problem**: The `/restore` endpoint requires the admin to re-authenticate with their password. It features a 4-second anti-automation delay (`setTimeout(..., 4000)`). However, this delay is placed **after** the password check. If the password fails, it returns `401` immediately. Furthermore, the global rate limiter explicitly skips admins (`skip: (req) => req.user?.role === 'admin'`).
* **Real-world risk**: An attacker who steals an admin's JWT (which has `role: admin`) can bypass the global rate limiter and brute-force the plaintext admin password at maximum speed against the `/restore` endpoint without triggering any cooldowns.

**Fix Suggestion**:
Move the 4-second delay to the top of the function so it penalizes *all* attempts (or apply a strict rate limiter to the route).

```javascript
// backend/controllers/restore.controller.js (Lines ~117-120)

// ❌ BEFORE:
    const passwordMatch = await bcrypt.compare(password, adminUser.password);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Password incorrect' });
    }
    // ... logging ...
    await new Promise(resolve => setTimeout(resolve, 4000));

// ✅ AFTER:
    // ── GUARD 4: Anti-automation safety delay MUST BE BEFORE CHECK ──
    await new Promise(resolve => setTimeout(resolve, 4000));

    const passwordMatch = await bcrypt.compare(password, adminUser.password);
    if (!passwordMatch) {
      console.warn(`[RESTORE:AUTH_FAIL] Admin failed password re-auth`);
      return res.status(401).json({ success: false, message: 'Password incorrect' });
    }
```

---

### 🔴 Finding 2: Denial of Service (DoS) via Unlimited Backup Triggers
* **Severity**: **High**
* **File**: `backend/routes/googleRoutes.js` & `backend/middlewares/rateLimiter.js`
* **Why it is a problem**: The `POST /api/auth/google/backup` route is protected by `auth` and `isAdmin`. However, the global `apiLimiter` skips admins. A backup process (`mongodump` + `zip` + AES encryption + Drive upload) is extremely CPU and memory intensive, taking up to a minute to complete.
* **Real-world risk**: A compromised admin account or malicious insider can fire hundreds of concurrent requests to `/backup`. This will immediately exhaust server resources (CPU, RAM, Disk I/O) and crash the backend (DoS).

**Fix Suggestion**:
Create a strict rate limiter for heavy admin operations and apply it to the backup and restore routes.

```javascript
// backend/middlewares/rateLimiter.js
// ✅ AFTER (Add this new limiter):
const heavyOpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Max 3 backups/restores per 15 mins
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  // ... existing limiters
  heavyOpLimiter
};
```

```javascript
// backend/routes/googleRoutes.js
// ✅ AFTER:
const { heavyOpLimiter } = require('../middlewares/rateLimiter');
router.post('/backup', auth, isAdmin, csrfProtection, heavyOpLimiter, catchAsync(googleController.backupToDrive));
```

---

### 🟡 Finding 3: Login CSRF Vulnerability
* **Severity**: **Moderate**
* **File**: `backend/middlewares/securityMiddleware.js`
* **Why it is a problem**: The custom `verifyCSRF` middleware explicitly whitelists `/api/auth/login`. This bypasses both the Origin check and the custom `X-Requested-With` header check. Additionally, `csrf.js` exempts it from token validation.
* **Real-world risk**: An attacker can execute a "Login CSRF" attack, forcing a victim's browser to authenticate into the attacker's account. If the victim unknowingly uses the account, the attacker can monitor their activity or steal data they input.

**Fix Suggestion**:
Remove `/api/auth/login` from the whitelist in `securityMiddleware.js` so it enforces the `X-Requested-With` header and Origin policy.

```javascript
// backend/middlewares/securityMiddleware.js (Line 20)

// ❌ BEFORE:
  const WHITELIST_PATHS = [
    '/api/auth/login',
    '/api/registrations',
    '/api/register'
  ];

// ✅ AFTER:
  const WHITELIST_PATHS = [
    // Removed /api/auth/login so it requires X-Requested-With header
    '/api/registrations',
    '/api/register' 
  ];
```

---

### 🟡 Finding 4: Insecure JWT Verification (Missing Algorithm)
* **Severity**: **Low**
* **File**: `backend/middlewares/auth.js`
* **Why it is a problem**: The `jwt.verify` call does not explicitly specify the allowed hashing algorithms. 
* **Real-world risk**: Older or misconfigured versions of `jsonwebtoken` are vulnerable to "algorithm confusion" (e.g., swapping RS256 for HS256) or the "none" algorithm attack. Explicitly defining algorithms prevents this entirely.

**Fix Suggestion**:

```javascript
// backend/middlewares/auth.js (Line 28)

// ❌ BEFORE:
const decoded = jwt.verify(token, process.env.JWT_SECRET);

// ✅ AFTER:
const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
```
*(Note: Do the same for `process.env.REFRESH_TOKEN_SECRET` in `authController.js` and `auth.js`)*

---

### 🟡 Finding 5: Deprecated Security Dependencies
* **Severity**: **Low / Info**
* **File**: `backend/package.json`
* **Why it is a problem**: 
  - `xss-clean` (`^0.1.4`) is deprecated, unmaintained, and has known bypasses.
  - `csurf` (`^1.11.0`) is deprecated by the Express team due to fundamental architectural flaws in token-based CSRF.
* **Real-world risk**: Future zero-day vulnerabilities in these packages will not be patched.

**Fix Suggestion**:
- Remove `xss-clean` and replace it with `dompurify` (running via JSDOM) or rely solely on React's built-in XSS protection (which is already excellent since `dangerouslySetInnerHTML` is not used).
- Transition entirely to the `verifyCSRF` middleware (Custom Header + Origin Check) and eventually uninstall `csurf`.
