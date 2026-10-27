import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { BoardPanel } from "@/components/go/board-panel";
import { HeroBoard } from "@/components/go/hero-board";
import { Button } from "@/components/ui/button";
import { MemberStrip } from "./member-strip";
import type { Player } from "@/lib/data/types";

function givenName(name: string) {
  return name.trim().split(/\s+/).at(-1) ?? name;
}

type Props = {
  viewer: Player | null;
  pendingCount: number;
  daysSinceLastGame: number | null;
  totals: { players: number; matches: number; clubs: number; week: number };
  recentMembers: Player[];
};

export function Hero({ viewer, pendingCount, daysSinceLastGame, totals, recentMembers }: Props) {
  const name = viewer ? givenName(viewer.display_name) : "";
  const headline = !viewer
    ? "Bàn cờ còn đó, cố nhân nơi đâu?"
    : pendingCount > 0
      ? `${name} ơi, có ${pendingCount} ván đang chờ bạn xác nhận.`
      : daysSinceLastGame === null
        ? `${name} ơi, ván đầu tiên của bạn đang chờ.`
        : daysSinceLastGame === 0
          ? `${name} ơi, bạn vừa đánh một ván hôm nay.`
          : daysSinceLastGame < 3
            ? `${name} ơi, hôm nay bạn đã ngồi xuống bàn cờ chưa?`
            : `Ấm trà đã nguội vài lần, kỳ quán vẫn chừa cho bạn một chỗ ngồi quen, ${name}.`;

  const community =
    totals.matches === 0
      ? "Chưa có ván nào trên kỳ phổ. Ván bạn ghi hôm nay sẽ là ván đầu tiên."
      : `${totals.matches} ván đã được ghi${totals.clubs ? ` tại ${totals.clubs} câu lạc bộ` : ""}, ${totals.week} ván trong 7 ngày qua.`;
  const away = viewer && pendingCount === 0 && daysSinceLastGame !== null && daysSinceLastGame >= 3 ? `Đã ${daysSinceLastGame} ngày bạn chưa ghi ván. ` : "";

  return (
    <BoardPanel className="px-5 py-8 sm:px-9 sm:py-10">
      <HeroBoard className="absolute top-1/2 right-6 hidden w-[200px] -translate-y-1/2 md:block lg:right-8" />
      <div className="relative max-w-[25rem]">
        <h1 className={`${headline.length > 50 ? "text-[1.9rem] sm:text-4xl" : "text-[2.4rem] sm:text-5xl"} leading-[1.1] font-bold text-ink dark:text-paper`}>{headline}</h1>
        <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-ink/80 dark:text-paper/80">
          {viewer ? `${away}${community}` : "Đánh xong một ván, ghi lại vài dòng. Nhiều năm sau nhìn lại, vẫn nhớ đã gặp ai bên bàn cờ hôm ấy."}
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
        <div><MemberStrip total={totals.players} recent={recentMembers} /></div>
        {!viewer && totals.matches > 0 && <p className="mt-3 text-sm text-ink/70 dark:text-paper/70">{community}</p>}
      </div>
    </BoardPanel>
  );
}
