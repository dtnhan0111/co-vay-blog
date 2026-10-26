import { cn } from "@/lib/utils";
import { Stone } from "./stone";

/** Loading: Đen, Trắng, Đen lần lượt rơi xuống ba giao điểm của một mảnh bàn cờ. */
export function StoneLoader({ label = "Đang xếp quân…", className }: { label?: string; className?: string }) {
  const stones = [
    { color: "black", x: 22, y: 22, delay: "0s" },
    { color: "white", x: 62, y: 22, delay: "0.35s" },
    { color: "black", x: 42, y: 52, delay: "0.7s" },
  ] as const;

  return (
    <div role="status" aria-live="polite" className={cn("stone-loader flex flex-col items-center gap-3", className)}>
      <div className="relative h-[84px] w-[84px]">
        <svg viewBox="0 0 84 84" className="absolute inset-0 text-wood/40" aria-hidden>
          <path d="M22 8V76M62 8V76M8 22H76M8 52H76" stroke="currentColor" strokeWidth="1" />
        </svg>
        {stones.map((s) => (
          <Stone
            key={s.delay}
            color={s.color}
            size={26}
            className="absolute"
            style={{
              left: s.x - 13,
              top: s.y - 13,
              opacity: 0,
              animation: `stone-loop 2.1s ${s.delay} infinite cubic-bezier(0.2, 0.9, 0.3, 1.1)`,
            }}
          />
        ))}
      </div>
      <p className="font-display text-base tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}
