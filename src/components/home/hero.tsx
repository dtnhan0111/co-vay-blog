import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { BoardPanel } from "@/components/go/board-panel";
import { Stone } from "@/components/go/stone";
import { Button } from "@/components/ui/button";
import type { Player } from "@/lib/data/types";

function givenName(name: string) {
  return name.trim().split(/\s+/).at(-1) ?? name;
}

function daypart(now = new Date()) {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hour12: false, timeZone: "Asia/Ho_Chi_Minh" }).format(now));
  if (hour < 11) return "buổi sáng";
  if (hour < 14) return "buổi trưa";
  if (hour < 18) return "buổi chiều";
  return "buổi tối";
}

type Props = {
  viewer: Player | null;
  pendingCount: number;
  daysSinceLastGame: number | null;
  totals: { players: number; matches: number; clubs: number; week: number };
};

export function Hero({ viewer, pendingCount, daysSinceLastGame, totals }: Props) {
  const line = !viewer
    ? "Nơi những ván cờ Vây ngoài đời của Đà Nẵng được ghi nhớ — không phải bàn phím, mà là bàn gỗ, trà nóng và một đối thủ ngồi đối diện."
    : pendingCount > 0
      ? `Có ${pendingCount} ván đang chờ bạn xác nhận — một cái gật đầu là đủ.`
      : daysSinceLastGame === null
        ? "Bạn chưa ghi ván nào. Ván đầu tiên luôn đáng nhớ."
        : daysSinceLastGame === 0
          ? "Hôm nay bạn đã đánh một ván. Chúc ngon trà."
          : `Ván gần nhất của bạn cách đây ${daysSinceLastGame} ngày. Có ai đang chờ một nước đi?`;

  return (
    <BoardPanel className="px-5 py-7 sm:px-9 sm:py-10">
      <Stone color="black" size={92} className="pointer-events-none absolute -top-6 -right-5 opacity-90 sm:-top-4 sm:right-10 sm:[--size:150px]!" aria-hidden />
      <Stone color="white" size={64} className="pointer-events-none absolute hidden opacity-90 sm:top-32 sm:right-[12.5rem] sm:grid sm:[--size:104px]!" aria-hidden />

      <div className="relative max-w-xl">
        <p className="text-xs font-medium tracking-[0.22em] text-ink/70 uppercase dark:text-paper/70">
          {viewer ? `Chào ${daypart()}` : "Kỳ quán số · Đà Nẵng"}
        </p>
        <h1 className="mt-2 text-[2.5rem] leading-[1.02] font-bold text-ink sm:text-6xl dark:text-paper">
          {viewer ? (
            <>
              {givenName(viewer.display_name)},<br />
              <span className="font-medium italic">đến lượt bạn.</span>
            </>
          ) : (
            <>
              Cờ Vây,
              <br />
              <span className="font-medium italic">đánh thật, nhớ lâu.</span>
            </>
          )}
        </h1>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-ink/80 dark:text-paper/80">{line}</p>

        <div className="mt-5 flex flex-wrap gap-2.5">
          <Button asChild size="lg">
            <Link href="/record">
              <Plus /> Ghi ván mới
            </Link>
          </Button>
          {!viewer && (
            <Button asChild size="lg" variant="outline" className="border-ink/40 dark:border-paper/40">
              <Link href="/login">
                Tham gia kỳ quán <ArrowRight />
              </Link>
            </Button>
          )}
        </div>

        <dl className="mt-7 grid grid-cols-4 gap-2 border-t border-ink/20 pt-4 dark:border-paper/20">
          {[
            [totals.players, "kỳ thủ"],
            [totals.matches, "ván cờ"],
            [totals.clubs, "CLB"],
            [totals.week, "ván tuần này"],
          ].map(([n, label]) => (
            <div key={label} className="flex flex-col-reverse">
              <dt className="text-[11px] leading-tight text-ink/70 dark:text-paper/70">{label}</dt>
              <dd className="font-display text-3xl leading-none font-bold tabular-nums sm:text-4xl">{n}</dd>
            </div>
          ))}
        </dl>
      </div>
    </BoardPanel>
  );
}
