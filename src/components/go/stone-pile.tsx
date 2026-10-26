import { Stone } from "./stone";
import type { StoneColor } from "@/lib/data/types";
import { cn } from "@/lib/utils";

const MAX = 18;

/** Một chồng quân đếm số ván thắng. Quá 18 quân thì rút gọn bằng "+n". */
export function StonePile({ count, color, align }: { count: number; color: StoneColor; align: "start" | "end" }) {
  const shown = Math.min(count, MAX);
  return (
    <div className={cn("flex flex-wrap content-start gap-1", align === "end" ? "justify-end" : "justify-start")} aria-hidden>
      {Array.from({ length: shown }, (_, i) => (
        <Stone key={i} color={color} size={22} />
      ))}
      {count > MAX && <span className="self-center px-1 text-xs font-semibold text-muted-foreground">+{count - MAX}</span>}
    </div>
  );
}
