import { ConfirmationTray } from "@/components/match/confirmation-tray";
import { FeedList } from "@/components/feed/feed-list";
import { SectionHeading } from "@/components/go/section-heading";
import { Hero } from "@/components/home/hero";
import { WeekSidebar } from "@/components/home/week-sidebar";
import { getViewer } from "@/lib/auth";
import { repo } from "@/lib/data";
import { addDays, daysBetween, todayVN } from "@/lib/format";
import { getClubs, getConfirmedMatches, getPlayers } from "@/lib/queries";
import { playerStats } from "@/lib/stats";

export default async function HomePage() {
  const today = todayVN();
  const viewer = await getViewer();
  const [matches, players, clubs, incoming, outgoing] = await Promise.all([
    getConfirmedMatches(),
    getPlayers(),
    getClubs(),
    viewer ? repo.listIncomingRequests(viewer.id) : [],
    viewer ? repo.listOutgoingUnconfirmed(viewer.id) : [],
  ]);

  const weekStart = addDays(today, -6);
  const lastPlayed = viewer ? playerStats(viewer.id, matches).lastPlayedOn : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
      <div className="min-w-0 space-y-6">
        <Hero
          viewer={viewer}
          pendingCount={incoming.length}
          daysSinceLastGame={lastPlayed ? daysBetween(lastPlayed, today) : null}
          totals={{
            players: players.length,
            matches: matches.length,
            clubs: clubs.length,
            week: matches.filter((m) => m.played_on >= weekStart).length,
          }}
        />

        {viewer && <ConfirmationTray incoming={incoming} outgoing={outgoing} viewerId={viewer.id} />}

        <section className="space-y-4">
          <SectionHeading title="Kỳ phổ cộng đồng" kicker="Những ván mới nhất" />
          <FeedList
            matches={matches.slice(0, 48)}
            viewer={viewer && { id: viewer.id, club_id: viewer.club_id }}
            today={today}
          />
        </section>
      </div>

      <div className="min-w-0 lg:pt-1">
        <WeekSidebar matches={matches} players={players} clubs={clubs} since={weekStart} />
      </div>
    </div>
  );
}
