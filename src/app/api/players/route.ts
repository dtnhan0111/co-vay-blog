import { NextResponse } from "next/server";
import { route } from "@/lib/api";
import { getClubMap, getConfirmedMatches, getPlayers } from "@/lib/queries";
import { playerStats } from "@/lib/stats";

/** GET /api/players?club=<id>&q=<tên> — danh bạ kỳ thủ kèm thành tích. */
export const GET = route(async (request) => {
  const url = new URL(request.url);
  const club = url.searchParams.get("club");
  const q = url.searchParams.get("q")?.trim().toLowerCase();
  const [players, matches, clubs] = await Promise.all([getPlayers(), getConfirmedMatches(), getClubMap()]);

  const data = players
    .filter((p) => (!club || p.club_id === club) && (!q || p.display_name.toLowerCase().includes(q)))
    .map((p) => {
      const s = playerStats(p.id, matches);
      return {
        ...p,
        club: p.club_id ? (clubs.get(p.club_id) ?? null) : null,
        stats: { games: s.games, wins: s.wins, losses: s.losses, winRate: s.winRate, lastPlayedOn: s.lastPlayedOn },
      };
    });
  return NextResponse.json({ players: data });
});
