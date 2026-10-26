import { cn } from "@/lib/utils";

const N = 9;
const STEP = 26;
const PAD = 16;
const SIZE = PAD * 2 + STEP * (N - 1);
const at = (i: number) => PAD + i * STEP;

/** Thế cờ khai cuộc trên bàn 9×9 — quân lần lượt rơi xuống, một lần khi trang mở. */
const OPENING: { x: number; y: number; color: "black" | "white" }[] = [
  { x: 6, y: 2, color: "black" },
  { x: 2, y: 6, color: "white" },
  { x: 2, y: 2, color: "black" },
  { x: 6, y: 6, color: "white" },
  { x: 4, y: 5, color: "black" },
  { x: 5, y: 4, color: "white" },
  { x: 3, y: 4, color: "black" },
  { x: 4, y: 3, color: "white" },
];

export function HeroBoard({ className }: { className?: string }) {
  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className={cn("block h-auto text-ink/55 dark:text-paper/40", className)} aria-hidden>
      <defs>
        <radialGradient id="hb-black" cx="35%" cy="28%" r="75%">
          <stop offset="0" stopColor="#6b6b6b" />
          <stop offset=".3" stopColor="#2b2b2b" />
          <stop offset="1" stopColor="#050505" />
        </radialGradient>
        <radialGradient id="hb-white" cx="35%" cy="28%" r="75%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset=".55" stopColor="#f2f0ea" />
          <stop offset="1" stopColor="#c9c4b8" />
        </radialGradient>
      </defs>
      <g stroke="currentColor" strokeWidth="1">
        {Array.from({ length: N }, (_, i) => (
          <g key={i}>
            <line x1={at(0)} x2={at(N - 1)} y1={at(i)} y2={at(i)} />
            <line y1={at(0)} y2={at(N - 1)} x1={at(i)} x2={at(i)} />
          </g>
        ))}
      </g>
      {[2, 6].flatMap((y) => [2, 6].map((x) => <circle key={`${x}${y}`} cx={at(x)} cy={at(y)} r="2.2" fill="currentColor" />))}
      <circle cx={at(4)} cy={at(4)} r="2.2" fill="currentColor" />
      {OPENING.map((s, i) => (
        <g key={i} className="animate-stone-drop" style={{ animationDelay: `${300 + i * 260}ms`, transformOrigin: `${at(s.x)}px ${at(s.y)}px` }}>
          <circle cx={at(s.x) + 1} cy={at(s.y) + 2} r="11" fill="rgb(20 12 4 / .35)" />
          <circle cx={at(s.x)} cy={at(s.y)} r="11" fill={`url(#hb-${s.color})`} />
        </g>
      ))}
    </svg>
  );
}
