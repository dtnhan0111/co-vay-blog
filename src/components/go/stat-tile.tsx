import { cn } from "@/lib/utils";

/** Một con số nổi bật — số kiểu display, chú thích nhỏ. */
export function StatTile({ label, value, sub, className }: { label: string; value: React.ReactNode; sub?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("wood-card flex flex-col justify-between gap-1 p-4", className)}>
      <p className="text-xs font-medium tracking-wide text-muted-foreground">{label}</p>
      <p className="font-display text-[2.1rem] leading-none font-bold tabular-nums">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
