import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Stone } from "@/components/go/stone";
import { SectionHeading } from "@/components/go/section-heading";
import { StatTile } from "@/components/go/stat-tile";
import { Leaderboard } from "@/components/stats/leaderboard";
import { MethodBar } from "@/components/stats/method-bar";
import { RangeTabs } from "@/components/stats/range-tabs";
import { StoneColumns } from "@/components/stats/stone-columns";
import { formatScore, percent, shortDate, todayVN } from "@/lib/format";
import { formatRankShort } from "@/lib/rank";
import { getClubMap, getClubs, getConfirmedMatches, getPlayerMap, getPlayers } from "@/lib/queries";
import { communityStats, loserOf, parseRange, rangeSince, RANGE_LABEL, MIN_GAMES_FOR_WIN_RATE } from "@/lib/stats";

export const metadata: Metadata = { title: "Thống kê" };

export default async function StatsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const range = parseRange((await searchParams).range);
  const today = todayVN();
  const [matches, players, clubs, byId, clubMap] = await Promise.all([getConfirmedMatches(), getPlayers(), getClubs(), getPlayerMap(), getClubMap()]);
  const s = communityStats(matches, players, clubs, today, rangeSince(range, today));
  const name = (id: string) => byId.get(id)?.display_name ?? "—";
  const link = (id: string) => `/players/${id}`;

  if (matches.length === 0) {
    return (
      <div className="space-y-6">
        <SectionHeading title="Thống kê kỳ quán" />
        <div className="wood-card space-y-3 px-6 py-14 text-center">
          <div className="flex justify-center gap-2">
            <Stone color="black" size={48} />
            <Stone color="white" size={48} />
          </div>
          <p className="font-display text-2xl">Bàn cờ còn trống</p>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">Số liệu sẽ xuất hiện khi những ván đầu tiên được ghi và xác nhận.</p>
          <Button asChild className="mt-2">
            <Link href="/record">Ghi ván đầu tiên</Link>
          </Button>
        </div>
      </div>
    );
  }

  const decided = s.blackWins + s.whiteWins;
  const blackShare = decided ? s.blackWins / decided : 0.5;
  const rangeText = range === "all" ? "từ trước đến nay" : `trong ${RANGE_LABEL[range]} qua`;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading title="Thống kê kỳ quán" />
        <RangeTabs current={range} />
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Ván đã đánh" value={s.totalMatches} sub={rangeText} />
        <StatTile label="Kỳ thủ hoạt động" value={s.activePlayers} sub={`trên ${s.totalPlayers} người trong kỳ quán`} />
        <StatTile label="7 ngày qua" value={s.matchesLast7Days} sub="ván mới được xác nhận" />
        <StatTile label="Chênh lệch trung bình" value={s.avgMargin != null ? formatScore(Math.round(s.avgMargin * 10) / 10) : "—"} sub="điểm, trong các ván tính điểm" />
      </section>

      <section className="wood-card space-y-4 p-5 sm:p-6">
        <div>
          <h2 className="text-2xl font-semibold">Nhịp độ 12 tuần</h2>
          <p className="text-sm text-muted-foreground">Mỗi quân cờ là một ván.</p>
        </div>
        <StoneColumns
          unit="ván"
          caption="Số ván theo tuần"
          columns={s.weekly.map((w, i) => ({
            key: w.weekStart,
            label: shortDate(w.weekStart, today).replace(" thg ", "/"),
            count: w.count,
            highlight: i === s.weekly.length - 1,
            sub: i === s.weekly.length - 1 ? "tuần này" : undefined,
          }))}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="wood-card space-y-4 p-5 sm:p-6">
          <h2 className="text-2xl font-semibold">Ván kết thúc thế nào</h2>
          <MethodBar methods={s.methods} />
        </div>
        <div className="wood-card space-y-4 p-5 sm:p-6">
          <div>
            <h2 className="text-2xl font-semibold">Đen hay Trắng?</h2>
            <p className="text-sm text-muted-foreground">Chỉ tính {s.evenGames} ván không chấp.</p>
          </div>
          {decided === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">Chưa có ván không chấp nào trong khoảng này.</p>
          ) : (
          <div className="flex items-center gap-4">
            <div className="text-center">
              <Stone color="black" size={52} />
              <p className="mt-1.5 font-display text-2xl leading-none font-bold tabular-nums">{percent(blackShare)}</p>
              <p className="text-xs text-muted-foreground">{s.blackWins} thắng</p>
            </div>
            <div className="flex h-5 flex-1 gap-0.5 overflow-hidden rounded-full" role="img" aria-label={`Đen thắng ${percent(blackShare)}, Trắng thắng ${percent(1 - blackShare)}`}>
              <div style={{ width: `${blackShare * 100}%`, background: "#111111", boxShadow: "0 0 0 1px rgb(216 188 135 / .35) inset" }} />
              <div style={{ width: `${(1 - blackShare) * 100}%`, background: "#f8f8f8" }} />
            </div>
            <div className="text-center">
              <Stone color="white" size={52} />
              <p className="mt-1.5 font-display text-2xl leading-none font-bold tabular-nums">{percent(1 - blackShare)}</p>
              <p className="text-xs text-muted-foreground">{s.whiteWins} thắng</p>
            </div>
          </div>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading title="Bảng vàng" description="Chỉ tính các ván mà cả hai bên đều là thành viên có tài khoản." />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <Leaderboard
            title="Chăm chỉ nhất"
            hint="Số ván đã đánh"
            rows={s.mostActive.map((r) => ({ id: r.playerId, href: link(r.playerId), name: name(r.playerId), value: r.games, sub: byId.get(r.playerId) && formatRankShort(byId.get(r.playerId)!.rank_value) }))}
          />
          <Leaderboard
            title="Tỉ lệ thắng cao nhất"
            hint={`Từ ${MIN_GAMES_FOR_WIN_RATE} ván trở lên`}
            empty={`Chưa ai đủ ${MIN_GAMES_FOR_WIN_RATE} ván trong khoảng này.`}
            rows={s.bestWinRate.map((r) => ({ id: r.playerId, href: link(r.playerId), name: name(r.playerId), value: percent(r.winRate), sub: `${r.games} ván` }))}
          />
          <Leaderboard
            title="Chuỗi thắng dài nhất"
            rows={s.longestStreaks.map((r) => ({ id: r.playerId, href: link(r.playerId), name: name(r.playerId), value: r.length, sub: r.ongoing ? "đang tiếp diễn" : "đã kết thúc" }))}
          />
          <Leaderboard
            title="Lật kèo đáng nhớ"
            hint="Thắng người hạng cao hơn, ván không chấp"
            empty="Chưa có cú lật kèo nào."
            rows={s.upsets.map((u) => ({
              id: u.match.id,
              href: `/matches/${u.match.id}`,
              name: name(u.match.winner),
              value: `+${u.gap}`,
              sub: `thắng ${name(loserOf(u.match))} · ${shortDate(u.match.played_on, today)}`,
            }))}
          />
          <Leaderboard
            title="Thắng đậm nhất"
            hint="Chênh lệch điểm lớn nhất"
            rows={s.bigWins.map((m) => ({
              id: m.id,
              href: `/matches/${m.id}`,
              name: name(m.winner),
              value: formatScore(m.score_difference ?? 0),
              sub: `thắng ${name(loserOf(m))} · ${shortDate(m.played_on, today)}`,
            }))}
            empty="Chưa có ván nào chênh từ 20 điểm."
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="wood-card space-y-4 p-5 sm:p-6">
          <div>
            <h2 className="text-2xl font-semibold">Kỳ thủ theo hạng</h2>
            <p className="text-sm text-muted-foreground">Mỗi quân là một người.</p>
          </div>
          <StoneColumns
            unit="người"
            caption="Số kỳ thủ theo hạng"
            columns={s.rankDistribution.map((r) => ({ key: String(r.rank), label: formatRankShort(r.rank), count: r.count }))}
          />
        </div>
        <div className="wood-card space-y-5 p-5 sm:p-6">
          <h2 className="text-2xl font-semibold">Nơi cờ được đánh</h2>
          <ul className="space-y-3">
            {s.clubActivity.map((c) => (
              <li key={c.clubId} className="space-y-1">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="truncate font-medium">{clubMap.get(c.clubId)?.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    <b className="text-foreground">{c.games}</b> ván · {c.members} kỳ thủ
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-foreground/10">
                  <div className="h-full rounded-full bg-wood dark:bg-board" style={{ width: `${(c.games / Math.max(1, s.clubActivity[0]?.games ?? 1)) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
          {s.venues.length > 0 && (
            <div className="border-t border-border/70 pt-4">
              <p className="mb-2 text-sm font-medium">Địa điểm đông nhất</p>
              <ul className="space-y-1.5 text-sm">
                {s.venues.map((v) => (
                  <li key={v.location} className="flex justify-between gap-3">
                    <span className="truncate">{v.location}</span>
                    <span className="text-muted-foreground tabular-nums">{v.games} ván</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
