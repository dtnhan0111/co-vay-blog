import { percent } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Thanh tỉ lệ thắng: nhãn + "12/19" + phần trăm bằng chữ, không chỉ bằng màu. */
export function RatioBar({ label, wins, games, className }: { label: React.ReactNode; wins: number; games: number; className?: string }) {
  const ratio = games ? wins / games : 0;
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="flex items-center gap-2 font-medium">{label}</span>
        <span className="text-muted-foreground tabular-nums">
          {games ? (
            <>
              <b className="text-foreground">{percent(ratio)}</b> · {wins}/{games} ván
            </>
          ) : (
            "chưa có ván"
          )}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-foreground/10" role="img" aria-label={`${percent(ratio)} thắng`}>
        <div className="h-full rounded-full bg-wood dark:bg-board" style={{ width: `${ratio * 100}%` }} />
      </div>
    </div>
  );
}
