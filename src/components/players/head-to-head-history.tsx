import Link from "next/link";
import { Seal } from "@/components/go/seal";
import { Stone } from "@/components/go/stone";
import type { MatchView } from "@/lib/data/types";
import { formatScore, shortDate } from "@/lib/format";
import { cn } from "@/lib/utils";

function resultText(m: MatchView) {
  if (m.win_method === "points") return `Hơn ${formatScore(m.score_difference ?? 0)} điểm`;
  return m.win_method === "resign" ? "Kết thúc bằng bỏ cuộc" : "Kết thúc do hết giờ";
}

/** Lịch sử đối đầu, mới nhất trước. Mỗi ván: ai cầm Đen, ai cầm Trắng, ai thắng, kết quả, ngày. */
export function HeadToHeadHistory({ matches, today }: { matches: MatchView[]; today: string }) {
  return (
    <ol className="wood-card divide-y divide-border/60 p-2">
      {matches.map((m) => (
        <li key={m.id}>
          <Link href={`/matches/${m.id}`} className="block rounded-xl px-2.5 py-3 transition-colors hover:bg-foreground/5 active:bg-foreground/8">
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center sm:gap-2">
              {[m.black, m.white].map((p, i) => {
                const won = m.winner === p.id;
                return (
                  <div key={p.id} className={cn("flex min-w-0 items-center gap-2", i === 1 && "sm:order-3 sm:flex-row-reverse sm:text-right")}>
                    <Stone color={i === 0 ? "black" : "white"} size={22} />
                    <span className={cn("min-w-0 truncate text-[15px]", won ? "font-semibold" : "text-foreground/85")}>{p.display_name}</span>
                    {won && <Seal className="size-[18px] text-[11px]" />}
                  </div>
                );
              })}
              <span className="order-2 hidden text-xs text-muted-foreground sm:inline">gặp</span>
            </div>
            <p className="mt-1.5 pl-[30px] text-xs text-muted-foreground">
              {resultText(m)}, {shortDate(m.played_on, today)}
              {m.handicap > 0 && `, chấp ${m.handicap}`}
            </p>
          </Link>
        </li>
      ))}
    </ol>
  );
}
