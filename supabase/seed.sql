-- Үе 3.2а: дотоодын тест хэрэглэгчид. Дугаарууд зохиомол.
-- Зөвхөн дотоодод (supabase db reset) ажиллана, үүлэн төсөл рүү очихгүй.

-- 3 тест хэрэглэгч: 2 оюутан, 1 багш. phone_confirmed_at бөглөгдсөн тул
-- trigger (handle_phone_confirmed) students мөрийг автоматаар үүсгэнэ.
-- Хоосон token баганыг '' болгоно, null бол нэвтрэлтийн сервер алдаа өгдөг.
insert into auth.users (
  instance_id, id, aud, role, phone, phone_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  phone_change, phone_change_token, reauthentication_token
) values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111',
   'authenticated', 'authenticated', '97699000001', now(),
   '{"provider": "phone", "providers": ["phone"]}', '{}', now(), now(),
   '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222',
   'authenticated', 'authenticated', '97699000002', now(),
   '{"provider": "phone", "providers": ["phone"]}', '{}', now(), now(),
   '', '', '', '', '', '', ''),
  -- Багш: app_metadata-д role = teacher
  ('00000000-0000-0000-0000-000000000000', '99999999-9999-9999-9999-999999999999',
   'authenticated', 'authenticated', '97699000009', now(),
   '{"provider": "phone", "providers": ["phone"], "role": "teacher"}', '{}', now(), now(),
   '', '', '', '', '', '', '');

-- Нэвтрэх боломжтой байхын тулд утасны identity мөр
insert into auth.identities (id, user_id, provider_id, provider, identity_data, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text, 'phone',
       jsonb_build_object('sub', u.id::text, 'phone', u.phone), now(), now()
from auth.users u
where u.phone in ('97699000001', '97699000002', '97699000009');

-- Тест явц: оюутан А 2 лекц, 1 семинар; оюутан Б 1 лекц
insert into public.progress (student_id, kind, item_id) values
  ('11111111-1111-1111-1111-111111111111', 'lecture', 1),
  ('11111111-1111-1111-1111-111111111111', 'lecture', 2),
  ('11111111-1111-1111-1111-111111111111', 'seminar', 1),
  ('22222222-2222-2222-2222-222222222222', 'lecture', 1);

