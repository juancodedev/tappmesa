# Proposal: fix-api-modules-csp

## Intent

Two issues make the codebase inconsistent and reduce security:

1. **Mixed module systems in API routes**: `api/auth/reset-password.js` uses ESM (`import`/`export default`) while the other 4 auth routes (`signin.js`, `signup.js`, `session.js`, `signout.js`) and all shared middleware (`api/middleware/`, `api/services/`) use CJS (`require()`/`module.exports`). The root `package.json` currently has `"type": "module"`, which makes CJS files technically invalid for Node.js native resolution. In Vercel's serverless environment this inconsistency causes `SyntaxError: Cannot use import statement outside a module` in `reset-password.js` at runtime.

2. **CSP `script-src` includes `'unsafe-inline'` and `'unsafe-eval'`** in `vercel.json`, which disables CSP's main XSS protection. Vite's production build generates static assets with hashed filenames (no inline scripts), and React in production mode doesn't use `eval()`. Neither directive is necessary.

## Scope

### In Scope
- Convert `api/auth/reset-password.js` from ESM to CJS (`require()`/`module.exports`)
- Remove `"type": "module"` from `package.json` (not needed by Vite for frontend bundling; harmful for CJS API routes)
- Remove `'unsafe-inline'` and `'unsafe-eval'` from CSP `script-src` in `vercel.json`
- Verify all 5 API routes deploy and respond correctly
- Verify frontend loads without CSP violations in modern browsers

### Out of Scope
- Converting the other 4 CJS routes + all shared middleware to ESM (deferred — scope is too large)
- Adding nonce/hash-based CSP for any remaining inline scripts
- Refactoring API route behavior or endpoints
- Other security headers or CSP directives beyond `script-src`

## Capabilities

### New Capabilities
None — pure refactor and config change. No new feature or capability added.

### Modified Capabilities
None — no spec-level requirement changes. API behavior and frontend behavior remain identical.

## Approach

1. **Remove `"type": "module"` from `package.json`** — the frontend uses Vite which handles ESM module resolution at build time regardless of the `type` field. The `api/` serverless functions run directly on Node.js and need CJS module resolution. Removing this field restores default CJS behavior for all `.js` files.

2. **Convert `api/auth/reset-password.js` to CJS**:
   - `import bcrypt from 'bcryptjs'` → `const bcrypt = require('bcryptjs')`
   - `import { createClient } from '@supabase/supabase-js'` → `const { createClient } = require('@supabase/supabase-js')`
   - All local imports: remove `.js` extension and use `require()` (matching all other routes)
   - `export default async function handler` → `module.exports = async function handler`
   - Indentation and structure remain identical for minimal diff

3. **Fix CSP in `vercel.json`**:
   - Remove `'unsafe-inline'` from `script-src` directive
   - Remove `'unsafe-eval'` from `script-src` directive
   - Keep all external domains: `https://vercel.live`, `https://*.vercel.app`, `https://va.vercel-scripts.com` (Vercel Analytics)
   - All other CSP directives remain unchanged

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `package.json` | Modified | Remove `"type": "module"` at line 5 |
| `api/auth/reset-password.js` | Modified | Convert ESM to CJS (approx 8 lines changed) |
| `vercel.json` | Modified | Remove `'unsafe-inline' 'unsafe-eval'` from script-src |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Vite or some dev dependency may need `"type": "module"` | Low | Test full `pnpm build`: Vitest, ESLint, and Vite all handle their own module resolution |
| CSP change breaks Vercel Analytics inline script injection | Low | `@vercel/analytics` loads via external `<script src>`, not inline — no CSP impact. Verify with browser console |
| `reset-password.js` imports an ESM-only package | Low | `bcryptjs`, `@supabase/supabase-js`, logger, middleware are all CJS-compatible (`require()` used elsewhere) |

## Rollback Plan

```bash
# Revert all 3 files at once
git checkout HEAD -- package.json api/auth/reset-password.js vercel.json

# Or revert individually if only partial rollback needed
git checkout HEAD -- package.json
git checkout HEAD -- api/auth/reset-password.js
git checkout HEAD -- vercel.json
```

All 3 changes are independent — any can be reverted without affecting the others.

## Dependencies

None. These are self-contained config and code changes. No new packages needed.

## Success Criteria

- [ ] `pnpm build` succeeds (Vite production build)
- [ ] `pnpm dev` starts and frontend loads without CSP errors in browser console
- [ ] All 5 API routes (`signin`, `signup`, `session`, `signout`, `reset-password`) respond correctly in Vercel preview deployment
- [ ] `reset-password.js` no longer throws `SyntaxError: Cannot use import statement outside a module`
- [ ] Browser DevTools Console shows 0 CSP-related errors or warnings for `script-src`
- [ ] `pnpm test` (vitest) passes with no regressions
