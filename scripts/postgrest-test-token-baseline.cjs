#!/usr/bin/env node
/**
 * scripts/postgrest-test-token-baseline.cjs
 *
 * SEC-001 / SEC-005 day-of gate — Pre-lockdown PostgREST test-token baseline.
 *
 * PURPOSE (task 1.14, gate 1.14):
 *   Prove that a server-minted HS256 JWT (claims app_tenant_id/app_role/
 *   app_user_id, role 'authenticated', iss 'tappmesa-api', exp-iat=3600) is
 *   ACCEPTED by the LIVE PostgREST path via supabase-js `global.headers`
 *   Authorization Bearer — the exact attach mechanism `setAccessToken()`
 *   (src/lib/supabase.js) uses for staff/super_admin reads (SEC-003).
 *   This is the pre-lockdown baseline: after S2 (`secure-data-access.sql`)
 *   flips RLS, the SAME token must ride the claim policies. Run this BEFORE
 *   the flip to record the baseline, and re-run it as part of the day-of
 *   checklist to confirm the token still survives the lockdown.
 *
 * MINT PATH (production code — no fork):
 *   - api/utils/jwt.js `mintAdminJwt()` — the exact function api/auth/token.js
 *     and api/auth/session.js use (HS256, SUPABASE_JWT_SECRET, TTL 3600,
 *     iss 'tappmesa-api').
 *   - Supabase client created with `global: { headers: { Authorization:
 *     Bearer <token> } }` — byte-for-byte the rebuild `setAccessToken(jwt)`
 *     performs in src/lib/supabase.js.
 *
 * USAGE (run from repo root):
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... SUPABASE_JWT_SECRET=... \
 *     node scripts/postgrest-test-token-baseline.cjs [order-table-name]
 *   Order table name defaults to `orders`; pass another table (e.g.
 *   `table_sessions`) to extend the baseline.
 *
 *   If a `.env.local` exists it is loaded first (dotenv), like the app does.
 *
 * EXIT CODES:
 *   0  — token verified + PostgREST accepted the query (200 with rows or
 *        empty array — empty is still a valid RLS-scoped baseline read)
 *   1  — token verified but the query failed (auth or otherwise)
 *   2  — prerequisites missing (no SUPABASE_URL / SUPABASE_JWT_SECRET) —
 *        documented "not run" state, expected when no live DB is configured
 *
 * NOTE: Requires `tenant` claim for the minted admin JWT (claims object shape
 * matches what requireAuth resolves from admin_sessions + admin_users).
 */

const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

// Load .env.local if present (dotenv is a project dependency).
try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
} catch {
  // dotenv missing — env vars must be provided inline.
}

const { mintAdminJwt, verifyToken, JWT_TTL_SECONDS, JWT_ISSUER } = require('../api/utils/jwt.js');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const JWT_SECRET = process.env.SUPABASE_JWT_SECRET;
const ORDER_TABLE = process.argv[2] || 'orders';

if (!SUPABASE_URL || !JWT_SECRET) {
  console.error(
    '[baseline] PREREQUISITES MISSING — not run (expected when no live DB is configured).\n' +
    '[baseline] Set SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_JWT_SECRET to execute;\n' +
    '[baseline] SUPABASE_SERVICE_ROLE_KEY is only needed for schema-independent client init.\n' +
    '[baseline] This is the SEC-005 day-of gate: run it right before `secure-data-access.sql`.'
  );
  process.exit(2);
}

// --- 1. Mint the JWT through the production code path (api/utils/jwt.js) ---
// Claims object mirrors requireAuth's output (admin_sessions join admin_users).
const adminClaims = {
  sessionToken: 'baseline-session-token',
  admin: {
    id: '00000000-0000-4000-8000-000000000001', // placeholder; real route mints from DB row
    email: 'baseline@tappmesa.local',
    role: 'staff',                              // tenant-scoped role
    tenant_id: '00000000-0000-4000-8000-00000000AAAA', // tenant A placeholder
  },
  tenant: null,
};
const token = mintAdminJwt(adminClaims, JWT_SECRET);

// --- 2. Verify claims EXACTLY per SEC-001 before touching the network ---
const { header, payload } = jwt.decode(token, { complete: true });
const verified = verifyToken(token, JWT_SECRET);
const claimChecks = {
  role_authenticated: payload.role === 'authenticated',
  app_tenant_id_present: payload.app_tenant_id === adminClaims.admin.tenant_id,
  app_role_present: payload.app_role === adminClaims.admin.role,
  app_user_id_present: payload.app_user_id === adminClaims.admin.id,
  ttl_3600: payload.exp - payload.iat === 3600 && payload.exp - payload.iat === JWT_TTL_SECONDS,
  iss_tappmesa_api: payload.iss === JWT_ISSUER,
  alg_HS256: header.alg === 'HS256',
  jwt_verifies: !!verified,
};
const claimsOk = Object.values(claimChecks).every(Boolean);
console.log(`[baseline] SEC-001 claim checks: ${JSON.stringify(claimChecks, null, 2)}`);
console.log(`[baseline] claims_ok=${claimsOk}`);
if (!claimsOk) process.exit(1);

// --- 3. PostgREST test query — the EXACT attach setAccessToken uses ---
// global.headers Authorization Bearer — zero call-site edits for reads (SEC-003).
const client = createClient(SUPABASE_URL, SERVICE_ROLE_KEY || 'no-service-role-needed-for-bearer-query', {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  global: { headers: { Authorization: `Bearer ${token}` } },
});

console.log(`[baseline] PostgREST query: from('${ORDER_TABLE}').select('id').limit(1) — Authorization: Bearer <jwt>`);

client
  .from(ORDER_TABLE)
  .select('id')
  .limit(1)
  .then(({ data, error }) => {
    if (error) {
      console.error(`[baseline] FAIL — PostgREST rejected the token-backed query: ${error.code} ${error.message}`);
      console.error('[baseline] If this is 401/PGRST301: the JWT is not accepted. If this is 42501: RLS/policies block the role.');
      process.exit(1);
    }
    console.log(`[baseline] SUCCESS — token accepted by PostgREST. Row count: ${data ? data.length : 0}`);
    console.log(`[baseline] Data: ${JSON.stringify(data)}`);
    console.log('[baseline] Token TTL seconds:', payload.exp - payload.iat, '| exp (epoch):', payload.exp);
    console.log('[baseline] Baseline recorded. Re-run at S2 flip (SEC-005 day-of gate) and after lockdown to confirm survival.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('[baseline] FAIL — unexpected error:', err.message);
    process.exit(1);
  });