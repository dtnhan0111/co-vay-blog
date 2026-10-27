-- Quản trị viên: ngoài hai người chơi, admin cũng được thêm / thay / gỡ kỳ phổ của mọi ván.
-- `is_admin` KHÔNG nằm trong quyền INSERT/UPDATE của client nên không ai tự phong admin được;
-- chỉ đặt bằng SQL (ví dụ: update public.users set is_admin = true where id = '…').
alter table public.users add column is_admin boolean not null default false;
grant select (is_admin) on public.users to anon, authenticated;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$ select coalesce((select is_admin from public.users where auth_id = auth.uid()), false) $$;
grant execute on function public.is_admin() to anon, authenticated;

drop policy "players attach a game record" on public.matches;
create policy "players and admins attach a game record" on public.matches
  for update to authenticated
  using (black_player = public.current_user_id() or white_player = public.current_user_id() or public.is_admin())
  with check (black_player = public.current_user_id() or white_player = public.current_user_id() or public.is_admin());
