import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DemoLogin } from "@/components/auth/demo-login";
import { GoogleSignInButton } from "@/components/auth/google-button";
import { BoardPanel } from "@/components/go/board-panel";
import { Stone } from "@/components/go/stone";
import { getViewer, safeNext } from "@/lib/auth";
import { isDemoMode } from "@/lib/data";
import { getClubMap, getPlayers } from "@/lib/queries";
import { DEMO_DEFAULT_PLAYER, seedId } from "@/lib/seed/source";

export const metadata: Metadata = { title: "Đăng nhập" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next: rawNext, error } = await searchParams;
  const next = safeNext(rawNext);
  if (await getViewer()) redirect(next);

  const demoPlayers = isDemoMode
    ? await (async () => {
        const [players, clubs] = await Promise.all([getPlayers(), getClubMap()]);
        const star = seedId("a", DEMO_DEFAULT_PLAYER);
        return players
          .map((p) => ({
            ...p,
            clubName: p.club_id ? (clubs.get(p.club_id)?.name ?? null) : null,
            hint: p.id === star ? "Gợi ý — có lời mời xác nhận đang chờ" : undefined,
          }))
          .sort((a, b) => Number(b.id === star) - Number(a.id === star) || b.rank_value - a.rank_value);
      })()
    : [];

  return (
    <div className="mx-auto max-w-lg space-y-6 py-4 sm:py-10">
      <BoardPanel className="px-6 py-8 text-center">
        <div className="mb-4 flex justify-center gap-2">
          <Stone color="black" size={52} />
          <Stone color="white" size={52} />
        </div>
        <h1 className="text-4xl font-bold">Vào kỳ quán</h1>
        <p className="mx-auto mt-2 max-w-xs text-[15px] text-ink/80 dark:text-paper/80">
          Đăng nhập để ghi ván, xác nhận với đối thủ và đặt một quân cho những ván hay.
        </p>
        {error && <p className="mt-3 text-sm font-medium text-loss">Đăng nhập chưa thành công, bạn thử lại nhé.</p>}
        {!isDemoMode && (
          <div className="mt-6">
            <GoogleSignInButton next={next} />
          </div>
        )}
      </BoardPanel>

      {isDemoMode && (
        <section className="space-y-3">
          <div>
            <h2 className="text-2xl font-semibold">Chọn một kỳ thủ mẫu</h2>
            <p className="text-sm text-muted-foreground">
              Đang ở chế độ demo (chưa cấu hình Supabase), nên thay cho Google bạn chọn ngồi vào ghế của một kỳ thủ hư cấu.
            </p>
          </div>
          <DemoLogin players={demoPlayers} next={next} />
        </section>
      )}
    </div>
  );
}
