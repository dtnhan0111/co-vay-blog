import { NextResponse } from "next/server";
import { readJson, requireViewerApi, route, type IdContext } from "@/lib/api";
import { DataError, repo } from "@/lib/data";
import { sgfBodySchema, sgfProblem } from "@/lib/validators";

/** PATCH /api/matches/:id/sgf { sgf: string | null } — hai người chơi hoặc admin thêm / thay / gỡ kỳ phổ. */
export const PATCH = route<IdContext>(async (request, { params }) => {
  const { id } = await params;
  const viewer = await requireViewerApi();
  const { sgf } = sgfBodySchema.parse(await readJson(request));

  const match = await repo.getMatch(id);
  if (!match) throw new DataError("Không tìm thấy ván này.", 404);
  if (match.black.id !== viewer.id && match.white.id !== viewer.id && !viewer.is_admin) {
    throw new DataError("Chỉ hai người chơi của ván này hoặc quản trị viên mới được thêm kỳ phổ.", 403);
  }
  if (sgf) {
    const problem = sgfProblem(sgf, match.board_size);
    if (problem) throw new DataError(problem);
  }
  await repo.setMatchSgf(id, viewer.id, sgf || null);
  return NextResponse.json({ ok: true });
});
