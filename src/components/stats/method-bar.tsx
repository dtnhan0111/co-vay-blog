import { METHOD_LABEL, percent } from "@/lib/format";
import type { WinMethod } from "@/lib/data/types";

const FILL: Record<WinMethod, string> = {
  points: "bg-ink dark:bg-paper",
  resign: "bg-wood dark:bg-board/70",
  time: "bg-board dark:bg-[#6f5a3e]",
};

/** Cách các ván kết thúc: thanh chia đoạn (khe 2px) + nhãn trực tiếp với số ván và phần trăm. */
export function MethodBar({ methods }: { methods: Record<WinMethod, number> }) {
  const total = methods.points + methods.resign + methods.time;
  const keys = (Object.keys(methods) as WinMethod[]).filter((k) => methods[k] > 0);
  return (
    <div className="space-y-4">
      <div className="flex h-5 gap-0.5 overflow-hidden rounded-full" role="img" aria-label={keys.map((k) => `${METHOD_LABEL[k]} ${methods[k]} ván`).join(", ")}>
        {keys.map((k) => (
          <div key={k} className={FILL[k]} style={{ width: `${(methods[k] / total) * 100}%` }} />
        ))}
      </div>
      <dl className="grid grid-cols-3 gap-3">
        {(Object.keys(methods) as WinMethod[]).map((k) => (
          <div key={k} className="space-y-0.5">
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={`size-2.5 rounded-sm ${FILL[k]}`} aria-hidden />
              {METHOD_LABEL[k]}
            </dt>
            <dd className="font-display text-2xl leading-none font-bold tabular-nums">
              {total ? percent(methods[k] / total) : "0%"}
              <span className="ml-1.5 font-sans text-xs font-normal text-muted-foreground">{methods[k]} ván</span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
