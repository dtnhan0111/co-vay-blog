import Link from "next/link";
import { StoneAvatar } from "@/components/go/stone";

export type LeaderRow = { id: string; href: string; name: string; player?: { display_name: string; avatar_tone: "black" | "white" | null; avatar_glyph: string | null }; value: React.ReactNode; sub?: React.ReactNode };

export function Leaderboard({ title, hint, rows, empty = "Chưa đủ dữ liệu." }: { title: string; hint?: string; rows: LeaderRow[]; empty?: string }) {
  return (
    <section className="wood-card p-5">
      <h3 className="text-xl font-semibold">{title}</h3>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {rows.length === 0 ? (
        <p className="py-6 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ol className="mt-3 space-y-0.5">
          {rows.map((r, i) => (
            <li key={r.id}>
              <Link href={r.href} className="flex items-center gap-3 rounded-xl px-1.5 py-2 transition-colors hover:bg-foreground/5">
                <span className="w-5 text-center font-display text-lg font-semibold text-muted-foreground tabular-nums">{i + 1}</span>
                {r.player ? <StoneAvatar player={r.player} size={38} /> : <StoneAvatar name={r.name} size={38} />}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{r.name}</span>
                  {r.sub && <span className="block truncate text-xs text-muted-foreground">{r.sub}</span>}
                </span>
                <span className="font-display text-xl font-bold tabular-nums">{r.value}</span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
