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

import { decodeGibBytes, gibToSgf, looksLikeGib, tygemHandicap } from "./sgf/gib";

const hex = (h: string) => Uint8Array.from(h.match(/../g)!.map((b) => parseInt(b, 16)));
const enc = (s: string) => new TextEncoder().encode(s);

const GIB = [
  "\\HS",
  "\\[GAMEWHITENAME=jimmy (5K)\\]",
  "\\[GAMEBLACKNAME=Silver Star (8K)\\]",
  "\\[GAMEINFOMAIN=GBKIND:3,GTYPE:0,GCDT:3,GTIME:60000-0-0,GRLT:0,ZIPSU:40,DUM:0,GONGJE:65,TCNT:3,AUSZ:0\\]",
  "\\[GAMETAG=S0,R3,D0,G65,W0,Z40,T0-0-60000,C2017:03:16:02:52,I:jimmy\\]",
  "\\HE",
  "\\GS",
  "2 1 0",
  "4 0 &4",
  "INI 0 1 3 &4",
  "STO 0 2 2 15 15",
  "STO 0 3 1 12 16",
  "STO 0 4 2 19 19",
  "\\GE",
].join("\r\n");

describe("Tygem .gib", () => {
  it("is recognised by content", () => {
    assert.equal(looksLikeGib(GIB), true);
    assert.equal(looksLikeGib("(;SZ[19];B[aa])"), false);
  });

  it("converts header, handicap, result and moves to SGF", () => {
    const sgf = gibToSgf(GIB);
    assert.match(sgf, /PB\[Silver Star\]BR\[8K\]PW\[jimmy\]WR\[5K\]/);
    assert.match(sgf, /DT\[2017-03-16\]KM\[6\.5\]RE\[B\+4\]HA\[3\]/);
    assert.match(sgf, /AB\[dp\]\[pd\]\[dd\]/);
    assert.match(sgf, /;W\[pp\];B\[mq\];W\[\]\)$/);
  });

  it("replays correctly: handicap stones placed, white moves first, trailing pass", () => {
    const r = buildReplay(gibToSgf(GIB));
    assert.equal(r.size, 19);
    assert.equal(r.moves, 3);
    assert.equal(r.frames[0].board.filter((v) => v === 1).length, 3);
    assert.equal(r.frames[1].color, 2);
    assert.equal(r.frames[3].pass, true);
    assert.equal(r.info.handicap, 3);
    assert.equal(describeResult(r.info.result), "Đen thắng 4 điểm");
  });

  it("uses Tygem handicap positions", () => {
    assert.deepEqual(tygemHandicap(2), [[3, 15], [15, 3]]);
    assert.equal(tygemHandicap(9).length, 9);
    assert.deepEqual(tygemHandicap(5).at(-1), [9, 9]);
    assert.deepEqual(tygemHandicap(7).at(-1), [9, 9]);
    assert.equal(new Set(tygemHandicap(9).map(([x, y]) => `${x},${y}`)).size, 9);
  });

  it("maps resign and timeout result codes", () => {
    const mk = (grlt: number) => gibToSgf(GIB.replace("GRLT:0,ZIPSU:40", `GRLT:${grlt},ZIPSU:0`).replace(/,W0,Z40,/, ",W0,Z0,"));
    assert.match(mk(4), /RE\[W\+R\]/);
    assert.match(mk(7), /RE\[B\+T\]/);
  });

  it("rejects a file without moves", () => {
    assert.throws(() => gibToSgf("\\HS\n\\HE\n\\GS\nINI 0 1 0 &4\n\\GE"), /nước đi/);
  });

  it("decodes UTF-8, EUC-KR, GBK and Big5 names", () => {
    assert.equal(decodeGibBytes(enc("홍길동 abc")), "홍길동 abc");
    assert.equal(decodeGibBytes(hex("c8abb1e6b5bf")), "홍길동");
    assert.equal(decodeGibBytes(hex("cea7c6e5b8dfcad6")), "围棋高手");
    assert.equal(decodeGibBytes(hex("b3f2b4d1b0aaa4e2")), "圍棋高手");
  });

  it("escapes SGF special characters in names", () => {
    const sgf = gibToSgf(GIB.replace("jimmy (5K)", "ji]mmy\\ (5K)"));
    assert.match(sgf, /PW\[ji\\\]mmy\\\\\]/);
    assert.doesNotThrow(() => buildReplay(sgf));
  });
});
