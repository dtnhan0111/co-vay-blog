"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Stone } from "@/components/go/stone";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { eventInClub, eventInvolves, type ActivityEvent } from "@/lib/activity";
import { JoinedItem, StreakItem } from "./activity-items";
import { MatchCard } from "./match-card";

type Viewer = { id: string; club_id: string | null } | null;
const PAGE = 8;

/** Dòng "Hoạt động gần đây": ván vừa xác nhận, chuỗi thắng, người mới vào. */
export function ActivityFeed({ events, viewer, today }: { events: ActivityEvent[]; viewer: Viewer; today: string }) {
  const [tab, setTab] = useState("all");
  const [shown, setShown] = useState(PAGE);

  const filtered = useMemo(() => {
    if (tab === "mine" && viewer) return events.filter((e) => eventInvolves(e, viewer.id));
    if (tab === "club" && viewer?.club_id) return events.filter((e) => eventInClub(e, viewer.club_id!));
    return events;
  }, [events, tab, viewer]);

  const visible = filtered.slice(0, shown);

  return (
    <div className="space-y-4">
      {viewer && (
        <Tabs
          value={tab}
          onValueChange={(v) => {
            setTab(v);
            setShown(PAGE);
          }}
        >
          <TabsList aria-label="Lọc hoạt động">
            <TabsTrigger value="all">Tất cả</TabsTrigger>
            {viewer.club_id && <TabsTrigger value="club">CLB của tôi</TabsTrigger>}
            <TabsTrigger value="mine">Của tôi</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {visible.length === 0 ? (
        <div className="paper-card flex flex-col items-center gap-3 px-6 py-10 text-center">
          <div className="flex gap-1.5" aria-hidden>
            <Stone color="black" size={30} />
            <Stone color="white" size={30} />
          </div>
          <p className="font-display text-xl">{tab === "all" ? "Kỳ quán đang yên ắng" : "Chưa có hoạt động nào ở đây"}</p>
          <p className="max-w-xs text-sm text-muted-foreground">Ván đã được đối thủ xác nhận, chuỗi thắng và người mới vào sẽ hiện ở đây.</p>
          <Button asChild className="mt-1">
            <Link href={viewer ? "/record" : "/login"}>{viewer ? "Ghi ván đầu tiên" : "Vào kỳ quán để ghi ván"}</Link>
          </Button>
        </div>
      ) : (
        <ol className="space-y-3.5">
          {visible.map((e) => (
            <li key={e.id}>
              {e.type === "match" ? (
                <MatchCard match={e.match} signedIn={!!viewer} today={today} />
              ) : e.type === "streak" ? (
                <StreakItem player={e.player} length={e.length} at={e.at} />
              ) : (
                <JoinedItem player={e.player} at={e.at} />
              )}
            </li>
          ))}
        </ol>
      )}

      {shown < filtered.length && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" onClick={() => setShown((n) => n + PAGE)}>
            Xem thêm
          </Button>
        </div>
      )}
    </div>
  );
}
