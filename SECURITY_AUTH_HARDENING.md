# Admin Authentication Hardening

This project uses Supabase Auth for password verification. Keep brute-force protection on the server; browser-side counters are only a usability guard and can be bypassed.

## Already implemented in the admin login page

- Prevents rapid repeat submissions in the same page (2.5-second cooldown).
- Disables the Login button while a request is in progress.
- Shows a safe generic message for invalid credentials.
- Shows a wait-and-retry message when Supabase returns HTTP 429.

## Required Supabase Dashboard settings

Open **Supabase Dashboard → Authentication → Rate Limits** for the project.

1. Review the current limit for the Auth token endpoint (password sign-in uses the token endpoint). Keep a conservative IP-based limit appropriate for your users and network; test before lowering it because users behind the same office/mobile carrier NAT may share an IP.
2. Enable CAPTCHA under **Authentication → Bot and Abuse Protection → CAPTCHA**. Cloudflare Turnstile is a suitable option. Configure the site key in the admin page and the secret key in Supabase; never expose the secret key in frontend code.
3. Under **Authentication → Password Security**, require at least 8 characters and enable stronger character requirements. Enable leaked-password protection if available on the project's plan.
4. Keep admin membership protected by the existing `public.is_admin()` check and RLS policies. Never put a Supabase secret/service-role key in `supabase-config.js` or browser JavaScript.

## Important limitations

- The 2.5-second browser guard is not a security boundary. It can be bypassed by another browser, device, or direct API call.
- Supabase Auth's IP-based rate limits are the server-side control for repeated password sign-in requests. A 429 response means the limit was reached.
- The browser must not permanently lock an account based only on failed attempts: that can be abused to deny the real owner access. If a per-account failed-password lockout is required, implement it using a trusted server-side Auth hook/service with careful abuse controls, not localStorage or a client-writable SQL table.

## Official Supabase documentation

- https://supabase.com/docs/guides/auth/rate-limits
- https://supabase.com/docs/guides/auth/auth-captcha
- https://supabase.com/docs/guides/auth/password-security
