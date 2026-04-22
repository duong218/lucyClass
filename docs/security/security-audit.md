# Security Audit Report

Scope: `lucyClass-main` (backend + frontend).  
Constraints honored: did **not** read `.env` / production env files; only reviewed `.env.example`.

## 1. Overall Score

**C** — Core auth + rate limiting + basic CSRF checks exist, but there are **high-impact secret/credential leaks to logs** in admin backup/restore + OAuth flows, and one misconfiguration-prone CSRF allowlist mismatch that can cause unexpected CSRF bypass/blocks depending on env setup.

## 2. Critical Issues (High)

### High-1: OAuth callback URL (auth code/state) is logged verbatim

- **File path**: `backend/routes/googleRoutes.js`
- **Code snippet**:

```js
router.use((req, res, next) => {
  console.log("Incoming request:", req.originalUrl);
  next();
});
```

- **Why dangerous (real scenario)**:
  - Google OAuth callback hits `GET /api/auth/google/callback?code=...&state=...`.
  - This middleware logs `req.originalUrl`, which includes **the authorization `code` and `state`**.
  - In many deployments, application logs are shipped to third-party log aggregators, shared with support staff, or exposed via misconfigured log viewers. Anyone with access to logs can replay the OAuth code **within its short validity window** to obtain tokens, gaining **Google Drive access** for backups (data exfiltration / destructive restore).

- **Fix (clear, code-level)**:
  - Remove this global route logger, or sanitize query strings before logging.
  - Example safe fix (minimal behavioral change):

```js
router.use((req, res, next) => {
  const urlPath = (req.originalUrl || '').split('?')[0];
  console.log('Incoming request:', urlPath);
  next();
});
```

  - Better: log via `systemLogger` and include only route + request id (no query).

---

### High-2: Restore process logs `mongorestore` args including `--uri=...` (credential leak)

- **File path**: `backend/services/restore.service.js`
- **Code snippet**:

```js
const runMongorestore = async (args, label) => {
  console.log(`[RESTORE] ${label}: mongorestore ${args.join(' ')}`);
  // ...
};
```

- **Why dangerous (real scenario)**:
  - `args` contains ``--uri=${MONGO_URI}``.
  - Mongo URIs commonly embed credentials, e.g. `mongodb+srv://user:pass@host/db?...`.
  - This line prints the full URI into logs. A developer/contractor with log access (or leaked logs) can immediately use the URI to **connect to production DB**, dump data (PII), or modify records. This is a full compromise, not just an “info leak”.

- **Fix (clear, code-level)**:
  - Never log raw command args that include secrets. Redact `--uri` before logging.
  - Example fix:

```js
const redactMongoUriArg = (arg) => {
  if (!arg.startsWith('--uri=')) return arg;
  return '--uri=[REDACTED]';
};

const runMongorestore = async (args, label) => {
  const safeArgs = args.map(redactMongoUriArg);
  console.log(`[RESTORE] ${label}: mongorestore ${safeArgs.join(' ')}`);
  // ...
};
```

  - Also consider removing the entire command echo in production and logging only the milestone/phase.

## 3. Medium Issues

### Med-1: CSRF origin allowlist source differs between CORS and CSRF middleware (misconfig → broken protection / availability risk)

- **File path**: `backend/middlewares/securityMiddleware.js`
- **Code snippet**:

```js
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(o => o.trim().replace(/\/$/, ''));
```

- **Why dangerous (real scenario)**:
  - `backend/server.js` builds CORS allowlist from `CORS_ORIGINS || CLIENT_URL || FRONTEND_URL || fallback`.
  - `verifyCSRF` uses **only** `CORS_ORIGINS`.
  - If deployment sets `FRONTEND_URL` (or `CLIENT_URL`) but forgets `CORS_ORIGINS`, CORS may allow the frontend while CSRF blocks it (or vice versa if someone “fixes” it incorrectly).
  - Operationally, teams often “fix” broken CSRF by weakening checks (e.g., allowing all origins), which becomes a real security regression.

- **Fix (clear, code-level)**:
  - Use the same origin parsing + fallback logic in both places.
  - Example: extract `parseOrigins()` from `server.js` into a shared helper and use it in `verifyCSRF`:

```js
// e.g. backend/utils/origins.js
exports.parseOrigins = (envVar) =>
  (envVar || '')
    .split(',')
    .map(o => o.trim().replace(/\/$/, ''))
    .filter(Boolean);

// securityMiddleware.js
const { parseOrigins } = require('../utils/origins');
const allowedOrigins = parseOrigins(
  process.env.CORS_ORIGINS || process.env.CLIENT_URL || process.env.FRONTEND_URL
);
```

---

### Med-2: Backup script shells out with an env-derived URI (command injection risk if env can be influenced)

- **File path**: `backend/scripts/backup.js`
- **Code snippet**:

```js
const command = `mongodump --uri="${uri}" --out="${path.join(BACKUP_DIR, fileName)}" --gzip`;
exec(command, (error, stdout, stderr) => {
  // ...
});
```

- **Why dangerous (real scenario)**:
  - This script is not a public API endpoint, but it is commonly run in CI/CD or ops contexts.
  - If an attacker can influence environment variables (compromised CI secrets, poisoned `.env` in a container image, or a low-privilege user on a shared host), they can inject shell metacharacters into `MONGO_URI` and execute arbitrary commands as the service user.

- **Fix (clear, code-level)**:
  - Use `spawn` with an args array (as you already do in `backend/services/backup.service.js`), never `exec` with string interpolation:

```js
const { spawn } = require('child_process');
const args = [`--uri=${uri}`, `--out=${path.join(BACKUP_DIR, fileName)}`, '--gzip'];
const proc = spawn('mongodump', args, { stdio: 'inherit' });
proc.on('close', (code) => process.exit(code));
```

## 4. Top 5 Fixes (priority order)

1. **Stop logging OAuth callback URLs** in `backend/routes/googleRoutes.js` (remove middleware or strip query).
2. **Redact `--uri` when logging restore commands** in `backend/services/restore.service.js` (or remove command echo entirely).
3. **Unify CSRF origin allowlist derivation** with the CORS configuration to avoid “fix-by-disabling” incidents (`backend/middlewares/securityMiddleware.js`).
4. **Replace `exec()` with `spawn()`** in `backend/scripts/backup.js` to eliminate shell injection risk in ops workflows.
5. **Audit remaining logs for secrets/PII** (search for printing request URLs, headers, tokens, and connection strings) and enforce a shared redaction helper (e.g. `redactSecrets()` used by `systemLogger`).

