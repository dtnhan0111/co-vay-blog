"use client";

import { useMemo, useState } from "react";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MatchView } from "@/lib/data/types";
import { MatchCard } from "./match-card";

type Viewer = { id: string; club_id: string | null } | null;
const PAGE = 8;

export function FeedList({ matches, viewer, today }: { matches: MatchView[]; viewer: Viewer; today: string }) {
  const [tab, setTab] = useState("all");
  const [shown, setShown] = useState(PAGE);

  const filtered = useMemo(() => {
    if (tab === "mine" && viewer) return matches.filter((m) => m.black.id === viewer.id || m.white.id === viewer.id);
    if (tab === "club" && viewer?.club_id)
      return matches.filter((m) => m.club_id === viewer.club_id || m.black.club_id === viewer.club_id || m.white.club_id === viewer.club_id);
    return matches;
  }, [matches, tab, viewer]);

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
          <TabsList aria-label="Lọc kỳ phổ">
            <TabsTrigger value="all">Tất cả</TabsTrigger>
            {viewer.club_id && <TabsTrigger value="club">CLB của tôi</TabsTrigger>}
            <TabsTrigger value="mine">Ván của tôi</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {visible.length === 0 ? (
        <div className="paper-card flex flex-col items-center gap-2 px-6 py-10 text-center">
          <Users className="size-6 text-muted-foreground" />
          <p className="font-display text-xl">Chưa có ván nào ở đây</p>
          <p className="text-sm text-muted-foreground">Ván đã được đối thủ xác nhận sẽ xuất hiện trên kỳ phổ.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((m, i) => (
            <div key={m.id} className="animate-rise" style={{ animationDelay: `${Math.min(i, 6) * 45}ms` }}>
              <MatchCard match={m} signedIn={!!viewer} today={today} />
            </div>
          ))}
        </div>
      )}

      {shown < filtered.length && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" onClick={() => setShown((n) => n + PAGE)}>
            Xem thêm {Math.min(PAGE, filtered.length - shown)} ván
          </Button>
        </div>
      )}
    </div>
  );
}
