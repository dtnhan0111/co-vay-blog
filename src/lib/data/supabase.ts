import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { USER_PUBLIC_COLUMNS } from "@/types/database";
import {
  DataError,
  type Club,
  type ConfirmationInfo,
  type MatchQuery,
  type MatchRow,
  type MatchView,
  type NewMatchInput,
  type Player,
  type PlayerPatch,
  type Repository,
} from "./types";

const PAGE = 1000; // giới hạn mặc định của PostgREST

// Liệt kê cột thay vì "*" để danh sách ván không kéo theo nội dung SGF (tới 200 KB mỗi ván).
const MATCH_COLUMNS =
  "id, black_player, white_player, winner, win_method, score_difference, played_on, location, club_id, note, board_size, handicap, status, recorded_by, created_at, resolved_at, has_sgf";
const RELATIONS = "kudos(user_id), match_confirmations(user_id, status, reason, responded_at)";
const MATCH_SELECT = `${MATCH_COLUMNS}, ${RELATIONS}`;
const MATCH_DETAIL_SELECT = `${MATCH_COLUMNS}, sgf, ${RELATIONS}`;

type MatchWithRelations = MatchRow & {
  sgf?: string | null;
  kudos: { user_id: string }[] | null;
  match_confirmations: ConfirmationInfo | ConfirmationInfo[] | null;
};

/** Danh bạ kỳ thủ & CLB nhỏ, nên nạp một lần mỗi request rồi ghép trong bộ nhớ. */
const loadDirectory = cache(async () => {
  const supabase = await createClient();
  const [players, clubs] = await Promise.all([
    supabase.from("users").select(USER_PUBLIC_COLUMNS).order("display_name"),
    supabase.from("clubs").select("*").order("name"),
  ]);
  if (players.error) throw new Error(players.error.message);
  if (clubs.error) throw new Error(clubs.error.message);
  return { players: players.data as Player[], clubs: clubs.data as Club[] };
});

const loadViewer = cache(async (): Promise<Player | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: id } = await supabase.rpc("current_user_id");
  if (!id) return null;
  const { players } = await loadDirectory();
  return players.find((p) => p.id === id) ?? null;
});

async function toView(row: MatchWithRelations): Promise<MatchView> {
  const [{ players, clubs }, viewer] = await Promise.all([loadDirectory(), loadViewer()]);
  const byId = new Map(players.map((p) => [p.id, p]));
  const { kudos, match_confirmations, sgf, ...match } = row;
  const confirmation = Array.isArray(match_confirmations) ? (match_confirmations[0] ?? null) : match_confirmations;
  return {
    ...match,
    black: byId.get(match.black_player)!,
    white: byId.get(match.white_player)!,
    club: clubs.find((c) => c.id === match.club_id) ?? null,
    kudos_count: kudos?.length ?? 0,
    kudosed_by_me: !!viewer && !!kudos?.some((k) => k.user_id === viewer.id),
    confirmation,
    sgf: sgf ?? null,
  };
}

function fail(error: { code?: string; message: string }): never {
  if (error.code === "42501") throw new DataError("Bạn không có quyền thực hiện thao tác này.", 403);
  if (error.code === "23514" || error.code === "23502" || error.code === "P0001") throw new DataError(error.message);
  throw new Error(error.message);
}

export const supabaseRepository: Repository = {
  getViewer: loadViewer,

  async listPlayers() {
    return (await loadDirectory()).players;
  },

  async listClubs() {
    return (await loadDirectory()).clubs;
  },

  async listMatches(query: MatchQuery = {}) {
    const supabase = await createClient();
    const wanted = query.limit ?? Infinity;
    const start = query.offset ?? 0;
    const rows: MatchWithRelations[] = [];

    // Không giới hạn → đọc từng trang 1000 ván để thống kê không bị cắt.
    while (rows.length < wanted) {
      const from = start + rows.length;
      const size = Math.min(PAGE, wanted - rows.length);
      let q = supabase
        .from("matches")
        .select(MATCH_SELECT)
        .eq("status", query.status ?? "confirmed")
        .order("played_on", { ascending: false })
        .order("created_at", { ascending: false })
        .range(from, from + size - 1);
      if (query.playerId) q = q.or(`black_player.eq.${query.playerId},white_player.eq.${query.playerId}`);
      if (query.clubId) q = q.eq("club_id", query.clubId);
      if (query.since) q = q.gte("played_on", query.since);

      const { data, error } = await q;
      if (error) fail(error);
      rows.push(...(data as unknown as MatchWithRelations[]));
      if (data.length < size) break;
    }
    return Promise.all(rows.map(toView));
  },

  async getMatch(id) {
    const supabase = await createClient();
    const { data, error } = await supabase.from("matches").select(MATCH_DETAIL_SELECT).eq("id", id).maybeSingle();
    if (error) fail(error);
    return data ? toView(data as unknown as MatchWithRelations) : null;
  },

  async listIncomingRequests(viewerId) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("match_confirmations")
      .select("match_id")
      .eq("user_id", viewerId)
      .eq("status", "pending");
    if (error) fail(error);
    if (!data.length) return [];
    const { data: rows, error: matchError } = await supabase
      .from("matches")
      .select(MATCH_SELECT)
      .in("id", data.map((c) => c.match_id))
      .order("played_on", { ascending: false });
    if (matchError) fail(matchError);
    return Promise.all((rows as unknown as MatchWithRelations[]).map(toView));
  },

  async listOutgoingUnconfirmed(viewerId) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("matches")
      .select(MATCH_SELECT)
      .eq("recorded_by", viewerId)
      .neq("status", "confirmed")
      .order("created_at", { ascending: false });
    if (error) fail(error);
    return Promise.all((data as unknown as MatchWithRelations[]).map(toView));
  },

  async createMatch(input: NewMatchInput, recorderId) {
    if (input.opponent_id === recorderId) throw new DataError("Bạn không thể đánh cờ với chính mình.");
    const supabase = await createClient();
    const [black, white] =
      input.my_color === "black" ? [recorderId, input.opponent_id] : [input.opponent_id, recorderId];
    const { data, error } = await supabase
      .from("matches")
      .insert({
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
        sgf: input.sgf,
        recorded_by: recorderId,
      })
      .select("id")
      .single();
    if (error) fail(error);
    // Trigger có thể đã tự xác nhận ván (đối thủ là khách), nên đọc lại trạng thái cuối.
    const created = await this.getMatch(data.id);
    if (!created) throw new Error("Không đọc lại được ván vừa ghi.");
    return created;
  },

  async respondToMatch(matchId, viewerId, decision, reason) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("match_confirmations")
      .update({ status: decision, reason })
      .eq("match_id", matchId)
      .eq("user_id", viewerId)
      .eq("status", "pending")
      .select("match_id");
    if (error) fail(error);
    if (!data.length) {
      // Phân biệt: không có ván / không phải đối thủ / đã trả lời.
      const { data: existing } = await supabase
        .from("match_confirmations")
        .select("user_id, status")
        .eq("match_id", matchId)
        .maybeSingle();
      if (!existing) throw new DataError("Không tìm thấy ván này.", 404);
      if (existing.user_id !== viewerId) throw new DataError("Chỉ đối thủ mới có thể xác nhận ván này.", 403);
      throw new DataError("Ván này đã được trả lời rồi.", 409);
    }
    const match = await this.getMatch(matchId);
    if (!match) throw new DataError("Không tìm thấy ván này.", 404);
    return match;
  },

  async cancelMatch(matchId, viewerId) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("matches")
      .delete()
      .eq("id", matchId)
      .eq("recorded_by", viewerId)
      .neq("status", "confirmed")
      .select("id");
    if (error) fail(error);
    if (!data.length) {
      const existing = await this.getMatch(matchId);
      if (!existing) throw new DataError("Không tìm thấy ván này.", 404);
      if (existing.recorded_by !== viewerId) throw new DataError("Chỉ người ghi ván mới có thể huỷ.", 403);
      throw new DataError("Ván đã xác nhận không thể huỷ.", 409);
    }
  },

  async setMatchSgf(matchId, viewerId, sgf) {
    const supabase = await createClient();
    const { data, error } = await supabase.from("matches").update({ sgf }).eq("id", matchId).select("id");
    if (error) fail(error);
    if (!data.length) {
      const existing = await this.getMatch(matchId);
      if (!existing) throw new DataError("Không tìm thấy ván này.", 404);
      throw new DataError("Chỉ hai người chơi của ván này hoặc quản trị viên mới được thêm kỳ phổ.", 403);
    }
  },

  async toggleKudos(matchId, viewerId) {
    const supabase = await createClient();
    const { data: existing, error } = await supabase
      .from("kudos")
      .select("match_id")
      .eq("match_id", matchId)
      .eq("user_id", viewerId)
      .maybeSingle();
    if (error) fail(error);

    const active = !existing;
    const write = active
      ? await supabase.from("kudos").insert({ match_id: matchId, user_id: viewerId })
      : await supabase.from("kudos").delete().eq("match_id", matchId).eq("user_id", viewerId);
    if (write.error) {
      if (write.error.code === "42501") throw new DataError("Không tìm thấy ván này.", 404);
      fail(write.error);
    }

    const { count } = await supabase.from("kudos").select("match_id", { count: "exact", head: true }).eq("match_id", matchId);
    return { active, count: count ?? 0 };
  },

  async updatePlayer(id, patch: PlayerPatch) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("users")
      .update(patch)
      .eq("id", id)
      .select(USER_PUBLIC_COLUMNS)
      .maybeSingle();
    if (error) fail(error);
    if (!data) throw new DataError("Không thể cập nhật hồ sơ này.", 403);
    return data as Player;
  },

  async createGuest(input, creatorId) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("users")
      .insert({ ...input, is_guest: true, created_by: creatorId })
      .select(USER_PUBLIC_COLUMNS)
      .single();
    if (error) fail(error);
    return data as Player;
  },
};
