import { NextResponse } from "next/server";
import { requireViewerApi, route, type IdContext } from "@/lib/api";
import { repo } from "@/lib/data";

/** POST /api/matches/:id/kudos — đặt / thu hồi một quân (toggle). */
export const POST = route<IdContext>(async (_request, { params }) => {
  const { id } = await params;
  const viewer = await requireViewerApi();
  return NextResponse.json(await repo.toggleKudos(id, viewer.id));
});
