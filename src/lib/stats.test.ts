import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { activityBoard, communityStats, headToHead, headToHeadSummary, playerStats, upsetGap, ACTIVITY_DAYS } from "./stats";
import type { MatchRow } from "./data/types";

const A = "a";
const B = "b";
const C = "c";
let seq = 0;

function match(over: Partial<MatchRow> & Pick<MatchRow, "black_player" | "white_player" | "winner">): MatchRow {
  seq++;
  return {
    id: `m${seq}`,
    win_method: "points",
    score_difference: 3.5,
    played_on: `2026-03-${String(seq).padStart(2, "0")}`,
    location: "CLB",
    club_id: null,
    note: null,
    board_size: 19,
    handicap: 0,
    status: "confirmed",
    recorded_by: over.black_player,
    created_at: `2026-03-${String(seq).padStart(2, "0")}T10:00:00Z`,
    resolved_at: null,
    has_sgf: false,
    ...over,
  };
}

describe("playerStats", () => {
  const matches = [
    match({ black_player: A, white_player: B, winner: A, score_difference: 2.5 }),
    match({ black_player: B, white_player: A, winner: A, win_method: "resign", score_difference: null }),
    match({ black_player: A, white_player: C, winner: C, score_difference: 10.5 }),
    match({ black_player: C, white_player: A, winner: A, score_difference: 4.5 }),
    match({ black_player: B, white_player: C, winner: B }),
  ];

  it("counts wins, losses, colours and methods", () => {
    const s = playerStats(A, matches);
    assert.equal(s.games, 4);
    assert.equal(s.wins, 3);
    assert.equal(s.losses, 1);
    assert.deepEqual(s.asBlack, { games: 2, wins: 1 });
    assert.deepEqual(s.asWhite, { games: 2, wins: 2 });
    assert.deepEqual(s.byMethod.resign, { wins: 1, losses: 0 });
  });

  it("derives streaks and margins", () => {
    const s = playerStats(A, matches);
    assert.deepEqual(s.currentStreak, { won: true, length: 1 });
    assert.equal(s.bestWinStreak, 2);
    assert.equal(s.avgWinMargin, 3.5); // (2.5 + 4.5) / 2, ván bỏ cuộc không tính
    assert.equal(s.avgLossMargin, 10.5);
  });

  it("handles a player with no games", () => {
    const s = playerStats("nobody", matches);
    assert.equal(s.games, 0);
    assert.equal(s.winRate, 0);
    assert.equal(s.currentStreak, null);
  });
});

describe("headToHead", () => {
  const matches = [
    match({ black_player: A, white_player: B, winner: A }),
    match({ black_player: B, white_player: A, winner: B }),
    match({ black_player: A, white_player: B, winner: B }),
    match({ black_player: A, white_player: C, winner: A }),
  ];

  it("only considers games between the two players", () => {
    const h = headToHead(A, B, matches);
    assert.equal(h.games, 3);
    assert.equal(h.aWins, 1);
    assert.equal(h.bWins, 2);
    assert.deepEqual(h.aAsBlack, { games: 2, aWins: 1 });
    assert.deepEqual(h.streak, { holderId: B, length: 2 });
  });

  it("writes a readable summary", () => {
    const h = headToHead(A, B, matches);
    const text = headToHeadSummary(h, { id: A, display_name: "Hiền" }, { id: B, display_name: "Nam" });
    assert.match(text, /Nam dẫn 2–1/);
    assert.match(text, /thắng 2 ván liên tiếp/);
  });

  it("says so when they never met", () => {
    const h = headToHead(B, C, []);
    assert.match(headToHeadSummary(h, { id: B, display_name: "Nam" }, { id: C, display_name: "Lan" }), /chưa có ván nào/);
  });
});

describe("upsetGap", () => {
  const rank = (id: string) => ({ a: 1, b: -3 })[id as "a" | "b"] ?? 0;
  it("counts only even games won by the lower-ranked player", () => {
    assert.equal(upsetGap(match({ black_player: A, white_player: B, winner: B }), rank), 4);
    assert.equal(upsetGap(match({ black_player: A, white_player: B, winner: A }), rank), 0);
    assert.equal(upsetGap(match({ black_player: A, white_player: B, winner: B, handicap: 4 }), rank), 0);
  });
});

describe("activityBoard", () => {
  it("lays out 361 days ending today and marks played days", () => {
    const today = "2026-03-20";
    const cells = activityBoard(A, [match({ black_player: A, white_player: B, winner: A, played_on: "2026-03-20" }), match({ black_player: A, white_player: B, winner: B, played_on: "2025-01-01" })], today);
    assert.equal(cells.length, ACTIVITY_DAYS);
    assert.equal(cells.at(-1)?.date, today);
    assert.equal(cells.at(-1)?.wins, 1);
    assert.equal(cells.reduce((n, c) => n + c.games, 0), 1); // ván quá cũ nằm ngoài bàn cờ
  });
});

describe("communityStats leaderboards", () => {
  const base = { bio: null, club_id: null, playing_since: null, created_by: null, created_at: "2026-01-01T00:00:00Z" };
  const players = [
    { ...base, id: A, display_name: "A", rank_value: 1, is_guest: false },
    { ...base, id: B, display_name: "B", rank_value: -3, is_guest: false },
    { ...base, id: "g", display_name: "Khách", rank_value: -9, is_guest: true },
  ];

  it("ignores guest opponents in win-rate, streak, upset and big-win boards but still counts the games", () => {
    const m = [
      ...Array.from({ length: 6 }, () => match({ black_player: A, white_player: "g", winner: A, score_difference: 30.5 })),
      match({ black_player: A, white_player: B, winner: B, score_difference: 2.5 }),
    ];
    const s = communityStats(m, players, [], "2026-03-30");
    assert.equal(s.totalMatches, 7);
    assert.equal(s.mostActive[0].playerId, A);
    assert.deepEqual(s.bestWinRate, []); // chỉ 1 ván có cả hai là thành viên
    assert.equal(s.bigWins.length, 0);
    assert.equal(s.longestStreaks.find((x) => x.playerId === A), undefined); // 6 thắng khách không tạo chuỗi
  });
});
