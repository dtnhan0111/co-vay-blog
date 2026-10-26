import { formatRank } from "@/lib/rank";
import { cn } from "@/lib/utils";

export function RankBadge({ rank, className }: { rank: number; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-wood/40 px-2 py-px text-[11px] font-semibold tracking-wide text-wood tabular-nums dark:border-board/40 dark:text-board",
        className,
      )}
    >
      {formatRank(rank)}
    </span>
  );
}
