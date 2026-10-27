import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MatchListItem } from "@/components/feed/match-list-item";
import { ActivityBoard } from "@/components/go/activity-board";
import { BoardPanel } from "@/components/go/board-panel";
import { RankBadge } from "@/components/go/rank-badge";
import { RatioBar } from "@/components/go/ratio-bar";
import { SectionHeading } from "@/components/go/section-heading";
import { Stone, StoneAvatar } from "@/components/go/stone";
import { FrequentOpponents } from "@/components/players/frequent-opponents";
import { ProfileEditDialog } from "@/components/players/profile-edit-dialog";
import { RecentForm } from "@/components/players/recent-form";
import { StatsBand } from "@/components/players/stats-band";
import { Button } from "@/components/ui/button";
import { getViewer } from "@/lib/auth";
import { repo } from "@/lib/data";
import { METHOD_LABEL, relativeDay, todayVN } from "@/lib/format";
import { getClubMap, getClubs, getPlayerMap } from "@/lib/queries";
import { activityBoard, favoriteVenues, playerStats, topOpponents } from "@/lib/stats";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const player = (await getPlayerMap()).get((await params).id);
  return { title: player?.display_name ?? "Kỳ thủ" };
}

const joinedLabel = (iso: string) => {
  const [y, m] = iso.slice(0, 7).split("-").map(Number);
  return `tháng ${m}/${y}`;
};

export default async function ProfilePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ edit?: string }> }) {
  const { id } = await params;
  const { edit } = await searchParams;
  const today = todayVN();
  const [players, clubMap, clubs, viewer, matches] = await Promise.all([getPlayerMap(), getClubMap(), getClubs(), getViewer(), repo.listMatches({ playerId: id })]);
  const player = players.get(id);
  if (!player) notFound();

  const club = player.club_id ? clubMap.get(player.club_id) : undefined;
  const isMe = viewer?.id === id;
  const canEdit = isMe || (!!viewer && player.is_guest && player.created_by === viewer.id);
  const stats = playerStats(id, matches);
  const rivals = topOpponents(id, matches, 5);
  const venues = favoriteVenues(id, matches, 3);
  const years = player.playing_since ? new Date().getFullYear() - player.playing_since : null;
  const given = player.display_name.split(/\s+/).at(-1);

  // Mỗi quân trong "phong độ" biết mình là ván nào để bấm vào và để đọc được bằng chữ.
  const byId = new Map(matches.map((m) => [m.id, m]));
  const form = stats.form.map((f) => {
    const m = byId.get(f.matchId)!;
    const opponent = m.black.id === id ? m.white : m.black;
    return { ...f, label: `${f.won ? "Thắng" : "Thua"} ${opponent.display_name}, ${relativeDay(m.played_on, today).toLowerCase()}` };
  });

  return (
    <div className="space-y-8">
      <BoardPanel className="px-5 py-7 sm:px-9 sm:py-9">
        <Stone color="black" size={110} className="pointer-events-none absolute -top-8 -right-8 opacity-20 sm:[--size:190px]!" aria-hidden />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <StoneAvatar player={player} size={104} labelled className="shadow-xl" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <h1 className="min-w-0 text-4xl leading-tight font-bold break-words sm:text-5xl">{player.display_name}</h1>
              <RankBadge rank={player.rank_value} className="border-ink/50 text-ink dark:border-paper/50 dark:text-paper" />
              {player.is_guest && <span className="rounded-full bg-ink/15 px-2.5 py-0.5 text-xs font-medium dark:bg-paper/15">Khách, chưa dùng app</span>}
            </div>
            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink/80 dark:text-paper/80">
              {club && (
                <Link href={`/players?club=${club.id}`} className="underline-offset-4 hover:underline">
                  {club.name}
                </Link>
              )}
              {player.playing_since && (
                <span>
                  Chơi cờ từ {player.playing_since}
                  {years ? `, được ${years} năm` : ""}
                </span>
              )}
              {!player.is_guest && <span>Vào kỳ quán từ {joinedLabel(player.created_at)}</span>}
            </p>
            {player.bio && <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink/90 italic dark:text-paper/90">“{player.bio}”</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              {canEdit ? (
                <ProfileEditDialog defaultOpen={edit === "1"} player={player} clubs={clubs.map((c) => ({ id: c.id, name: c.name }))} />
              ) : (
                <>
                  <Button asChild>
                    <Link href={`/record?opponent=${id}`}>Ghi ván với {given}</Link>
                  </Button>
                  <Button asChild variant="outline" className="border-ink/40 dark:border-paper/40">
                    <Link href={`/head-to-head?a=${viewer?.id ?? id}&b=${viewer ? id : ""}`}>{viewer ? "Xem đối đầu với tôi" : "Xem đối đầu"}</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </BoardPanel>

      {stats.games === 0 ? (
        <div className="paper-card flex flex-col items-center gap-3 px-6 py-12 text-center">
          <div className="flex gap-1.5" aria-hidden>
            <Stone color="black" size={30} />
            <Stone color="white" size={30} />
          </div>
          <p className="font-display text-2xl">Chưa có ván nào được xác nhận</p>
          <p className="max-w-sm text-sm text-muted-foreground">{isMe ? "Ghi ván đầu tiên của bạn và mời đối thủ xác nhận." : `${given} chưa có ván nào trên kỳ phổ.`}</p>
          {isMe && (
            <Button asChild className="mt-1">
              <Link href="/record">Ghi ván đầu tiên</Link>
            </Button>
          )}
        </div>
      ) : (
        <>
          <StatsBand stats={stats} />

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
            <div className="wood-card space-y-6 p-5 sm:p-6">
              <div className="space-y-3">
                <h2 className="text-xl font-semibold">Phong độ gần đây</h2>
                <RecentForm form={form} />
              </div>
              <div className="space-y-4 border-t border-border/70 pt-5">
                <h2 className="text-xl font-semibold">Khi cầm quân</h2>
                <RatioBar
                  label={
                    <>
                      <Stone color="black" size={16} /> Cầm Đen
                    </>
                  }
                  wins={stats.asBlack.wins}
                  games={stats.asBlack.games}
                />
                <RatioBar
                  label={
                    <>
                      <Stone color="white" size={16} /> Cầm Trắng
                    </>
                  }
                  wins={stats.asWhite.wins}
                  games={stats.asWhite.games}
                />
              </div>
              <div className="border-t border-border/70 pt-5">
                <h2 className="mb-3 text-xl font-semibold">Cách kết thúc</h2>
                <dl className="grid grid-cols-3 gap-3 text-center">
                  {(["points", "resign", "time"] as const).map((k) => (
                    <div key={k} className="wood-inset rounded-xl px-2 py-3">
                      <dt className="text-xs text-muted-foreground">{METHOD_LABEL[k]}</dt>
                      <dd className="mt-1 text-sm">
                        <b className="text-win tabular-nums">{stats.byMethod[k].wins}</b>
                        <span className="text-muted-foreground"> thắng, </span>
                        <b className="tabular-nums">{stats.byMethod[k].losses}</b>
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
              <h2 className="text-xl font-semibold">Đối thủ thường gặp</h2>
              <p className="mb-2 text-sm text-muted-foreground">Bấm một người để xem hai bên đã đối đầu thế nào.</p>
              <FrequentOpponents playerId={id} records={rivals} players={players} />
            </div>
            <div className="wood-card p-5 sm:p-6">
              <h2 className="text-xl font-semibold">Hay đánh ở</h2>
              <ul className="mt-3 space-y-3">
                {venues.map((v) => (
                  <li key={v.location} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate">{v.location}</span>
                    <span className="shrink-0 text-muted-foreground tabular-nums">{v.games} ván</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="space-y-3">
            <SectionHeading title="Lịch sử ván" description={`${stats.games} ván đã xác nhận`} />
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
