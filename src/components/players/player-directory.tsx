"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MapPin, Search } from "lucide-react";
import { FormStones } from "@/components/go/form-stones";
import { RankBadge } from "@/components/go/rank-badge";
import { StoneAvatar } from "@/components/go/stone";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { RANK_GROUP_LABEL, rankGroup, type RankGroup } from "@/lib/rank";
import { percent, relativeDay } from "@/lib/format";
import { cn } from "@/lib/utils";

export type DirectoryEntry = {
  id: string;
  display_name: string;
  rank_value: number;
  club_id: string | null;
  clubName: string | null;
  isGuest: boolean;
  avatar_tone: "black" | "white" | null;
  avatar_glyph: string | null;
  games: number;
  wins: number;
  losses: number;
  winRate: number;
  lastPlayedOn: string | null;
  form: { matchId: string; won: boolean }[];
};

export type DirectoryClub = { id: string; name: string; meets_at: string | null; address: string | null; members: number };

type Sort = "rank" | "games" | "winRate" | "recent";
const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").toLowerCase();

export function PlayerDirectory({
  players,
  clubs,
  initialClub,
  today,
}: {
  players: DirectoryEntry[];
  clubs: DirectoryClub[];
  initialClub: string | null;
  today: string;
}) {
  const [query, setQuery] = useState("");
  const [club, setClub] = useState<string | null>(initialClub);
  const [group, setGroup] = useState<RankGroup | "all">("all");
  const [sort, setSort] = useState<Sort>("rank");

  const list = useMemo(() => {
    const q = fold(query.trim());
    return players
      .filter((p) => (!q || fold(p.display_name).includes(q)) && (!club || p.club_id === club) && (group === "all" || rankGroup(p.rank_value) === group))
      .sort((a, b) => {
        switch (sort) {
          case "games":
            return b.games - a.games;
          case "winRate":
            return (b.games >= 3 ? b.winRate : -1) - (a.games >= 3 ? a.winRate : -1) || b.games - a.games;
          case "recent":
            return (b.lastPlayedOn ?? "").localeCompare(a.lastPlayedOn ?? "");
          default:
            return b.rank_value - a.rank_value || b.games - a.games;
        }
      });
  }, [players, query, club, group, sort]);

  return (
    <div className="space-y-5">
      <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {clubs.map((c) => {
          const active = club === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setClub(active ? null : c.id)}
              aria-pressed={active}
              className={cn(
                "wood-card w-56 shrink-0 p-4 text-left transition-all",
                active ? "ring-2 ring-ink dark:ring-paper" : "opacity-95 hover:-translate-y-0.5",
              )}
            >
              <p className="font-display text-lg leading-tight font-semibold">{c.name}</p>
              <p className="mt-1.5 flex items-start gap-1 text-xs text-muted-foreground">
                <MapPin className="mt-px size-3 shrink-0" />
                <span>{c.meets_at}</span>
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {c.address} · <b className="text-foreground">{c.members}</b> kỳ thủ
              </p>
            </button>
          );
        })}
      </div>

      <div className="grid gap-2.5 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-10" placeholder="Tìm kỳ thủ theo tên…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Tìm kỳ thủ" />
        </div>
        <Select value={group} onChange={(e) => setGroup(e.target.value as RankGroup | "all")} aria-label="Nhóm hạng" className="sm:w-44">
          <option value="all">Mọi hạng</option>
          {(Object.keys(RANK_GROUP_LABEL) as RankGroup[]).map((g) => (
            <option key={g} value={g}>
              {RANK_GROUP_LABEL[g]}
            </option>
          ))}
        </Select>
        <Select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sắp xếp" className="sm:w-44">
          <option value="rank">Theo hạng</option>
          <option value="games">Nhiều ván nhất</option>
          <option value="winRate">Tỉ lệ thắng</option>
          <option value="recent">Mới chơi gần đây</option>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {list.length} kỳ thủ{club && ` · ${clubs.find((c) => c.id === club)?.name}`}
        {club && (
          <button onClick={() => setClub(null)} className="ml-2 underline underline-offset-4">
            bỏ lọc CLB
          </button>
        )}
      </p>

      {list.length === 0 ? (
        <div className="paper-card px-6 py-12 text-center">
          <p className="font-display text-xl">Không có kỳ thủ nào khớp</p>
          <p className="mt-1 text-sm text-muted-foreground">Thử bỏ bớt bộ lọc.</p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => (
            <li key={p.id}>
              <Link href={`/players/${p.id}`} className="wood-card flex h-full flex-col gap-3 p-4 transition-transform hover:-translate-y-0.5">
                <div className="flex items-center gap-3.5">
                  <StoneAvatar player={p} size={64} />
                  <div className="min-w-0">
                    <p className="truncate font-display text-xl leading-tight font-semibold">{p.display_name}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <RankBadge rank={p.rank_value} />
                      <span className="truncate text-xs text-muted-foreground">{p.isGuest ? "Khách · chưa dùng app" : (p.clubName ?? "Chưa vào CLB")}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-auto flex items-end justify-between gap-3 border-t border-border/70 pt-3">
                  {p.games > 0 ? (
                    <>
                      <div>
                        <p className="text-sm">
                          <b className="tabular-nums">{p.wins}</b> thắng · <b className="tabular-nums">{p.losses}</b> thua
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {p.games >= 3 ? `${percent(p.winRate)} thắng · ` : ""}
                          {p.lastPlayedOn ? relativeDay(p.lastPlayedOn, today).toLowerCase() : ""}
                        </p>
                      </div>
                      <FormStones form={p.form.slice(-5)} size={20} />
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Chưa có ván nào được xác nhận</p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
