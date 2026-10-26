import { z } from "zod";
import { MAX_RANK, MIN_RANK } from "@/lib/rank";
import { todayVN, addDays } from "@/lib/format";

/** UUID dạng lỏng: chấp nhận cả id mẫu có xác định (không bắt version/variant như z.uuid()). */
const id = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "ID không hợp lệ");

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày không hợp lệ");

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Tối đa ${max} ký tự`)
    .nullish()
    .transform((v) => (v ? v : null));

export const newMatchSchema = z
  .object({
    opponent_id: id,
    my_color: z.enum(["black", "white"]),
    i_won: z.boolean(),
    win_method: z.enum(["points", "resign", "time"]),
    score_difference: z.number().positive("Chênh lệch phải lớn hơn 0").max(361.5).multipleOf(0.5, "Bội của 0.5").nullish(),
    played_on: isoDate,
    location: z.string().trim().min(2, "Hãy cho biết đã đánh ở đâu").max(80),
    club_id: id.nullish().transform((v) => v ?? null),
    note: optionalText(280),
    board_size: z.union([z.literal(9), z.literal(13), z.literal(19)]).default(19),
    handicap: z.number().int().min(0).max(9).default(0),
  })
  .superRefine((v, ctx) => {
    if (v.win_method === "points" && v.score_difference == null) {
      ctx.addIssue({ code: "custom", path: ["score_difference"], message: "Nhập số điểm hơn" });
    }
    if (v.played_on > addDays(todayVN(), 1)) {
      ctx.addIssue({ code: "custom", path: ["played_on"], message: "Không thể chọn ngày ở tương lai" });
    }
  })
  .transform((v) => ({ ...v, score_difference: v.win_method === "points" ? (v.score_difference ?? null) : null }));

export type NewMatchBody = z.input<typeof newMatchSchema>;

export const respondSchema = z.object({
  decision: z.enum(["confirmed", "rejected"]),
  reason: optionalText(280),
});

export const profilePatchSchema = z
  .object({
    display_name: z.string().trim().min(2, "Tên quá ngắn").max(60),
    rank_value: z.number().int().min(MIN_RANK).max(MAX_RANK),
    club_id: id.nullable(),
    bio: optionalText(280),
    playing_since: z.number().int().min(1950).max(new Date().getFullYear()).nullable(),
  })
  .partial();

export const guestSchema = z.object({
  display_name: z.string().trim().min(2, "Tên quá ngắn").max(60),
  rank_value: z.number().int().min(MIN_RANK).max(MAX_RANK),
});

export const headToHeadQuery = z.object({ a: id, b: id }).refine((v) => v.a !== v.b, "Hãy chọn hai kỳ thủ khác nhau");

export const matchesQuery = z.object({
  player: id.optional(),
  club: id.optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
