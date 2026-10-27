-- Tuỳ biến avatar quân cờ: màu quân (đen/trắng; rỗng = tự chọn theo tên) và ký tự khắc trên quân.
alter table public.users
  add column avatar_tone  text check (avatar_tone in ('black', 'white')),
  add column avatar_glyph text check (char_length(avatar_glyph) between 1 and 8);

grant select (avatar_tone, avatar_glyph) on public.users to anon, authenticated;
grant update (avatar_tone, avatar_glyph) on public.users to authenticated;
