import { cookies } from "next/headers";
import { todayVN } from "@/lib/format";
import { materializeSeed, type DemoSeed } from "@/lib/seed";
import {
  DataError,
  type Club,
  type MatchQuery,
  type MatchRow,
  type MatchView,
  type NewMatchInput,
  type Player,
  type PlayerPatch,
  type Repository,
} from "./types";

export const DEMO_COOKIE = "go_demo_user";

/**
 * Demo mode: dữ liệu sống trong bộ nhớ của tiến trình (reset khi restart server).
 * Hành vi bám sát RLS của Supabase: người ngoài không thấy ván chưa xác nhận,
 * chỉ đối thủ mới được trả lời, chỉ người ghi mới được huỷ.
 */
const globalForDemo = globalThis as unknown as { __goDemo?: DemoSeed };

function store(): DemoSeed {
  return (globalForDemo.__goDemo ??= materializeSeed(todayVN()));
}

async function viewerId(): Promise<string | null> {
  const id = (await cookies()).get(DEMO_COOKIE)?.value;
  return id && store().players.some((p) => p.id === id) ? id : null;
}

function enrich(row: MatchRow, viewer: string | null): MatchView {
  const s = store();
  const players = new Map(s.players.map((p) => [p.id, p]));
  const clubs = new Map(s.clubs.map((c) => [c.id, c]));
  const prefix = `${row.id}:`;
  let kudosCount = 0;
  for (const key of s.kudos) if (key.startsWith(prefix)) kudosCount++;

  return {
    ...row,
    black: players.get(row.black_player)!,
    white: players.get(row.white_player)!,
    club: row.club_id ? (clubs.get(row.club_id) ?? null) : null,
    kudos_count: kudosCount,
    kudosed_by_me: viewer ? s.kudos.has(`${row.id}:${viewer}`) : false,
    confirmation: s.confirmations.get(row.id) ?? null,
  };
}

const newestFirst = (a: MatchRow, b: MatchRow) =>
  b.played_on.localeCompare(a.played_on) || b.created_at.localeCompare(a.created_at);

const isParticipant = (m: MatchRow, id: string | null) => !!id && (m.black_player === id || m.white_player === id);

export const demoRepository: Repository = {
  mode: "demo",

  async getViewer() {
    const id = await viewerId();
    return id ? (store().players.find((p) => p.id === id) ?? null) : null;
  },

  async listPlayers() {
    return [...store().players];
  },

  async listClubs() {
    return [...store().clubs];
  },

  async listMatches(query: MatchQuery = {}) {
    const viewer = await viewerId();
    const status = query.status ?? "confirmed";
    let rows = store().matches.filter((m) => m.status === status);
    // Giống RLS: ván chưa xác nhận chỉ hai người chơi nhìn thấy.
    if (status !== "confirmed") rows = rows.filter((m) => isParticipant(m, viewer));
    if (query.playerId) rows = rows.filter((m) => isParticipant(m, query.playerId!));
    if (query.clubId) rows = rows.filter((m) => m.club_id === query.clubId);
    if (query.since) rows = rows.filter((m) => m.played_on >= query.since!);
    rows = rows.sort(newestFirst);
    const offset = query.offset ?? 0;
    rows = rows.slice(offset, query.limit ? offset + query.limit : undefined);
    return rows.map((m) => enrich(m, viewer));
  },

  async getMatch(id) {
    const viewer = await viewerId();
    const row = store().matches.find((m) => m.id === id);
    if (!row || (row.status !== "confirmed" && !isParticipant(row, viewer))) return null;
    return enrich(row, viewer);
  },

  async listIncomingRequests(viewer) {
    const s = store();
    return s.matches
      .filter((m) => {
        const c = s.confirmations.get(m.id);
        return m.status === "pending" && c?.user_id === viewer && c.status === "pending";
      })
      .sort(newestFirst)
      .map((m) => enrich(m, viewer));
  },

  async listOutgoingUnconfirmed(viewer) {
    return store()
      .matches.filter((m) => m.recorded_by === viewer && m.status !== "confirmed")
      .sort(newestFirst)
      .map((m) => enrich(m, viewer));
  },

  async createMatch(input: NewMatchInput, recorderId) {
    const s = store();
    if (input.opponent_id === recorderId) throw new DataError("Bạn không thể đánh cờ với chính mình.");
    if (!s.players.some((p) => p.id === input.opponent_id)) throw new DataError("Không tìm thấy đối thủ.", 404);
    if (input.club_id && !s.clubs.some((c) => c.id === input.club_id)) throw new DataError("Không tìm thấy CLB.", 404);

    const [black, white] =
      input.my_color === "black" ? [recorderId, input.opponent_id] : [input.opponent_id, recorderId];
    const now = new Date().toISOString();
    const row: MatchRow = {
      id: crypto.randomUUID(),
      black_player: black,
      white_player: white,
      winner: input.i_won ? recorderId : input.opponent_id,
      win_method: input.win_method,
      score_difference: input.win_method === "points" ? input.score_difference : null,
      played_on: input.played_on,
      location: input.location,
      club_id: input.club_id,
      note: input.note,
      board_size: input.board_size,
      handicap: input.handicap,
      status: "pending",
      recorded_by: recorderId,
      created_at: now,
      resolved_at: null,
    };
    s.matches.push(row);
    s.confirmations.set(row.id, { user_id: input.opponent_id, status: "pending", reason: null, responded_at: null });
    return enrich(row, recorderId);
  },

  async respondToMatch(matchId, viewer, decision, reason) {
    const s = store();
    const row = s.matches.find((m) => m.id === matchId);
    const confirmation = s.confirmations.get(matchId);
    if (!row || !confirmation) throw new DataError("Không tìm thấy ván này.", 404);
    if (confirmation.user_id !== viewer) throw new DataError("Chỉ đối thủ mới có thể xác nhận ván này.", 403);
    if (confirmation.status !== "pending") throw new DataError("Ván này đã được trả lời rồi.", 409);

    const now = new Date().toISOString();
    s.confirmations.set(matchId, { ...confirmation, status: decision, reason, responded_at: now });
    row.status = decision;
    row.resolved_at = now;
    return enrich(row, viewer);
  },

  async cancelMatch(matchId, viewer) {
    const s = store();
    const idx = s.matches.findIndex((m) => m.id === matchId);
    if (idx < 0) throw new DataError("Không tìm thấy ván này.", 404);
    const row = s.matches[idx];
    if (row.recorded_by !== viewer) throw new DataError("Chỉ người ghi ván mới có thể huỷ.", 403);
    if (row.status === "confirmed") throw new DataError("Ván đã xác nhận không thể huỷ.", 409);
    s.matches.splice(idx, 1);
    s.confirmations.delete(matchId);
  },

  async toggleKudos(matchId, viewer) {
    const s = store();
    const row = s.matches.find((m) => m.id === matchId);
    if (!row || row.status !== "confirmed") throw new DataError("Không tìm thấy ván này.", 404);
    const key = `${matchId}:${viewer}`;
    const active = !s.kudos.has(key);
    if (active) s.kudos.add(key);
    else s.kudos.delete(key);
    return { active, count: enrich(row, viewer).kudos_count };
  },

  async updatePlayer(id, patch: PlayerPatch) {
    const s = store();
    const idx = s.players.findIndex((p) => p.id === id);
    if (idx < 0) throw new DataError("Không tìm thấy kỳ thủ.", 404);
    if (patch.club_id && !s.clubs.some((c: Club) => c.id === patch.club_id)) throw new DataError("Không tìm thấy CLB.", 404);
    const next: Player = { ...s.players[idx], ...patch };
    s.players[idx] = next;
    return next;
  },
};
