import { NextResponse } from "next/server";
import { readJson, requireViewerApi, route, type IdContext } from "@/lib/api";
import { repo, DataError } from "@/lib/data";
import { getClubMap, getConfirmedMatches, getPlayerMap } from "@/lib/queries";
import { playerStats, topOpponents } from "@/lib/stats";
import { profilePatchSchema } from "@/lib/validators";

/** GET /api/players/:id — hồ sơ, thành tích và đối thủ thường gặp. */
export const GET = route<IdContext>(async (_request, { params }) => {
  const { id } = await params;
  const [players, clubs, matches] = await Promise.all([getPlayerMap(), getClubMap(), getConfirmedMatches()]);
  const player = players.get(id);
  if (!player) throw new DataError("Không tìm thấy kỳ thủ.", 404);
  return NextResponse.json({
    player,
    club: player.club_id ? (clubs.get(player.club_id) ?? null) : null,
    stats: playerStats(id, matches),
    opponents: topOpponents(id, matches).map((o) => ({ ...o, opponent: players.get(o.opponentId) ?? null })),
  });
});

/** PATCH /api/players/:id — chủ hồ sơ sửa thông tin của mình. */
export const PATCH = route<IdContext>(async (request, { params }) => {
  const { id } = await params;
  const viewer = await requireViewerApi();
  if (viewer.id !== id) throw new DataError("Bạn chỉ có thể sửa hồ sơ của chính mình.", 403);
  const patch = profilePatchSchema.parse(await readJson(request));
  return NextResponse.json({ player: await repo.updatePlayer(id, patch) });
});
