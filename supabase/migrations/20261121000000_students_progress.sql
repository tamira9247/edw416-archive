-- Үе 3.2: оюутан, явцын хүснэгт, RLS дүрэм

-- Багш эсэхийг шалгана. app_metadata-г зөвхөн админ (Dashboard, service_role) засна,
-- оюутан өөрөө өөртөө "teacher" эрх өгч чадахгүй
create or replace function public.is_teacher()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'teacher', false)
$$;

-- Оюутан. Нэвтрэлтийн хэрэглэгчтэй (auth.users) нэг нэгээр холбогдоно
create table public.students (
  id uuid primary key references auth.users (id) on delete cascade,
  phone text not null unique check (phone ~ '^[0-9]{8}$'),
  created_at timestamptz not null default now()
);

-- Явц. Нэг мөр = нэг уншсан лекц эсвэл семинар
create table public.progress (
  student_id uuid not null references public.students (id) on delete cascade,
  kind text not null check (kind in ('lecture', 'seminar')),
  item_id int not null,
  marked_at timestamptz not null default now(),
  primary key (student_id, kind, item_id),
  -- Лекц 1-8, семинар 1-16
  check (
    (kind = 'lecture' and item_id between 1 and 8) or
    (kind = 'seminar' and item_id between 1 and 16)
  )
);

alter table public.students enable row level security;
alter table public.progress enable row level security;

-- students: өөрийн мөрийг эсвэл багш бүгдийг харна
create policy "students_select" on public.students
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_teacher()));
-- Оюутан мөрөө өөрөө үүсгэхгүй, засахгүй (доорх trigger үүсгэнэ)

-- progress: өөрийн мөрийг эсвэл багш бүгдийг харна
create policy "progress_select" on public.progress
  for select to authenticated
  using (student_id = (select auth.uid()) or (select public.is_teacher()));

-- Оюутан зөвхөн өөртөө тэмдэглэнэ
create policy "progress_insert" on public.progress
  for insert to authenticated
  with check (student_id = (select auth.uid()));

-- Тэмдэглэгээгээ буцаана (тэмдэглэх товчийг дахин дарахад)
create policy "progress_delete" on public.progress
  for delete to authenticated
  using (student_id = (select auth.uid()));
-- update бодлого байхгүй. Багш ямар ч мөр засах, устгах эрхгүй

-- Утасны дугаар SMS кодоор баталгаажсаны дараа students мөр автоматаар үүснэ.
-- Ингэснээр оюутан бусдын дугаарыг өөрийн нэр дээр бичиж чадахгүй.
-- Supabase хэрэглэгчийг код илгээх үед (баталгаажихаас өмнө) үүсгэдэг тул
-- phone_confirmed_at бөглөгдөх үеийг хүлээнэ
create or replace function public.handle_phone_confirmed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.phone is not null and new.phone_confirmed_at is not null then
    -- Supabase дугаарыг улсын кодтой (97699112233) хадгална, сүүлийн 8 оронг авна
    insert into public.students (id, phone)
    values (new.id, right(new.phone, 8))
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_phone_confirmed
  after insert or update of phone_confirmed_at on auth.users
  for each row execute function public.handle_phone_confirmed();
