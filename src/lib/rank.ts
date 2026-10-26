/**
 * Hạng cờ Vây được lưu thành một số nguyên liên tục:
 *   9 dan = 9 … 1 dan = 1, 1 kyu = 0, 2 kyu = -1 … 30 kyu = -29.
 * Nhờ vậy so sánh hạng chỉ là so sánh số.
 */
export const MIN_RANK = -29;
export const MAX_RANK = 9;

export function formatRank(value: number): string {
  return value >= 1 ? `${value} dan` : `${1 - value} kyu`;
}

/** Dạng ngắn: "3k", "2d". */
export function formatRankShort(value: number): string {
  return value >= 1 ? `${value}d` : `${1 - value}k`;
}

export type RankGroup = "dan" | "high-kyu" | "low-kyu";

export const RANK_GROUP_LABEL: Record<RankGroup, string> = {
  dan: "Dan",
  "high-kyu": "Kyu cao (1–5k)",
  "low-kyu": "Kyu thấp (6k+)",
};

export function rankGroup(value: number): RankGroup {
  if (value >= 1) return "dan";
  return value >= -4 ? "high-kyu" : "low-kyu";
}

/** Danh sách hạng để chọn: 6 dan → 20 kyu (đủ cho cộng đồng nghiệp dư). */
export const RANK_OPTIONS = Array.from({ length: 6 + 20 }, (_, i) => 6 - i).map((value) => ({
  value,
  label: formatRank(value),
}));
