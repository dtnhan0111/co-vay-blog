/**
 * "Hoạt động gần đây": dựng dòng thời gian cộng đồng từ dữ liệu có thật (ván đã xác nhận + hồ sơ).
 * Không có API riêng, nên đây là lớp dịch vụ thuần ở frontend: sau này thay bằng API chỉ cần
 * trả về cùng kiểu `ActivityEvent`.
 *
 * Các sự kiện:
 *  • match  — một ván vừa được xác nhận
 *  • streak — kỳ thủ chạm mốc chuỗi thắng (3, 5, 7, 10, 15, 20) tại chính ván đó
 *  • joined — kỳ thủ mới vào kỳ quán
 * Chuỗi thắng chỉ tính ván giữa hai thành viên (ván với khách không xác nhận được nên không dùng
 * để "đạt mốc", giống Bảng vàng).
 */
import type { MatchView, Player } from "@/lib/data/types";

export const STREAK_MILESTONES = [3, 5, 7, 10, 15, 20] as const;

export type ActivityEvent =
  | { type: "match"; id: string; at: string; match: MatchView }
  | { type: "streak"; id: string; at: string; player: Player; length: number; match: MatchView }
  | { type: "joined"; id: string; at: string; player: Player };

export type ActivityOptions = {
  /** Chỉ lấy sự kiện trong N ngày gần đây cho "streak" và "joined" (ván thì luôn lấy theo `limit`). */
  recentDays?: number;
  now?: number;
  limit?: number;
};

const DAY = 86_400_000;

/** Thời điểm một ván được xác nhận (ván với khách: lúc ghi). */
export const confirmedAt = (m: Pick<MatchView, "resolved_at" | "created_at">) => m.resolved_at ?? m.created_at;

export function buildActivityFeed(matches: MatchView[], players: Player[], opts: ActivityOptions = {}): ActivityEvent[] {
  const { recentDays = 30, now = Date.now(), limit = 60 } = opts;
  const since = now - recentDays * DAY;
  const events: ActivityEvent[] = [];

  for (const match of matches) {
    if (match.status !== "confirmed") continue;
    events.push({ type: "match", id: `match:${match.id}`, at: confirmedAt(match), match });
  }

  // Chuỗi thắng: duyệt các ván cũ → mới, ghi nhận lúc người thắng chạm đúng một mốc.
  const verified = matches
    .filter((m) => m.status === "confirmed" && !m.black.is_guest && !m.white.is_guest)
    .sort((a, b) => a.played_on.localeCompare(b.played_on) || a.created_at.localeCompare(b.created_at));
  const run = new Map<string, number>();
  for (const m of verified) {
    const loserId = m.winner === m.black.id ? m.white.id : m.black.id;
    run.set(loserId, 0);
    const length = (run.get(m.winner) ?? 0) + 1;
    run.set(m.winner, length);
    if (!(STREAK_MILESTONES as readonly number[]).includes(length)) continue;
    const at = confirmedAt(m);
    if (Date.parse(at) < since) continue;
    const player = m.winner === m.black.id ? m.black : m.white;
    events.push({ type: "streak", id: `streak:${m.id}:${length}`, at, player, length, match: m });
  }

  for (const player of players) {
    if (player.is_guest) continue;
    if (Date.parse(player.created_at) >= since) {
      events.push({ type: "joined", id: `joined:${player.id}`, at: player.created_at, player });
    }
  }

  // Mới nhất trước; cùng thời điểm thì "chuỗi thắng" nằm trên ván tạo ra nó.
  const weight = { streak: 2, match: 1, joined: 0 } as const;
  events.sort((a, b) => Date.parse(b.at) - Date.parse(a.at) || weight[b.type] - weight[a.type]);
  return events.slice(0, limit);
}

/** Sự kiện có liên quan tới kỳ thủ này không (cho tab "Của tôi"). */
export function eventInvolves(e: ActivityEvent, playerId: string): boolean {
  if (e.type === "match") return e.match.black.id === playerId || e.match.white.id === playerId;
  return e.player.id === playerId;
}

/** Sự kiện có thuộc câu lạc bộ này không (cho tab "CLB của tôi"). */
export function eventInClub(e: ActivityEvent, clubId: string): boolean {
  if (e.type === "match") return e.match.club_id === clubId || e.match.black.club_id === clubId || e.match.white.club_id === clubId;
  return e.player.club_id === clubId;
}
