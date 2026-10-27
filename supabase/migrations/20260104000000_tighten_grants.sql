-- Siết quyền truy cập bảng.
-- Supabase tự cấp ALL cho anon/authenticated trên mọi bảng mới trong schema public. Với bảng đã bật RLS
-- thì phần lớn vẫn an toàn, nhưng một khi có policy UPDATE/INSERT thì quyền cấp cho CỘT mới là hàng rào
-- cuối cùng (ví dụ người chơi chỉ được sửa cột `sgf`, không được sửa `winner`/`status`).
-- Vì vậy thu hồi hết rồi cấp lại đúng những gì app dùng.

alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;

revoke all on public.clubs, public.matches, public.match_confirmations, public.kudos from anon, authenticated;

-- clubs: chỉ đọc
grant select on public.clubs to anon, authenticated;

-- matches: đọc công khai (RLS lọc ván chưa xác nhận); chỉ ghi ván mới, sửa kỳ phổ, huỷ ván của mình
grant select on public.matches to anon, authenticated;
grant insert (black_player, white_player, winner, win_method, score_difference, played_on, location,
              club_id, note, board_size, handicap, recorded_by, sgf)
  on public.matches to authenticated;
grant update (sgf) on public.matches to authenticated;
grant delete on public.matches to authenticated;

-- match_confirmations: đối thủ chỉ trả lời (status, reason); không đổi được match_id / user_id.
-- `anon` cần quyền SELECT để truy vấn kỳ phổ có nhúng bảng này không bị lỗi quyền; RLS chỉ cho
-- người trong cuộc đọc dòng nào nên khách vẫn không thấy gì.
grant select on public.match_confirmations to anon, authenticated;
grant update (status, reason) on public.match_confirmations to authenticated;

-- kudos
grant select on public.kudos to anon, authenticated;
grant insert (match_id, user_id) on public.kudos to authenticated;
grant delete on public.kudos to authenticated;
