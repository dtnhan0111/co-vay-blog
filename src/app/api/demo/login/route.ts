import { NextResponse } from "next/server";
import { readJson, route } from "@/lib/api";
import { DataError, isDemoMode } from "@/lib/data";
import { DEMO_COOKIE } from "@/lib/data/demo";
import { getPlayerMap } from "@/lib/queries";
import { demoLoginSchema } from "@/lib/validators";

/** Chỉ tồn tại ở demo mode: "đăng nhập" bằng cách chọn một kỳ thủ mẫu. */
export const POST = route(async (request) => {
  if (!isDemoMode) throw new DataError("Không khả dụng.", 404);
  const { playerId } = demoLoginSchema.parse(await readJson(request));
  const player = (await getPlayerMap()).get(playerId);
  if (!player) throw new DataError("Không tìm thấy kỳ thủ.", 404);
  const response = NextResponse.json({ player });
  response.cookies.set(DEMO_COOKIE, playerId, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
  return response;
});

export const DELETE = route(async () => {
  if (!isDemoMode) throw new DataError("Không khả dụng.", 404);
  const response = new NextResponse(null, { status: 204 });
  response.cookies.delete(DEMO_COOKIE);
  return response;
});
