import Link from "next/link";
import { Sparkles } from "lucide-react";
import { RankBadge } from "@/components/go/rank-badge";
import { Seal } from "@/components/go/seal";
import { StoneAvatar } from "@/components/go/stone";
import { Badge } from "@/components/ui/badge";
import type { MatchView, Player, StoneColor } from "@/lib/data/types";
import { COLOR_LABEL, formatScore, relativeDay, timeAgo } from "@/lib/format";
import { confirmedAt } from "@/lib/activity";
import { isBigWin } from "@/lib/stats";
import { cn } from "@/lib/utils";
import { KudosButton } from "./kudos-button";

type Props = {
  match: MatchView;
  signedIn: boolean;
  today: string;
  className?: string;
  showKudos?: boolean;
  linkToDetail?: boolean;
};

/** Một bên của ván: quân đúng màu đã cầm, tên (bấm sang hồ sơ), hạng. Người thắng đóng dấu triện, người thua để yên. */
function Side({ player, color, won }: { player: Player; color: StoneColor; won: boolean }) {
  return (
    <div className="flex min-h-12 items-center gap-3">
      <StoneAvatar player={player} tone={color} size={40} className={cn(won && "ring-2 ring-wood ring-offset-2 ring-offset-card")} />
      <div className="min-w-0 flex-1">
        <Link
          href={`/players/${player.id}`}
          className={cn("relative z-10 -my-1 block truncate py-1 text-[17px] leading-tight hover:underline", won ? "font-semibold" : "font-medium text-foreground/90")}
        >
          {player.display_name}
        </Link>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Cầm {COLOR_LABEL[color]}</span>
          <RankBadge rank={player.rank_value} />
        </p>
      </div>
      {won && <Seal />}
    </div>
  );
}

/** Một ván trên dòng hoạt động: đọc lướt được trên điện thoại. */
export function MatchCard({ match: m, signedIn, today, className, showKudos = true, linkToDetail = true }: Props) {
  const winnerIsBlack = m.winner === m.black.id;
  const winnerRank = (winnerIsBlack ? m.black : m.white).rank_value;
  const loserRank = (winnerIsBlack ? m.white : m.black).rank_value;
  const upset = m.handicap === 0 && winnerRank < loserRank;
  const bigWin = isBigWin(m);
  const oneSided = m.black.is_guest || m.white.is_guest;

  const how =
    m.win_method === "points" ? `Hơn ${formatScore(m.score_difference ?? 0)} điểm` : m.win_method === "resign" ? "Kết thúc bằng bỏ cuộc" : "Kết thúc do hết giờ";
  const setup = [m.handicap > 0 && `chấp ${m.handicap}`, m.board_size !== 19 && `bàn ${m.board_size}×${m.board_size}`].filter(Boolean).join(", ");
  const result = `${how}${setup ? `, ${setup}` : ""}`;

  return (
    <article className={cn("wood-card relative px-4 pt-2.5 pb-1.5", className)}>
      <Side player={m.black} color="black" won={winnerIsBlack} />
      <div className="my-0.5 ml-[19px] h-2 w-px bg-border" aria-hidden />
      <Side player={m.white} color="white" won={!winnerIsBlack} />

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-border/70 pt-2">
        <p className="min-w-0 text-sm font-medium">
          {linkToDetail ? (
            <Link href={`/matches/${m.id}`} className="after:absolute after:inset-0 after:content-['']" aria-label={`Xem ván: ${m.black.display_name} gặp ${m.white.display_name}`}>
              {result}
            </Link>
          ) : (
            result
          )}
        </p>
        <span className="flex flex-wrap gap-1">
          {upset && (
            <Badge variant="wood">
              <Sparkles /> Lật kèo
            </Badge>
          )}
          {bigWin && <Badge variant="default">Thắng đậm</Badge>}
          {m.has_sgf && <Badge variant="outline">Có kỳ phổ</Badge>}
          {oneSided && (
            <Badge variant="outline" title="Đối thủ chưa dùng app nên ván được ghi từ một phía">
              Ghi một phía
            </Badge>
          )}
        </span>
      </div>
      <p className="mt-1 truncate text-xs text-muted-foreground">
        {relativeDay(m.played_on, today)}, {m.location}
      </p>

      {m.note && <blockquote className="mt-2 line-clamp-2 border-l-2 border-seal/60 pl-3 text-sm leading-snug text-foreground/80 italic">{m.note}</blockquote>}

      {showKudos ? (
        <footer className="mt-1.5 flex items-center justify-between gap-3 border-t border-border/70 pt-0.5">
          <KudosButton matchId={m.id} count={m.kudos_count} active={m.kudosed_by_me} signedIn={signedIn} />
          <span className="shrink-0 text-xs text-muted-foreground" suppressHydrationWarning>
            xác nhận {timeAgo(confirmedAt(m))}
          </span>
        </footer>
      ) : (
        <div className="pb-2" />
      )}
    </article>
  );
}
