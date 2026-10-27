import type { Metadata } from "next";
import Link from "next/link";
import { BoardPanel } from "@/components/go/board-panel";
import { RankBadge } from "@/components/go/rank-badge";
import { RatioBar } from "@/components/go/ratio-bar";
import { SectionHeading } from "@/components/go/section-heading";
import { StatTile } from "@/components/go/stat-tile";
import { Stone, StoneAvatar } from "@/components/go/stone";
import { StonePile } from "@/components/go/stone-pile";
import { H2HPicker } from "@/components/players/h2h-picker";
import { HeadToHeadHistory } from "@/components/players/head-to-head-history";
import { Button } from "@/components/ui/button";
import { getViewer } from "@/lib/auth";
import { repo } from "@/lib/data";
import { formatScore, relativeDay, shortDate, todayVN } from "@/lib/format";
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
  const lastMatch = between[0] ?? null;
  // Nút "Ghi ván" chỉ có nghĩa khi người đang xem là một trong hai bên.
  const opponentForViewer = viewer && a && b ? (viewer.id === a.id ? b : viewer.id === b.id ? a : null) : null;

  return (
    <div className="space-y-6">
      <SectionHeading title="Kỳ phùng địch thủ" description="Chọn hai kỳ thủ để xem họ đã gặp nhau thế nào." />
      <H2HPicker players={players} a={a?.id ?? null} b={b?.id ?? null} />

      {!a || !b || !h ? (
        <div className="wood-card space-y-4 px-6 py-10 text-center">
          <div className="flex justify-center gap-2" aria-hidden>
            <Stone color="black" size={52} />
            <Stone color="white" size={52} />
          </div>
          <p className="font-display text-2xl">{a ? `${a.display_name} muốn gặp ai?` : "Chọn hai kỳ thủ để xem thế trận"}</p>
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
                      className="wood-inset flex min-h-11 max-w-full items-center gap-2 rounded-full py-1.5 pr-4 pl-1.5 text-sm font-medium"
                    >
                      <StoneAvatar player={o} size={30} />
                      <span className="truncate">{o.display_name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          <BoardPanel className="px-4 py-7 sm:px-8 sm:py-9">
            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2 sm:gap-6">
              {[a, b].map((p, i) => {
                const leading = h.games > 0 && (i === 0 ? h.aWins > h.bWins : h.bWins > h.aWins);
                return (
                  <div key={p.id} className={i === 0 ? "order-1" : "order-3"}>
                    <Link href={`/players/${p.id}`} className="flex min-h-11 flex-col items-center gap-2 text-center">
                      <StoneAvatar player={p} tone={i === 0 ? "black" : "white"} size={84} className="sm:[--size:104px]!" />
                      <span className="line-clamp-2 max-w-full font-display text-xl leading-tight font-semibold break-words sm:text-2xl">{p.display_name}</span>
                      <RankBadge rank={p.rank_value} className="border-ink/50 text-ink dark:border-paper/50 dark:text-paper" />
                    </Link>
                    {leading && <p className="mx-auto mt-2 w-fit rounded-full bg-seal px-2.5 py-0.5 text-xs font-semibold text-[#fff4e0]">Đang dẫn</p>}
                  </div>
                );
              })}
              <div className="order-2 flex flex-col items-center pt-3 sm:pt-6">
                <p className="font-display text-5xl leading-none font-bold tabular-nums sm:text-7xl" aria-label={`${h.aWins} trên ${h.bWins}`}>
                  {h.aWins}
                  <span className="mx-1.5 font-normal opacity-50 sm:mx-3">–</span>
                  {h.bWins}
                </p>
                <p className="mt-2 text-sm opacity-75">{h.games} lần đối đầu</p>
              </div>
            </div>

            {h.games > 0 && (
              <div className="mt-6 grid grid-cols-[1fr_1px_1fr] gap-3 rounded-2xl bg-ink/10 p-3 dark:bg-black/20">
                <StonePile count={h.aWins} color="black" align="end" />
                <span className="bg-ink/30 dark:bg-paper/30" />
                <StonePile count={h.bWins} color="white" align="start" />
              </div>
            )}

            <p className="mx-auto mt-5 max-w-xl text-center font-display text-xl leading-snug italic sm:text-2xl">
              {h.games === 0 ? "Chưa có ván đấu nào giữa hai kỳ thủ." : headToHeadSummary(h, a, b)}
            </p>

            {h.games > 0 && lastMatch && (
              <p className="mt-3 text-center text-sm text-ink/80 dark:text-paper/80">
                <Link href={`/matches/${lastMatch.id}`} className="inline-block min-h-8 py-1 underline underline-offset-4">
                  Ván gần nhất: {(lastMatch.winner === a.id ? a : b).display_name} thắng, {shortDate(lastMatch.played_on, today)}
                </Link>
              </p>
            )}
          </BoardPanel>

          {h.games === 0 ? (
            <div className="paper-card flex flex-col items-center gap-3 px-6 py-10 text-center">
              <p className="max-w-sm text-sm text-muted-foreground">
                {opponentForViewer ? "Ván đầu tiên giữa hai bạn sẽ mở đầu cho cuộc đối đầu này." : "Khi hai người này có ván được xác nhận, lịch sử đối đầu sẽ hiện ở đây."}
              </p>
              {opponentForViewer && (
                <Button asChild>
                  <Link href={`/record?opponent=${opponentForViewer.id}`}>Ghi ván với {opponentForViewer.display_name.split(/\s+/).at(-1)}</Link>
                </Button>
              )}
            </div>
          ) : (
            <>
              <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatTile
                  label="Chuỗi hiện tại"
                  value={
                    h.streak ? (
                      <>
                        {h.streak.length}
                        <span className="ml-1 text-lg font-medium">thắng</span>
                      </>
                    ) : (
                      "—"
                    )
                  }
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
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <RatioBar label={<><Stone color="black" size={16} /> <span className="truncate">{a.display_name} cầm Đen</span></>} wins={h.aAsBlack.aWins} games={h.aAsBlack.games} />
                  <RatioBar label={<><Stone color="white" size={16} /> <span className="truncate">{a.display_name} cầm Trắng</span></>} wins={h.aAsWhite.aWins} games={h.aAsWhite.games} />
                  <RatioBar label={<><Stone color="black" size={16} /> <span className="truncate">{b.display_name} cầm Đen</span></>} wins={h.aAsWhite.games - h.aAsWhite.aWins} games={h.aAsWhite.games} />
                  <RatioBar label={<><Stone color="white" size={16} /> <span className="truncate">{b.display_name} cầm Trắng</span></>} wins={h.aAsBlack.games - h.aAsBlack.aWins} games={h.aAsBlack.games} />
                </div>
              </section>

              <section className="space-y-3">
                <SectionHeading title="Lịch sử đối đầu" description="Mới nhất trước. Bấm một ván để xem chi tiết." />
                <HeadToHeadHistory matches={between} today={today} />
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}
