# Admin Authentication Hardening

This project uses Supabase Auth for password verification. Brute-force controls must run on the server; browser-side counters are only usability guards and can be bypassed.

## Server-side admin lockout (3 failures / 15 minutes)

Migration: `supabase/admin-login-lockout.sql`

1. Run the migration in the Supabase SQL Editor as a database owner.
2. In **Supabase Dashboard → Authentication → Hooks**, enable **Password Verification Attempt** and select the Postgres function `public.hook_admin_password_verification`.
3. Confirm the Supabase project plan supports this hook. Supabase currently lists Password Verification Attempt hooks for **Teams and Enterprise** plans. If this hook is unavailable, do not claim that per-account lockout is active; retain the Auth IP rate limits and CAPTCHA until the project is upgraded or an equivalent trusted server-side Auth integration is deployed.
4. Test using a dedicated test admin account: two wrong passwords should be handled as ordinary failures; the third wrong password should lock the account for 15 minutes; correct passwords during the lock must also be rejected; after 15 minutes a correct password should work; a successful login clears the failure counter.

### What the migration enforces

- Only accounts present in `public.admin_users` are subject to this policy; customer accounts are unaffected.
- The first two failed password verifications are allowed to proceed to Supabase's normal invalid-credentials response.
- The third consecutive failed verification starts a 15-minute lockout.
- The lock is checked before the valid-password branch, so even a correct password cannot bypass an active lock.
- A successful verification after the lock expires clears the failed-attempt state.
- Per-user advisory transaction locking serializes concurrent attempts.
- The state table has RLS enabled and no client policies; table privileges are revoked from `anon`, `authenticated`, and `public`, and granted only to `supabase_auth_admin`.
- The hook never stores or logs passwords.

### Abuse / availability consideration

Per-account lockouts can be abused to temporarily deny the legitimate owner access if an attacker knows the admin email. Keep Supabase's IP-based Auth rate limits enabled and configure CAPTCHA as an additional layer. Consider alerting the owner on repeated failures. Do not expose the lockout table or add a client-side mechanism that can reset it.

## Existing admin login page protections

- Prevents rapid repeat submissions in the same page (2.5-second cooldown).
- Disables the Login button while a request is in progress.
- Shows a safe generic message for invalid credentials.
- Shows a wait-and-retry message when Supabase returns HTTP 429.

The browser cooldown is UX only. It is not the 3-attempt lockout and is not a security boundary.

## Required Supabase Dashboard settings

Open **Supabase Dashboard → Authentication → Rate Limits**.

1. Review the Auth token endpoint limit. Password sign-in uses the token endpoint and Supabase applies an IP-based limit. Tune conservatively because users behind the same office/mobile carrier NAT may share an IP.
2. Enable CAPTCHA under **Authentication → Bot and Abuse Protection → CAPTCHA**. Cloudflare Turnstile is a suitable option. Configure the site key in the admin page and the secret key in Supabase; never expose the secret key in frontend code.
3. Under **Authentication → Password Security**, require at least 8 characters and enable stronger character requirements. Enable leaked-password protection if available on the project's plan.
4. Keep admin membership protected by the existing `public.is_admin()` check and RLS policies. Never put a Supabase secret/service-role key in `supabase-config.js` or browser JavaScript.

## Official Supabase documentation

- https://supabase.com/docs/guides/auth/auth-hooks/password-verification-hook
- https://supabase.com/docs/guides/auth/auth-hooks
- https://supabase.com/docs/guides/auth/rate-limits
- https://supabase.com/docs/guides/auth/auth-captcha
- https://supabase.com/docs/guides/auth/password-security
