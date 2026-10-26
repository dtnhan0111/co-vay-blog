import { Inbox, Send } from "lucide-react";
import type { MatchView } from "@/lib/data/types";
import { IncomingRequestCard, OutgoingCard } from "./confirmation-cards";

type Props = { incoming: MatchView[]; outgoing: MatchView[]; viewerId: string };

/** Khay xác nhận trên trang chủ: việc cần làm trước, ván đang chờ sau. Rỗng thì không hiện. */
export function ConfirmationTray({ incoming, outgoing, viewerId }: Props) {
  if (!incoming.length && !outgoing.length) return null;

  return (
    <section aria-label="Xác nhận ván" className="space-y-3">
      {incoming.length > 0 && (
        <div className="wood-card wood-board space-y-4 p-4 sm:p-5">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <Inbox className="size-5" /> Lời mời xác nhận
            <span className="ml-1 grid size-6 place-items-center rounded-full bg-ink text-xs font-bold text-paper dark:bg-paper dark:text-ink">
              {incoming.length}
            </span>
          </h2>
          <div className="divide-y divide-border/70 [&>*]:py-4 [&>*:first-child]:pt-0 [&>*:last-child]:pb-0">
            {incoming.map((m) => (
              <IncomingRequestCard key={m.id} match={m} viewerId={viewerId} />
            ))}
          </div>
        </div>
      )}
      {outgoing.length > 0 && (
        <div className="paper-card space-y-4 p-4 sm:p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Send className="size-4" /> Ván bạn đã gửi
          </h2>
          <div className="divide-y divide-border [&>*]:py-4 [&>*:first-child]:pt-0 [&>*:last-child]:pb-0">
            {outgoing.map((m) => (
              <OutgoingCard key={m.id} match={m} viewerId={viewerId} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
