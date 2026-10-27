import Link from "next/link";
import { RankBadge } from "@/components/go/rank-badge";
import { Stone, StoneAvatar } from "@/components/go/stone";
import type { Player } from "@/lib/data/types";
import { timeAgo } from "@/lib/format";

function Name({ player }: { player: Player }) {
  return (
    <Link href={`/players/${player.id}`} className="relative z-10 -my-1 inline-block max-w-full truncate py-1 align-bottom font-semibold hover:underline">
      {player.display_name}
    </Link>
  );
}

/** "Hiền đang thắng 5 ván liên tiếp": một hàng quân đen, quân cuối viền đỏ triện. */
export function StreakItem({ player, length, at }: { player: Player; length: number; at: string }) {
  const shown = Math.min(length, 10);
  return (
    <div className="paper-card flex items-center gap-3 px-4 py-3">
      <StoneAvatar player={player} size={40} />
      <div className="min-w-0 flex-1">
        <p className="text-[15px] leading-snug">
          <Name player={player} /> <span className="text-foreground/85">đang thắng {length} ván liên tiếp</span>
        </p>
        <div className="mt-1.5 flex items-center" aria-hidden>
          <span className="flex -space-x-1.5">
            {Array.from({ length: shown }, (_, i) => (
              <Stone key={i} color="black" size={16} className={i === shown - 1 ? "ring-2 ring-seal" : ""} />
            ))}
          </span>
          {length > shown && <span className="ml-2 text-xs text-muted-foreground">+{length - shown}</span>}
        </div>
      </div>
      <time className="shrink-0 self-start text-xs text-muted-foreground" dateTime={at} suppressHydrationWarning>
        {timeAgo(at)}
      </time>
    </div>
  );
}

/** "Minh vừa vào kỳ quán". */
export function JoinedItem({ player, at }: { player: Player; at: string }) {
  return (
    <div className="paper-card flex items-center gap-3 px-4 py-3">
      <StoneAvatar player={player} size={40} />
      <div className="min-w-0 flex-1">
        <p className="text-[15px] leading-snug">
          <Name player={player} /> <span className="text-foreground/85">vừa vào kỳ quán</span>
        </p>
        <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          Chào bạn mới <RankBadge rank={player.rank_value} />
        </p>
      </div>
      <time className="shrink-0 self-start text-xs text-muted-foreground" dateTime={at} suppressHydrationWarning>
        {timeAgo(at)}
      </time>
    </div>
  );
}
