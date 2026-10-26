import { NextResponse } from "next/server";
import { route } from "@/lib/api";
import { DataError } from "@/lib/data";
import { getConfirmedMatches, getPlayerMap } from "@/lib/queries";
import { headToHead, headToHeadSummary } from "@/lib/stats";
import { headToHeadQuery } from "@/lib/validators";

/** GET /api/head-to-head?a=<id>&b=<id> */
export const GET = route(async (request) => {
  const { a, b } = headToHeadQuery.parse(Object.fromEntries(new URL(request.url).searchParams));
  const [players, matches] = await Promise.all([getPlayerMap(), getConfirmedMatches()]);
  const pa = players.get(a);
  const pb = players.get(b);
  if (!pa || !pb) throw new DataError("Không tìm thấy kỳ thủ.", 404);
  const h2h = headToHead(a, b, matches);
  return NextResponse.json({ a: pa, b: pb, ...h2h, summary: headToHeadSummary(h2h, pa, pb) });
});
