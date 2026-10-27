import { BLACK, Board, EMPTY, WHITE, type Cell } from "./board";
import { SgfError, mainLine, parseSgf, type SgfNode } from "./parse";

export const SUPPORTED_SIZES = [9, 13, 19] as const;
export const MAX_SGF_CHARS = 200_000;

export type GameInfo = {
  blackName: string | null;
  whiteName: string | null;
  blackRank: string | null;
  whiteRank: string | null;
  date: string | null;
  event: string | null;
  result: string | null;
  komi: string | null;
  handicap: number;
};

export type Frame = {
  /** Trạng thái bàn sau nước này (size×size, 0 trống, 1 đen, 2 trắng). */
  board: Uint8Array;
  /** Nước vừa đi; null ở khung đầu (thế cờ ban đầu) và với nước "pass". */
  move: { color: 1 | 2; x: number; y: number } | null;
  pass: boolean;
  /** Bên vừa đi (kể cả pass hoặc tự sát); null ở khung đầu. */
  color: 1 | 2 | null;
  /** Số nước (khung đầu = 0). */
  number: number;
  /** Số quân đã bắt tính đến nay. */
  captures: { black: number; white: number };
  /** Các điểm bị bắt ở nước này. */
  captured: number[];
  comment: string | null;
};

export type Replay = { size: 9 | 13 | 19; info: GameInfo; frames: Frame[]; moves: number };

const first = (node: SgfNode, key: string) => node[key]?.[0]?.trim() || null;

function readSize(root: SgfNode): 9 | 13 | 19 {
  const raw = first(root, "SZ") ?? "19";
  const [a, b = a] = raw.split(":");
  const w = Number(a);
  const h = Number(b);
  if (w !== h) throw new SgfError("Chỉ hỗ trợ bàn cờ vuông.");
  if (!(SUPPORTED_SIZES as readonly number[]).includes(w)) throw new SgfError("Chỉ hỗ trợ bàn 9×9, 13×13 và 19×19.");
  return w as 9 | 13 | 19;
}

function point(value: string, size: number): [number, number] | null {
  if (value === "" || (value === "tt" && size <= 19)) return null; // pass
  if (!/^[a-z]{2}$/.test(value)) throw new SgfError(`Toạ độ "${value}" không hợp lệ.`);
  const x = value.charCodeAt(0) - 97;
  const y = value.charCodeAt(1) - 97;
  if (x >= size || y >= size) throw new SgfError(`Toạ độ "${value}" nằm ngoài bàn ${size}×${size}.`);
  return [x, y];
}

/** AB[aa][cc:dd] → danh sách điểm (hỗ trợ dạng hình chữ nhật a:b). */
function points(values: string[] | undefined, size: number): [number, number][] {
  const out: [number, number][] = [];
  for (const v of values ?? []) {
    const [from, to] = v.split(":");
    const a = point(from, size);
    const b = to ? point(to, size) : a;
    if (!a || !b) continue;
    for (let x = Math.min(a[0], b[0]); x <= Math.max(a[0], b[0]); x++)
      for (let y = Math.min(a[1], b[1]); y <= Math.max(a[1], b[1]); y++) out.push([x, y]);
  }
  return out;
}

/** Đọc SGF và dựng sẵn mọi khung hình của đường chính. Ném `SgfError` (thông điệp tiếng Việt) nếu file hỏng. */
export function buildReplay(text: string): Replay {
  if (text.length > MAX_SGF_CHARS) throw new SgfError("File kỳ phổ quá lớn (tối đa 200 KB).");
  let nodes: SgfNode[];
  try {
    nodes = mainLine(parseSgf(text));
  } catch (e) {
    if (e instanceof SgfError) throw e;
    throw new SgfError("Không đọc được file SGF.");
  }
  if (!nodes.length) throw new SgfError("File SGF không có nội dung.");

  const root = nodes[0];
  const size = readSize(root);
  const board = new Board(size);
  const captures = { black: 0, white: 0 };
  const frames: Frame[] = [];

  const snapshot = (over: Partial<Frame>): Frame => ({
    board: board.cells.slice(),
    move: null,
    pass: false,
    color: null,
    number: frames.length ? frames[frames.length - 1].number : 0,
    captures: { ...captures },
    captured: [],
    comment: null,
    ...over,
  });

  const applySetup = (node: SgfNode) => {
    for (const [x, y] of points(node.AE, size)) board.set(x, y, EMPTY);
    for (const [x, y] of points(node.AB, size)) board.set(x, y, BLACK);
    for (const [x, y] of points(node.AW, size)) board.set(x, y, WHITE);
  };

  applySetup(root);
  frames.push(snapshot({ number: 0, comment: first(root, "C") }));

  let moveNumber = 0;
  for (let k = 1; k < nodes.length; k++) {
    const node = nodes[k];
    const hasSetup = node.AB || node.AW || node.AE;
    if (hasSetup) applySetup(node);

    const color: Cell | null = node.B ? BLACK : node.W ? WHITE : null;
    if (!color) {
      // Nút không có nước đi: cập nhật thế cờ / lời bình vào khung gần nhất.
      const last = frames[frames.length - 1];
      if (hasSetup) last.board = board.cells.slice();
      const c = first(node, "C");
      if (c) last.comment = last.comment ? `${last.comment}\n${c}` : c;
      continue;
    }

    moveNumber++;
    const p = point((color === BLACK ? node.B : node.W)[0], size);
    if (!p) {
      frames.push(snapshot({ number: moveNumber, pass: true, color, comment: first(node, "C") }));
      continue;
    }
    let result: { captured: number[]; suicide: boolean };
    try {
      result = board.play(color, p[0], p[1]);
    } catch {
      throw new SgfError(`Nước thứ ${moveNumber} đi vào điểm đã có quân.`);
    }
    // Quân bị bắt tính cho bên vừa đi; tự sát thì tính cho đối phương.
    if (result.suicide) captures[color === BLACK ? "white" : "black"] += result.captured.length;
    else captures[color === BLACK ? "black" : "white"] += result.captured.length;
    frames.push(
      snapshot({
        number: moveNumber,
        color,
        move: result.suicide ? null : { color, x: p[0], y: p[1] },
        captured: result.captured,
        comment: first(node, "C"),
      }),
    );
  }

  if (moveNumber === 0) throw new SgfError("Kỳ phổ chưa có nước đi nào.");

  const ha = Number(first(root, "HA") ?? 0);
  return {
    size,
    moves: moveNumber,
    frames,
    info: {
      blackName: first(root, "PB"),
      whiteName: first(root, "PW"),
      blackRank: first(root, "BR"),
      whiteRank: first(root, "WR"),
      date: first(root, "DT"),
      event: first(root, "EV") ?? first(root, "GN"),
      result: first(root, "RE"),
      komi: first(root, "KM"),
      handicap: Number.isFinite(ha) && ha >= 0 && ha <= 9 ? ha : 0,
    },
  };
}

/** "B+R" → "Đen thắng, đối thủ bỏ cuộc"; "W+3.5" → "Trắng thắng 3.5 điểm". */
export function describeResult(re: string | null): string | null {
  if (!re) return null;
  const m = /^([BW])\+(.*)$/i.exec(re.trim());
  if (!m) return /^(0|draw|jigo)$/i.test(re.trim()) ? "Hoà" : null;
  const who = m[1].toUpperCase() === "B" ? "Đen" : "Trắng";
  const how = m[2].trim();
  if (/^r/i.test(how)) return `${who} thắng, đối thủ bỏ cuộc`;
  if (/^t/i.test(how)) return `${who} thắng, đối thủ hết giờ`;
  if (/^f/i.test(how)) return `${who} thắng, đối thủ phạm luật`;
  const n = Number(how);
  return Number.isFinite(n) && how !== "" ? `${who} thắng ${n} điểm` : `${who} thắng`;
}

/** Cột của bàn cờ theo thông lệ: A–T bỏ chữ I. */
export function columnLabel(x: number): string {
  return "ABCDEFGHJKLMNOPQRST"[x] ?? "";
}

/** Điểm sao theo kích thước bàn. */
export function starPoints(size: number): [number, number][] {
  const a = size === 9 ? [2, 4, 6] : size === 13 ? [3, 6, 9] : [3, 9, 15];
  const pts = a.flatMap((y) => a.map((x) => [x, y] as [number, number]));
  return size === 9 ? pts.filter(([x, y]) => (x !== 4 && y !== 4) || (x === 4 && y === 4)) : pts;
}
