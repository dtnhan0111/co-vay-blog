import Link from "next/link";
import { RankBadge } from "@/components/go/rank-badge";
import { StoneAvatar } from "@/components/go/stone";
import type { Player } from "@/lib/data/types";
import type { OpponentRecord } from "@/lib/stats";

/** Đối thủ hay gặp: bấm một người để mở trang đối đầu giữa hai bên. */
export function FrequentOpponents({ playerId, records, players }: { playerId: string; records: OpponentRecord[]; players: Map<string, Player> }) {
  const rows = records.flatMap((r) => {
    const opponent = players.get(r.opponentId);
    return opponent ? [{ r, opponent }] : [];
  });
  if (rows.length === 0) return <p className="py-2 text-sm text-muted-foreground">Chưa gặp ai quá một lần.</p>;
  return (
    <ul className="-mx-2 divide-y divide-border/60">
      {rows.map(({ r, opponent }) => (
        <li key={r.opponentId}>
          <Link
            href={`/head-to-head?a=${playerId}&b=${opponent.id}`}
            className="flex min-h-14 items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-foreground/5 active:bg-foreground/8"
            aria-label={`Đối đầu với ${opponent.display_name}: ${r.games} lần, ${r.wins} thắng ${r.losses} thua`}
          >
            <StoneAvatar player={opponent} size={40} />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="min-w-0 truncate text-[15px] font-medium">{opponent.display_name}</span>
                <RankBadge rank={opponent.rank_value} />
              </span>
              <span className="block text-xs text-muted-foreground">{r.games} lần đối đầu</span>
            </span>
            <span className="shrink-0 text-right">
              <span className="block font-display text-xl leading-none font-bold tabular-nums">
                {r.wins}–{r.losses}
              </span>
              <span className="text-[11px] text-muted-foreground">thắng–thua</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
