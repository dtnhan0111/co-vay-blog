import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Plus, Swords } from "lucide-react";
import { MatchListItem } from "@/components/feed/match-list-item";
import { ActivityBoard } from "@/components/go/activity-board";
import { BoardPanel } from "@/components/go/board-panel";
import { FormStones } from "@/components/go/form-stones";
import { RankBadge } from "@/components/go/rank-badge";
import { RatioBar } from "@/components/go/ratio-bar";
import { SectionHeading } from "@/components/go/section-heading";
import { StatTile } from "@/components/go/stat-tile";
import { Stone, StoneAvatar } from "@/components/go/stone";
import { ProfileEditDialog } from "@/components/players/profile-edit-dialog";
import { Button } from "@/components/ui/button";
import { getViewer } from "@/lib/auth";
import { repo } from "@/lib/data";
import { METHOD_LABEL, formatScore, percent, relativeDay, todayVN } from "@/lib/format";
import { getClubMap, getClubs, getPlayerMap } from "@/lib/queries";
import { activityBoard, favoriteVenues, playerStats, topOpponents } from "@/lib/stats";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const player = (await getPlayerMap()).get((await params).id);
  return { title: player?.display_name ?? "Kỳ thủ" };
}

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const today = todayVN();
  const [players, clubMap, clubs, viewer, matches] = await Promise.all([
    getPlayerMap(),
    getClubMap(),
    getClubs(),
    getViewer(),
    repo.listMatches({ playerId: id }),
  ]);
  const player = players.get(id);
  if (!player) notFound();

  const club = player.club_id ? clubMap.get(player.club_id) : undefined;
  const isMe = viewer?.id === id;
  const stats = playerStats(id, matches);
  const rivals = topOpponents(id, matches, 4);
  const venues = favoriteVenues(id, matches, 3);
  const years = player.playing_since ? new Date().getFullYear() - player.playing_since : null;
  const given = player.display_name.split(/\s+/).at(-1);

  const streak = stats.currentStreak;
  const margin =
    stats.avgWinMargin != null || stats.avgLossMargin != null ? (
      <>
        {stats.avgWinMargin != null && <>thắng TB +{formatScore(Math.round(stats.avgWinMargin * 10) / 10)}</>}
        {stats.avgWinMargin != null && stats.avgLossMargin != null && " · "}
        {stats.avgLossMargin != null && <>thua TB −{formatScore(Math.round(stats.avgLossMargin * 10) / 10)}</>}
      </>
    ) : undefined;

  return (
    <div className="space-y-8">
      <BoardPanel className="px-5 py-7 sm:px-9 sm:py-9">
        <Stone color={player.rank_value % 2 === 0 ? "white" : "black"} size={110} className="pointer-events-none absolute -top-8 -right-8 opacity-25 sm:[--size:190px]!" aria-hidden />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <StoneAvatar name={player.display_name} size={104} labelled className="shadow-xl" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-4xl leading-none font-bold sm:text-5xl">{player.display_name}</h1>
              <RankBadge rank={player.rank_value} className="border-ink/50 text-ink dark:border-paper/50 dark:text-paper" />
            </div>
            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink/80 dark:text-paper/80">
              {club && (
                <Link href={`/players?club=${club.id}`} className="inline-flex items-center gap-1 underline-offset-4 hover:underline">
                  <MapPin className="size-3.5" /> {club.name}
                </Link>
              )}
              {player.playing_since && (
                <span>
                  Chơi cờ từ {player.playing_since}
                  {years ? ` · ${years} năm` : ""}
                </span>
              )}
            </p>
            {player.bio && <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink/90 italic dark:text-paper/90">“{player.bio}”</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              {isMe ? (
                <ProfileEditDialog player={player} clubs={clubs.map((c) => ({ id: c.id, name: c.name }))} />
              ) : (
                <>
                  <Button asChild>
                    <Link href={`/record?opponent=${id}`}>
                      <Plus /> Ghi ván với {given}
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="border-ink/40 dark:border-paper/40">
                    <Link href={`/head-to-head?a=${viewer?.id ?? id}&b=${viewer ? id : ""}`}>
                      <Swords /> {viewer ? "Đối đầu với tôi" : "Đối đầu"}
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </BoardPanel>

      {stats.games === 0 ? (
        <div className="paper-card px-6 py-12 text-center">
          <p className="font-display text-2xl">Chưa có ván nào được xác nhận</p>
          <p className="mt-1 text-sm text-muted-foreground">{isMe ? "Ghi ván đầu tiên của bạn và mời đối thủ xác nhận." : `${given} chưa có ván nào trên kỳ phổ.`}</p>
        </div>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Số ván" value={stats.games} sub={`${stats.wins} thắng · ${stats.losses} thua`} />
            <StatTile label="Tỉ lệ thắng" value={percent(stats.winRate)} sub={stats.games < 5 ? "mới có ít ván" : `chuỗi thắng dài nhất ${stats.bestWinStreak}`} />
            <StatTile
              label="Chuỗi hiện tại"
              value={streak ? <>{streak.length}<span className="ml-1 text-lg font-medium">{streak.won ? "thắng" : "thua"}</span></> : "—"}
              sub={stats.lastPlayedOn ? `ván cuối: ${relativeDay(stats.lastPlayedOn, today).toLowerCase()}` : undefined}
            />
            <StatTile label="Chênh lệch điểm" value={stats.avgWinMargin != null ? `+${formatScore(Math.round(stats.avgWinMargin * 10) / 10)}` : "—"} sub={margin} />
          </section>

          <section className="grid gap-6 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
            <div className="wood-card space-y-6 p-5 sm:p-6">
              <div className="space-y-3">
                <h2 className="text-xl font-semibold">Phong độ</h2>
                <FormStones form={stats.form} size={32} />
                <p className="text-xs text-muted-foreground">10 ván gần nhất, cũ → mới · T = thắng, B = thua</p>
              </div>
              <div className="space-y-4 border-t border-border/70 pt-5">
                <h2 className="text-xl font-semibold">Khi cầm quân…</h2>
                <RatioBar label={<><Stone color="black" size={16} /> Cầm Đen</>} wins={stats.asBlack.wins} games={stats.asBlack.games} />
                <RatioBar label={<><Stone color="white" size={16} /> Cầm Trắng</>} wins={stats.asWhite.wins} games={stats.asWhite.games} />
              </div>
              <div className="border-t border-border/70 pt-5">
                <h2 className="mb-3 text-xl font-semibold">Cách kết thúc</h2>
                <dl className="grid grid-cols-3 gap-3 text-center">
                  {(["points", "resign", "time"] as const).map((k) => (
                    <div key={k} className="wood-inset rounded-xl px-2 py-3">
                      <dt className="text-xs text-muted-foreground">{METHOD_LABEL[k]}</dt>
                      <dd className="mt-1 text-sm">
                        <b className="text-win tabular-nums">{stats.byMethod[k].wins}</b>
                        <span className="text-muted-foreground"> thắng · </span>
                        <b className="text-loss tabular-nums">{stats.byMethod[k].losses}</b>
                        <span className="text-muted-foreground"> thua</span>
                      </dd>
                    </div>
                  ))}
                </dl>
                {stats.handicapGames > 0 && <p className="mt-2 text-xs text-muted-foreground">{stats.handicapGames} ván có chấp quân.</p>}
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-semibold">Bàn cờ hoạt động</h2>
              <ActivityBoard cells={activityBoard(id, matches, today)} />
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="wood-card p-5 sm:p-6">
              <h2 className="text-xl font-semibold">Hay gặp nhau</h2>
              <ul className="mt-3 space-y-1">
                {rivals.map((r) => {
                  const o = players.get(r.opponentId)!;
                  return (
                    <li key={r.opponentId}>
                      <Link
                        href={`/head-to-head?a=${id}&b=${r.opponentId}`}
                        className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-foreground/5"
                      >
                        <StoneAvatar name={o.display_name} size={40} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{o.display_name}</span>
                          <span className="block text-xs text-muted-foreground">{r.games} ván</span>
                        </span>
                        <span className="font-display text-xl font-bold tabular-nums">
                          {r.wins}–{r.losses}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="wood-card p-5 sm:p-6">
              <h2 className="text-xl font-semibold">Hay đánh ở</h2>
              <ul className="mt-3 space-y-3">
                {venues.map((v) => (
                  <li key={v.location} className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <MapPin className="size-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{v.location}</span>
                    </span>
                    <span className="text-muted-foreground tabular-nums">{v.games} ván</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="space-y-3">
            <SectionHeading title="Lịch sử ván" kicker={`${stats.games} ván đã xác nhận`} />
            <ul className="wood-card divide-y divide-border/60 p-2">
              {matches.slice(0, 20).map((m) => (
                <MatchListItem key={m.id} match={m} perspectiveId={id} today={today} />
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
