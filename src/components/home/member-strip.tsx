import Link from "next/link";
import { StoneAvatar } from "@/components/go/stone";
import type { Player } from "@/lib/data/types";

/** Bao nhiêu kỳ thủ đã vào kỳ quán: vài gương mặt mới nhất và con số, bấm vào xem danh bạ. */
export function MemberStrip({ total, recent }: { total: number; recent: Player[] }) {
  if (total === 0) return null;
  const more = total - recent.length;
  return (
    <Link href="/players" className="group mt-5 inline-flex items-center gap-3 rounded-full py-1 pr-3 transition-colors hover:bg-ink/5 dark:hover:bg-paper/10">
      <span className="flex -space-x-2.5" aria-hidden>
        {recent.map((p) => (
          <StoneAvatar key={p.id} player={p} size={34} className="ring-2 ring-[#d8bc87] dark:ring-[#33271b]" />
        ))}
        {more > 0 && (
          <span className="relative grid size-[34px] place-items-center rounded-full bg-ink text-[11px] font-semibold text-paper ring-2 ring-[#d8bc87] dark:bg-paper dark:text-ink dark:ring-[#33271b]">
            +{more}
          </span>
        )}
      </span>
      <span className="text-sm text-ink/85 dark:text-paper/85">
        <b className="font-semibold tabular-nums">{total}</b> kỳ thủ đã tham gia
        <span className="ml-1 text-ink/60 group-hover:underline dark:text-paper/60">xem danh bạ</span>
      </span>
    </Link>
  );
}
