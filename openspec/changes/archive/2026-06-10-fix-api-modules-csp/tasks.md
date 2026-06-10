# Tasks: fix-api-modules-csp

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~10 (3 files, ~8 logic + ~2 config) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR — all 3 changes are independent and tiny |
| Delivery strategy | single-pr |
| Chain strategy | pending |

```
Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low
```

## Phase 1: Baseline Verification

- [x] 1.1 Run `npm run test:run` to confirm all existing tests pass BEFORE any changes
- [x] 1.2 Run `npm run build` to confirm production build succeeds as baseline
- [x] 1.3 Capture current `git diff` and `git status` to ensure clean working tree

## Phase 2: Convert api/auth/reset-password.js to CJS

- [x] 2.1 Replace `import bcrypt from 'bcryptjs'` → `const bcrypt = require('bcryptjs')`
- [x] 2.2 Replace `import { createClient } from '@supabase/supabase-js'` → `const { createClient } = require('@supabase/supabase-js')`
- [x] 2.3 Replace all local imports: drop `.js` extension, change to `require()` (5 imports: logger, rateLimiter/blacklistMiddleware, corsMiddleware, sendEmail/getPasswordResetEmail)
- [x] 2.4 Replace `export default async function handler` → `module.exports = async function handler`
- [x] 2.5 Verify file contains no `import` or `export default` statements (grep)

## Phase 3: Remove "type": "module" from package.json

- [x] 3.1 Delete line `  "type": "module",` from `package.json` (line 5)
- [x] 3.2 Verify `package.json` has no `"type"` field — expected: starts at `"pnpm":` after `"version"`

## Phase 4: Harden CSP script-src in vercel.json

- [x] 4.1 Remove `'unsafe-inline'` from CSP `script-src` directive
- [x] 4.2 Remove `'unsafe-eval'` from CSP `script-src` directive
- [x] 4.3 Verify remaining `script-src` values: `'self' https://vercel.live https://*.vercel.app https://va.vercel-scripts.com`
- [x] 4.4 Verify all non-`script-src` directives are untouched (default-src, style-src, font-src, img-src, connect-src, frame-ancestors, base-uri, form-action)

## Phase 5: Final Verification

- [x] 5.1 Run `npm run test:run` — all existing tests MUST pass
- [x] 5.2 Run `npm run build` — production build MUST succeed
- [x] 5.3 Run `npm run dev` and confirm Vite dev server starts on port 5173
- [x] 5.4 Run `node -c api/auth/reset-password.js` to verify Node.js parses the file without SyntaxError
- [x] 5.5 Run `npm run lint` — no new lint errors from changes
