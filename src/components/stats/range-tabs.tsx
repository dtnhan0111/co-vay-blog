import Link from "next/link";
import { RANGE_LABEL, type RangeKey } from "@/lib/stats";
import { cn } from "@/lib/utils";

/** Bộ lọc thời gian dạng liên kết (render ở server, không cần JS). */
export function RangeTabs({ current }: { current: RangeKey }) {
  return (
    <nav aria-label="Khoảng thời gian" className="wood-inset inline-flex h-11 items-center gap-1 rounded-full p-1">
      {(Object.keys(RANGE_LABEL) as RangeKey[]).map((key) => (
        <Link
          key={key}
          href={key === "all" ? "/stats" : `/stats?range=${key}`}
          scroll={false}
          aria-current={current === key ? "page" : undefined}
          className={cn(
            "inline-flex h-9 items-center rounded-full px-4 text-sm font-medium transition-colors",
            current === key ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {RANGE_LABEL[key]}
        </Link>
      ))}
    </nav>
  );
}
