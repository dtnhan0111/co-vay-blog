import Link from "next/link";
import { Clock, Flame, Sparkles } from "lucide-react";
import { RankBadge } from "@/components/go/rank-badge";
import { StoneAvatar } from "@/components/go/stone";
import type { Club, MatchRow, Player } from "@/lib/data/types";
import { formatScore } from "@/lib/format";
import { loserOf, playerStats, upsetGap } from "@/lib/stats";

type Props = { matches: MatchRow[]; players: Player[]; clubs: Club[]; since: string };

export function WeekSidebar({ matches, players, clubs, since }: Props) {
  const byId = new Map(players.map((p) => [p.id, p]));
  const rankOf = (id: string) => byId.get(id)?.rank_value ?? 0;

  const week = matches.filter((m) => m.played_on >= since);
  const upset = week
    .map((m) => ({ m, gap: upsetGap(m, rankOf) }))
    .filter((u) => u.gap > 0)
    .sort((a, b) => b.gap - a.gap)[0];

  const hot = players
    .map((p) => ({ p, streak: playerStats(p.id, matches).currentStreak }))
    .filter((x) => x.streak?.won && x.streak.length >= 3)
    .sort((a, b) => b.streak!.length - a.streak!.length)
    .slice(0, 3);

  return (
    <aside className="space-y-5">
      {upset && (
        <section className="wood-card p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Sparkles className="size-4" /> Lật kèo tuần này
          </h2>
          {(() => {
            const w = byId.get(upset.m.winner)!;
            const l = byId.get(loserOf(upset.m))!;
            return (
              <Link href={`/matches/${upset.m.id}`} className="mt-3 flex items-center gap-3">
                <StoneAvatar name={w.display_name} size={44} />
                <div className="min-w-0 text-sm">
                  <p>
                    <b>{w.display_name}</b> <RankBadge rank={w.rank_value} className="ml-0.5" />
                  </p>
                  <p className="text-muted-foreground">
                    thắng {l.display_name} ({upset.gap} hạng trên)
                    {upset.m.win_method === "points" && `, hơn ${formatScore(upset.m.score_difference ?? 0)} điểm`}
                  </p>
                </div>
              </Link>
            );
          })()}
        </section>
      )}

      {hot.length > 0 && (
        <section className="wood-card p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Flame className="size-4" /> Đang thắng liên tiếp
          </h2>
          <ul className="mt-3 space-y-2.5">
            {hot.map(({ p, streak }) => (
              <li key={p.id}>
                <Link href={`/players/${p.id}`} className="flex items-center gap-3 rounded-lg hover:bg-foreground/5">
                  <StoneAvatar name={p.display_name} size={36} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{p.display_name}</span>
                  <span className="font-display text-xl font-bold tabular-nums">{streak!.length}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {clubs.length > 0 && (
      <section className="wood-card p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Các câu lạc bộ</h2>
          <Link href="/players" className="text-xs text-muted-foreground underline-offset-4 hover:underline">
            Xem kỳ thủ
          </Link>
        </div>
        <ul className="mt-3 space-y-3">
          {clubs.map((c) => (
            <li key={c.id} className="text-sm">
              <Link href={`/players?club=${c.id}`} className="font-medium hover:underline">
                {c.name}
              </Link>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="size-3 shrink-0" /> {c.meets_at}
              </p>
            </li>
          ))}
        </ul>
      </section>
      )}
    </aside>
  );
}
