import Link from "next/link";
import { MapPin, Sparkles, Swords, Trophy } from "lucide-react";
import { RankBadge } from "@/components/go/rank-badge";
import { StoneAvatar } from "@/components/go/stone";
import { Badge } from "@/components/ui/badge";
import type { MatchView, Player } from "@/lib/data/types";
import { formatScore, matchHeadline, relativeDay } from "@/lib/format";
import { isBigWin } from "@/lib/stats";
import { cn } from "@/lib/utils";
import { KudosButton } from "./kudos-button";

function Side({ player, color, won, align }: { player: Player; color: "black" | "white"; won: boolean; align: "left" | "right" }) {
  return (
    <div className={cn("flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center", !won && "opacity-80")}>
      <div className="relative">
        <StoneAvatar name={player.display_name} tone={color} size={56} className={cn(won && "ring-2 ring-offset-2 ring-offset-card ring-wood")} />
        {won && (
          <span
            className={cn(
              "absolute -top-1.5 grid size-6 place-items-center rounded-full bg-wood text-white shadow ring-2 ring-card",
              align === "left" ? "-right-2" : "-left-2",
            )}
            title="Người thắng"
          >
            <Trophy className="size-3" />
            <span className="sr-only">Người thắng</span>
          </span>
        )}
      </div>
      <Link href={`/players/${player.id}`} className={cn("relative z-10 max-w-full truncate text-sm hover:underline", won ? "font-semibold" : "font-medium")}>
        {player.display_name}
      </Link>
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <span>{color === "black" ? "Đen" : "Trắng"}</span>
        <RankBadge rank={player.rank_value} />
      </div>
    </div>
  );
}

type Props = { match: MatchView; signedIn: boolean; today: string; className?: string; showKudos?: boolean; linkToDetail?: boolean };

/** Một ván trên "kỳ phổ" cộng đồng. */
export function MatchCard({ match: m, signedIn, today, className, showKudos = true, linkToDetail = true }: Props) {
  const { winnerName, loserName, detail } = matchHeadline(m);
  const winnerRank = (m.winner === m.black.id ? m.black : m.white).rank_value;
  const loserRank = (m.winner === m.black.id ? m.white : m.black).rank_value;
  const upset = m.handicap === 0 && winnerRank < loserRank;
  const bigWin = isBigWin(m);

  return (
    <article className={cn("wood-card relative p-4 sm:p-5", className)}>
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="font-medium text-foreground/80">{relativeDay(m.played_on, today)}</span>
        <span className="flex min-w-0 items-center gap-1">
          <MapPin className="size-3 shrink-0" />
          <span className="truncate">{m.location}</span>
        </span>
        <span className="ml-auto flex gap-1.5">
          {upset && (
            <Badge variant="wood">
              <Sparkles /> Lật kèo
            </Badge>
          )}
          {bigWin && <Badge variant="default">Thắng đậm</Badge>}
        </span>
      </header>

      <div className="mt-4 flex items-start gap-2">
        <Side player={m.black} color="black" won={m.winner === m.black.id} align="left" />
        <div className="flex shrink-0 flex-col items-center gap-1 pt-3 text-muted-foreground" aria-hidden>
          <span className="h-px w-8 bg-border sm:w-14" />
          <Swords className="size-4" />
          <span className="h-px w-8 bg-border sm:w-14" />
        </div>
        <Side player={m.white} color="white" won={m.winner === m.white.id} align="right" />
      </div>

      <h3 className="mt-4 text-center text-xl leading-snug font-semibold">
        {linkToDetail ? (
          <Link href={`/matches/${m.id}`} className="after:absolute after:inset-0 after:content-['']">
            <span>{winnerName}</span> <span className="font-normal text-muted-foreground">thắng</span> {loserName}
          </Link>
        ) : (
          <>
            <span>{winnerName}</span> <span className="font-normal text-muted-foreground">thắng</span> {loserName}
          </>
        )}
        <span className="block text-base font-normal text-muted-foreground">
          {m.win_method === "points" ? `hơn ${formatScore(m.score_difference ?? 0)} điểm` : detail}
        </span>
      </h3>

      {(m.handicap > 0 || m.board_size !== 19) && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {m.board_size !== 19 && <>Bàn {m.board_size}×{m.board_size}</>}
          {m.board_size !== 19 && m.handicap > 0 && " · "}
          {m.handicap > 0 && <>Chấp {m.handicap} quân</>}
        </p>
      )}

      {m.note && (
        <blockquote className="mt-3 border-l-2 border-wood/50 pl-3 text-sm leading-relaxed text-foreground/80 italic">{m.note}</blockquote>
      )}

      <footer className="mt-3 flex items-center justify-between border-t border-border pt-2">
        {showKudos ? <KudosButton matchId={m.id} count={m.kudos_count} active={m.kudosed_by_me} signedIn={signedIn} /> : <span />}
        {m.club && <span className="truncate text-xs text-muted-foreground">{m.club.name}</span>}
      </footer>
    </article>
  );
}
