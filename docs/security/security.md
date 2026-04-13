# Security Overview - Lucy's Class

## 🔍 System Overview
The **Lucy's Class** application implements a "defense-in-depth" strategy, utilizing multiple layers of security at the network, application, and database levels. The system is designed to handle sensitive student data and administrative functions with high integrity and availability.

---

## 🎭 1. Threat Model (Simplified)

### Attacker Types
-   **Unauthenticated Bots**: Attempting brute-force login or spamming registration forms.
-   **Unauthorized Users**: Attempting to bypass the admin dashboard login.
-   **Malicious Insiders**: (Hypothetically) Attempting to download or tamper with backup data.
-   **Session Hijackers**: Attempting to reuse stolen tokens/cookies from a legitimate admin session.

### Key Attack Surfaces
-   **Admin API**: Endpoints for student, teacher, and timetable management.
-   **Auth Routes**: Login, Refresh, and Forgot Password endpoints.
-   **Backup Pipeline**: Transmission of data between the server and Google Drive.
-   **Public Forms**: Student registration, feedback, and course browsing.

---

## 🛡️ 2. Trust Boundaries

-   **Frontend (Untrusted)**: Resides on the user's browser. All data coming from the frontend is considered untrusted and must be validated.
-   **Backend (Trusted)**: The Node.js application server. This is where business logic, authentication, and authorization are enforced.
-   **Database (Restricted)**: MongoDB Atlas. Accessed only via the Backend using secure URI credentials. No direct public access allowed.
-   **External Services (Semi-Trusted)**:
    -   **Google Drive API**: Trust is established via OAuth2 tokens; data is encrypted locally before transmission.
    -   **Cloudinary**: Used for image storage; requests are signed and validated.

---

## 🔐 3. Authentication & Authorization

### JWT Handling & Session Logic
-   **Access Token**: 
    -   Type: JWT (HS256)
    -   Lifetime: **15 minutes**
    -   Storage: **In-Memory** (Client-side) to mitigate XSS theft.
-   **Refresh Token**: 
    -   Type: JWT (HS256)
    -   Lifetime: **7 days**
    -   Storage: **HttpOnly, Secure, SameSite=None** Cookie.
    -   **Rotation**: A new refresh token is issued on every refresh request; the old one is invalidated to prevent replay attacks.
-   **Single-Session Enforcement**: 
    -   Each admin login generates a unique `sessionId` stored in a session cookie and the database (`activeSessionId`).
    -   If a new login occurs on a different device, the previous `sessionId` becomes invalid, immediately forcing the older session to log out (detected via 10s polling or next API call).

### Role-Based Access Control (RBAC)
-   The system enforces an `admin` role for all management routes via the `auth` and `authorizeRoles('admin')` middlewares.

---

## 📦 4. Data Protection

### Encryption Standards
-   **Backup Encryption**: Uses **AES-256-GCM** (Authenticated Encryption). Every database backup is encrypted locally using a 32-byte hex key before being compressed or uploaded.
-   **Password Security**: Hashed using **Bcrypt** with a secure salt factor.
-   **Sensitive Data**: Emails and personal details are handled solely within the trusted backend environment.

### Sensitive Data Handling
-   Audit logs are maintained for all critical administrative actions (e.g., automated backups, manual restores).

---

## 🚀 5. API Security

### CSRF Protection (Two-Layered)
1.  **Custom Header Check**: All non-GET requests require an `X-Requested-With` header (automatically added by Axios), which is difficult for multi-origin malicious sites to forge.
2.  **Standard CSRF**: Utilizes the `csurf` library for stateful CSRF token validation on sensitive data-changing operations.
3.  **Origin Validation**: Strict checking of the `Origin` header against a whitelist of allowed domains defined in `CORS_ORIGINS`.

### Rate Limiting (Production Thresholds)
-   **Global API**: 200 requests per 5 minutes.
-   **Login**: **5 failed attempts per 10 minutes** (account locking after 5 failures).
-   **Registration**: 5 attempts per 1 hour.
-   **Forgot Password**: 3 attempts per 1 hour.
-   **Reset Password**: 5 attempts per 30 minutes.

### Input Validation & Error Handling
-   **Validation**: Every endpoint uses `express-validator` to enforce strict schemas on all `req.body` and `req.params`.
-   **Error Masking**: Production errors are sanitized; stack traces are never returned to the client to prevent environmental leakage.

---

## 📂 6. Backup & Restore Security

### Secure Pipeline
-   **Zero-Knowledge Upload**: Backups are encrypted at rest on the server before being transmitted to Google Drive via HTTPS.
-   **Drive Safety**: The system maintains only the last **20 backups** using an automated rotation policy in `drive.service.js`.

### Safe Restoration
-   **Validation Run**: The `restore.service.js` performs a "dry-run" by restoring data into a **temporary database** first to ensure the backup isn't corrupted.
-   **Safety Snapshot**: A local safety backup is taken immediately before the production database is cleared (`--drop`).
-   **Cleanup**: Temporary decrypted ZIP files and extraction folders are immediately wiped from disk upon completion or failure.

---

## 💻 7. Frontend Security

-   **Token Storage**: Tokens are kept in JavaScript memory, never in `localStorage`, significantly reducing the risk of token theft via XSS.
-   **Axios Interceptors**: Automated handling of CSRF token fetching and refresh token calls.
-   **reCAPTCHA v2**: Integrated into **Login** and **Forgot Password** forms to prevent automated brute-force attacks.

---

## 🚩 8. Potential Risks & Improvements

-   **Risk**: Centralized encryption key in `.env` could be a single point of failure if the server environment is compromised.
    -   *Improvement*: Integrate with a dedicated Secrets Management service (e.g., AWS Secrets Manager or HashiCorp Vault) for enterprise-grade key rotation.
-   **Risk**: Google Drive storage relies on a single service account.
    -   *Improvement*: Implement secondary offsite backup storage (e.g., AWS S3 with Object Lock) for enhanced disaster recovery.
-   **Improvement**: Implement IP-based anomaly detection to block distributed brute-force attacks that stay under the per-IP rate limit.

---

# Advanced Security Audit

## 1. Identified Vulnerabilities

### 1.1 Destructive Database Restore (Critical)
The `restore.service.js` utilizes the `mongorestore --drop` flag. While this is necessary for a full restoration, it presents a significant risk if misused or abused by a compromised account.
- **Location**: `backend/services/restore.service.js`
- **Logic**: The service drops all existing production collections (except `admins`) before replacing them with backup data.

### 1.2 Stored XSS in Administrative Dashboards (High)
User-provided data from public registration forms (e.g., `parentName`, `childName`, `message`) is stored in the database without backend-level HTML sanitization and later rendered in the Admin dashboard.
- **Location**: `backend/middlewares/validateRegistration.js` (missing sanitization) & `frontend/src/pages/RegistrationManagement.jsx` (rendering context).
- **Risk**: A malicious user can inject scripts that execute in the context of an authenticated admin session.

### 1.3 Rate Limiting Gap: Refresh Token Endpoint (Medium)
While sensitive routes like `/login` and `/forgot-password` are strictly limited, the `/api/auth/refresh-token` endpoint lacks an explicit rate limiter in the current route configuration.
- **Location**: `backend/routes/authRoutes.js`
- **Risk**: An attacker with a stolen refresh token could spam the endpoint to keep a session alive indefinitely or perform denial-of-service on the database.

### 1.4 Inconsistent CSRF Whitelisting (Low)
There is a slight architectural discrepancy where `securityMiddleware.js` whitelists certain paths that `csrf.js` (the `csurf` wrapper) still protects. 
- **Location**: `backend/middlewares/securityMiddleware.js` vs `backend/middlewares/csrf.js`.
- **Logic**: While redundant, the Origin check being skipped for whitelisted paths reduces the depth of defense for those specific endpoints.

---

## 2. Attack Scenarios (Simulations)

### Attack: Database Wipe via Malicious Restore
*   **Step 1**: Attacker gains access to an Admin account (e.g., via phishing or session theft).
*   **Step 2**: Attacker uploads a specially crafted "empty" or malicious `.enc` backup file to the restore directory (or exploits the `performRestore` logic).
*   **Step 3**: Attacker triggers the Restore operation.
*   **Step 4**: The system drops all production collections and fails to populate them with valid data.
*   **Preconditions**: Admin credentials + valid encryption key + access to the restore API.
*   **Impact (Critical)**: Immediate loss of all current student registrations, courses, and teacher data.
*   **Detection**: Monitor audit logs for manual restore events at anomalous times or a spike in `AUTO_BACKUP_FAILED` system events.

### Attack: Admin Session Takeover via Stored XSS
*   **Step 1**: Attacker submits a public registration form with a malicious payload in the `message` field: `<script>fetch('/api/auth/me').then(r=>r.json()).then(d=>sendToAttacker(d))</script>`.
*   **Step 2**: An Admin logs in and opens the "Registration Management" dashboard to view new sign-ups.
*   **Step 3**: The payload executes in the Admin's browser, sending their profile info or performing actions on their behalf.
*   **Preconditions**: Public access to registration forms; an Admin viewing the malicious entry.
*   **Impact (High)**: Full take-over of the Admin session, bypass of MFA/reCAPTCHA, and access to internal management tools.
*   **Detection**: Audit logs showing admin actions (e.g., deleting registrations) that the admin does not recognize.

### Attack: Refresh Token persistence abuse
*   **Step 1**: Attacker steals the `refreshToken` cookie from a compromised workstation.
*   **Step 2**: Attacker uses a script to spam the `/refresh-token` endpoint before the original user notices or the session expires.
*   **Step 3**: Attacker maintains an active Access Token indefinitely without needing the original user's password.
*   **Preconditions**: Access to a stolen HttpOnly cookie (e.g., via malware on the user's OS).
*   **Impact (Medium)**: Persistent unauthorized access to the management dashboard.
*   **Detection**: Monitoring the `/refresh-token` endpoint for a high volume of requests or a spike in 401/403 errors from a single IP.

---

## 3. Severity Assessment

| Vulnerability | Severity | Justification |
| :--- | :--- | :--- |
| **Destructive Restore** | **Critical** | Leads to total data loss. Recovery depends on external Google Drive backups which may also be compromised. |
| **Stored XSS** | **High** | Directly target administrative sessions, bypassing standard authentication perimeters. |
| **Rate Limit Gap** | **Medium** | Increases the effectiveness of automated session persistence attacks. |
| **CSRF Inconsistency** | **Low** | While it reduces defense-in-depth, standard protection is still largely enforced by `csurf`. |

---

## 4. Recommended Fixes

1.  **Harden Restore Pipeline**:
    -   Implement "Two-Person Integrity" (4-eyes principle) requiring two administrators to approve a destructive restore.
    -   Add a mandatory "Final Confirmation" step displaying exactly which collections will be dropped.
2.  **Implement Backend Sanitization**:
    -   Use a library like `dompurify` (backend side) or `sanitize-html` in the registration validator to strip all HTML tags from user-provided strings before saving to MongoDB.
3.  **Close Rate Limiting Gaps**:
    -   Apply a dedicated `refreshLimiter` (e.g., 20 requests per hour per IP) to the `/api/auth/refresh-token` endpoint.
4.  **Enlist Audit Trails**:
    -   Increase the granularity of the `AuditLog` for session-related events, specifically tracking session conflict triggers and refresh token rotation failures.
---

## Stored XSS Mitigation (Resolved)

### Overview
Previously, the system was vulnerable to Stored XSS due to unsanitized user input from public forms (registration, feedback). Malicious scripts could be stored in MongoDB and executed in the admin dashboard.

### Root Cause
* User input was stored without sanitization
* Rendering in admin dashboard trusted stored data

### Fix Implemented
* Introduced a centralized sanitization utility: `utils/sanitize.js`
* Used `sanitize-html` with strict configuration:
  * No allowed HTML tags
  * No allowed attributes
* Applied sanitization to all public input fields:
  * `parentName`, `childName`, `message`, feedback text
* Ensured sanitization runs BEFORE saving to database
* Added type safety handling for `null`, `undefined`, and non-string inputs

### Verification
Manual browser testing confirmed mitigation:
* Payload tested: `<script>alert('XSS')</script>`
* Result:
  * No JavaScript execution
  * Data stored as plain text or encoded
  * Admin dashboard renders content safely

Additional payload: `<img src=x onerror=alert('XSS')>`
* Result:
  * No execution

### Security Impact
* Eliminates Stored XSS attack vector from public forms
* Protects admin session from script injection
* Significantly reduces attack surface

### Residual Risk
* Admin-controlled inputs are not fully sanitized (low risk)
* No HTML rendering is allowed (intentional design choice)

### Status
✅ RESOLVED
