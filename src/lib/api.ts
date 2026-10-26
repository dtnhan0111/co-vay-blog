import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getViewer } from "@/lib/auth";
import { DataError, type Player } from "@/lib/data/types";

type Handler<C> = (request: Request, context: C) => Promise<Response>;

/** Bọc route handler: chuyển lỗi miền dữ liệu / validate thành JSON `{ error }` nhất quán. */
export function route<C = unknown>(handler: Handler<C>): Handler<C> {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      if (error instanceof DataError) return NextResponse.json({ error: error.message }, { status: error.status });
      if (error instanceof ZodError) {
        const first = error.issues[0];
        return NextResponse.json(
          { error: first?.message ?? "Dữ liệu không hợp lệ", field: first?.path.join(".") || undefined },
          { status: 400 },
        );
      }
      console.error("[api]", error);
      return NextResponse.json({ error: "Có lỗi xảy ra, bạn thử lại sau nhé." }, { status: 500 });
    }
  };
}

export async function requireViewerApi(): Promise<Player> {
  const viewer = await getViewer();
  if (!viewer) throw new DataError("Bạn cần đăng nhập để làm việc này.", 401);
  return viewer;
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new DataError("Nội dung gửi lên không hợp lệ.");
  }
}

export type IdContext = { params: Promise<{ id: string }> };
