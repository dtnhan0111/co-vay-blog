import type { Metadata } from "next";
import Link from "next/link";
import { Swords } from "lucide-react";
import { MatchListItem } from "@/components/feed/match-list-item";
import { BoardPanel } from "@/components/go/board-panel";
import { RankBadge } from "@/components/go/rank-badge";
import { RatioBar } from "@/components/go/ratio-bar";
import { SectionHeading } from "@/components/go/section-heading";
import { StatTile } from "@/components/go/stat-tile";
import { Stone, StoneAvatar } from "@/components/go/stone";
import { StonePile } from "@/components/go/stone-pile";
import { H2HPicker } from "@/components/players/h2h-picker";
import { getViewer } from "@/lib/auth";
import { repo } from "@/lib/data";
import { formatScore, relativeDay, todayVN } from "@/lib/format";
import { getPlayerMap, getPlayers } from "@/lib/queries";
import { headToHead, headToHeadSummary, topOpponents } from "@/lib/stats";

export const metadata: Metadata = { title: "Đối đầu" };

type Params = { a?: string; b?: string };

export default async function HeadToHeadPage({ searchParams }: { searchParams: Promise<Params> }) {
  const { a: rawA, b: rawB } = await searchParams;
  const [viewer, players, byId] = await Promise.all([getViewer(), getPlayers(), getPlayerMap()]);
  const today = todayVN();

  // Mặc định: a = chính bạn. Hai người phải khác nhau và đều tồn tại.
  const aId = (rawA && byId.has(rawA) ? rawA : null) ?? viewer?.id ?? null;
  const bId = rawB && byId.has(rawB) && rawB !== aId ? rawB : null;
  const a = aId ? byId.get(aId)! : null;
  const b = bId ? byId.get(bId)! : null;

  const matches = a ? await repo.listMatches({ playerId: a.id }) : [];
  const h = a && b ? headToHead(a.id, b.id, matches) : null;
  const suggestions = a && !b ? topOpponents(a.id, matches, 5) : [];
  const between = a && b ? matches.filter((m) => m.black.id === b.id || m.white.id === b.id) : [];

  return (
    <div className="space-y-6">
      <SectionHeading title="Đối đầu" />
      <H2HPicker players={players} a={a?.id ?? null} b={b?.id ?? null} />

      {!a || !b || !h ? (
        <div className="wood-card space-y-4 px-6 py-10 text-center">
          <div className="flex justify-center gap-2">
            <Stone color="black" size={52} />
            <Swords className="mt-3 size-6 text-muted-foreground" />
            <Stone color="white" size={52} />
          </div>
          <p className="font-display text-2xl">{a ? `${a.display_name} sẽ gặp ai?` : "Chọn hai kỳ thủ để xem thế trận"}</p>
          {suggestions.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Những người {a?.display_name.split(/\s+/).at(-1)} hay gặp:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestions.map((s) => {
                  const o = byId.get(s.opponentId)!;
                  return (
                    <Link
                      key={s.opponentId}
                      href={`/head-to-head?a=${a!.id}&b=${o.id}`}
                      className="wood-inset flex items-center gap-2 rounded-full py-1.5 pr-4 pl-1.5 text-sm font-medium"
                    >
                      <StoneAvatar name={o.display_name} size={30} />
                      {o.display_name}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          <BoardPanel className="px-4 py-7 sm:px-8">
            <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2 sm:gap-6">
              {[a, b].map((p, i) => (
                <div key={p.id} className={i === 0 ? "order-1" : "order-3"}>
                  <Link href={`/players/${p.id}`} className="flex flex-col items-center gap-2 text-center">
                    <StoneAvatar name={p.display_name} tone={i === 0 ? "black" : "white"} size={84} className="sm:[--size:104px]!" />
                    <span className="font-display text-xl leading-tight font-semibold sm:text-2xl">{p.display_name}</span>
                    <RankBadge rank={p.rank_value} className="border-ink/50 text-ink dark:border-paper/50 dark:text-paper" />
                  </Link>
                </div>
              ))}
              <div className="order-2 flex flex-col items-center pt-3 sm:pt-6">
                <p className="font-display text-5xl leading-none font-bold tabular-nums sm:text-7xl" aria-label={`${h.aWins} trên ${h.bWins}`}>
                  {h.aWins}<span className="mx-1.5 font-normal opacity-50 sm:mx-3">–</span>{h.bWins}
                </p>
                <p className="mt-2 text-sm opacity-70">{h.games} ván</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-[1fr_1px_1fr] gap-3 rounded-2xl bg-ink/10 p-3 dark:bg-black/20">
              <StonePile count={h.aWins} color="black" align="end" />
              <span className="bg-ink/30 dark:bg-paper/30" />
              <StonePile count={h.bWins} color="white" align="start" />
            </div>

            <p className="mx-auto mt-5 max-w-xl text-center font-display text-xl leading-snug italic sm:text-2xl">{headToHeadSummary(h, a, b)}</p>
          </BoardPanel>

          {h.games > 0 && (
            <>
              <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatTile
                  label="Chuỗi hiện tại"
                  value={h.streak ? <>{h.streak.length}<span className="ml-1 text-lg font-medium">thắng</span></> : "—"}
                  sub={h.streak ? (h.streak.holderId === a.id ? a : b).display_name : undefined}
                />
                <StatTile label="Gặp gần nhất" value={h.lastMeeting ? relativeDay(h.lastMeeting, today) : "—"} />
                <StatTile
                  label={`${a.display_name.split(/\s+/).at(-1)} thắng điểm`}
                  value={h.avgMarginA != null ? `+${formatScore(Math.round(h.avgMarginA * 10) / 10)}` : "—"}
                  sub="trung bình"
                />
                <StatTile
                  label={`${b.display_name.split(/\s+/).at(-1)} thắng điểm`}
                  value={h.avgMarginB != null ? `+${formatScore(Math.round(h.avgMarginB * 10) / 10)}` : "—"}
                  sub="trung bình"
                />
              </section>

              <section className="wood-card space-y-4 p-5 sm:p-6">
                <h2 className="text-xl font-semibold">Theo màu quân</h2>
                <div className="grid gap-5 sm:grid-cols-2">
                  <RatioBar label={<><Stone color="black" size={16} /> {a.display_name} cầm Đen</>} wins={h.aAsBlack.aWins} games={h.aAsBlack.games} />
                  <RatioBar label={<><Stone color="white" size={16} /> {a.display_name} cầm Trắng</>} wins={h.aAsWhite.aWins} games={h.aAsWhite.games} />
                  <RatioBar label={<><Stone color="black" size={16} /> {b.display_name} cầm Đen</>} wins={h.aAsWhite.games - h.aAsWhite.aWins} games={h.aAsWhite.games} />
                  <RatioBar label={<><Stone color="white" size={16} /> {b.display_name} cầm Trắng</>} wins={h.aAsBlack.games - h.aAsBlack.aWins} games={h.aAsBlack.games} />
                </div>
              </section>
            </>
          )}

          <section className="space-y-3">
            <SectionHeading title="Những lần gặp nhau" description={`Kết quả nhìn từ phía ${a.display_name}`} />
            {between.length === 0 ? (
              <div className="paper-card px-6 py-10 text-center text-sm text-muted-foreground">Hai người chưa có ván nào được xác nhận.</div>
            ) : (
              <ul className="wood-card divide-y divide-border/60 p-2">
                {between.map((m) => (
                  <MatchListItem key={m.id} match={m} perspectiveId={a.id} today={today} />
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
