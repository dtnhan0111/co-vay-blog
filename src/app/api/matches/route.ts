import { NextResponse } from "next/server";
import { readJson, requireViewerApi, route } from "@/lib/api";
import { repo } from "@/lib/data";
import { matchesQuery, newMatchSchema } from "@/lib/validators";

/** GET /api/matches?player=&club=&limit=&offset= — các ván đã xác nhận, mới nhất trước. */
export const GET = route(async (request) => {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const q = matchesQuery.parse(params);
  const matches = await repo.listMatches({ playerId: q.player, clubId: q.club, limit: q.limit, offset: q.offset });
  return NextResponse.json({ matches });
});

/** POST /api/matches — ghi một ván (trạng thái pending, gửi yêu cầu xác nhận cho đối thủ). */
export const POST = route(async (request) => {
  const viewer = await requireViewerApi();
  const input = newMatchSchema.parse(await readJson(request));
  const match = await repo.createMatch(input, viewer.id);
  return NextResponse.json({ match }, { status: 201 });
});
