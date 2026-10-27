import Link from "next/link";
import { MapPin, ScrollText, Sparkles } from "lucide-react";
import { StoneAvatar } from "@/components/go/stone";
import { Badge } from "@/components/ui/badge";
import type { MatchView } from "@/lib/data/types";
import { COLOR_LABEL, formatScore, relativeDay } from "@/lib/format";
import { isBigWin } from "@/lib/stats";
import { cn } from "@/lib/utils";
import { KudosButton } from "./kudos-button";

type Props = { match: MatchView; signedIn: boolean; today: string; className?: string; showKudos?: boolean; linkToDetail?: boolean };

/** Một ván trên "kỳ phổ" cộng đồng — gọn trong ~3 dòng: ai thắng ai, thế nào, ở đâu. */
export function MatchCard({ match: m, signedIn, today, className, showKudos = true, linkToDetail = true }: Props) {
  const winnerIsBlack = m.winner === m.black.id;
  const [winner, loser] = winnerIsBlack ? [m.black, m.white] : [m.white, m.black];
  const winnerColor = winnerIsBlack ? "black" : "white";
  const loserColor = winnerIsBlack ? "white" : "black";

  const upset = m.handicap === 0 && winner.rank_value < loser.rank_value;
  const bigWin = isBigWin(m);
  const oneSided = m.black.is_guest || m.white.is_guest;

  const how =
    m.win_method === "points"
      ? `hơn ${formatScore(m.score_difference ?? 0)} điểm`
      : m.win_method === "resign"
        ? "đối thủ bỏ cuộc"
        : "đối thủ hết giờ";
  const setup = [m.handicap > 0 && `chấp ${m.handicap}`, m.board_size !== 19 && `bàn ${m.board_size}×${m.board_size}`].filter(Boolean).join(", ");

  const title = (
    <>
      {winner.display_name} <span className="font-normal text-muted-foreground">thắng</span> {loser.display_name}
    </>
  );

  return (
    <article className={cn("wood-card relative px-4 pt-3.5 pb-1.5", className)}>
      <div className="flex items-start gap-3">
        <div className="relative mt-0.5 flex shrink-0 -space-x-1.5" aria-hidden>
          <StoneAvatar name={winner.display_name} tone={winnerColor} size={44} className="relative z-10 ring-2 ring-wood ring-offset-2 ring-offset-card" />
          <StoneAvatar name={loser.display_name} tone={loserColor} size={38} className="mt-2.5 opacity-90" />
        </div>

        <div className="min-w-0 flex-1">
          <div>
            <h3 className="text-[1.15rem] leading-snug font-semibold">
              {linkToDetail ? (
                <Link href={`/matches/${m.id}`} className="after:absolute after:inset-0 after:content-['']">
                  {title}
                </Link>
              ) : (
                title
              )}
            </h3>
          </div>

          <p className="text-sm text-foreground/80">
            {how}, cầm {COLOR_LABEL[winnerColor]}
            {setup && `, ${setup}`}
          </p>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="flex min-w-0 items-center gap-1">
              <MapPin className="size-3 shrink-0" />
              <span className="truncate">
                {relativeDay(m.played_on, today)}, {m.location}
              </span>
            </span>
            <span className="flex flex-wrap gap-1">
              {upset && (
                <Badge variant="wood">
                  <Sparkles /> Lật kèo
                </Badge>
              )}
              {bigWin && <Badge variant="default">Thắng đậm</Badge>}
              {m.has_sgf && (
                <Badge variant="outline" title="Ván này có kỳ phổ để xem lại từng nước">
                  <ScrollText /> Có kỳ phổ
                </Badge>
              )}
              {oneSided && (
                <Badge variant="outline" title="Đối thủ chưa dùng app nên ván được ghi từ một phía">
                  Ghi một phía
                </Badge>
              )}
            </span>
          </div>
        </div>
      </div>

      {m.note && <blockquote className="mt-2 line-clamp-2 border-l-2 border-wood/50 pl-3 text-sm leading-snug text-foreground/80 italic">{m.note}</blockquote>}

      {showKudos && (
        <footer className="mt-1.5 flex items-center border-t border-border/70 pt-0.5">
          <KudosButton matchId={m.id} count={m.kudos_count} active={m.kudosed_by_me} signedIn={signedIn} />
        </footer>
      )}
      {!showKudos && <div className="pb-2" />}
    </article>
  );
}
