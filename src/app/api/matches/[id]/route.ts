import { NextResponse } from "next/server";
import { requireViewerApi, route, type IdContext } from "@/lib/api";
import { repo, DataError } from "@/lib/data";

export const GET = route<IdContext>(async (_request, { params }) => {
  const { id } = await params;
  const match = await repo.getMatch(id);
  if (!match) throw new DataError("Không tìm thấy ván này.", 404);
  return NextResponse.json({ match });
});

/** DELETE /api/matches/:id — người ghi huỷ ván chưa được xác nhận. */
export const DELETE = route<IdContext>(async (_request, { params }) => {
  const { id } = await params;
  const viewer = await requireViewerApi();
  await repo.cancelMatch(id, viewer.id);
  return new NextResponse(null, { status: 204 });
});
