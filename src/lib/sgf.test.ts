import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SgfError, mainLine, parseSgf } from "./sgf/parse";
import { buildReplay, describeResult, starPoints } from "./sgf/replay";
import { newMatchSchema, sgfProblem } from "./validators";

const idx = (size: number, x: number, y: number) => y * size + x;

describe("parseSgf", () => {
  it("reads properties, escapes and multi-value properties", () => {
    const t = parseSgf("(;GM[1]SZ[9]C[a \\] b \\\\ c]AB[aa][bb];B[cc])");
    assert.deepEqual(t.nodes[0].AB, ["aa", "bb"]);
    assert.equal(t.nodes[0].C[0], "a ] b \\ c");
    assert.equal(t.nodes.length, 2);
  });

  it("follows the first branch as the main line", () => {
    const t = parseSgf("(;SZ[9];B[aa](;W[bb];B[cc])(;W[dd]))");
    assert.deepEqual(mainLine(t).map((n) => (n.B ?? n.W ?? ["-"])[0]), ["-", "aa", "bb", "cc"]);
  });

  it("handles very deep nesting without overflowing the stack", () => {
    const depth = 20000;
    const sgf = "(;SZ[19]" + "(;B[aa]".repeat(depth) + ")".repeat(depth) + ")";
    assert.equal(mainLine(parseSgf(sgf)).length, depth + 1);
  });

  it("rejects truncated or non-SGF input", () => {
    assert.throws(() => parseSgf("hello"), SgfError);
    assert.throws(() => parseSgf("(;SZ[9];B[aa"), SgfError);
    assert.throws(() => parseSgf("(;SZ[9];B[aa]"), SgfError);
  });
});

describe("buildReplay", () => {
  it("captures a corner stone", () => {
    const r = buildReplay("(;SZ[9];B[ba];W[aa];B[ab])");
    const last = r.frames.at(-1)!;
    assert.equal(r.moves, 3);
    assert.equal(last.board[idx(9, 0, 0)], 0);
    assert.deepEqual(last.captures, { black: 1, white: 0 });
    assert.deepEqual(last.captured, [idx(9, 0, 0)]);
  });

  it("captures a group, not just a stone", () => {
    // Trắng có 2 quân ở góc (aa, ba); Đen vây ca, bb, ab.
    const r = buildReplay("(;SZ[9];B[ab];W[aa];B[bb];W[ba];B[ca])");
    const last = r.frames.at(-1)!;
    assert.equal(last.board[idx(9, 0, 0)], 0);
    assert.equal(last.board[idx(9, 1, 0)], 0);
    assert.equal(last.captures.black, 2);
  });

  it("removes a suicidal stone and credits the opponent", () => {
    const r = buildReplay("(;SZ[9]AB[ba][ab];W[aa])");
    const last = r.frames.at(-1)!;
    assert.equal(last.board[idx(9, 0, 0)], 0);
    assert.deepEqual(last.captures, { black: 1, white: 0 });
    assert.equal(last.move, null);
  });

  it("applies handicap stones and passes", () => {
    const r = buildReplay("(;SZ[19]HA[2]AB[pd][dp];W[dd];B[tt];W[];B[qq])");
    assert.equal(r.info.handicap, 2);
    assert.equal(r.frames[0].board[idx(19, 15, 3)], 1);
    assert.equal(r.frames[2].pass, true);
    assert.equal(r.frames[3].pass, true);
    assert.equal(r.moves, 4);
  });

  it("expands AB point ranges", () => {
    const r = buildReplay("(;SZ[9]AB[aa:ac];W[ee])");
    assert.equal(r.frames[0].board.filter((v) => v === 1).length, 3);
  });

  it("collects comments and game info", () => {
    const r = buildReplay("(;SZ[9]PB[Hien]PW[Nam]RE[B+3.5]C[mo dau];B[ee]C[nuoc hay])");
    assert.equal(r.info.blackName, "Hien");
    assert.equal(r.frames[0].comment, "mo dau");
    assert.equal(r.frames[1].comment, "nuoc hay");
  });

  it("reports readable errors", () => {
    assert.throws(() => buildReplay("(;SZ[15];B[aa])"), /9×9, 13×13/);
    assert.throws(() => buildReplay("(;SZ[9];B[aa];W[aa])"), /Nước thứ 2/);
    assert.throws(() => buildReplay("(;SZ[9])"), /chưa có nước/);
    assert.throws(() => buildReplay("(;SZ[9];B[zz])"), /ngoài bàn/);
  });
});

describe("helpers", () => {
  it("describes results in Vietnamese", () => {
    assert.equal(describeResult("B+R"), "Đen thắng, đối thủ bỏ cuộc");
    assert.equal(describeResult("W+3.5"), "Trắng thắng 3.5 điểm");
    assert.equal(describeResult("W+T"), "Trắng thắng, đối thủ hết giờ");
    assert.equal(describeResult("?"), null);
  });
  it("gives star points per board size", () => {
    assert.equal(starPoints(19).length, 9);
    assert.equal(starPoints(13).length, 9);
    assert.equal(starPoints(9).length, 5);
  });
});

describe("sgf validation for matches", () => {
  const base = {
    opponent_id: "00000000-0000-4000-a000-000000000001",
    my_color: "black" as const,
    i_won: true,
    win_method: "resign" as const,
    played_on: "2026-01-01",
    location: "Cà phê Cầu Rồng",
  };

  it("flags a board-size mismatch with the match", () => {
    assert.match(sgfProblem("(;SZ[13];B[aa])", 19) ?? "", /bàn 13×13 nhưng ván này ghi bàn 19×19/);
    assert.equal(sgfProblem("(;SZ[19];B[aa])", 19), null);
  });

  it("rejects a match whose attached SGF is invalid or the wrong size", () => {
    assert.equal(newMatchSchema.safeParse({ ...base, board_size: 19, sgf: "(;SZ[19];B[aa])" }).success, true);
    const bad = newMatchSchema.safeParse({ ...base, board_size: 13, sgf: "(;SZ[19];B[aa])" });
    assert.equal(bad.success, false);
    assert.equal(newMatchSchema.safeParse({ ...base, sgf: "rubbish" }).success, false);
  });

  it("treats an empty SGF as no SGF", () => {
    const ok = newMatchSchema.safeParse({ ...base, sgf: "" });
    assert.equal(ok.success && ok.data.sgf, null);
  });
});
