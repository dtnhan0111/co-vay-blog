-- Go Đà Nẵng — schema khởi tạo
-- Bảng: clubs, users, matches, match_confirmations (+ kudos)
-- Chạy bằng `supabase db reset` (migration + seed) hoặc dán vào SQL editor.

-- ───────────────────────────── Enums ─────────────────────────────
create type public.win_method   as enum ('points', 'resign', 'time');
create type public.match_status as enum ('pending', 'confirmed', 'rejected');

-- ───────────────────────────── clubs ─────────────────────────────
create table public.clubs (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name        text not null check (char_length(name) between 2 and 80),
  description text check (char_length(description) <= 400),
  address     text,
  meets_at    text,                       -- "Thứ 7 · 14:00–18:00" (mô tả tự do)
  created_at  timestamptz not null default now()
);

-- ───────────────────────────── users ─────────────────────────────
-- Một dòng = một kỳ thủ. Có ba loại:
--   • thành viên: có `auth_id` (đã đăng nhập Google)
--   • hồ sơ tạo sẵn: `auth_id` rỗng + có `email`, được "nhận" khi người đó đăng nhập đúng email
--   • khách: `is_guest` — do một thành viên gõ tên khi ghi ván với người chưa dùng app
-- rank_value: 1 dan = 1, 1 kyu = 0, 2 kyu = -1 … 30 kyu = -29, 9 dan = 9.
create table public.users (
  id            uuid primary key default gen_random_uuid(),
  auth_id       uuid unique references auth.users (id) on delete set null,
  email         text,
  display_name  text not null check (char_length(display_name) between 1 and 60),
  rank_value    smallint not null default -9 check (rank_value between -29 and 9),
  club_id       uuid references public.clubs (id) on delete set null,
  bio           text check (char_length(bio) <= 280),
  playing_since smallint check (playing_since between 1950 and 2100),
  is_guest      boolean not null default false,
  created_by    uuid references public.users (id) on delete set null,
  created_at    timestamptz not null default now(),
  constraint users_guest_rule check (not is_guest or auth_id is null)
);
create unique index users_email_lower_key on public.users (lower(email));
create index users_club_idx on public.users (club_id);

-- ──────────────────────────── matches ────────────────────────────
create table public.matches (
  id               uuid primary key default gen_random_uuid(),
  black_player     uuid not null references public.users (id) on delete cascade,
  white_player     uuid not null references public.users (id) on delete cascade,
  winner           uuid not null references public.users (id) on delete cascade,
  win_method       public.win_method not null,
  score_difference numeric(5, 1),
  played_on        date not null default current_date,
  location         text not null check (char_length(location) between 2 and 80),
  club_id          uuid references public.clubs (id) on delete set null,
  note             text check (char_length(note) <= 280),
  board_size       smallint not null default 19 check (board_size in (9, 13, 19)),
  handicap         smallint not null default 0 check (handicap between 0 and 9),
  status           public.match_status not null default 'pending',
  recorded_by      uuid not null references public.users (id) on delete cascade,
  created_at       timestamptz not null default now(),
  resolved_at      timestamptz,

  constraint matches_distinct_players check (black_player <> white_player),
  constraint matches_winner_plays     check (winner in (black_player, white_player)),
  constraint matches_recorder_plays   check (recorded_by in (black_player, white_player)),
  -- chênh lệch điểm: bắt buộc (>0, bội 0.5) khi thắng điểm; để trống với bỏ cuộc/hết giờ
  constraint matches_score_rule check (
    (win_method = 'points'
       and score_difference is not null
       and score_difference > 0
       and score_difference * 2 = floor(score_difference * 2))
    or (win_method <> 'points' and score_difference is null)
  )
);
create index matches_feed_idx    on public.matches (status, played_on desc, created_at desc);
create index matches_black_idx   on public.matches (black_player);
create index matches_white_idx   on public.matches (white_player);
create index matches_club_idx    on public.matches (club_id);

-- ───────────────────────── match_confirmations ─────────────────────────
-- Mỗi ván có đúng một yêu cầu xác nhận, gửi cho đối thủ của người ghi.
create table public.match_confirmations (
  id           uuid primary key default gen_random_uuid(),
  match_id     uuid not null unique references public.matches (id) on delete cascade,
  user_id      uuid not null references public.users (id) on delete cascade,
  status       public.match_status not null default 'pending',
  reason       text check (char_length(reason) <= 280),
  responded_at timestamptz,
  created_at   timestamptz not null default now()
);
create index match_confirmations_user_idx on public.match_confirmations (user_id, status);

-- ───────────────────────────── kudos ─────────────────────────────
-- "Đặt một quân": lời khen nhẹ nhàng cho một ván đã xác nhận.
create table public.kudos (
  match_id   uuid not null references public.matches (id) on delete cascade,
  user_id    uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (match_id, user_id)
);

-- ═════════════════════════ Functions & triggers ═════════════════════════

-- Hồ sơ kỳ thủ của người đang đăng nhập (null nếu chưa đăng nhập).
-- security definer để RLS không cần đọc cột auth_id.
create or replace function public.current_user_id()
returns uuid
language sql stable security definer set search_path = public
as $$ select id from public.users where auth_id = auth.uid() $$;

-- Đăng nhập Google lần đầu: nhận hồ sơ có sẵn theo email, hoặc tạo hồ sơ mới.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  claimed uuid;
begin
  update public.users
     set auth_id = new.id
   where auth_id is null
     and lower(email) = lower(new.email)
  returning id into claimed;

  if claimed is null then
    insert into public.users (auth_id, email, display_name)
    values (
      new.id,
      new.email,
      left(coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''),
                    nullif(new.raw_user_meta_data ->> 'name', ''),
                    split_part(new.email, '@', 1)), 60)
    );
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Kiểm tra ván trước khi lưu: ngày không ở tương lai (cho phép lệch múi giờ 1 ngày).
create or replace function public.validate_match()
returns trigger
language plpgsql
as $$
begin
  if new.played_on > current_date + 1 then
    raise exception 'played_on cannot be in the future';
  end if;
  return new;
end;
$$;

create trigger matches_validate
  before insert on public.matches
  for each row execute function public.validate_match();

-- Tạo yêu cầu xác nhận gửi cho đối thủ ngay khi ván được ghi.
-- Nếu đối thủ chưa có tài khoản (khách / hồ sơ chưa được nhận) thì không ai trả lời được:
-- ván được ghi nhận luôn, không có dòng xác nhận (UI gắn nhãn "đối thủ chưa dùng app").
create or replace function public.create_confirmation_request()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  opponent uuid := case when new.recorded_by = new.black_player then new.white_player else new.black_player end;
  opponent_auth uuid;
begin
  select auth_id into opponent_auth from public.users where id = opponent;

  if opponent_auth is null then
    update public.matches set status = 'confirmed', resolved_at = now() where id = new.id;
  else
    insert into public.match_confirmations (match_id, user_id) values (new.id, opponent);
  end if;
  return new;
end;
$$;

create trigger matches_request_confirmation
  after insert on public.matches
  for each row execute function public.create_confirmation_request();

-- Chỉ trả lời một lần: pending → confirmed | rejected.
create or replace function public.guard_confirmation_response()
returns trigger
language plpgsql
as $$
begin
  if old.status <> 'pending' then
    raise exception 'confirmation already answered';
  end if;
  if new.status = 'pending' then
    raise exception 'confirmation must be confirmed or rejected';
  end if;
  new.responded_at := now();
  return new;
end;
$$;

create trigger confirmations_guard
  before update on public.match_confirmations
  for each row execute function public.guard_confirmation_response();

-- Đồng bộ trạng thái ván theo câu trả lời của đối thủ.
create or replace function public.apply_confirmation_response()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  update public.matches
     set status = new.status, resolved_at = new.responded_at
   where id = new.match_id;
  return new;
end;
$$;

create trigger confirmations_apply
  after update on public.match_confirmations
  for each row execute function public.apply_confirmation_response();

-- ═════════════════════════════ Privileges ═════════════════════════════
-- Email là dữ liệu riêng tư: không cấp quyền SELECT cột email cho client.
-- (Vì vậy phía app luôn liệt kê cột cụ thể, không dùng select('*') trên users.)
revoke all on public.users from anon, authenticated;
grant select (id, display_name, rank_value, club_id, bio, playing_since, is_guest, created_by, created_at)
  on public.users to anon, authenticated;
grant insert (display_name, rank_value, is_guest, created_by)
  on public.users to authenticated;
grant update (display_name, rank_value, club_id, bio, playing_since)
  on public.users to authenticated;

grant select on public.clubs to anon, authenticated;
grant select on public.matches to anon, authenticated;
grant insert, delete on public.matches to authenticated;
grant select, update (status, reason) on public.match_confirmations to authenticated;
grant select on public.kudos to anon, authenticated;
grant insert, delete on public.kudos to authenticated;
grant execute on function public.current_user_id() to anon, authenticated;

-- ═══════════════════════════════ RLS ═══════════════════════════════
alter table public.clubs               enable row level security;
alter table public.users               enable row level security;
alter table public.matches             enable row level security;
alter table public.match_confirmations enable row level security;
alter table public.kudos               enable row level security;

-- clubs: công khai
create policy "clubs are public" on public.clubs
  for select using (true);

-- users: hồ sơ công khai; chỉ chủ hồ sơ được sửa (các cột đã giới hạn bằng GRANT)
create policy "players are public" on public.users
  for select using (true);
create policy "members add guest opponents" on public.users
  for insert to authenticated
  with check (is_guest and created_by = public.current_user_id());
create policy "players edit own profile or their guests" on public.users
  for update to authenticated
  using (id = public.current_user_id() or (is_guest and created_by = public.current_user_id()))
  with check (id = public.current_user_id() or (is_guest and created_by = public.current_user_id()));

-- matches: ván đã xác nhận công khai; ván pending/rejected chỉ hai người chơi thấy
create policy "confirmed matches are public" on public.matches
  for select using (
    status = 'confirmed'
    or black_player = public.current_user_id()
    or white_player = public.current_user_id()
  );
create policy "players record their own matches" on public.matches
  for insert to authenticated
  with check (
    recorded_by = public.current_user_id()
    and status = 'pending'
    and (black_player = recorded_by or white_player = recorded_by)
  );
create policy "recorder cancels unconfirmed matches" on public.matches
  for delete to authenticated
  using (recorded_by = public.current_user_id() and status in ('pending', 'rejected'));

-- match_confirmations: người ghi và đối thủ cùng xem; chỉ đối thủ được trả lời
create policy "participants see confirmations" on public.match_confirmations
  for select to authenticated
  using (
    user_id = public.current_user_id()
    or exists (
      select 1 from public.matches m
      where m.id = match_id and m.recorded_by = public.current_user_id()
    )
  );
create policy "opponent answers confirmation" on public.match_confirmations
  for update to authenticated
  using (user_id = public.current_user_id() and status = 'pending')
  with check (user_id = public.current_user_id() and status in ('confirmed', 'rejected'));

-- kudos: xem công khai; mỗi người đặt/thu hồi quân của mình trên ván đã xác nhận
create policy "kudos are public" on public.kudos
  for select using (true);
create policy "players place their own kudos" on public.kudos
  for insert to authenticated
  with check (
    user_id = public.current_user_id()
    and exists (select 1 from public.matches m where m.id = match_id and m.status = 'confirmed')
  );
create policy "players take back their own kudos" on public.kudos
  for delete to authenticated
  using (user_id = public.current_user_id());
