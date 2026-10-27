"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Clock, MapPin, Flag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { StoneAvatar } from "@/components/go/stone";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/client-api";
import type { MatchView } from "@/lib/data/types";
import { outcomePhrase, relativeDay, resultFor } from "@/lib/format";
import { cn } from "@/lib/utils";

const COLOR_VI = { black: "Đen", white: "Trắng" } as const;

function Versus({ match, viewerId }: { match: MatchView; viewerId: string }) {
  const { color, me, opponent } = resultFor(match, viewerId);
  return (
    <div className="flex items-center gap-3">
      <div className="flex -space-x-2.5">
        <StoneAvatar player={opponent} tone={color === "black" ? "white" : "black"} size={44} className="ring-2 ring-card" />
        <StoneAvatar player={me} tone={color} size={44} className="ring-2 ring-card" />
      </div>
      <div className="min-w-0 text-sm">
        <p className="truncate font-semibold">
          <Link href={`/players/${opponent.id}`} className="hover:underline">
            {opponent.display_name}
          </Link>
        </p>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="size-3 shrink-0" />
          <span className="truncate">
            {relativeDay(match.played_on)}, {match.location}
          </span>
        </p>
      </div>
    </div>
  );
}

/** Lời mời xác nhận: đối thủ đã ghi một ván có tên bạn. */
export function IncomingRequestCard({ match, viewerId }: { match: MatchView; viewerId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"confirm" | "reject" | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const { color, opponent, won } = resultFor(match, viewerId);

  async function respond(decision: "confirmed" | "rejected") {
    setBusy(decision === "confirmed" ? "confirm" : "reject");
    try {
      await api(`/api/matches/${match.id}/confirm`, {
        method: "POST",
        json: { decision, reason: decision === "rejected" ? reason : null },
      });
      toast.success(decision === "confirmed" ? "Đã xác nhận — ván cờ lên kỳ phổ." : "Đã báo sai sót cho " + opponent.display_name + ".");
      setRejecting(false);
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      <Versus match={match} viewerId={viewerId} />
      <p className="text-[15px] leading-snug">
        <b>{opponent.display_name}</b> ghi rằng bạn cầm <b>{COLOR_VI[color]}</b> và{" "}
        <b className={cn(won ? "text-win" : "text-loss")}>{outcomePhrase(match, won)}</b>
        {match.handicap > 0 && <> (chấp {match.handicap} quân)</>}.
      </p>
      {match.note && <p className="border-l-2 border-wood/50 pl-3 text-sm text-foreground/75 italic">{match.note}</p>}
      <div className="flex gap-2">
        <Button className="flex-1" pending={busy === "confirm"} disabled={!!busy} onClick={() => respond("confirmed")}>
          <Check /> Đúng rồi
        </Button>
        <Button variant="outline" className="flex-1" disabled={!!busy} onClick={() => setRejecting(true)}>
          <Flag /> Có sai sót
        </Button>
      </div>

      <Dialog open={rejecting} onOpenChange={setRejecting}>
        <DialogContent>
          <DialogTitle>Có điều gì chưa đúng?</DialogTitle>
          <DialogDescription>
            Ván sẽ không được tính cho đến khi {opponent.display_name} ghi lại. Một lời nhắn nhẹ nhàng sẽ giúp ích.
          </DialogDescription>
          <Textarea
            className="mt-4"
            rows={3}
            maxLength={280}
            placeholder="Ví dụ: Mình nhớ là hơn 2.5 điểm chứ không phải 6.5…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="mt-4 flex gap-2">
            <DialogClose asChild>
              <Button variant="ghost" className="flex-1">
                Để sau
              </Button>
            </DialogClose>
            <Button className="flex-1" pending={busy === "reject"} onClick={() => respond("rejected")}>
              Gửi báo sai
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Ván do bạn ghi nhưng chưa được xác nhận (đang chờ hoặc bị báo sai). */
export function OutgoingCard({ match, viewerId }: { match: MatchView; viewerId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const { opponent, won } = resultFor(match, viewerId);
  const rejected = match.status === "rejected";

  async function cancel() {
    setBusy(true);
    try {
      await api(`/api/matches/${match.id}`, { method: "DELETE" });
      toast.success("Đã huỷ ván.");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2.5">
      <Versus match={match} viewerId={viewerId} />
      <p className="text-sm">
        Bạn <b className={cn(won ? "text-win" : "text-loss")}>{outcomePhrase(match, won)}</b>.{" "}
        {rejected ? (
          <span className="text-loss">{opponent.display_name} báo có sai sót.</span>
        ) : (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Clock className="size-3.5" /> Đang chờ {opponent.display_name} xác nhận
          </span>
        )}
      </p>
      {rejected && match.confirmation?.reason && (
        <p className="border-l-2 border-loss/60 pl-3 text-sm text-foreground/80 italic">“{match.confirmation.reason}”</p>
      )}
      <Button variant="ghost" size="sm" pending={busy} onClick={cancel} className="-ml-2 text-muted-foreground">
        <Trash2 /> {rejected ? "Xoá để ghi lại" : "Huỷ ván này"}
      </Button>
    </div>
  );
}
