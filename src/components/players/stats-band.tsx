import { percent } from "@/lib/format";
import type { PlayerStats } from "@/lib/stats";

/** Số liệu của kỳ thủ trên một mảnh gỗ, chia bằng các đường kẻ mảnh như đường bàn cờ. */
export function StatsBand({ stats }: { stats: PlayerStats }) {
  const streak = stats.currentStreak?.won && stats.currentStreak.length >= 2 ? stats.currentStreak.length : null;
  const cells: { label: string; value: React.ReactNode; accent?: boolean }[] = [
    { label: "Số ván", value: stats.games },
    { label: "Thắng", value: stats.wins },
    { label: "Thua", value: stats.losses },
    { label: "Tỉ lệ thắng", value: stats.games > 0 ? percent(stats.winRate) : "—" },
    { label: "Chuỗi thắng", value: streak ?? "—", accent: streak !== null },
  ];
  return (
    <dl className="wood-card grid grid-cols-6 divide-x divide-border/70 sm:grid-cols-5 [&>div]:px-4 [&>div]:py-3.5">
      {cells.map((c, i) => (
        <div key={c.label} className={`${i < 3 ? "col-span-2" : "col-span-3 border-t border-border/70"} sm:col-span-1 sm:border-t-0 ${i === 3 ? "!border-l-0" : ""} sm:!border-l`}>
          <dt className="text-xs text-muted-foreground">{c.label}</dt>
          <dd className={`mt-0.5 font-display text-[2rem] leading-none font-bold tabular-nums ${c.accent ? "text-seal" : ""}`}>{c.value}</dd>
        </div>
      ))}
    </dl>
  );
}
