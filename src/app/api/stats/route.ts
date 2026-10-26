import { NextResponse } from "next/server";
import { route } from "@/lib/api";
import { todayVN } from "@/lib/format";
import { getClubs, getConfirmedMatches, getPlayers } from "@/lib/queries";
import { communityStats, parseRange, rangeSince } from "@/lib/stats";

/** GET /api/stats?range=30|90|all */
export const GET = route(async (request) => {
  const range = parseRange(new URL(request.url).searchParams.get("range") ?? undefined);
  const today = todayVN();
  const [matches, players, clubs] = await Promise.all([getConfirmedMatches(), getPlayers(), getClubs()]);
  return NextResponse.json({ range, stats: communityStats(matches, players, clubs, today, rangeSince(range, today)) });
});
