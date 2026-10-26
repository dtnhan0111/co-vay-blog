import type { Metadata } from "next";
import { PlayerDirectory } from "@/components/players/player-directory";
import { SectionHeading } from "@/components/go/section-heading";
import { todayVN } from "@/lib/format";
import { getClubMap, getClubs, getConfirmedMatches, getPlayers } from "@/lib/queries";
import { playerStats } from "@/lib/stats";

export const metadata: Metadata = { title: "Kỳ thủ" };

export default async function PlayersPage({ searchParams }: { searchParams: Promise<{ club?: string }> }) {
  const { club } = await searchParams;
  const [players, clubs, clubMap, matches] = await Promise.all([getPlayers(), getClubs(), getClubMap(), getConfirmedMatches()]);

  const entries = players.map((p) => {
    const s = playerStats(p.id, matches);
    return {
      id: p.id,
      display_name: p.display_name,
      rank_value: p.rank_value,
      club_id: p.club_id,
      clubName: p.club_id ? (clubMap.get(p.club_id)?.name ?? null) : null,
      games: s.games,
      wins: s.wins,
      losses: s.losses,
      winRate: s.winRate,
      lastPlayedOn: s.lastPlayedOn,
      form: s.form,
    };
  });

  const members = new Map<string, number>();
  for (const p of players) if (p.club_id) members.set(p.club_id, (members.get(p.club_id) ?? 0) + 1);

  return (
    <div className="space-y-6">
      <SectionHeading title="Kỳ thủ Đà Nẵng" kicker="Những người ngồi quanh bàn cờ" />
      <PlayerDirectory
        players={entries}
        clubs={clubs.map((c) => ({ id: c.id, name: c.name, meets_at: c.meets_at, address: c.address, members: members.get(c.id) ?? 0 }))}
        initialClub={club && clubs.some((c) => c.id === club) ? club : null}
        today={todayVN()}
      />
    </div>
  );
}
