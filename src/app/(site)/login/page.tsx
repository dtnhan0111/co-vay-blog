import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { GoogleSignInButton } from "@/components/auth/google-button";
import { BoardPanel } from "@/components/go/board-panel";
import { Stone } from "@/components/go/stone";
import { getViewer, safeNext } from "@/lib/auth";

export const metadata: Metadata = { title: "Đăng nhập" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next: rawNext, error } = await searchParams;
  const next = safeNext(rawNext);
  if (await getViewer()) redirect(next);

  return (
    <div className="mx-auto max-w-lg space-y-6 py-4 sm:py-10">
      <BoardPanel className="px-6 py-8 text-center">
        <div className="mb-4 flex justify-center gap-2">
          <Stone color="black" size={52} />
          <Stone color="white" size={52} />
        </div>
        <h1 className="text-4xl font-bold">Vào kỳ quán</h1>
        <p className="mx-auto mt-2 max-w-xs text-[15px] text-ink/80 dark:text-paper/80">
          Đăng nhập để ghi ván, nhờ đối thủ gật đầu, và đặt một quân khen ván hay.
        </p>
        {error && <p className="mt-3 text-sm font-medium text-loss">Đăng nhập chưa thành công, bạn thử lại nhé.</p>}
        <div className="mt-6">
          <GoogleSignInButton next={next} />
        </div>
      </BoardPanel>

    </div>
  );
}
