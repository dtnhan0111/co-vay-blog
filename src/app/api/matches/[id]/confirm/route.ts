import { NextResponse } from "next/server";
import { readJson, requireViewerApi, route, type IdContext } from "@/lib/api";
import { repo } from "@/lib/data";
import { respondSchema } from "@/lib/validators";

/** POST /api/matches/:id/confirm { decision: "confirmed" | "rejected", reason? } */
export const POST = route<IdContext>(async (request, { params }) => {
  const { id } = await params;
  const viewer = await requireViewerApi();
  const { decision, reason } = respondSchema.parse(await readJson(request));
  const match = await repo.respondToMatch(id, viewer.id, decision, decision === "rejected" ? reason : null);
  return NextResponse.json({ match });
});
