/**
 * Sinh supabase/seed.sql từ cùng nguồn dữ liệu mẫu với demo mode.
 *   npm run seed:sql
 *
 * Ngày được ghi dưới dạng `current_date - N` nên dữ liệu luôn "mới" vào lúc chạy seed.
 * Seed chạy với session_replication_role = replica để bỏ qua trigger (ván & xác nhận
 * được chèn thẳng ở trạng thái cuối, kèm thời điểm trả lời thực tế).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { SEED_CLUBS, SEED_KUDOS, SEED_MATCHES, SEED_PLAYERS, seedId } from "../src/lib/seed/source";

const q = (value: string | null) => (value === null ? "null" : `'${value.replace(/'/g, "''")}'`);
const n = (value: number | null) => (value === null ? "null" : String(value));
const clubId = (slug: string | null) => (slug ? q(seedId("b", SEED_CLUBS.find((c) => c.slug === slug)!.n)) : "null");
const stamp = (daysAgo: number, minutes: number) => `((current_date - ${daysAgo}) + interval '${minutes} minutes')::timestamptz`;

const lines: string[] = [];
const push = (s = "") => lines.push(s);

push("-- Go Đà Nẵng — dữ liệu mẫu HƯ CẤU (tên người, CLB, địa điểm đều là giả định).");
push("-- File này được sinh tự động bởi `npm run seed:sql` — đừng sửa tay.");
push("-- Mẹo: để đăng nhập Google và nhận lại một hồ sơ mẫu, đổi email của dòng đó thành email Google của bạn:");
push("--   update public.users set email = 'ban@gmail.com' where display_name = 'Nguyễn Thị Thu Hiền';");
push();
push("set session_replication_role = replica;");
push();

push("insert into public.clubs (id, slug, name, description, address, meets_at, created_at) values");
push(
  SEED_CLUBS.map(
    (c) => `  (${q(seedId("b", c.n))}, ${q(c.slug)}, ${q(c.name)}, ${q(c.description)}, ${q(c.address)}, ${q(c.meets_at)}, now() - interval '300 days')`,
  ).join(",\n") + ";",
);
push();

push("insert into public.users (id, email, display_name, rank_value, club_id, bio, playing_since, created_at) values");
push(
  SEED_PLAYERS.map(
    (p) =>
      `  (${q(seedId("a", p.n))}, ${q(p.email)}, ${q(p.name)}, ${p.rank}, ${clubId(p.club)}, ${q(p.bio)}, ${p.since}, now() - interval '260 days')`,
  ).join(",\n") + ";",
);
push();

push("insert into public.matches (id, black_player, white_player, winner, win_method, score_difference, played_on, location, club_id, note, board_size, handicap, status, recorded_by, created_at, resolved_at) values");
push(
  SEED_MATCHES.map((m) => {
    const resolved = m.status === "pending" ? "null" : stamp(m.daysAgo, m.createdMin + m.respondedAfterMin);
    return `  (${q(seedId("c", m.n))}, ${q(seedId("a", m.black))}, ${q(seedId("a", m.white))}, ${q(seedId("a", m.winner))}, '${m.method}', ${n(m.score)}, current_date - ${m.daysAgo}, ${q(m.location)}, ${clubId(m.club)}, ${q(m.note)}, ${m.boardSize}, ${m.handicap}, '${m.status}', ${q(seedId("a", m.recordedBy))}, ${stamp(m.daysAgo, m.createdMin)}, ${resolved})`;
  }).join(",\n") + ";",
);
push();

push("insert into public.match_confirmations (id, match_id, user_id, status, reason, responded_at, created_at) values");
push(
  SEED_MATCHES.map((m) => {
    const opponent = m.recordedBy === m.black ? m.white : m.black;
    const responded = m.status === "pending" ? "null" : stamp(m.daysAgo, m.createdMin + m.respondedAfterMin);
    return `  (${q(seedId("d", m.n))}, ${q(seedId("c", m.n))}, ${q(seedId("a", opponent))}, '${m.status}', ${q(m.reason)}, ${responded}, ${stamp(m.daysAgo, m.createdMin)})`;
  }).join(",\n") + ";",
);
push();

push("insert into public.kudos (match_id, user_id, created_at) values");
push(SEED_KUDOS.map((k) => `  (${q(seedId("c", k.match))}, ${q(seedId("a", k.player))}, now())`).join(",\n") + ";");
push();
push("set session_replication_role = default;");
push();

const out = resolve(__dirname, "../supabase/seed.sql");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, lines.join("\n"));
console.log(`Wrote ${out} — ${SEED_CLUBS.length} clubs, ${SEED_PLAYERS.length} players, ${SEED_MATCHES.length} matches, ${SEED_KUDOS.length} kudos.`);
