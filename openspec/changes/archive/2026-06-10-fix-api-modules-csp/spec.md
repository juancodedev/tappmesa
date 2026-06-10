# Spec: fix-api-modules-csp

## Domain

Infrastructure — deployment config, module system compatibility, security headers.

## Overview

Three independent configuration/code changes with no behavioral impact on capabilities:

1. **Remove `"type": "module"` from `package.json`** — restores default CJS resolution for serverless API routes
2. **Convert `api/auth/reset-password.js` from ESM to CJS** — matches the other 4 auth routes (`signin`, `signup`, `session`, `signout`) and all shared middleware/services
3. **Harden CSP `script-src` in `vercel.json`** — removes `'unsafe-inline'` and `'unsafe-eval'` while preserving external script domains

No new capabilities added. API behavior and frontend behavior remain identical.

---

## Requirements

### R1: CJS default module resolution

The `package.json` MUST NOT contain `"type": "module"`. Default CommonJS resolution MUST be active for all `.js` files, allowing `require()` and `module.exports` to work natively without file extension hacks.

#### Scenario: Build succeeds
- GIVEN `package.json` has no `"type"` field (or `"type": "commonjs"`)
- WHEN `pnpm build` is executed
- THEN Vite MUST complete the production build successfully

#### Scenario: Dev server starts
- GIVEN `package.json` has no `"type": "module"`
- WHEN `pnpm dev` is executed
- THEN the Vite dev server MUST start on port 5173 without module errors

#### Scenario: Test suite passes
- GIVEN `package.json` has no `"type": "module"`
- WHEN `pnpm test:run` is executed
- THEN all Vitest tests MUST pass

---

### R2: reset-password.js uses CommonJS

The file `api/auth/reset-password.js` MUST use `require()`/`module.exports`, matching the CJS convention of the other 4 auth routes and all shared middleware.

| Current (ESM) | Target (CJS) |
|---|---|
| `import bcrypt from 'bcryptjs'` | `const bcrypt = require('bcryptjs')` |
| `import { createClient } from '@supabase/supabase-js'` | `const { createClient } = require('@supabase/supabase-js')` |
| `import logger from '../utils/logger.js'` | `const logger = require('../utils/logger')` |
| `import { rateLimiter, blacklistMiddleware } from '../middleware/rateLimit.js'` | `const { rateLimiter, blacklistMiddleware } = require('../middleware/rateLimit')` |
| `import { corsMiddleware } from '../middleware/cors.js'` | `const { corsMiddleware } = require('../middleware/cors')` |
| `import { sendEmail, getPasswordResetEmail } from '../services/emailService.js'` | `const { sendEmail, getPasswordResetEmail } = require('../services/emailService')` |
| `export default async function handler` | `module.exports = async function handler` |

#### Scenario: File syntax is valid CJS
- GIVEN the converted `api/auth/reset-password.js`
- WHEN parsed by Node.js
- THEN it MUST NOT throw any `SyntaxError` for import/export statements
- AND all `require()` calls MUST resolve to their respective modules

#### Scenario: Runtime without SyntaxError
- GIVEN a Vercel deployment with the converted file
- WHEN a request is sent to `/api/auth/reset-password`
- THEN the handler MUST execute without throwing `SyntaxError: Cannot use import statement outside a module`

#### Scenario: All three sub-handlers execute
- GIVEN the converted file
- WHEN a POST to `/request`, `/confirm`, or base POST is received
- THEN the corresponding handler (`handleResetRequest`, `handleResetConfirm`, `handleResetPassword`) MUST execute correctly

---

### R3: CSP script-src hardened

The `Content-Security-Policy` header in `vercel.json` MUST NOT include `'unsafe-inline'` or `'unsafe-eval'` in the `script-src` directive. All other directives and external script domains SHALL remain unchanged.

#### Scenario: unsafe directives removed
- GIVEN the modified CSP header
- WHEN the `script-src` directive is inspected
- THEN it MUST NOT contain `'unsafe-inline'`
- AND it MUST NOT contain `'unsafe-eval'`

#### Scenario: External domains preserved
- GIVEN the modified CSP header
- WHEN the `script-src` directive is inspected
- THEN it MUST still include `https://vercel.live`, `https://*.vercel.app`, and `https://va.vercel-scripts.com`

#### Scenario: No CSP violations in browser
- GIVEN a production build deployed to Vercel
- WHEN a modern browser loads the frontend
- THEN the DevTools Console MUST show 0 `script-src` CSP errors or warnings

#### Scenario: Other CSP directives identical
- GIVEN the modified `vercel.json`
- WHEN compared with the original
- THEN `default-src`, `style-src`, `font-src`, `img-src`, `connect-src`, `frame-ancestors`, `base-uri`, and `form-action` MUST be identical to the pre-change version

---

### R4: All 5 auth routes respond correctly

All auth API routes MUST respond correctly after applying the three changes.

#### Scenario: All endpoints functional
- GIVEN a Vercel preview deployment with all changes
- WHEN each of the 5 auth endpoints (`signin`, `signup`, `session`, `signout`, `reset-password`) receives an HTTP request
- THEN each MUST return an appropriate HTTP status (200, 400, 401, or 405) depending on the request
- AND none MUST return 500 due to module resolution failure

---

### R5: VITE_API_BASE_URL compatibility

The changes MUST NOT break API calls when `VITE_API_BASE_URL` is configured.

#### Scenario: Custom API origin works
- GIVEN `VITE_API_BASE_URL` is set to an alternative origin
- WHEN the frontend makes authenticated API fetch calls
- THEN requests MUST reach the configured origin
- AND responses MUST be handled without errors

---

## Edge Cases

| Case | Risk | Mitigation |
|---|---|---|
| `VITE_API_BASE_URL` is set | None — module/CSP changes don't affect runtime URL resolution | N/A — `import.meta.env` is Vite-only, unchanged |
| Inline scripts in the codebase | Low — Vite production build emits no inline scripts; `@vercel/analytics` loads via `<script src>` (external) | Verify with browser DevTools before prod deployment |
| ESM-only packages imported by reset-password | None — `bcryptjs`, `@supabase/supabase-js`, logger, middleware, emailService are all CJS-compatible | Confirmed by existing `require()` usage across all other routes |
| `"type": "module"` removal breaks Vite/plugins | None — Vite 8 resolves its own module graph; `@vitejs/plugin-react`, `@tailwindcss/vite`, `@sentry/vite-plugin` all handle their own ESM resolution | Confirmed by Vite architecture — `type` field is irrelevant for Vite's bundled output |
| CSP `'unsafe-eval'` removal breaks React or libraries | Low — React production mode doesn't use `eval()`; Radix UI, lucide-react use functional patterns | Verify with browser DevTools; consider `Report-Only` rollout if needed |
| CSP `'unsafe-inline'` removal breaks Vite dev server | None — `vercel.json` CSP only applies to production Vercel deployment; dev server uses localhost without CSP headers | Not affected |

---

## Success Criteria

- [ ] `pnpm build` succeeds with no errors
- [ ] `pnpm dev` starts and frontend loads without console errors
- [ ] `pnpm test:run` passes all tests
- [ ] `api/auth/reset-password.js` contains no `import` or `export default` statements
- [ ] Node.js can parse `api/auth/reset-password.js` without `SyntaxError`
- [ ] `vercel.json` `script-src` contains neither `'unsafe-inline'` nor `'unsafe-eval'`
- [ ] `vercel.json` `script-src` preserves `https://vercel.live`, `https://*.vercel.app`, `https://va.vercel-scripts.com`
- [ ] All other CSP directives in `vercel.json` are unchanged from original
- [ ] 0 CSP `script-src` violations appear in browser DevTools Console on Vercel deployment
- [ ] All 5 auth API routes respond with expected HTTP status codes in Vercel preview
