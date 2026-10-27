/**
 * Tygem `.gib` → SGF.
 *
 * `.gib` là file chữ do Tygem (cờ Vây Hàn Quốc) xuất ra. Phần đầu ghi thông tin bằng các dòng
 * `\[TÊN=giá trị\]`; phần ván cờ gồm một dòng `INI` (có số quân chấp) và các dòng `STO`:
 *   STO 0 <số nước> <màu: 1 đen, 2 trắng> <cột 0..18 từ trái> <hàng 0..18 từ trên>
 * Quân chấp không nằm trong các dòng STO mà đặt theo vị trí chuẩn của Tygem.
 * Ta đổi sang SGF rồi lưu, nên trong hệ thống chỉ còn một định dạng.
 */
import { SgfError } from "./parse";

const SIZE = 19;
const letter = (n: number) => String.fromCharCode(97 + n);
const point = (x: number, y: number) => letter(x) + letter(y);

/** File có phải `.gib` của Tygem không (dò theo nội dung, không tin đuôi file). */
export function looksLikeGib(text: string): boolean {
  return /^\s*\\HS\b/.test(text) || (/^\s*\\\[GAME[A-Z]+=/m.test(text) && /^STO\s/m.test(text));
}

/**
 * Giải mã byte của file. Tygem lưu theo bảng mã của từng quốc gia (EUC-KR, GBK, Big5), nên:
 * thử UTF-8 nghiêm ngặt trước; nếu không được thì chọn bảng mã cho ít ký tự lỗi nhất.
 */
export function decodeGibBytes(bytes: Uint8Array): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    // không phải UTF-8
  }
  // Ít ký tự lỗi nhất thắng; hoà thì chọn bảng mã mà phần chữ ngoài ASCII "đúng bộ chữ" nhiều hơn
  // (Hangul cho EUC-KR, chữ Hán cho GBK/Big5). Chỉ ảnh hưởng tên người chơi, không ảnh hưởng nước đi.
  const script: Record<string, RegExp> = {
    "euc-kr": /[\uAC00-\uD7A3]/g,
    gb18030: /[\u4E00-\u9FFF]/g,
    big5: /[\u4E00-\u9FFF]/g,
    shift_jis: /[\u3040-\u30FF\u4E00-\u9FFF]/g,
  };
  let best: { text: string; bad: number; ratio: number } | null = null;
  for (const label of ["euc-kr", "gb18030", "big5", "shift_jis"]) {
    let text: string;
    try {
      text = new TextDecoder(label).decode(bytes);
    } catch {
      continue;
    }
    const bad = (text.match(/\uFFFD/g) ?? []).length;
    const nonAscii = (text.match(/[^\x00-\x7F]/g) ?? []).length || 1;
    const ratio = (text.match(script[label]) ?? []).length / nonAscii;
    if (!best || bad < best.bad || (bad === best.bad && ratio > best.ratio)) best = { text, bad, ratio };
  }
  return best ? best.text : new TextDecoder("utf-8").decode(bytes);
}

/** Vị trí quân chấp theo Tygem trên bàn 19×19 (2–9 quân). */
export function tygemHandicap(count: number): [number, number][] {
  const near = 3;
  const far = SIZE - near - 1; // 15
  const mid = (SIZE - 1) / 2; // 9
  const pts: [number, number][] = [
    [near, far],
    [far, near],
    [near, near],
    [far, far],
  ];
  if (count === 5) pts.push([mid, mid]);
  pts.push([near, mid], [far, mid]);
  if (count === 7) pts.push([mid, mid]);
  pts.push([mid, near], [mid, far], [mid, mid]);
  return pts.slice(0, count);
}

const esc = (v: string) => v.replace(/\\/g, "\\\\").replace(/]/g, "\\]");

/** "jimmy (5K)" → { name: "jimmy", rank: "5K" }. */
function player(raw: string): { name: string; rank: string } {
  const m = /^(.*?)\s*\(([^()]*)\)\s*$/.exec(raw.trim());
  return m && m[1] ? { name: m[1].trim(), rank: m[2].trim() } : { name: raw.trim(), rank: "" };
}

/** GRLT: 0 đen thắng n điểm, 1 trắng thắng n điểm, 3/4 đen/trắng thắng do đối phương bỏ cuộc, 7/8 do hết giờ. Điểm ×10. */
function result(kind: number, score: number): string {
  const easy: Record<number, string> = { 3: "B+R", 4: "W+R", 7: "B+T", 8: "W+T" };
  if (easy[kind]) return easy[kind];
  if (kind === 0 || kind === 1) return `${kind === 0 ? "B" : "W"}+${score / 10}`;
  return "";
}

export function gibToSgf(text: string): string {
  const lines = text.replace(/\r/g, "").split("\n");
  const props: string[] = [];
  const get = (re: RegExp, line: string) => re.exec(line)?.[1];

  let blackName = "";
  let blackRank = "";
  let whiteName = "";
  let whiteRank = "";
  let date = "";
  let komi: number | null = null;
  let res = "";
  let handicap = 0;
  const moves: string[] = [];

  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith("\\[GAMEBLACKNAME=") && line.endsWith("\\]")) {
      ({ name: blackName, rank: blackRank } = player(line.slice(16, -2)));
    } else if (line.startsWith("\\[GAMEWHITENAME=") && line.endsWith("\\]")) {
      ({ name: whiteName, rank: whiteRank } = player(line.slice(16, -2)));
    } else if (line.startsWith("\\[GAMEINFOMAIN=")) {
      const kind = get(/GRLT:(\d+),/, line);
      const score = get(/ZIPSU:(\d+),/, line);
      if (!res && kind !== undefined && score !== undefined) res = result(Number(kind), Number(score));
      const gongje = get(/GONGJE:(\d+),/, line);
      if (komi === null && gongje !== undefined) komi = Number(gongje) / 10;
    } else if (line.startsWith("\\[GAMETAG=")) {
      const d = /C(\d{4}):(\d\d):(\d\d)/.exec(line);
      if (!date && d) date = `${d[1]}-${d[2]}-${d[3]}`;
      const kind = get(/,W(\d+),/, line);
      const score = get(/,Z(\d+),/, line);
      if (!res && kind !== undefined && score !== undefined) res = result(Number(kind), Number(score));
      const g = get(/,G(\d+),/, line);
      if (komi === null && g !== undefined) komi = Number(g) / 10;
    } else if (line.startsWith("INI")) {
      const h = Math.floor(Number(line.split(/\s+/)[3]));
      if (Number.isFinite(h) && h >= 2 && h <= 9) handicap = h;
    } else if (line.startsWith("STO")) {
      const f = line.split(/\s+/);
      if (f.length < 6) continue;
      const color = f[3] === "1" ? "B" : f[3] === "2" ? "W" : null;
      const x = Math.floor(Number(f[4]));
      const y = Math.floor(Number(f[5]));
      if (!color || Number.isNaN(x) || Number.isNaN(y)) continue;
      // Toạ độ ngoài bàn = bỏ lượt (pass).
      moves.push(x >= 0 && x < SIZE && y >= 0 && y < SIZE ? `;${color}[${point(x, y)}]` : `;${color}[]`);
    }
  }

  if (!moves.length) throw new SgfError("Không tìm thấy nước đi nào trong file .gib.");

  props.push("FF[4]", "GM[1]", "CA[UTF-8]", `SZ[${SIZE}]`, "AP[GoDaNang:gib]");
  if (blackName) props.push(`PB[${esc(blackName)}]`);
  if (blackRank) props.push(`BR[${esc(blackRank)}]`);
  if (whiteName) props.push(`PW[${esc(whiteName)}]`);
  if (whiteRank) props.push(`WR[${esc(whiteRank)}]`);
  if (date) props.push(`DT[${date}]`);
  if (komi !== null) props.push(`KM[${komi}]`);
  if (res) props.push(`RE[${res}]`);
  if (handicap) {
    props.push(`HA[${handicap}]`);
    props.push(`AB${tygemHandicap(handicap).map(([x, y]) => `[${point(x, y)}]`).join("")}`);
  }
  return `(;${props.join("")}${moves.join("")})`;
}
