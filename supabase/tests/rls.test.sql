-- Үе 3.2а: RLS дүрмийг тест хэрэглэгчдийн (seed.sql) нэрийн өмнөөс шалгана.
-- Ажиллуулах: npx supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(15);

-- Trigger: баталгаажсан 3 хэрэглэгчид students мөр үүсч, дугаар 8 оронтой
select is((select count(*)::int from public.students), 3, 'trigger: students-д 3 мөр');
select is((select phone from public.students where id = '11111111-1111-1111-1111-111111111111'),
  '99000001', 'trigger: дугаарын сүүлийн 8 орон');

-- Оюутан А
set local role authenticated;
set local request.jwt.claims = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated", "app_metadata": {}}';

select is((select count(*)::int from public.progress), 3, 'оюутан: зөвхөн өөрийн 3 мөрийг харна');
select is((select count(*)::int from public.students), 1, 'оюутан: зөвхөн өөрийн students мөрийг харна');
select throws_ok(
  $$ insert into public.progress (student_id, kind, item_id)
     values ('22222222-2222-2222-2222-222222222222', 'lecture', 2) $$,
  '42501', null, 'оюутан: бусдын нэр дээр тэмдэглэж чадахгүй');
select lives_ok(
  $$ insert into public.progress (student_id, kind, item_id)
     values ('11111111-1111-1111-1111-111111111111', 'lecture', 3) $$,
  'оюутан: өөртөө тэмдэглэнэ');
select lives_ok(
  $$ delete from public.progress
     where student_id = '11111111-1111-1111-1111-111111111111' and kind = 'lecture' and item_id = 3 $$,
  'оюутан: өөрийн тэмдэглэгээг буцаана');
-- Бусдын мөрийг устгах гэвэл алдаа өгөхгүй ч юу ч устахгүй (багшийн тоогоор шалгана)
delete from public.progress where student_id = '22222222-2222-2222-2222-222222222222';

-- Багш
set local request.jwt.claims = '{"sub": "99999999-9999-9999-9999-999999999999", "role": "authenticated", "app_metadata": {"role": "teacher"}}';

select is((select count(*)::int from public.progress), 4, 'багш: бүх 4 мөрийг харна (оюутан бусдынхыг устгаж чадаагүй)');
select is((select count(*)::int from public.students), 3, 'багш: бүх оюутныг харна');
select throws_ok(
  $$ insert into public.progress (student_id, kind, item_id)
     values ('11111111-1111-1111-1111-111111111111', 'lecture', 5) $$,
  '42501', null, 'багш: оюутны нэр дээр тэмдэглэж чадахгүй');
delete from public.progress;
select is((select count(*)::int from public.progress), 4, 'багш: мөр устгаж чадахгүй');

-- Оюутан: нэвтрэх оролдлогын хүснэгтэд хандах эрхгүй
set local request.jwt.claims = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated", "app_metadata": {}}';
select throws_ok('select count(*) from public.login_sessions', '42501', null, 'оюутан: login_sessions харах эрхгүй');

-- Нэвтрээгүй хүн
set local role anon;
set local request.jwt.claims = '{"role": "anon"}';

select throws_ok('select count(*) from public.progress', '42501', null, 'anon: явц харах эрхгүй');
select throws_ok('select count(*) from public.students', '42501', null, 'anon: дугаар харах эрхгүй');
select throws_ok('select count(*) from public.login_sessions', '42501', null, 'anon: нэвтрэх оролдлого харах эрхгүй');

select * from finish();
rollback;
