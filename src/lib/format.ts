import type { MatchView } from "@/lib/data/types";

const VN_TZ = "Asia/Ho_Chi_Minh";
const DAY_MS = 86_400_000;

/** Ngày hôm nay (YYYY-MM-DD) theo giờ Việt Nam, bất kể server chạy ở múi giờ nào. */
export function todayVN(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: VN_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Số ngày giữa hai chuỗi YYYY-MM-DD (b - a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY_MS);
}

export function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

/** "Hôm nay", "Hôm qua", "3 ngày trước", "12 thg 5", "12 thg 5, 2025". */
export function relativeDay(date: string, today: string = todayVN()): string {
  const diff = daysBetween(date, today);
  if (diff <= 0) return "Hôm nay";
  if (diff === 1) return "Hôm qua";
  if (diff < 7) return `${diff} ngày trước`;
  return shortDate(date, today);
}

export function shortDate(date: string, today: string = todayVN()): string {
  const [y, m, d] = date.split("-").map(Number);
  const base = `${d} thg ${m}`;
  return y === Number(today.slice(0, 4)) ? base : `${base}, ${y}`;
}

export function longDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const weekday = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"][
    new Date(Date.parse(`${date}T00:00:00Z`)).getUTCDay()
  ];
  return `${weekday}, ${d} thg ${m}, ${y}`;
}

/** 3.5 → "3.5", 12 → "12". */
export function formatScore(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function percent(value: number, digits = 0): string {
  return `${(value * 100).toFixed(digits)}%`;
}

export const METHOD_LABEL = {
  points: "Thắng điểm",
  resign: "Bỏ cuộc",
  time: "Hết giờ",
} as const;

export const COLOR_LABEL = { black: "Đen", white: "Trắng" } as const;

/** Câu kể chuyện cho một ván: "Minh thắng Lan 3.5 điểm". */
export function matchHeadline(m: Pick<MatchView, "winner" | "black" | "white" | "win_method" | "score_difference">): {
  winnerName: string;
  loserName: string;
  detail: string;
} {
  const winnerIsBlack = m.winner === m.black.id;
  const winnerName = (winnerIsBlack ? m.black : m.white).display_name;
  const loserName = (winnerIsBlack ? m.white : m.black).display_name;
  const detail =
    m.win_method === "points"
      ? `${formatScore(m.score_difference ?? 0)} điểm`
      : m.win_method === "resign"
        ? "khi đối thủ bỏ cuộc"
        : "do hết giờ";
  return { winnerName, loserName, detail };
}

/** Ván nhìn từ góc độ một người chơi. */
export function resultFor(m: Pick<MatchView, "black" | "white" | "winner">, playerId: string) {
  const color = m.black.id === playerId ? ("black" as const) : ("white" as const);
  const me = color === "black" ? m.black : m.white;
  const opponent = color === "black" ? m.white : m.black;
  return { color, me, opponent, won: m.winner === playerId };
}

/** "thắng 4.5 điểm" / "thắng do đối thủ bỏ cuộc" … từ góc nhìn của người chơi. */
export function outcomePhrase(
  m: Pick<MatchView, "win_method" | "score_difference">,
  won: boolean,
): string {
  const verb = won ? "thắng" : "thua";
  if (m.win_method === "points") return `${verb} ${formatScore(m.score_difference ?? 0)} điểm`;
  if (m.win_method === "resign") return won ? "thắng vì đối thủ bỏ cuộc" : "thua vì bỏ cuộc";
  return won ? "thắng do đối thủ hết giờ" : "thua do hết giờ";
}
