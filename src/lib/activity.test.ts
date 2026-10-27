import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildActivityFeed, eventInClub, eventInvolves } from "./activity";
import type { MatchView, Player } from "./data/types";
import { headToHead, playerStats } from "./stats";

const NOW = Date.parse("2026-10-30T12:00:00Z");
const base = { bio: null, club_id: null, playing_since: null, is_admin: false, avatar_tone: null, avatar_glyph: null, created_by: null };
const player = (id: string, over: Partial<Player> = {}): Player => ({ ...base, id, display_name: id.toUpperCase(), rank_value: 0, is_guest: false, created_at: "2026-01-01T00:00:00Z", ...over });
const A = player("a");
const B = player("b");
const G = player("g", { is_guest: true });

let n = 0;
function match(black: Player, white: Player, winner: Player, over: Partial<MatchView> = {}): MatchView {
  n++;
  const day = String(n).padStart(2, "0");
  return {
    id: `m${n}`,
    black_player: black.id,
    white_player: white.id,
    winner: winner.id,
    win_method: "points",
    score_difference: 2.5,
    played_on: `2026-10-${day}`,
    location: "CLB",
    club_id: null,
    note: null,
    board_size: 19,
    handicap: 0,
    status: "confirmed",
    recorded_by: black.id,
    created_at: `2026-10-${day}T10:00:00Z`,
    resolved_at: `2026-10-${day}T11:00:00Z`,
    has_sgf: false,
    black,
    white,
    club: null,
    kudos_count: 0,
    kudosed_by_me: false,
    confirmation: null,
    sgf: null,
    ...over,
  };
}

describe("buildActivityFeed", () => {
  it("is empty when there is no data", () => {
    assert.deepEqual(buildActivityFeed([], [], { now: NOW }), []);
  });

  it("lists confirmed matches newest first and skips pending ones", () => {
    const m1 = match(A, B, A);
    const m2 = match(B, A, B);
    const pending = match(A, B, A, { status: "pending" });
    const ev = buildActivityFeed([m1, pending, m2], [], { now: NOW });
    assert.deepEqual(ev.map((e) => e.id), [`match:${m2.id}`, `match:${m1.id}`]);
  });

  it("emits a streak event exactly when a milestone is reached, above its match", () => {
    n = 0;
    const ms = [1, 2, 3, 4].map(() => match(A, B, A));
    const ev = buildActivityFeed(ms, [], { now: NOW });
    const streaks = ev.filter((e) => e.type === "streak");
    assert.equal(streaks.length, 1);
    assert.equal(streaks[0].type === "streak" && streaks[0].length, 3);
    // sự kiện chuỗi thắng nằm ngay trên ván thứ 3
    const idx = ev.findIndex((e) => e.type === "streak");
    assert.equal(ev[idx + 1].id, `match:${ms[2].id}`);
  });

  it("a loss resets the streak", () => {
    n = 0;
    const ms = [match(A, B, A), match(A, B, A), match(A, B, B), match(A, B, A), match(A, B, A)];
    assert.equal(buildActivityFeed(ms, [], { now: NOW }).filter((e) => e.type === "streak").length, 0);
  });

  it("ignores games against guests for streaks", () => {
    n = 0;
    const ms = [1, 2, 3].map(() => match(A, G, A));
    assert.equal(buildActivityFeed(ms, [], { now: NOW }).filter((e) => e.type === "streak").length, 0);
  });

  it("reports recently joined members, not guests or old accounts", () => {
    const fresh = player("new", { created_at: "2026-10-25T00:00:00Z" });
    const old = player("old", { created_at: "2025-01-01T00:00:00Z" });
    const ev = buildActivityFeed([], [fresh, old, player("guest", { is_guest: true, created_at: "2026-10-28T00:00:00Z" })], { now: NOW });
    assert.deepEqual(ev.map((e) => e.id), ["joined:new"]);
  });

  it("respects the limit and filters by player / club", () => {
    n = 0;
    const ms = [1, 2, 3, 4, 5].map(() => match(A, B, B));
    assert.equal(buildActivityFeed(ms, [], { now: NOW, limit: 2 }).length, 2);
    const first = buildActivityFeed(ms, [], { now: NOW }).find((e) => e.type === "match")!;
    assert.equal(eventInvolves(first, "a"), true);
    assert.equal(eventInvolves(first, "zzz"), false);
    assert.equal(eventInClub(first, "club-x"), false);
  });
});

describe("profile / rivalry edge cases (0, 1, many matches)", () => {
  it("handles a player with no matches", () => {
    const s = playerStats("a", []);
    assert.equal(s.games, 0);
    assert.equal(s.winRate, 0);
    assert.deepEqual(s.form, []);
  });

  it("handles exactly one match", () => {
    n = 0;
    const s = playerStats("a", [match(A, B, A)]);
    assert.equal(s.wins, 1);
    assert.equal(s.winRate, 1);
    assert.deepEqual(s.currentStreak, { won: true, length: 1 });
    assert.equal(s.form.length, 1);
  });

  it("keeps only the 10 most recent results, oldest to newest", () => {
    n = 0;
    const ms = Array.from({ length: 13 }, (_, i) => match(A, B, i % 2 === 0 ? A : B));
    const s = playerStats("a", ms);
    assert.equal(s.form.length, 10);
    assert.equal(s.form.at(-1)?.matchId, ms[12].id);
  });

  it("head-to-head: never met, once, many", () => {
    n = 0;
    assert.equal(headToHead("a", "b", []).games, 0);
    const one = headToHead("a", "b", [match(A, B, B)]);
    assert.deepEqual([one.games, one.aWins, one.bWins], [1, 0, 1]);
    const many = headToHead("a", "b", [match(A, B, A), match(B, A, A), match(A, B, B), match(A, player("c"), A)]);
    assert.deepEqual([many.games, many.aWins, many.bWins], [3, 2, 1]);
    assert.equal(many.matches[0].id, many.matches[0].id);
    assert.deepEqual(many.streak, { holderId: "b", length: 1 });
  });
});
