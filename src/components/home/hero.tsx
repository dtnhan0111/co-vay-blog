import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { BoardPanel } from "@/components/go/board-panel";
import { HeroBoard } from "@/components/go/hero-board";
import { Button } from "@/components/ui/button";
import type { Player } from "@/lib/data/types";

function givenName(name: string) {
  return name.trim().split(/\s+/).at(-1) ?? name;
}

type Props = {
  viewer: Player | null;
  pendingCount: number;
  daysSinceLastGame: number | null;
  totals: { players: number; matches: number; clubs: number; week: number };
};

export function Hero({ viewer, pendingCount, daysSinceLastGame, totals }: Props) {
  const headline = !viewer
    ? "Cờ Vây đánh ngoài đời, nhớ ở đây."
    : pendingCount > 0
      ? `${givenName(viewer.display_name)} ơi, có ${pendingCount} ván đang chờ bạn xác nhận.`
      : daysSinceLastGame === null
        ? `${givenName(viewer.display_name)} ơi, ván đầu tiên của bạn đang chờ.`
        : daysSinceLastGame === 0
          ? `${givenName(viewer.display_name)} ơi, bạn vừa đánh một ván hôm nay.`
          : `${givenName(viewer.display_name)} ơi, ${daysSinceLastGame} ngày rồi bạn chưa ghi ván.`;

  const community =
    totals.matches === 0
      ? "Chưa có ván nào trên kỳ phổ. Ván bạn ghi hôm nay sẽ là ván đầu tiên."
      : `${totals.players} kỳ thủ đã ghi ${totals.matches} ván tại ${totals.clubs || "nhiều"} câu lạc bộ, ${totals.week} ván trong 7 ngày qua.`;

  return (
    <BoardPanel className="px-5 py-8 sm:px-9 sm:py-10">
      <HeroBoard className="absolute top-1/2 right-6 hidden w-[200px] -translate-y-1/2 md:block lg:right-8" />
      <div className="relative max-w-[25rem]">
        <h1 className="text-[2.4rem] leading-[1.06] font-bold text-ink sm:text-5xl dark:text-paper">{headline}</h1>
        <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-ink/80 dark:text-paper/80">
          {viewer ? community : "Ghi lại mỗi ván đã đánh ở CLB, quán trà hay nhà bạn bè. Đối thủ xác nhận, kỳ phổ ghi nhớ."}
        </p>

        <div className="mt-6 flex flex-wrap gap-2.5">
          <Button asChild size="lg">
            <Link href="/record">
              <Plus /> Ghi ván mới
            </Link>
          </Button>
          {!viewer && (
            <Button asChild size="lg" variant="outline" className="border-ink/40 dark:border-paper/40">
              <Link href="/login">
                Vào kỳ quán <ArrowRight />
              </Link>
            </Button>
          )}
        </div>
        {!viewer && totals.matches > 0 && <p className="mt-5 text-sm text-ink/70 dark:text-paper/70">{community}</p>}
      </div>
    </BoardPanel>
  );
}
