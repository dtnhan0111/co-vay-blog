"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { RankBadge } from "@/components/go/rank-badge";
import { StoneAvatar } from "@/components/go/stone";
import { api } from "@/lib/client-api";
import type { Player } from "@/lib/data/types";
import { cn } from "@/lib/utils";

type Props = { players: (Player & { clubName: string | null; hint?: string })[]; next: string };

/** Demo mode: không có Google, nên "đăng nhập" bằng cách ngồi vào ghế của một kỳ thủ mẫu. */
export function DemoLogin({ players, next }: Props) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function choose(id: string) {
    setBusyId(id);
    try {
      await api("/api/demo/login", { method: "POST", json: { playerId: id } });
      router.push(next);
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
      setBusyId(null);
    }
  }

  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {players.map((p) => (
        <li key={p.id}>
          <button
            onClick={() => choose(p.id)}
            disabled={busyId !== null}
            className={cn(
              "wood-inset flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-transform active:scale-[0.98] disabled:opacity-60",
              busyId === p.id && "ring-2 ring-ring",
            )}
          >
            <StoneAvatar name={p.display_name} size={44} />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="truncate text-sm font-semibold">{p.display_name}</span>
                <RankBadge rank={p.rank_value} />
              </span>
              <span className="block truncate text-xs text-muted-foreground">{p.hint ?? p.clubName ?? "Chưa vào CLB nào"}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
