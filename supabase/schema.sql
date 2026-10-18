-- 排班系統的資料表與權限（Row Level Security）
-- 在 Supabase 的 SQL Editor 貼上整份執行即可，可以重複執行。
--
-- 角色：
--   管理者  admins 裡的 email：讀寫全部資料
--   員工    members 裡的 email（由管理者在系統裡加入）：
--           能讀班表與設定；只能寫自己的畫休、換班、個人資料
--   其他人  就算用 email 驗證碼登入成功，也讀不到任何資料

create table if not exists public.admins  (email text primary key);
create table if not exists public.members (email text primary key);

-- 所有資料都是 JSON 文件，用路徑當主鍵，例如 config/main、roster/2026-11、requests/<uid>
create table if not exists public.docs (
  path       text primary key,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid()
);

create or replace function public.jwt_email() returns text
language sql stable as $$ select lower(coalesce(auth.jwt() ->> 'email', '')) $$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins a where lower(a.email) = public.jwt_email())
$$;

create or replace function public.is_member() returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin()
      or exists (select 1 from public.members m where lower(m.email) = public.jwt_email())
$$;

-- 這個路徑是不是「我自己的」：requests/<我>、swaps/<我>、swapAcks/<我>、data/users/<我>/...
create or replace function public.path_is_own(p text) returns boolean
language sql stable as $$
  select auth.uid() is not null and (
       p = 'requests/'  || auth.uid()::text
    or p = 'swaps/'     || auth.uid()::text
    or p = 'swapAcks/'  || auth.uid()::text
    or left(p, length('data/users/' || auth.uid()::text || '/')) = 'data/users/' || auth.uid()::text || '/'
  )
$$;

alter table public.docs    enable row level security;
alter table public.admins  enable row level security;
alter table public.members enable row level security;

drop policy if exists docs_select on public.docs;
drop policy if exists docs_insert on public.docs;
drop policy if exists docs_update on public.docs;
drop policy if exists docs_delete on public.docs;

-- 讀：管理者全部；員工不能讀 notes/（管理者備註）和別人的 data/users/（個人資料）
create policy docs_select on public.docs for select to authenticated using (
  public.is_admin()
  or (public.is_member() and (
        (path not like 'notes/%' and path not like 'data/users/%')
        or public.path_is_own(path)))
);
-- 寫：管理者全部；員工只能寫自己的
create policy docs_insert on public.docs for insert to authenticated
  with check (public.is_admin() or (public.is_member() and public.path_is_own(path)));
create policy docs_update on public.docs for update to authenticated
  using      (public.is_admin() or (public.is_member() and public.path_is_own(path)))
  with check (public.is_admin() or (public.is_member() and public.path_is_own(path)));
create policy docs_delete on public.docs for delete to authenticated
  using (public.is_admin() or (public.is_member() and public.path_is_own(path)));

-- admins：只能在 SQL Editor 新增（見 README）；members：管理者在系統裡管理
drop policy if exists members_all on public.members;
create policy members_all on public.members for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists admins_select on public.admins;
create policy admins_select on public.admins for select to authenticated using (public.is_admin());

revoke all on public.docs, public.admins, public.members from anon;
grant select, insert, update, delete on public.docs    to authenticated;
grant select, insert, update, delete on public.members to authenticated;
grant select on public.admins to authenticated;
grant execute on function public.is_admin(), public.is_member() to authenticated;

-- 即時同步（Realtime）
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables
                     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'docs') then
    alter publication supabase_realtime add table public.docs;
  end if;
end $$;
