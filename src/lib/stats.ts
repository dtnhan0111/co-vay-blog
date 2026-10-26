/**
 * Mọi con số trong app đều tính ở đây, bằng hàm thuần trên danh sách ván ĐÃ XÁC NHẬN.
 * Profile, Đối đầu, Thống kê và API dùng chung → không có hai cách tính khác nhau.
 */
import { addDays, daysBetween } from "@/lib/format";
import type { Club, MatchRow, Player, WinMethod } from "@/lib/data/types";

type Played = Pick<
  MatchRow,
  | "id"
  | "black_player"
  | "white_player"
  | "winner"
  | "win_method"
  | "score_difference"
  | "played_on"
  | "created_at"
  | "handicap"
  | "club_id"
  | "location"
>;

// ───────────────────────────── helpers ─────────────────────────────

export const involves = (m: Played, id: string) => m.black_player === id || m.white_player === id;
export const opponentOf = (m: Played, id: string) => (m.black_player === id ? m.white_player : m.black_player);
export const didWin = (m: Played, id: string) => m.winner === id;
export const loserOf = (m: Played) => (m.winner === m.black_player ? m.white_player : m.black_player);

/** Cũ → mới (cùng ngày thì theo lúc ghi). */
export function chronological<T extends Played>(matches: T[]): T[] {
  return [...matches].sort(
    (a, b) => a.played_on.localeCompare(b.played_on) || a.created_at.localeCompare(b.created_at),
  );
}

const mean = (values: number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : null);
const rate = (wins: number, games: number) => (games ? wins / games : 0);

// ────────────────────────────── player ──────────────────────────────

export type Streak = { won: boolean; length: number };

export type PlayerStats = {
  games: number;
  wins: number;
  losses: number;
  winRate: number;
  currentStreak: Streak | null;
  bestWinStreak: number;
  /** 10 ván gần nhất, cũ → mới. true = thắng. */
  form: { matchId: string; won: boolean }[];
  asBlack: { games: number; wins: number };
  asWhite: { games: number; wins: number };
  byMethod: Record<WinMethod, { wins: number; losses: number }>;
  avgWinMargin: number | null;
  avgLossMargin: number | null;
  handicapGames: number;
  lastPlayedOn: string | null;
};

export function playerStats(playerId: string, matches: Played[]): PlayerStats {
  const mine = chronological(matches.filter((m) => involves(m, playerId)));

  const stats: PlayerStats = {
    games: mine.length,
    wins: 0,
    losses: 0,
    winRate: 0,
    currentStreak: null,
    bestWinStreak: 0,
    form: [],
    asBlack: { games: 0, wins: 0 },
    asWhite: { games: 0, wins: 0 },
    byMethod: {
      points: { wins: 0, losses: 0 },
      resign: { wins: 0, losses: 0 },
      time: { wins: 0, losses: 0 },
    },
    avgWinMargin: null,
    avgLossMargin: null,
    handicapGames: 0,
    lastPlayedOn: mine.at(-1)?.played_on ?? null,
  };

  const winMargins: number[] = [];
  const lossMargins: number[] = [];
  let run = 0;

  for (const m of mine) {
    const won = didWin(m, playerId);
    const bucket = m.black_player === playerId ? stats.asBlack : stats.asWhite;
    bucket.games++;
    if (won) {
      stats.wins++;
      bucket.wins++;
      stats.byMethod[m.win_method].wins++;
      if (m.win_method === "points" && m.score_difference != null) winMargins.push(m.score_difference);
      run++;
      stats.bestWinStreak = Math.max(stats.bestWinStreak, run);
    } else {
      stats.losses++;
      stats.byMethod[m.win_method].losses++;
      if (m.win_method === "points" && m.score_difference != null) lossMargins.push(m.score_difference);
      run = 0;
    }
    if (m.handicap > 0) stats.handicapGames++;
  }

  stats.winRate = rate(stats.wins, stats.games);
  stats.avgWinMargin = mean(winMargins);
  stats.avgLossMargin = mean(lossMargins);
  stats.form = mine.slice(-10).map((m) => ({ matchId: m.id, won: didWin(m, playerId) }));

  if (mine.length) {
    const lastWon = didWin(mine.at(-1)!, playerId);
    let length = 0;
    for (let i = mine.length - 1; i >= 0 && didWin(mine[i], playerId) === lastWon; i--) length++;
    stats.currentStreak = { won: lastWon, length };
  }
  return stats;
}

export type OpponentRecord = { opponentId: string; games: number; wins: number; losses: number; lastPlayedOn: string };

export function topOpponents(playerId: string, matches: Played[], limit = 5): OpponentRecord[] {
  const byOpponent = new Map<string, OpponentRecord>();
  for (const m of chronological(matches.filter((x) => involves(x, playerId)))) {
    const opponentId = opponentOf(m, playerId);
    const rec = byOpponent.get(opponentId) ?? { opponentId, games: 0, wins: 0, losses: 0, lastPlayedOn: m.played_on };
    rec.games++;
    if (didWin(m, playerId)) rec.wins++;
    else rec.losses++;
    rec.lastPlayedOn = m.played_on;
    byOpponent.set(opponentId, rec);
  }
  return [...byOpponent.values()]
    .sort((a, b) => b.games - a.games || b.lastPlayedOn.localeCompare(a.lastPlayedOn))
    .slice(0, limit);
}

export function favoriteVenues(playerId: string, matches: Played[], limit = 3) {
  const count = new Map<string, number>();
  for (const m of matches) if (involves(m, playerId)) count.set(m.location, (count.get(m.location) ?? 0) + 1);
  return [...count.entries()]
    .map(([location, games]) => ({ location, games }))
    .sort((a, b) => b.games - a.games)
    .slice(0, limit);
}

export type ActivityCell = { date: string; games: number; wins: number; losses: number };

/** 361 ngày gần nhất (= 19×19 giao điểm), cũ → mới, ngày cuối là `today`. */
export const ACTIVITY_DAYS = 361;

export function activityBoard(playerId: string, matches: Played[], today: string): ActivityCell[] {
  const start = addDays(today, -(ACTIVITY_DAYS - 1));
  const cells: ActivityCell[] = Array.from({ length: ACTIVITY_DAYS }, (_, i) => ({
    date: addDays(start, i),
    games: 0,
    wins: 0,
    losses: 0,
  }));
  for (const m of matches) {
    if (!involves(m, playerId)) continue;
    const idx = daysBetween(start, m.played_on);
    if (idx < 0 || idx >= ACTIVITY_DAYS) continue;
    const cell = cells[idx];
    cell.games++;
    if (didWin(m, playerId)) cell.wins++;
    else cell.losses++;
  }
  return cells;
}

// ─────────────────────────── head-to-head ───────────────────────────

export type HeadToHead = {
  games: number;
  aWins: number;
  bWins: number;
  aAsBlack: { games: number; aWins: number };
  aAsWhite: { games: number; aWins: number };
  avgMarginA: number | null; // trung bình điểm hơn của A trong các ván A thắng điểm
  avgMarginB: number | null;
  /** Chuỗi thắng hiện tại trong các lần gặp nhau. */
  streak: { holderId: string; length: number } | null;
  lastMeeting: string | null;
  /** Mới → cũ. */
  matches: Played[];
};

export function headToHead(aId: string, bId: string, matches: Played[]): HeadToHead {
  const between = chronological(matches.filter((m) => involves(m, aId) && involves(m, bId)));

  const marginsA: number[] = [];
  const marginsB: number[] = [];
  const h2h: HeadToHead = {
    games: between.length,
    aWins: 0,
    bWins: 0,
    aAsBlack: { games: 0, aWins: 0 },
    aAsWhite: { games: 0, aWins: 0 },
    avgMarginA: null,
    avgMarginB: null,
    streak: null,
    lastMeeting: between.at(-1)?.played_on ?? null,
    matches: [...between].reverse(),
  };

  for (const m of between) {
    const aWon = m.winner === aId;
    if (aWon) h2h.aWins++;
    else h2h.bWins++;
    const bucket = m.black_player === aId ? h2h.aAsBlack : h2h.aAsWhite;
    bucket.games++;
    if (aWon) bucket.aWins++;
    if (m.win_method === "points" && m.score_difference != null) (aWon ? marginsA : marginsB).push(m.score_difference);
  }
  h2h.avgMarginA = mean(marginsA);
  h2h.avgMarginB = mean(marginsB);

  if (between.length) {
    const holderId = between.at(-1)!.winner;
    let length = 0;
    for (let i = between.length - 1; i >= 0 && between[i].winner === holderId; i--) length++;
    h2h.streak = { holderId, length };
  }
  return h2h;
}

/** Câu tóm tắt tự nhiên cho trang Đối đầu. */
export function headToHeadSummary(h: HeadToHead, a: Pick<Player, "id" | "display_name">, b: Pick<Player, "id" | "display_name">) {
  if (h.games === 0) return `${a.display_name} và ${b.display_name} chưa có ván nào được ghi lại với nhau.`;
  const [leader, trailer, lead, trail] =
    h.aWins === h.bWins
      ? [null, null, h.aWins, h.bWins]
      : h.aWins > h.bWins
        ? [a, b, h.aWins, h.bWins]
        : [b, a, h.bWins, h.aWins];

  const score = leader
    ? `${leader.display_name} dẫn ${lead}–${trail}`
    : `${a.display_name} và ${b.display_name} đang hoà ${lead}–${trail}`;
  const holder = h.streak && h.streak.length >= 2 ? (h.streak.holderId === a.id ? a : b) : null;
  const streak = holder ? `, ${holder.display_name} đang thắng ${h.streak!.length} ván liên tiếp` : "";
  const comeback =
    trailer && h.streak && h.streak.holderId === trailer.id && h.streak.length === 1
      ? `, nhưng ${trailer.display_name} vừa thắng ván gần nhất`
      : "";
  return `${score}${streak}${comeback}.`;
}

// ──────────────────────────── community ────────────────────────────

export type RankFn = (playerId: string) => number;

/** "Lật kèo": ván đấu đều (không chấp) mà bên hạng thấp hơn thắng. Trả về số hạng chênh. */
export function upsetGap(m: Played, rankOf: RankFn): number {
  if (m.handicap > 0) return 0;
  const gap = rankOf(loserOf(m)) - rankOf(m.winner);
  return gap > 0 ? gap : 0;
}

export const BIG_WIN_MARGIN = 20;

export function isBigWin(m: Pick<MatchRow, "win_method" | "score_difference">) {
  return m.win_method === "points" && (m.score_difference ?? 0) >= BIG_WIN_MARGIN;
}

export type CommunityStats = {
  totalMatches: number;
  activePlayers: number;
  totalPlayers: number;
  totalClubs: number;
  matchesLast7Days: number;
  /** 12 tuần gần nhất, cũ → mới (không phụ thuộc bộ lọc thời gian). */
  weekly: { weekStart: string; count: number }[];
  methods: Record<WinMethod, number>;
  blackWins: number;
  whiteWins: number;
  evenGames: number;
  avgMargin: number | null;
  mostActive: { playerId: string; games: number }[];
  bestWinRate: { playerId: string; games: number; winRate: number }[];
  longestStreaks: { playerId: string; length: number; ongoing: boolean }[];
  upsets: { match: Played; gap: number }[];
  bigWins: Played[];
  rankDistribution: { rank: number; count: number }[];
  clubActivity: { clubId: string; games: number; members: number }[];
  venues: { location: string; games: number }[];
};

export const MIN_GAMES_FOR_WIN_RATE = 5;
export const WEEKS_SHOWN = 12;

function mondayOf(date: string): string {
  const dow = (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7;
  return addDays(date, -dow);
}

export function communityStats(
  allMatches: Played[],
  players: Player[],
  clubs: Club[],
  today: string,
  since?: string,
): CommunityStats {
  const rankById = new Map(players.map((p) => [p.id, p.rank_value]));
  const rankOf: RankFn = (id) => rankById.get(id) ?? 0;
  const matches = since ? allMatches.filter((m) => m.played_on >= since) : allMatches;

  // nhịp độ theo tuần
  const thisMonday = mondayOf(today);
  const weekly = Array.from({ length: WEEKS_SHOWN }, (_, i) => ({
    weekStart: addDays(thisMonday, -7 * (WEEKS_SHOWN - 1 - i)),
    count: 0,
  }));
  for (const m of allMatches) {
    const idx = daysBetween(weekly[0].weekStart, m.played_on);
    const week = Math.floor(idx / 7);
    if (idx >= 0 && week < WEEKS_SHOWN) weekly[week].count++;
  }

  const methods: Record<WinMethod, number> = { points: 0, resign: 0, time: 0 };
  let blackWins = 0;
  let whiteWins = 0;
  let evenGames = 0;
  const margins: number[] = [];
  const games = new Map<string, { games: number; wins: number }>();
  const venues = new Map<string, number>();
  const clubGames = new Map<string, number>();
  const rolling = new Map<string, number>();
  const bestRun = new Map<string, number>();

  for (const m of chronological(matches)) {
    methods[m.win_method]++;
    if (m.handicap === 0) {
      evenGames++;
      if (m.winner === m.black_player) blackWins++;
      else whiteWins++;
    }
    if (m.win_method === "points" && m.score_difference != null) margins.push(m.score_difference);
    venues.set(m.location, (venues.get(m.location) ?? 0) + 1);
    if (m.club_id) clubGames.set(m.club_id, (clubGames.get(m.club_id) ?? 0) + 1);

    for (const id of [m.black_player, m.white_player]) {
      const g = games.get(id) ?? { games: 0, wins: 0 };
      g.games++;
      if (m.winner === id) {
        g.wins++;
        const run = (rolling.get(id) ?? 0) + 1;
        rolling.set(id, run);
        bestRun.set(id, Math.max(bestRun.get(id) ?? 0, run));
      } else {
        rolling.set(id, 0);
      }
      games.set(id, g);
    }
  }

  const members = new Map<string, number>();
  for (const p of players) if (p.club_id) members.set(p.club_id, (members.get(p.club_id) ?? 0) + 1);

  const rankCount = new Map<number, number>();
  for (const p of players) rankCount.set(p.rank_value, (rankCount.get(p.rank_value) ?? 0) + 1);

  const upsets = matches
    .map((match) => ({ match, gap: upsetGap(match, rankOf) }))
    .filter((u) => u.gap > 0)
    .sort((a, b) => b.gap - a.gap || b.match.played_on.localeCompare(a.match.played_on))
    .slice(0, 5);

  const sinceLast7 = addDays(today, -6);

  return {
    totalMatches: matches.length,
    activePlayers: games.size,
    totalPlayers: players.length,
    totalClubs: clubs.length,
    matchesLast7Days: allMatches.filter((m) => m.played_on >= sinceLast7).length,
    weekly,
    methods,
    blackWins,
    whiteWins,
    evenGames,
    avgMargin: mean(margins),
    mostActive: [...games.entries()]
      .map(([playerId, g]) => ({ playerId, games: g.games }))
      .sort((a, b) => b.games - a.games)
      .slice(0, 5),
    bestWinRate: [...games.entries()]
      .filter(([, g]) => g.games >= MIN_GAMES_FOR_WIN_RATE)
      .map(([playerId, g]) => ({ playerId, games: g.games, winRate: rate(g.wins, g.games) }))
      .sort((a, b) => b.winRate - a.winRate || b.games - a.games)
      .slice(0, 5),
    longestStreaks: [...bestRun.entries()]
      .map(([playerId, length]) => ({ playerId, length, ongoing: (rolling.get(playerId) ?? 0) === length }))
      .sort((a, b) => b.length - a.length)
      .slice(0, 5),
    upsets,
    bigWins: matches.filter(isBigWin).sort((a, b) => (b.score_difference ?? 0) - (a.score_difference ?? 0)).slice(0, 5),
    rankDistribution: [...rankCount.entries()].map(([rank, count]) => ({ rank, count })).sort((a, b) => b.rank - a.rank),
    clubActivity: clubs
      .map((c) => ({ clubId: c.id, games: clubGames.get(c.id) ?? 0, members: members.get(c.id) ?? 0 }))
      .sort((a, b) => b.games - a.games),
    venues: [...venues.entries()]
      .map(([location, count]) => ({ location, games: count }))
      .sort((a, b) => b.games - a.games)
      .slice(0, 5),
  };
}

/** Mốc "since" cho bộ lọc thời gian. */
export type RangeKey = "30" | "90" | "all";
export const RANGE_LABEL: Record<RangeKey, string> = { "30": "30 ngày", "90": "90 ngày", all: "Tất cả" };

export function rangeSince(range: RangeKey, today: string): string | undefined {
  return range === "all" ? undefined : addDays(today, -(Number(range) - 1));
}

export function parseRange(value: string | string[] | undefined): RangeKey {
  return value === "30" || value === "90" ? value : "all";
}
