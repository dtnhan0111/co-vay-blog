-- Bình luận kỳ phổ + "đặt một quân" cho từng bình luận.
-- Chỉ ván đã xác nhận và có kỳ phổ mới nhận bình luận; ai cũng đọc được, chỉ thành viên đã đăng nhập mới viết.
create table public.match_comments (
  id          uuid primary key default gen_random_uuid(),
  match_id    uuid not null references public.matches (id) on delete cascade,
  user_id     uuid not null references public.users (id) on delete cascade,
  body        text not null check (char_length(btrim(body)) between 1 and 500),
  move_number smallint check (move_number >= 0),   -- gắn với nước thứ mấy của kỳ phổ (tuỳ chọn)
  created_at  timestamptz not null default now()
);
create index match_comments_match_idx on public.match_comments (match_id, created_at);

create table public.comment_likes (
  comment_id uuid not null references public.match_comments (id) on delete cascade,
  user_id    uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

alter table public.match_comments enable row level security;
alter table public.comment_likes  enable row level security;

-- Quyền theo từng cột (xem migration tighten_grants): không ai sửa được nội dung sau khi đăng.
grant select on public.match_comments to anon, authenticated;
grant insert (match_id, user_id, body, move_number) on public.match_comments to authenticated;
grant delete on public.match_comments to authenticated;
grant select on public.comment_likes to anon, authenticated;
grant insert (comment_id, user_id) on public.comment_likes to authenticated;
grant delete on public.comment_likes to authenticated;

-- Đọc: bất kỳ ai nhìn thấy ván thì thấy bình luận của ván đó.
create policy "comments follow match visibility" on public.match_comments
  for select using (exists (select 1 from public.matches m where m.id = match_id));

-- Viết: thành viên, dưới tên của chính mình, vào ván đã xác nhận có kỳ phổ.
create policy "members comment on game records" on public.match_comments
  for insert to authenticated
  with check (
    user_id = public.current_user_id()
    and exists (select 1 from public.matches m where m.id = match_id and m.status = 'confirmed' and m.has_sgf)
  );

-- Xoá: tác giả hoặc admin.
create policy "authors and admins delete comments" on public.match_comments
  for delete to authenticated
  using (user_id = public.current_user_id() or public.is_admin());

create policy "comment likes are public" on public.comment_likes
  for select using (true);
create policy "members like comments" on public.comment_likes
  for insert to authenticated
  with check (
    user_id = public.current_user_id()
    and exists (select 1 from public.match_comments c where c.id = comment_id)
  );
create policy "members take back their like" on public.comment_likes
  for delete to authenticated
  using (user_id = public.current_user_id());
