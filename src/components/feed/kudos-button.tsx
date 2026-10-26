"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Stone } from "@/components/go/stone";
import { cn } from "@/lib/utils";

type Props = { matchId: string; count: number; active: boolean; signedIn: boolean };

/** "Đặt một quân" — lời khen nhẹ nhàng cho một ván hay. */
export function KudosButton({ matchId, count: initialCount, active: initialActive, signedIn }: Props) {
  const router = useRouter();
  const [state, setState] = useState({ count: initialCount, active: initialActive });
  const [pending, startTransition] = useTransition();

  function toggle() {
    if (!signedIn) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    const previous = state;
    setState({ active: !previous.active, count: previous.count + (previous.active ? -1 : 1) });
    startTransition(async () => {
      const res = await fetch(`/api/matches/${matchId}/kudos`, { method: "POST" });
      if (!res.ok) {
        setState(previous);
        toast.error("Chưa đặt được quân, bạn thử lại nhé.");
        return;
      }
      const data = (await res.json()) as { active: boolean; count: number };
      setState(data);
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={state.active}
      className={cn(
        "relative z-10 -ml-2 inline-flex h-9 items-center gap-2 rounded-full px-3 text-sm font-medium transition-colors hover:bg-foreground/8",
        state.active ? "text-foreground" : "text-muted-foreground",
      )}
    >
      <Stone
        key={String(state.active)}
        color={state.active ? "black" : "white"}
        size={18}
        className={cn(state.active ? "animate-stone-drop" : "opacity-70")}
      />
      <span>{state.active ? "Đã đặt một quân" : "Đặt một quân"}</span>
      {state.count > 0 && <span className="text-muted-foreground tabular-nums">· {state.count}</span>}
    </button>
  );
}
