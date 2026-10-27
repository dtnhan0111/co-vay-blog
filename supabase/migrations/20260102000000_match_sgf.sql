-- Kỳ phổ SGF đính kèm ván cờ.
-- Nội dung SGF lưu thẳng trong `matches.sgf` (tối đa 200 KB). Danh sách ván không đọc cột này
-- (nặng); chỉ trang chi tiết đọc. `has_sgf` cho danh sách biết ván nào có kỳ phổ.
alter table public.matches
  add column sgf text check (char_length(sgf) <= 200000),
  add column has_sgf boolean generated always as (sgf is not null) stored;

-- Chỉ hai người chơi được thêm / thay / gỡ kỳ phổ, và chỉ sửa được đúng cột này.
grant update (sgf) on public.matches to authenticated;

create policy "players attach a game record" on public.matches
  for update to authenticated
  using (black_player = public.current_user_id() or white_player = public.current_user_id())
  with check (black_player = public.current_user_id() or white_player = public.current_user_id());
