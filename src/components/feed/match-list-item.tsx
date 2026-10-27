import Link from "next/link";
import { MapPin } from "lucide-react";
import { StoneAvatar } from "@/components/go/stone";
import { Badge } from "@/components/ui/badge";
import type { MatchView } from "@/lib/data/types";
import { METHOD_LABEL, formatScore, relativeDay, resultFor } from "@/lib/format";

/** Một dòng gọn trong lịch sử ván, nhìn từ góc độ `perspectiveId`. */
export function MatchListItem({ match: m, perspectiveId, today }: { match: MatchView; perspectiveId: string; today: string }) {
  const { color, opponent, won } = resultFor(m, perspectiveId);
  return (
    <li>
      <Link href={`/matches/${m.id}`} className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-foreground/5">
        <StoneAvatar player={opponent} tone={color === "black" ? "white" : "black"} size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            vs {opponent.display_name}
            <span className="ml-2 text-xs font-normal text-muted-foreground">cầm {color === "black" ? "Đen" : "Trắng"}</span>
          </p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3 shrink-0" />
            <span className="truncate">
              {relativeDay(m.played_on, today)}, {m.location}
            </span>
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Badge variant={won ? "win" : "loss"}>{won ? "Thắng" : "Thua"}</Badge>
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {m.win_method === "points" ? `${formatScore(m.score_difference ?? 0)} điểm` : METHOD_LABEL[m.win_method]}
          </span>
        </div>
      </Link>
    </li>
  );
}
