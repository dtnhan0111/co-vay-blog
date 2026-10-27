import { requireViewerApi, route, type IdContext } from "@/lib/api";
import { repo } from "@/lib/data";

/** DELETE /api/comments/:id — tác giả hoặc admin xoá bình luận (RLS quyết định quyền). */
export const DELETE = route<IdContext>(async (_request, { params }) => {
  const { id } = await params;
  await requireViewerApi();
  await repo.deleteComment(id);
  return new Response(null, { status: 204 });
});
