# 🛡️ Security Audit Report — Lucy's Class

**Date:** 2026-04-23  
**Scope:** Full-stack (backend + frontend) — all routes, middleware, controllers, models, services  
**Constraint:** Only `.env.example` was read. No real secrets accessed.  
**Auditor context:** System design rules (streak helping, teacher course-scoping, admin-only rankings, MKT approval flow) respected.

---

## 1. Overall Security Score

### Grade: B+

| Category | Score | Notes |
|----------|-------|-------|
| Authentication | A | JWT HS256, session conflict, account lock, refresh rotation |
| Authorization (RBAC) | A- | All admin routes gated; teacher course-scoping via `checkCourseAccess` |
| CSRF Protection | B+ | Origin + custom header; one path-matching weakness |
| Input Validation | A | mongo-sanitize, xss-clean, sanitize-html, express-validator |
| Data Leakage | B | Ranking API safe; streak endpoints expose PII without auth |
| Rate Limiting | A | 9 dedicated limiters + phone/IP abuse guards |
| Caching | A- | Proper invalidation on mutations; all cached routes are public-only |
| File Upload | A | Magic number validation, MIME check, 5MB limit, memory storage |
| Error Handling | B+ | No stack traces returned; minor message leakage risk |
| Dependencies | B | One unmaintained package; one unused duplicate |

**Previous audit (grade C) listed 3 critical vulns (VULN-1/2/3). All three are now FALSE POSITIVES** — `checkCourseAccess()` was added to all teacher-scoped endpoints, and ranking creation is admin-only.

---

## 2. Critical Vulnerabilities (P0)

### ✅ None Found

All previously reported critical vulnerabilities have been resolved:

| Previous Finding | Current Status | Evidence |
|-----------------|---------------|----------|
| VULN-1: Teacher reads any course's students | **FIXED** | `getStudentsByCourse` calls `checkCourseAccess(id, req)` → returns 403 if teacher not assigned |
| VULN-2: Teacher writes attendance for any course | **FIXED** | `saveAttendance` calls `checkCourseAccess(id, req)` → blocks unauthorized teachers |
| VULN-3: Teacher creates rankings for any student | **FIXED** | `rankingRoutes.js` POST uses `authorizeRoles('admin')` — teachers cannot access this endpoint at all |

---

## 3. Medium Issues (P1)

### P1-1: Streak `getStreak` Exposes Email Without Authentication

**File:** `controllers/streakController.js` → `getStreak` (line 167)  
**Route:** `GET /api/streak/me?phone=0912345678` — no auth required  
**Risk:** Information disclosure

```
GET /api/streak/me?phone=0912345678
→ { phone, name, email, streakCount, lastCheckin, reviveUsed }
```

Anyone who knows (or guesses) a phone number can discover the associated email. The `streakLimiter` (5 req/min) slows enumeration but doesn't prevent targeted lookups.

**Recommended fix:**
```js
// Option A: Remove email from public response
const formatUser = (user) => ({
  phone: user.phone,
  name: user.name,
  // email removed from public response
  streakCount: user.streakCount || 0,
  lastCheckin: user.lastCheckin || null,
  reviveUsed: user.reviveUsed || false
});

// Option B: Require streakAuth token for getStreak
router.get('/me', streakLimiter, streakAuth, controller.getStreak);
```

---

### P1-2: Announcement `mark-seen` Resets Global State for All Users

**File:** `controllers/announcementController.js` → `markSeen` (line 61)  
**Route:** `PATCH /api/announcements/mark-seen` — requires `auth` only, no role check  
**Risk:** Business logic — any teacher/marketing staff can reset the admin's notification badge

```js
// Current: ANY authenticated user marks ALL announcements as seen
await Announcement.updateMany({ isUnread: true }, { $set: { isUnread: false } });
```

A teacher opening the bell dropdown clears the unread count for the admin too.

**Recommended fix:**
```js
// Option A: Restrict to admin only
router.patch('/mark-seen', auth, isAdmin, catchAsync(announcementController.markSeen));

// Option B: Per-user read tracking (requires schema change)
// Add a `seenBy: [ObjectId]` array to Announcement schema
```

---

### P1-3: CSRF Whitelist Path Matching Is Too Loose

**File:** `middlewares/securityMiddleware.js` (line 27)

```js
const isWhitelisted = WHITELIST_PATHS.some(path => url === path || url.endsWith(path));
```

`url.endsWith('/api/registrations')` would also match `/api/evil/api/registrations`, allowing an attacker to craft a URL that bypasses CSRF on a different endpoint sharing the same suffix.

**Recommended fix:**
```js
// Use exact match only (already partially done with url === path)
const isWhitelisted = WHITELIST_PATHS.some(path => url === path);
```

---

### P1-4: Refresh Token Verification Missing Algorithm Restriction

**File:** `controllers/authController.js` (line 189)

```js
// Current: no algorithm restriction
const decoded = jwt.verify(token, refreshTokenSecret);

// Compare with auth.js line 31 which correctly restricts:
const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
```

Without `{ algorithms: ['HS256'] }`, the token could theoretically be crafted with `alg: none` on vulnerable JWT library versions. While `jsonwebtoken@9.x` mitigates this, defense-in-depth requires explicit algorithm restriction.

**Recommended fix:**
```js
const decoded = jwt.verify(token, refreshTokenSecret, { algorithms: ['HS256'] });
```
Apply same fix to `logout` (line 248).

---

### P1-5: `xss-clean` Dependency Is Unmaintained

**File:** `package.json` — `"xss-clean": "^0.1.4"`

This package hasn't been updated since 2018. Known bypass vectors exist. The primary defense (`sanitize-html` via `cleanInput()`) is solid, but `xss-clean` gives a false sense of security as middleware.

**Recommended fix:** Either remove `xss-clean` (since `sanitize-html` handles it) or replace with a maintained alternative. The `cleanInput()` function in `utils/sanitize.js` is the real XSS defense and is correctly applied across all controllers.

---

## 4. Low Issues / Improvements (P2)

### P2-1: Both `bcrypt` and `bcryptjs` in Dependencies
`package.json` lists both `bcrypt@6.0.0` and `bcryptjs@2.4.3`. Only `bcryptjs` is imported anywhere. Remove unused `bcrypt` to reduce attack surface and build complexity.

### P2-2: Body Parsing Limit Is 10MB
`express.json({ limit: '10mb' })` is generous for an API that primarily handles JSON forms. Consider reducing to `1mb` or `2mb` for JSON endpoints (file uploads use multer with separate 5MB limit).

### P2-3: In-Memory Rate Limiters Reset on Restart
`phoneLimiter.js` uses in-memory Maps. Server restarts clear all state. For production at scale, consider backing with Redis (the `rate-limit-redis` package is already in `package.json` but not used for phone limiters).

### P2-4: CORS Fallback Includes Hardcoded Origins
`server.js` line 93: fallback `'http://localhost:5173,https://lucy-class.vercel.app'` if env vars are missing. This works but should be made explicit via required env vars only.

### P2-5: Error Handler May Leak Implementation Details
`errorHandler.js` returns `err.message` for all errors. Some database/validation errors may contain schema field names or query details. Consider using generic messages for 500 errors.

### P2-6: `startStreak` Increments DeviceUsage Before Phone Validation
In `streakController.js`, the device usage counter is incremented (lines 96-105) before phone validation (line 107). An attacker sending requests with valid `deviceId` but invalid phone can exhaust the device limit without creating any streak.

---

## 5. Data Leakage Analysis

### Ranking System — ✅ SAFE

| Check | Status | Evidence |
|-------|--------|----------|
| Public API returns only safe fields | ✅ | `getTopRankings` maps to `{ childName, stars, courseName, title, skill }` only |
| No phone/email/parentName in response | ✅ | These fields don't exist in the Ranking model at all |
| Ranking model has `strict: true` | ✅ | Prevents extra fields from being stored |
| Creation is admin-only | ✅ | `authorizeRoles('admin')` on POST route |
| studentId (ObjectId) not exposed publicly | ✅ | `safeData` mapping strips it from response |

### Streak System — ⚠️ PARTIAL EXPOSURE

| Endpoint | Auth Required | Fields Exposed | Risk |
|----------|--------------|----------------|------|
| `GET /me?phone=X` | No | phone, name, email, streakCount | Email disclosure for known phones |
| `POST /start` | No | phone, name, email, streakCount | Returns PII after registration |
| `GET /leaderboard` | No | name, streakCount | ✅ Safe — `.select('name streakCount')` |
| `GET /leaderboard-weekly` | No | name, streakCount | ✅ Safe |

### Public Course/Teacher Endpoints — ✅ SAFE
No student PII exposed. Only course metadata and teacher profiles (name, specialization, experience, avatar).

### Staff Controller — ✅ SAFE
All queries use `.select('-password -refreshTokens -activeSessionId -resetPasswordToken -resetPasswordExpire')`.

### Admin Auth `/me` — ✅ SAFE
Returns only `{ id, username, role, email }`.

---

## 6. Business Logic Risks

### Teacher Course Isolation — ✅ CORRECT

The `checkCourseAccess()` function (`courseController.js` line 67) correctly enforces:
- Admin always has access
- Teacher must be `course.teacher` or in `course.additionalTeachers`
- Uses `req.user.teacherId` populated by `auth.js` middleware via `Teacher.staffAccountId` lookup

Applied consistently across: `getAttendance`, `saveAttendance`, `exportAttendanceExcel`, `getStudentsByCourse`.

### MKT Announcement Flow — ⚠️ NOT IMPLEMENTED

The system design specifies MKT can create/edit announcements pending admin approval. Current implementation:
- All announcement CRUD is admin-only (`isAdmin` middleware)
- No `marketing` role routes exist for announcements
- No `status` or `approvedBy` field in Announcement model

**Impact:** Not a security risk (access is MORE restricted than designed), but a feature gap.

### Streak Helping — ✅ BY DESIGN (with adequate controls)

The streak system intentionally allows anyone with a phone number to check in. Abuse is controlled by:
- `streakLimiter`: 5 req/min per IP (production)
- `phoneSpamLimiter`: 3-second cooldown per phone
- `phoneDiversityLimiter`: 3 different phones per IP per day
- `ipActionLimiter`: 5 phone changes per IP per day
- `DeviceUsage` model: max 5 new phone registrations per device per day

### Admin-Only Actions — ✅ PROTECTED

| Action | Middleware Chain | Status |
|--------|-----------------|--------|
| Manage students (CRUD) | `auth → isAdmin` | ✅ |
| Assign rankings | `auth → authorizeRoles('admin')` | ✅ |
| Transfer students | `auth → isAdmin` | ✅ |
| Remove students | `auth → isAdmin` | ✅ |
| Manage staff accounts | `auth → isAdmin` | ✅ |
| Backup/restore | `auth → isAdmin` | ✅ |
| Deep clean/sync | `auth → isAdmin` | ✅ |
| Stats dashboard | `auth → isAdmin` | ✅ |

### Privilege Escalation Vectors — ✅ NONE FOUND
- JWT payload includes `role` from DB lookup (not from client)
- `authorizeRoles` normalizes to lowercase before comparison
- Deactivated staff accounts are rejected at auth middleware level
- Session conflict detection prevents concurrent logins

---

## 7. CSRF & Auth Flow Summary

### CSRF Protection Architecture

```
Client Request (POST/PUT/DELETE/PATCH)
  │
  ├─ 1. server.js global middleware checks req.method
  │     └─ Safe methods (GET/HEAD/OPTIONS) → SKIP
  │
  ├─ 2. verifyCSRF() in securityMiddleware.js
  │     ├─ Development mode → SKIP (expected)
  │     ├─ Whitelisted paths (/api/registrations, /api/register) → SKIP
  │     ├─ Origin header check (strict equality against CORS_ORIGINS) → 403 if mismatch
  │     └─ X-Requested-With header check → 403 if missing
  │
  └─ 3. Frontend api.js sets X-Requested-With: XMLHttpRequest on all requests
```

**Why this works:** Cross-origin form submissions and basic CSRF attacks cannot set custom headers (`X-Requested-With`). Combined with origin validation, this provides strong CSRF protection for a stateless JWT + cross-origin (Vercel↔Render) architecture.

### Auth Flow

```
Login → reCAPTCHA verify → bcrypt compare → JWT access token (15m)
  + refresh token (httpOnly cookie, 7d) + sessionId cookie
  → Single-device enforcement via activeSessionId
  → 5 failed attempts → 2min lock
  
Refresh → Cookie refresh token → Verify → Rotate token → New access token

Logout → Verify refresh token → Remove from DB → Clear cookies
```

**Key strengths:**
- Access token stored in memory only (not localStorage) ✅
- Refresh token in httpOnly cookie with `secure` + `sameSite: none` in production ✅
- Token rotation on refresh (old token removed, new token issued) ✅
- Session conflict detection on both auth middleware and refresh ✅
- Account lock after 5 failed attempts ✅
- 1-second delay on failed login (timing attack mitigation) ✅

---

## 8. Recommended Fixes (Prioritized)

### Priority 1 — Fix This Week

| # | Issue | File | Fix |
|---|-------|------|-----|
| 1 | Add `{ algorithms: ['HS256'] }` to refresh token verify | `authController.js` L189, L248 | One-line change each |
| 2 | Remove email from streak public response | `streakController.js` `formatUser()` | Remove `email` field |
| 3 | Fix CSRF whitelist to exact match only | `securityMiddleware.js` L27 | Change `url.endsWith(path)` to `url === path` |
| 4 | Restrict `mark-seen` to admin | `announcementRoutes.js` L18 | Add `isAdmin` middleware |

### Priority 2 — Fix This Sprint

| # | Issue | File | Fix |
|---|-------|------|-----|
| 5 | Remove unused `bcrypt` from dependencies | `package.json` | `npm uninstall bcrypt` |
| 6 | Remove or replace `xss-clean` | `package.json` + `server.js` | Remove `app.use(xss())` — `sanitize-html` covers XSS |
| 7 | Reorder deviceUsage check after phone validation | `streakController.js` | Move lines 96-105 after line 113 |
| 8 | Reduce JSON body limit | `server.js` L155 | Change `10mb` to `2mb` |

### Priority 3 — Next Cycle

| # | Issue | File | Fix |
|---|-------|------|-----|
| 9 | Move phone limiters to Redis | `phoneLimiter.js` | Use `rate-limit-redis` (already in deps) |
| 10 | Remove hardcoded CORS fallback | `server.js` L93 | Make `CORS_ORIGINS` a required env var |
| 11 | Use generic error messages for 500s | `errorHandler.js` | Return `'Internal Server Error'` for status >= 500 |
| 12 | Implement MKT announcement flow | `announcementRoutes.js` | Add `status` field + marketing role routes |

---

## Appendix: Route Authorization Matrix

| Route | Method | Auth | Role | Rate Limiter | Cache | CSRF |
|-------|--------|------|------|-------------|-------|------|
| `/api/auth/login` | POST | — | — | loginLimiter | — | Global |
| `/api/auth/logout` | POST | auth | any | — | — | Global |
| `/api/auth/refresh-token` | POST | cookie | — | — | — | Global |
| `/api/auth/forgot-password` | POST | — | — | forgotPasswordLimiter | — | Global |
| `/api/auth/reset-password/:token` | POST | — | — | resetPasswordLimiter | — | Global |
| `/api/auth/me` | GET | auth | any | — | — | — |
| `/api/auth/check-session` | GET | auth | any | — | — | — |
| `/api/courses` | GET | — | public | apiLimiter | 300s | — |
| `/api/courses/:id` | GET | — | public | apiLimiter | 300s | — |
| `/api/courses/:id/students` | GET | auth | admin,teacher | apiLimiter | — | — |
| `/api/courses/:id/attendance` | GET | auth | admin,teacher | apiLimiter | — | — |
| `/api/courses/:id/attendance` | POST | auth | admin,teacher | apiLimiter | — | Global |
| `/api/courses/:id/attendance/export-excel` | GET | auth | admin,teacher | apiLimiter | — | — |
| `/api/courses/students/:id/transfer` | PUT | auth | admin | apiLimiter | — | Global |
| `/api/courses` | POST | auth | admin | apiLimiter | — | Global |
| `/api/courses/:id` | PUT | auth | admin | apiLimiter | — | Global |
| `/api/courses/:id` | DELETE | auth | admin | apiLimiter | — | Global |
| `/api/teachers` | GET | — | public | apiLimiter | 300s | — |
| `/api/teachers/:id` | GET | — | public | apiLimiter | 300s | — |
| `/api/teachers` | POST | auth | admin | apiLimiter | — | Global |
| `/api/teachers/:id` | PUT | auth | admin | apiLimiter | — | Global |
| `/api/teachers/:id` | DELETE | auth | admin | apiLimiter | — | Global |
| `/api/registrations` | GET | auth | admin | apiLimiter | — | — |
| `/api/registrations` | POST | — | public | registerLimiter | — | Whitelisted |
| `/api/registrations/export-excel` | POST | auth | admin | apiLimiter | — | Global |
| `/api/registrations/:id` | GET | auth | admin | apiLimiter | — | — |
| `/api/registrations/:id` | PUT | auth | admin | apiLimiter | — | Global |
| `/api/registrations/:id` | DELETE | auth | admin | apiLimiter | — | Global |
| `/api/rankings` | POST | auth | admin | apiLimiter | — | Global |
| `/api/rankings/top` | GET | — | public | apiLimiter | 300s | — |
| `/api/announcements` | GET | — | public | apiLimiter | 60s | — |
| `/api/announcements/latest` | GET | auth | any | apiLimiter | — | — |
| `/api/announcements/mark-seen` | PATCH | auth | any ⚠️ | apiLimiter | — | Global |
| `/api/announcements` | POST | auth | admin | apiLimiter | — | Global |
| `/api/announcements/:id` | PUT | auth | admin | apiLimiter | — | Global |
| `/api/announcements/:id` | DELETE | auth | admin | apiLimiter | — | Global |
| `/api/stats` | GET | auth | admin | apiLimiter | — | — |
| `/api/stats/dashboard` | GET | auth | admin | apiLimiter | — | — |
| `/api/staff` | GET | auth | admin | apiLimiter | — | — |
| `/api/staff/:id` | GET | auth | admin | apiLimiter | — | — |
| `/api/staff` | POST | auth | admin | apiLimiter | — | Global |
| `/api/staff/:id` | PUT | auth | admin | apiLimiter | — | Global |
| `/api/staff/:id/reset-password` | PUT | auth | admin | apiLimiter | — | Global |
| `/api/staff/:id` | DELETE | auth | admin | apiLimiter | — | Global |
| `/api/staff/:id/permanent` | DELETE | auth | admin | apiLimiter | — | Global |
| `/api/me/profile` | GET | auth | teacher,mkt | apiLimiter | — | — |
| `/api/streak/start` | POST | — | public | streakLimiter + phone limiters | — | Global |
| `/api/streak/me` | GET | — | public | streakLimiter | — | — |
| `/api/streak/checkin` | POST | — | public | streakLimiter + phoneSpam | — | Global |
| `/api/streak/revive` | POST | — | public | streakLimiter + phoneSpam | — | Global |
| `/api/streak/leaderboard` | GET | — | public | streakLimiter | — | — |
| `/api/streak/leaderboard-weekly` | GET | — | public | streakLimiter | — | — |
| `/api/sync/rankings` | POST | auth | admin | apiLimiter | — | Global |
| `/api/sync/deep-clean` | POST | auth | admin | apiLimiter | — | Global |
| `/api/restore/progress` | GET | auth | admin | apiLimiter | — | — |
| `/api/submit` | POST | — | public | registerLimiter | — | Global |
| `/api/health` | GET | — | public | — | — | — |

---

*End of audit. No real secrets were accessed. Only `.env.example` was read.*
