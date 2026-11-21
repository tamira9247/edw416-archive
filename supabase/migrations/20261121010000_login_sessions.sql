-- №6: verify.mn-ээр нэвтрэх оролдлого. Оюутан 144773 руу кодыг SMS-ээр илгээж,
-- login-check функц баталгаажсаныг шалгана. Зөвхөн Edge Function (service_role) хандана.
create table public.login_sessions (
  id uuid primary key default gen_random_uuid(),
  phone text not null check (phone ~ '^[0-9]{8}$'),
  verify_session_id text not null,
  code text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index login_sessions_phone_created on public.login_sessions (phone, created_at);

-- RLS асаалттай, бодлого байхгүй: оюутан, гадны хүн уншиж, бичиж чадахгүй
alter table public.login_sessions enable row level security;
revoke all on public.login_sessions from anon, authenticated;
