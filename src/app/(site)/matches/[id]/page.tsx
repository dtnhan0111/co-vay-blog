import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MatchCard } from "@/components/feed/match-card";
import { IncomingRequestCard, OutgoingCard } from "@/components/match/confirmation-cards";
import { getViewer } from "@/lib/auth";
import { repo } from "@/lib/data";
import { longDate, todayVN } from "@/lib/format";

export const metadata: Metadata = { title: "Ván cờ" };

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [match, viewer] = await Promise.all([repo.getMatch(id), getViewer()]);
  if (!match) notFound();

  const confirmed = match.status === "confirmed";
  const waitingOnMe = !confirmed && match.status === "pending" && match.confirmation?.user_id === viewer?.id;
  const recordedByMe = match.recorded_by === viewer?.id;
  const recorder = match.recorded_by === match.black.id ? match.black : match.white;
  const responder = match.recorded_by === match.black.id ? match.white : match.black;

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Kỳ phổ
      </Link>

      {!confirmed && viewer && (
        <div className="wood-card wood-board p-5">
          <p className="mb-3 text-sm font-medium opacity-80">
            {match.status === "pending" ? "Chưa được xác nhận" : "Bị báo sai sót"}
          </p>
          {waitingOnMe && <IncomingRequestCard match={match} viewerId={viewer.id} />}
          {recordedByMe && <OutgoingCard match={match} viewerId={viewer.id} />}
        </div>
      )}

      <MatchCard match={match} signedIn={!!viewer} today={todayVN()} showKudos={confirmed} linkToDetail={false} />

      <dl className="paper-card divide-y divide-border/70 text-sm [&>div]:flex [&>div]:justify-between [&>div]:gap-4 [&>div]:px-4 [&>div]:py-3">
        <div>
          <dt className="text-muted-foreground">Ngày đánh</dt>
          <dd className="text-right font-medium">{longDate(match.played_on)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Địa điểm</dt>
          <dd className="text-right font-medium">{match.location}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Bàn cờ</dt>
          <dd className="text-right font-medium">
            {match.board_size}×{match.board_size}
            {match.handicap > 0 ? ` · chấp ${match.handicap}` : " · không chấp"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Ghi bởi</dt>
          <dd className="text-right font-medium">
            <Link href={`/players/${recorder.id}`} className="hover:underline">
              {recorder.display_name}
            </Link>
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Xác nhận bởi</dt>
          <dd className="text-right font-medium">
            {confirmed ? (
              <Link href={`/players/${responder.id}`} className="hover:underline">
                {responder.display_name}
              </Link>
            ) : (
              <span className="text-muted-foreground">{match.status === "pending" ? "đang chờ" : "—"}</span>
            )}
          </dd>
        </div>
      </dl>
    </div>
  );
}
