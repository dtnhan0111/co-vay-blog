import { formatRank } from "@/lib/rank";
import { cn } from "@/lib/utils";

/** Hạng của kỳ thủ. Chưa có hạng (null/undefined) thì không hiện gì thay vì hiện "NaN kyu". */
export function RankBadge({ rank, className }: { rank: number | null | undefined; className?: string }) {
  if (rank === null || rank === undefined || Number.isNaN(rank)) return null;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center whitespace-nowrap rounded-full border border-wood/40 px-2 py-px text-[11px] font-semibold tracking-wide text-wood tabular-nums dark:border-board/40 dark:text-board",
        className,
      )}
    >
      {formatRank(rank)}
    </span>
  );
}
