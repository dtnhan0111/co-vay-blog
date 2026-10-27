import { NextResponse } from "next/server";
import { readJson, requireViewerApi, route, type IdContext } from "@/lib/api";
import { DataError, repo } from "@/lib/data";
import { buildReplay } from "@/lib/sgf/replay";
import { commentSchema } from "@/lib/validators";

/** GET /api/matches/:id/comments — bình luận kỳ phổ (công khai). */
export const GET = route<IdContext>(async (_request, { params }) => {
  const { id } = await params;
  return NextResponse.json({ comments: await repo.listComments(id) });
});

/** POST /api/matches/:id/comments { body, move_number? } — thành viên bình luận vào ván có kỳ phổ. */
export const POST = route<IdContext>(async (request, { params }) => {
  const { id } = await params;
  const viewer = await requireViewerApi();
  const input = commentSchema.parse(await readJson(request));

  const match = await repo.getMatch(id);
  if (!match || match.status !== "confirmed") throw new DataError("Không tìm thấy ván này.", 404);
  if (!match.sgf) throw new DataError("Ván này chưa có kỳ phổ nên chưa nhận bình luận.", 409);
  if (input.move_number !== null && input.move_number > buildReplay(match.sgf).moves) {
    throw new DataError("Kỳ phổ không có nước thứ " + input.move_number + ".");
  }
  const comment = await repo.addComment(id, viewer.id, input);
  return NextResponse.json({ comment }, { status: 201 });
});
