-- Task 1.10 (spec ADM-002): drop the PUBLIC SECURITY DEFINER token-minting
-- function. Reset tokens are now minted server-side in
-- api/auth/reset-password.js with crypto.randomBytes(32) and inserted
-- directly into password_reset_tokens (service role), so no database
-- function may mint a valid reset token for an arbitrary email.
--
-- The function exposed reset-token generation to anyone holding the anon
-- key (security definer, search_path-public): an attacker could mint a
-- token for a victim email and then use it to reset their password once
-- the phishing email flow was completed (or via the /confirm + /reset
-- endpoints). Dropping it closes the hole; password_reset_tokens RLS with
-- zero policies is enforced in the split-2 lockdown.

DROP FUNCTION IF EXISTS public.generate_password_reset_token(character varying);

-- Safety net: also drop it in case the signature was created with a
-- different casing/synonym; DROP is idempotent so this is a no-op if the
-- first statement already removed it.
DROP FUNCTION IF EXISTS public.generate_password_reset_token(text);