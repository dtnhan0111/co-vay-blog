import { cache } from "react";
import { redirect } from "next/navigation";
import { repo } from "@/lib/data";
import type { Player } from "@/lib/data/types";

/** Kỳ thủ đang đăng nhập (null nếu khách). Cache theo request. */
export const getViewer = cache((): Promise<Player | null> => repo.getViewer());

/** Dùng trong trang cần đăng nhập: chuyển sang /login rồi quay lại `next`. */
export async function requireViewer(next: string): Promise<Player> {
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(next)}`);
  return viewer;
}

/** Chỉ cho phép đường dẫn nội bộ làm đích chuyển hướng (chống open redirect). */
export function safeNext(next: string | null | undefined): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}
