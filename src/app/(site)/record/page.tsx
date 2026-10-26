import type { Metadata } from "next";
import { BoardPanel } from "@/components/go/board-panel";
import { RecordMatchForm } from "@/components/match/record-match-form";
import { requireViewer } from "@/lib/auth";
import { repo } from "@/lib/data";
import { todayVN } from "@/lib/format";
import { getClubMap, getClubs, getPlayers } from "@/lib/queries";
import { opponentOf } from "@/lib/stats";

export const metadata: Metadata = { title: "Ghi ván" };

export default async function RecordPage({ searchParams }: { searchParams: Promise<{ opponent?: string }> }) {
  const { opponent } = await searchParams;
  const viewer = await requireViewer(opponent ? `/record?opponent=${opponent}` : "/record");
  const [players, clubs, clubMap, mine, outgoing] = await Promise.all([
    getPlayers(),
    getClubs(),
    getClubMap(),
    repo.listMatches({ playerId: viewer.id, limit: 40 }),
    repo.listOutgoingUnconfirmed(viewer.id),
  ]);

  const toPicker = (p: (typeof players)[number]) => ({
    id: p.id,
    display_name: p.display_name,
    rank_value: p.rank_value,
    clubName: p.club_id ? (clubMap.get(p.club_id)?.name ?? null) : null,
  });

  const byId = new Map(players.map((p) => [p.id, p]));
  const everyone = players.filter((p) => p.id !== viewer.id).sort((a, b) => b.rank_value - a.rank_value).map(toPicker);

  // Những người vừa đánh cùng, gần nhất trước.
  const recentIds: string[] = [];
  for (const m of [...outgoing, ...mine].sort((a, b) => b.created_at.localeCompare(a.created_at))) {
    const id = opponentOf(m, viewer.id);
    if (!recentIds.includes(id) && byId.has(id)) recentIds.push(id);
  }
  // Nếu mới vào: gợi ý người cùng CLB.
  for (const p of players) {
    if (recentIds.length >= 6) break;
    if (p.id !== viewer.id && viewer.club_id && p.club_id === viewer.club_id && !recentIds.includes(p.id)) recentIds.push(p.id);
  }
  const recents = recentIds.slice(0, 6).map((id) => toPicker(byId.get(id)!));

  const last = [...outgoing, ...mine].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  const viewerClub = viewer.club_id ? clubMap.get(viewer.club_id) : undefined;
  const defaultLocation = last
    ? { location: last.location, clubId: last.club_id }
    : viewerClub
      ? { location: viewerClub.name, clubId: viewerClub.id }
      : { location: "", clubId: null };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <BoardPanel className="px-6 py-6">
        <p className="text-xs font-medium tracking-[0.2em] text-ink/70 uppercase dark:text-paper/70">Dưới 30 giây</p>
        <h1 className="mt-1 text-4xl font-bold sm:text-5xl">Ghi một ván</h1>
        <p className="mt-1 text-[15px] text-ink/80 dark:text-paper/80">Chạm vài lần là xong. Đối thủ sẽ nhận được lời mời xác nhận.</p>
      </BoardPanel>
      <RecordMatchForm
        today={todayVN()}
        recents={recents}
        everyone={everyone}
        clubs={clubs.map((c) => ({ id: c.id, name: c.name }))}
        defaultLocation={defaultLocation}
        initialOpponentId={everyone.some((p) => p.id === opponent) ? opponent : null}
      />
    </div>
  );
}
