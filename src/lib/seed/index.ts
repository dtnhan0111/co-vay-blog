import { addDays } from "@/lib/format";
import type { Club, ConfirmationInfo, MatchRow, Player } from "@/lib/data/types";
import { SEED_CLUBS, SEED_KUDOS, SEED_MATCHES, SEED_PLAYERS, seedId } from "./source";

export type DemoSeed = {
  clubs: Club[];
  players: Player[];
  emails: Map<string, string>;
  matches: MatchRow[];
  confirmations: Map<string, ConfirmationInfo>;
  kudos: Set<string>; // `${matchId}:${userId}`
};

function atMinute(date: string, minutes: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + minutes * 60_000).toISOString();
}

/** Biến dữ liệu mẫu thành các bản ghi có ngày cụ thể, tính từ `today` (YYYY-MM-DD). */
export function materializeSeed(today: string): DemoSeed {
  const clubIdBySlug = new Map(SEED_CLUBS.map((c) => [c.slug, seedId("b", c.n)]));
  const joined = atMinute(addDays(today, -260), 0);

  const clubs: Club[] = SEED_CLUBS.map((c) => ({
    id: seedId("b", c.n),
    slug: c.slug,
    name: c.name,
    description: c.description,
    address: c.address,
    meets_at: c.meets_at,
    created_at: atMinute(addDays(today, -300), 0),
  }));

  const emails = new Map<string, string>();
  const players: Player[] = SEED_PLAYERS.map((p) => {
    const id = seedId("a", p.n);
    emails.set(id, p.email);
    return {
      id,
      display_name: p.name,
      rank_value: p.rank,
      club_id: clubIdBySlug.get(p.club) ?? null,
      bio: p.bio,
      playing_since: p.since,
      created_at: joined,
    };
  });

  const matches: MatchRow[] = [];
  const confirmations = new Map<string, ConfirmationInfo>();
  for (const m of SEED_MATCHES) {
    const id = seedId("c", m.n);
    const playedOn = addDays(today, -m.daysAgo);
    const createdAt = atMinute(playedOn, m.createdMin);
    const opponent = m.recordedBy === m.black ? m.white : m.black;
    const resolvedAt = m.status === "pending" ? null : atMinute(playedOn, m.createdMin + m.respondedAfterMin);

    matches.push({
      id,
      black_player: seedId("a", m.black),
      white_player: seedId("a", m.white),
      winner: seedId("a", m.winner),
      win_method: m.method,
      score_difference: m.score,
      played_on: playedOn,
      location: m.location,
      club_id: m.club ? (clubIdBySlug.get(m.club) ?? null) : null,
      note: m.note,
      board_size: m.boardSize,
      handicap: m.handicap,
      status: m.status,
      recorded_by: seedId("a", m.recordedBy),
      created_at: createdAt,
      resolved_at: resolvedAt,
    });
    confirmations.set(id, {
      user_id: seedId("a", opponent),
      status: m.status,
      reason: m.reason,
      responded_at: resolvedAt,
    });
  }

  const kudos = new Set(SEED_KUDOS.map((k) => `${seedId("c", k.match)}:${seedId("a", k.player)}`));
  return { clubs, players, emails, matches, confirmations, kudos };
}
