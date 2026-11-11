-- =====================================================================
-- EduCampus : schema complet Supabase (a executer dans SQL Editor)
-- Corrige : recursion RLS, escalade de privileges, politiques manquantes,
-- buckets Storage prives + politiques Storage.
-- =====================================================================

create extension if not exists "uuid-ossp";

create type public.user_role as enum ('director', 'teacher', 'student');

-- ---------- Tables ----------
create table public.classes (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  department text,
  created_at timestamptz default now() not null
);

create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  full_name text not null,
  role public.user_role default 'student' not null,
  class_id uuid references public.classes(id) on delete set null,
  last_login timestamptz,
  created_at timestamptz default now() not null
);

create table public.courses (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  code text unique not null,
  teacher_id uuid references public.profiles(id) on delete cascade not null,
  class_id uuid references public.classes(id) on delete set null,
  created_at timestamptz default now() not null
);

create table public.enrollments (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references public.profiles(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete cascade not null,
  enrolled_at timestamptz default now() not null,
  unique (student_id, course_id)
);

-- content_url / video_url : chemin dans le bucket course-materials
-- OU lien externe (https://...) YouTube / Vimeo
create table public.modules (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid references public.courses(id) on delete cascade not null,
  title text not null,
  content_url text,
  video_url text,
  order_index integer default 0 not null,
  created_at timestamptz default now() not null
);

create table public.lesson_progress (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references public.profiles(id) on delete cascade not null,
  module_id uuid references public.modules(id) on delete cascade not null,
  completed boolean default true not null,
  updated_at timestamptz default now() not null,
  unique (student_id, module_id)
);

create table public.assignments (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid references public.courses(id) on delete cascade not null,
  title text not null,
  instructions text,
  due_date timestamptz not null,
  max_score numeric default 20 not null,
  created_at timestamptz default now() not null
);

-- file_url : chemin dans le bucket submissions
create table public.submissions (
  id uuid default uuid_generate_v4() primary key,
  assignment_id uuid references public.assignments(id) on delete cascade not null,
  student_id uuid references public.profiles(id) on delete cascade not null,
  file_url text not null,
  submitted_at timestamptz default now() not null,
  grade numeric,
  feedback text,
  graded_at timestamptz,
  unique (assignment_id, student_id)
);

create table public.activity_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  action text not null,
  details jsonb,
  created_at timestamptz default now() not null
);

create index on public.courses (teacher_id);
create index on public.courses (class_id);
create index on public.modules (course_id);
create index on public.assignments (course_id);
create index on public.submissions (assignment_id);
create index on public.lesson_progress (module_id);
create index on public.activity_logs (created_at desc);
create index on public.profiles (class_id);

-- ---------- Fonctions utilitaires (SECURITY DEFINER = pas de recursion RLS) ----------
create or replace function public.current_user_role()
returns public.user_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_director()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'director' from public.profiles where id = auth.uid()), false)
$$;

create or replace function public.my_class_id()
returns uuid language sql stable security definer set search_path = public as $$
  select class_id from public.profiles where id = auth.uid()
$$;

create or replace function public.is_teacher_of(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.courses where id = cid and teacher_id = auth.uid())
$$;

create or replace function public.has_course_access(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_director() or exists (
    select 1 from public.courses c
    where c.id = cid and (
      c.teacher_id = auth.uid()
      or (c.class_id is not null and c.class_id = public.my_class_id())
      or exists (select 1 from public.enrollments e where e.course_id = c.id and e.student_id = auth.uid())
    )
  )
$$;

create or replace function public.assignment_course(aid uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select course_id from public.assignments where id = aid
$$;

create or replace function public.module_course(mid uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select course_id from public.modules where id = mid
$$;

-- Enregistre la connexion (appelee apres login)
create or replace function public.touch_login()
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set last_login = now() where id = auth.uid();
  insert into public.activity_logs (user_id, action) values (auth.uid(), 'login');
end $$;

-- ---------- Creation automatique du profil ----------
-- SECURITE : le role est TOUJOURS 'student'. Seule la Direction (ou le
-- serveur avec la cle service_role) peut promouvoir un compte.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', 'Utilisateur'), 'student');
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- RLS ----------
alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.courses enable row level security;
alter table public.enrollments enable row level security;
alter table public.modules enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.assignments enable row level security;
alter table public.submissions enable row level security;
alter table public.activity_logs enable row level security;

-- profiles
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or role in ('teacher', 'director')
         or public.is_director() or public.current_user_role() = 'teacher');
create policy profiles_director_all on public.profiles for all to authenticated
  using (public.is_director()) with check (public.is_director());

-- classes
create policy classes_select on public.classes for select to authenticated using (true);
create policy classes_director_all on public.classes for all to authenticated
  using (public.is_director()) with check (public.is_director());

-- courses
create policy courses_select on public.courses for select to authenticated
  using (public.has_course_access(id));
create policy courses_insert on public.courses for insert to authenticated
  with check (public.is_director() or (teacher_id = auth.uid() and public.current_user_role() = 'teacher'));
create policy courses_update on public.courses for update to authenticated
  using (teacher_id = auth.uid() or public.is_director())
  with check (teacher_id = auth.uid() or public.is_director());
create policy courses_delete on public.courses for delete to authenticated
  using (teacher_id = auth.uid() or public.is_director());

-- enrollments
create policy enroll_select on public.enrollments for select to authenticated
  using (student_id = auth.uid() or public.is_teacher_of(course_id) or public.is_director());
create policy enroll_write on public.enrollments for all to authenticated
  using (public.is_teacher_of(course_id) or public.is_director())
  with check (public.is_teacher_of(course_id) or public.is_director());

-- modules
create policy modules_select on public.modules for select to authenticated
  using (public.has_course_access(course_id));
create policy modules_write on public.modules for all to authenticated
  using (public.is_teacher_of(course_id) or public.is_director())
  with check (public.is_teacher_of(course_id) or public.is_director());

-- lesson_progress
create policy progress_own on public.lesson_progress for all to authenticated
  using (student_id = auth.uid())
  with check (student_id = auth.uid() and public.has_course_access(public.module_course(module_id)));
create policy progress_staff_read on public.lesson_progress for select to authenticated
  using (public.is_director() or public.is_teacher_of(public.module_course(module_id)));

-- assignments
create policy assignments_select on public.assignments for select to authenticated
  using (public.has_course_access(course_id));
create policy assignments_write on public.assignments for all to authenticated
  using (public.is_teacher_of(course_id) or public.is_director())
  with check (public.is_teacher_of(course_id) or public.is_director());

-- submissions
create policy sub_select on public.submissions for select to authenticated
  using (student_id = auth.uid() or public.is_director()
         or public.is_teacher_of(public.assignment_course(assignment_id)));
create policy sub_student_insert on public.submissions for insert to authenticated
  with check (student_id = auth.uid() and grade is null and feedback is null
              and public.has_course_access(public.assignment_course(assignment_id)));
create policy sub_student_update on public.submissions for update to authenticated
  using (student_id = auth.uid() and grade is null)
  with check (student_id = auth.uid() and grade is null and feedback is null);
create policy sub_staff_update on public.submissions for update to authenticated
  using (public.is_director() or public.is_teacher_of(public.assignment_course(assignment_id)))
  with check (public.is_director() or public.is_teacher_of(public.assignment_course(assignment_id)));
create policy sub_director_delete on public.submissions for delete to authenticated
  using (public.is_director());

-- activity_logs
create policy logs_insert_own on public.activity_logs for insert to authenticated
  with check (user_id = auth.uid());
create policy logs_director_select on public.activity_logs for select to authenticated
  using (public.is_director());

-- ---------- Storage (buckets prives, acces par URL signee) ----------
insert into storage.buckets (id, name, public, file_size_limit)
values ('course-materials', 'course-materials', false, 52428800),
       ('submissions', 'submissions', false, 52428800)
on conflict (id) do nothing;

-- course-materials : chemin = {course_id}/{fichier}
create policy materials_read on storage.objects for select to authenticated
  using (bucket_id = 'course-materials'
         and public.has_course_access(((storage.foldername(name))[1])::uuid));
create policy materials_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'course-materials'
              and (public.is_director() or public.is_teacher_of(((storage.foldername(name))[1])::uuid)));
create policy materials_delete on storage.objects for delete to authenticated
  using (bucket_id = 'course-materials'
         and (public.is_director() or public.is_teacher_of(((storage.foldername(name))[1])::uuid)));

-- submissions : chemin = {assignment_id}/{student_id}/{fichier}
create policy subfiles_read on storage.objects for select to authenticated
  using (bucket_id = 'submissions' and (
    (storage.foldername(name))[2] = auth.uid()::text
    or public.is_director()
    or public.is_teacher_of(public.assignment_course(((storage.foldername(name))[1])::uuid))));
create policy subfiles_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'submissions'
              and (storage.foldername(name))[2] = auth.uid()::text
              and public.has_course_access(public.assignment_course(((storage.foldername(name))[1])::uuid)));
create policy subfiles_update on storage.objects for update to authenticated
  using (bucket_id = 'submissions' and (storage.foldername(name))[2] = auth.uid()::text);

-- ---------- Premier compte Direction ----------
-- 1) Creez l'utilisateur dans Authentication > Users
-- 2) Executez (en remplacant l'email) :
--    update public.profiles set role = 'director' where email = 'direction@votre-ecole.ht';
