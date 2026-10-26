import { ACTIVITY_DAYS, type ActivityCell } from "@/lib/stats";
import { shortDate } from "@/lib/format";

const N = 19;
const STEP = 18;
const PAD = 16;
const SIZE = PAD * 2 + STEP * (N - 1);
const HOSHI = [3, 9, 15];

/**
 * "Bàn cờ hoạt động": 361 ngày gần nhất xếp trên lưới 19×19, hàng trái → phải, trên → dưới.
 * Giao điểm có quân = ngày có ván (đen: thắng nhiều hơn/bằng, trắng: thua nhiều hơn).
 */
export function ActivityBoard({ cells }: { cells: ActivityCell[] }) {
  const played = cells.filter((c) => c.games > 0);
  const total = played.reduce((sum, c) => sum + c.games, 0);
  const at = (i: number) => PAD + i * STEP;

  return (
    <figure className="space-y-3">
      <div className="wood-card wood-board mx-auto w-full max-w-[380px] p-2.5">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="block h-auto w-full" role="img" aria-labelledby="activity-title">
          <title id="activity-title">{`${played.length} ngày có ván trong ${ACTIVITY_DAYS} ngày gần nhất`}</title>
          <defs>
            <radialGradient id="ab-black" cx="35%" cy="28%" r="75%">
              <stop offset="0" stopColor="#6b6b6b" />
              <stop offset=".3" stopColor="#2b2b2b" />
              <stop offset="1" stopColor="#050505" />
            </radialGradient>
            <radialGradient id="ab-white" cx="35%" cy="28%" r="75%">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset=".55" stopColor="#f2f0ea" />
              <stop offset="1" stopColor="#c9c4b8" />
            </radialGradient>
          </defs>
          <g stroke="currentColor" className="text-wood" strokeWidth="1" opacity=".55">
            {Array.from({ length: N }, (_, i) => (
              <g key={i}>
                <line x1={at(0)} x2={at(N - 1)} y1={at(i)} y2={at(i)} />
                <line y1={at(0)} y2={at(N - 1)} x1={at(i)} x2={at(i)} />
              </g>
            ))}
          </g>
          {HOSHI.flatMap((r) => HOSHI.map((c) => <circle key={`${r}-${c}`} cx={at(c)} cy={at(r)} r="2.4" className="fill-wood" opacity=".7" />))}
          {cells.map((cell, i) => {
            if (!cell.games) return null;
            const black = cell.wins >= cell.losses;
            const cx = at(i % N);
            const cy = at(Math.floor(i / N));
            return (
              <g key={cell.date}>
                <title>{`${shortDate(cell.date)} · ${cell.wins} thắng, ${cell.losses} thua`}</title>
                <circle cx={cx + 0.8} cy={cy + 1.6} r="7.6" fill="rgb(20 12 4 / .35)" />
                <circle cx={cx} cy={cy} r="7.6" fill={black ? "url(#ab-black)" : "url(#ab-white)"} />
              </g>
            );
          })}
        </svg>
      </div>
      <figcaption className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>{ACTIVITY_DAYS} ngày gần nhất · {total} ván</span>
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <i className="stone stone--black" style={{ "--size": "12px" } as React.CSSProperties} /> thắng
          </span>
          <span className="flex items-center gap-1.5">
            <i className="stone stone--white" style={{ "--size": "12px" } as React.CSSProperties} /> thua
          </span>
        </span>
      </figcaption>
    </figure>
  );
}
