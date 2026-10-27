"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { Stone } from "@/components/go/stone";
import { Button } from "@/components/ui/button";
import { SgfError } from "@/lib/sgf/parse";
import { buildReplay, columnLabel, describeResult, starPoints, type Replay } from "@/lib/sgf/replay";

const CELL = 24;
const MARGIN = 26;

function useReplay(sgf: string): { replay: Replay } | { error: string } {
  return useMemo(() => {
    try {
      return { replay: buildReplay(sgf) };
    } catch (e) {
      return { error: e instanceof SgfError ? e.message : "Không đọc được kỳ phổ này." };
    }
  }, [sgf]);
}

/** Bàn cờ tái hiện ván đấu từ kỳ phổ SGF: lùi/tiến từng nước, kéo thanh trượt, phím mũi tên, tự chạy. */
export function SgfViewer({ sgf, blackName, whiteName }: { sgf: string; blackName: string; whiteName: string }) {
  const parsed = useReplay(sgf);
  if ("error" in parsed) {
    return <p className="paper-card px-4 py-6 text-center text-sm text-loss">{parsed.error}</p>;
  }
  return <Player replay={parsed.replay} blackName={blackName} whiteName={whiteName} />;
}

function Player({ replay, blackName, whiteName }: { replay: Replay; blackName: string; whiteName: string }) {
  const { size, frames, info } = replay;
  const last = frames.length - 1;
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  const frame = frames[step];
  const span = CELL * (size - 1);
  const total = span + MARGIN * 2;
  const at = (i: number) => MARGIN + i * CELL;

  useEffect(() => {
    if (!playing) return;
    if (step >= last) {
      setPlaying(false);
      return;
    }
    const id = setTimeout(() => setStep((s) => Math.min(last, s + 1)), 650);
    return () => clearTimeout(id);
  }, [playing, step, last]);

  const go = (to: number) => {
    setPlaying(false);
    setStep(Math.max(0, Math.min(last, to)));
  };

  function onKey(e: React.KeyboardEvent) {
    const keys: Record<string, number> = { ArrowLeft: step - 1, ArrowRight: step + 1, Home: 0, End: last, ArrowUp: step - 10, ArrowDown: step + 10 };
    if (e.key in keys) {
      e.preventDefault();
      go(keys[e.key]);
    } else if (e.key === " ") {
      e.preventDefault();
      setPlaying((p) => !p);
    }
  }

  const result = describeResult(info.result);
  const turn = frame.color === 1 ? "Đen" : frame.color === 2 ? "Trắng" : null;

  return (
    <div tabIndex={0} onKeyDown={onKey} role="group" aria-label="Tái hiện ván đấu từ kỳ phổ" className="space-y-3 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <div className="wood-card wood-board mx-auto w-full max-w-[560px] p-2 sm:p-3">
        <svg viewBox={`0 0 ${total} ${total}`} className="block h-auto w-full select-none" role="img" aria-label={`Bàn ${size}×${size}, nước ${frame.number} trên ${replay.moves}`}>
          <defs>
            <radialGradient id="sv-black" cx="35%" cy="28%" r="75%">
              <stop offset="0" stopColor="#6b6b6b" />
              <stop offset=".3" stopColor="#2b2b2b" />
              <stop offset="1" stopColor="#050505" />
            </radialGradient>
            <radialGradient id="sv-white" cx="35%" cy="28%" r="75%">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset=".55" stopColor="#f2f0ea" />
              <stop offset="1" stopColor="#c9c4b8" />
            </radialGradient>
          </defs>

          <g stroke="#2a2118" strokeOpacity=".7" strokeWidth=".7">
            {Array.from({ length: size }, (_, i) => (
              <g key={i}>
                <line x1={at(0)} x2={at(size - 1)} y1={at(i)} y2={at(i)} />
                <line y1={at(0)} y2={at(size - 1)} x1={at(i)} x2={at(i)} />
              </g>
            ))}
          </g>
          {starPoints(size).map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={at(x)} cy={at(y)} r="2" fill="#2a2118" fillOpacity=".75" />
          ))}

          <g fill="#2a2118" fillOpacity=".65" fontSize="8" textAnchor="middle">
            {Array.from({ length: size }, (_, i) => (
              <g key={i}>
                <text x={at(i)} y={MARGIN - 12}>{columnLabel(i)}</text>
                <text x={at(i)} y={total - MARGIN + 18}>{columnLabel(i)}</text>
                <text x={MARGIN - 14} y={at(i) + 3}>{size - i}</text>
                <text x={total - MARGIN + 14} y={at(i) + 3}>{size - i}</text>
              </g>
            ))}
          </g>

          {Array.from(frame.board).map((v, idx) => {
            if (!v) return null;
            const x = idx % size;
            const y = (idx - x) / size;
            return (
              <g key={idx}>
                <circle cx={at(x) + 0.8} cy={at(y) + 1.6} r={CELL * 0.47} fill="rgb(20 12 4 / .35)" />
                <circle cx={at(x)} cy={at(y)} r={CELL * 0.47} fill={v === 1 ? "url(#sv-black)" : "url(#sv-white)"} />
              </g>
            );
          })}

          {frame.move && (
            <circle
              cx={at(frame.move.x)}
              cy={at(frame.move.y)}
              r={CELL * 0.2}
              fill="none"
              stroke={frame.move.color === 1 ? "#f5e7c6" : "#8b5e3c"}
              strokeWidth="2"
            />
          )}
        </svg>
      </div>

      <div className="mx-auto flex max-w-[560px] items-center gap-2">
        <Button variant="outline" size="icon-sm" aria-label="Về đầu" onClick={() => go(0)} disabled={step === 0}>
          <SkipBack />
        </Button>
        <Button variant="outline" size="icon-sm" aria-label="Lùi một nước" onClick={() => go(step - 1)} disabled={step === 0}>
          <ChevronLeft />
        </Button>
        <Button size="icon-sm" aria-label={playing ? "Dừng" : "Tự chạy"} onClick={() => (step >= last ? (setStep(0), setPlaying(true)) : setPlaying((p) => !p))}>
          {playing ? <Pause /> : <Play />}
        </Button>
        <Button variant="outline" size="icon-sm" aria-label="Tiến một nước" onClick={() => go(step + 1)} disabled={step === last}>
          <ChevronRight />
        </Button>
        <Button variant="outline" size="icon-sm" aria-label="Đến cuối" onClick={() => go(last)} disabled={step === last}>
          <SkipForward />
        </Button>
        <input
          type="range"
          min={0}
          max={last}
          value={step}
          onChange={(e) => go(Number(e.target.value))}
          aria-label="Nước đi"
          className="ml-1 h-2 min-w-0 flex-1 cursor-pointer accent-[var(--wood)]"
        />
        <span className="w-16 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
          {step}/{replay.moves}
        </span>
      </div>

      <div className="mx-auto grid max-w-[560px] grid-cols-2 gap-2 text-sm">
        <div className="paper-card flex items-center gap-2 px-3 py-2">
          <Stone color="black" size={18} />
          <span className="min-w-0 flex-1 truncate font-medium">{blackName}</span>
          <span className="text-xs text-muted-foreground tabular-nums">bắt {frame.captures.black}</span>
        </div>
        <div className="paper-card flex items-center gap-2 px-3 py-2">
          <Stone color="white" size={18} />
          <span className="min-w-0 flex-1 truncate font-medium">{whiteName}</span>
          <span className="text-xs text-muted-foreground tabular-nums">bắt {frame.captures.white}</span>
        </div>
      </div>

      <p className="mx-auto max-w-[560px] text-center text-sm text-muted-foreground" aria-live="polite">
        {step === 0
          ? "Thế cờ ban đầu. Bấm tiến hoặc phím → để xem từng nước."
          : frame.pass
            ? `Nước ${frame.number}: ${turn} bỏ lượt`
            : `Nước ${frame.number}: ${turn} ${frame.move ? `${columnLabel(frame.move.x)}${size - frame.move.y}` : "tự sát"}${frame.captured.length && frame.move ? `, bắt ${frame.captured.length} quân` : ""}`}
      </p>

      {frame.comment && <blockquote className="mx-auto max-w-[560px] border-l-2 border-wood/50 pl-3 text-sm leading-relaxed whitespace-pre-line text-foreground/85 italic">{frame.comment}</blockquote>}

      {(result || info.date) && (
        <p className="mx-auto max-w-[560px] text-center text-xs text-muted-foreground">
          {[info.date, result && `Kết quả theo kỳ phổ: ${result}`].filter(Boolean).join(", ")}
        </p>
      )}
    </div>
  );
}
