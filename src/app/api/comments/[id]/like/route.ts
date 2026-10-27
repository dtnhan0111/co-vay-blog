import { NextResponse } from "next/server";
import { requireViewerApi, route, type IdContext } from "@/lib/api";
import { repo } from "@/lib/data";

/** POST /api/comments/:id/like — đặt / thu hồi một quân cho bình luận (toggle). */
export const POST = route<IdContext>(async (_request, { params }) => {
  const { id } = await params;
  const viewer = await requireViewerApi();
  return NextResponse.json(await repo.toggleCommentLike(id, viewer.id));
});
