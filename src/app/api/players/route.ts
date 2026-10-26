import { NextResponse } from "next/server";
import { readJson, requireViewerApi, route } from "@/lib/api";
import { repo } from "@/lib/data";
import { guestSchema } from "@/lib/validators";
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

/** POST /api/players — thành viên tạo hồ sơ "khách" cho đối thủ chưa dùng app. */
export const POST = route(async (request) => {
  const viewer = await requireViewerApi();
  const input = guestSchema.parse(await readJson(request));
  const player = await repo.createGuest(input, viewer.id);
  return NextResponse.json({ player }, { status: 201 });
});
