-- Grant Pramod Printers admin access to the owner account.
-- Run this in Supabase Dashboard -> SQL Editor after confirming this is the intended owner email.
-- This does not create or change the user's password; it only adds the existing Auth user
-- to the administrator allowlist used by public.is_admin().

insert into public.admin_users (user_id)
select id
from auth.users
where lower(email) = lower('tulsiramchandravanshi6@gmail.com')
on conflict (user_id) do nothing;

-- Verify that the account is now registered as an administrator.
select
  u.email,
  au.user_id,
  (au.user_id is not null) as admin_access_granted
from auth.users u
left join public.admin_users au on au.user_id = u.id
where lower(u.email) = lower('tulsiramchandravanshi6@gmail.com');
