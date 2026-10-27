import type { Enums, Tables, UserPublicRow } from "@/types/database";

export type Player = UserPublicRow;
export type Club = Tables<"clubs">;
/** Hàng `matches` không kèm nội dung SGF (nặng); chỉ `has_sgf` cho biết ván có kỳ phổ. */
export type MatchRow = Omit<Tables<"matches">, "sgf">;
export type MatchStatus = Enums<"match_status">;
export type WinMethod = Enums<"win_method">;
export type StoneColor = "black" | "white";

export type ConfirmationInfo = {
  user_id: string;
  status: MatchStatus;
  reason: string | null;
  responded_at: string | null;
};

/** Một ván đã được "dựng" sẵn cho UI: kèm người chơi, CLB, kudos, xác nhận. */
export type MatchView = MatchRow & {
  black: Player;
  white: Player;
  club: Club | null;
  kudos_count: number;
  kudosed_by_me: boolean;
  confirmation: ConfirmationInfo | null;
  /** Nội dung kỳ phổ SGF — chỉ có khi lấy bằng `getMatch` (trang chi tiết). */
  sgf: string | null;
};

/** Một bình luận trên kỳ phổ của ván, đã ghép tác giả và lượt "đặt một quân". */
export type CommentView = {
  id: string;
  match_id: string;
  body: string;
  /** Gắn với nước thứ mấy của kỳ phổ (null = bình luận chung). */
  move_number: number | null;
  created_at: string;
  author: Player;
  like_count: number;
  liked_by_me: boolean;
};

export type MatchQuery = {
  status?: MatchStatus;
  playerId?: string;
  clubId?: string;
  /** YYYY-MM-DD — chỉ lấy ván từ ngày này trở đi. */
  since?: string;
  limit?: number;
  offset?: number;
};

export type NewMatchInput = {
  opponent_id: string;
  my_color: StoneColor;
  i_won: boolean;
  win_method: WinMethod;
  score_difference: number | null;
  played_on: string;
  location: string;
  club_id: string | null;
  note: string | null;
  board_size: 9 | 13 | 19;
  handicap: number;
  sgf: string | null;
};

export type PlayerPatch = Partial<
  Pick<Player, "display_name" | "rank_value" | "club_id" | "bio" | "playing_since" | "avatar_tone" | "avatar_glyph">
>;

export class DataError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 401 | 403 | 404 | 409 = 400,
  ) {
    super(message);
  }
}

/** Hợp đồng truy cập dữ liệu — hiện thực duy nhất là Supabase (lib/data/supabase.ts). */
export interface Repository {
  /** Kỳ thủ đang đăng nhập, hoặc null. */
  getViewer(): Promise<Player | null>;

  listPlayers(): Promise<Player[]>;
  listClubs(): Promise<Club[]>;

  /** Mặc định chỉ trả ván `confirmed`, mới nhất trước. */
  listMatches(query?: MatchQuery): Promise<MatchView[]>;
  getMatch(id: string): Promise<MatchView | null>;

  /** Lời mời xác nhận đang chờ viewer trả lời. */
  listIncomingRequests(viewerId: string): Promise<MatchView[]>;
  /** Ván viewer đã ghi nhưng chưa được xác nhận (pending/rejected). */
  listOutgoingUnconfirmed(viewerId: string): Promise<MatchView[]>;

  createMatch(input: NewMatchInput, recorderId: string): Promise<MatchView>;
  respondToMatch(
    matchId: string,
    viewerId: string,
    decision: "confirmed" | "rejected",
    reason: string | null,
  ): Promise<MatchView>;
  cancelMatch(matchId: string, viewerId: string): Promise<void>;
  /** Hai người chơi thêm / thay (chuỗi) hoặc gỡ (null) kỳ phổ SGF của ván. */
  setMatchSgf(matchId: string, viewerId: string, sgf: string | null): Promise<void>;
  toggleKudos(matchId: string, viewerId: string): Promise<{ active: boolean; count: number }>;

  /** Bình luận của ván, cũ → mới. */
  listComments(matchId: string): Promise<CommentView[]>;
  addComment(matchId: string, viewerId: string, input: { body: string; move_number: number | null }): Promise<CommentView>;
  /** Tác giả hoặc admin xoá. */
  deleteComment(commentId: string): Promise<void>;
  toggleCommentLike(commentId: string, viewerId: string): Promise<{ active: boolean; count: number }>;
  updatePlayer(id: string, patch: PlayerPatch): Promise<Player>;
  /** Tạo hồ sơ "khách" cho một đối thủ chưa dùng app. */
  createGuest(input: { display_name: string; rank_value: number }, creatorId: string): Promise<Player>;
}
