"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, FileUp, Minus, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Stone } from "@/components/go/stone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, api } from "@/lib/client-api";
import type { StoneColor, WinMethod } from "@/lib/data/types";
import { addDays, formatScore } from "@/lib/format";
import { newMatchSchema, sgfProblem } from "@/lib/validators";
import { RECORD_ACCEPT, SUPPORTED_RECORD_NOTE, readSgfFile } from "@/lib/sgf/read-file";
import { buildReplay } from "@/lib/sgf/replay";
import { cn } from "@/lib/utils";
import { OpponentPicker, type PickerPlayer } from "./opponent-picker";

type ClubOption = { id: string; name: string };

type Props = {
  today: string;
  recents: PickerPlayer[];
  everyone: PickerPlayer[];
  clubs: ClubOption[];
  defaultLocation: { location: string; clubId: string | null };
  initialOpponentId?: string | null;
  viewerRank: number;
};

const SCORE_CHIPS = [0.5, 1.5, 2.5, 3.5, 5.5, 7.5, 10.5, 15.5, 20.5];
const LAST_LOCATION_KEY = "go:last-location";

/** Nhóm nút chọn một: dùng cho màu quân, kết quả, cách thắng. */
function Choice<T extends string>({
  label,
  value,
  onChange,
  options,
  invalid,
}: {
  label: string;
  value: T | null;
  onChange: (v: T) => void;
  options: { value: T; label: React.ReactNode; hint?: string }[];
  invalid?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("grid gap-2 rounded-2xl", invalid && "ring-2 ring-loss/60")} style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl px-2 py-2.5 text-sm font-medium transition-all active:scale-[0.97]",
              active ? "bg-primary text-primary-foreground shadow-lg" : "wood-inset",
            )}
          >
            {o.label}
            {o.hint && <span className={cn("text-[11px] font-normal", active ? "text-primary-foreground/70" : "text-muted-foreground")}>{o.hint}</span>}
          </button>
        );
      })}
    </div>
  );
}

function Step({ n, title, children, error }: { n: number; title: string; children: React.ReactNode; error?: string }) {
  return (
    <section className="space-y-2.5">
      <div className="flex items-baseline gap-2.5">
        <span className="grid size-6 place-items-center rounded-full bg-ink font-display text-sm font-bold text-paper dark:bg-paper dark:text-ink">{n}</span>
        <Label className="text-sm font-semibold tracking-normal text-foreground">{title}</Label>
        {error && <span className="text-xs font-medium text-loss">{error}</span>}
      </div>
      {children}
    </section>
  );
}

export function RecordMatchForm({ today, recents, everyone, clubs, defaultLocation, initialOpponentId = null, viewerRank }: Props) {
  const router = useRouter();
  const [opponentId, setOpponentId] = useState<string | null>(initialOpponentId);
  const [color, setColor] = useState<StoneColor | null>(null);
  const [result, setResult] = useState<"win" | "loss" | null>(null);
  const [method, setMethod] = useState<WinMethod>("points");
  const [score, setScore] = useState("");
  const [date, setDate] = useState(today);
  const [customDate, setCustomDate] = useState(false);
  const [location, setLocation] = useState(defaultLocation.location);
  const [clubId, setClubId] = useState<string | null>(defaultLocation.clubId);
  const [note, setNote] = useState("");
  const [boardSize, setBoardSize] = useState<9 | 13 | 19>(19);
  const [handicap, setHandicap] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [sentTo, setSentTo] = useState<{ player: PickerPlayer; confirmed: boolean } | null>(null);
  const [sgf, setSgf] = useState<{ text: string; name: string; moves: number; size: number } | null>(null);
  const [guests, setGuests] = useState<PickerPlayer[]>([]);
  const topRef = useRef<HTMLDivElement>(null);

  // Nhớ nơi đánh lần trước trên thiết bị này.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LAST_LOCATION_KEY);
      if (saved && !defaultLocation.location) {
        const parsed = JSON.parse(saved) as { location: string; clubId: string | null };
        setLocation(parsed.location);
        setClubId(parsed.clubId);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scoreNumber = score === "" ? null : Number(score);
  const allPlayers = useMemo(() => [...guests, ...everyone], [guests, everyone]);
  const opponent = useMemo(() => allPlayers.find((p) => p.id === opponentId) ?? null, [allPlayers, opponentId]);
  const opponentFirst = opponent?.display_name.split(/\s+/).at(-1) ?? "đối thủ";

  function bumpScore(delta: number) {
    const base = scoreNumber ?? 0.5;
    setScore(formatScore(Math.max(0.5, base + delta)));
    setErrors((e) => ({ ...e, score_difference: "" }));
  }

  async function attachSgf(file: File | undefined) {
    if (!file) return;
    try {
      const text = await readSgfFile(file);
      const problem = sgfProblem(text);
      if (problem) return void toast.error(problem);
      const replay = buildReplay(text);
      setSgf({ text, name: file.name, moves: replay.moves, size: replay.size });
      setBoardSize(replay.size); // bàn cờ và số quân chấp lấy theo kỳ phổ
      if (replay.info.handicap) setHandicap(replay.info.handicap);
      setErrors((e) => ({ ...e, sgf: "" }));
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  function pickClub(id: string) {
    const club = clubs.find((c) => c.id === id)!;
    setClubId(id);
    setLocation(club.name);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const body = {
      opponent_id: opponentId ?? "",
      my_color: color ?? "black",
      i_won: result === "win",
      win_method: method,
      score_difference: method === "points" ? scoreNumber : null,
      played_on: date,
      location,
      club_id: clubId,
      note: note || null,
      board_size: boardSize,
      handicap,
      sgf: sgf?.text ?? null,
    };

    const next: Record<string, string> = {};
    if (!opponentId) next.opponent_id = "Chọn đối thủ";
    if (!color) next.my_color = "Chọn màu quân";
    if (!result) next.result = "Chọn kết quả";
    const parsed = newMatchSchema.safeParse(body);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (key !== "opponent_id") next[key] ??= issue.message;
      }
    }
    if (Object.keys(next).length) {
      setErrors(next);
      toast.error("Còn thiếu một vài thông tin.");
      document.querySelector("[data-invalid]")?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }

    setErrors({});
    setPending(true);
    try {
      const { match } = await api<{ match: { status: string } }>("/api/matches", { method: "POST", json: parsed.data });
      try {
        localStorage.setItem(LAST_LOCATION_KEY, JSON.stringify({ location, clubId }));
      } catch {}
      setSentTo(opponent && { player: opponent, confirmed: match.status === "confirmed" });
      router.refresh();
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      if (err instanceof ApiError && err.field) setErrors({ [err.field]: err.message });
      toast.error((err as Error).message);
    } finally {
      setPending(false);
    }
  }

  function reset() {
    setSentTo(null);
    setColor(null);
    setResult(null);
    setScore("");
    setNote("");
    setMethod("points");
    setHandicap(0);
    setBoardSize(19);
  }

  if (sentTo) {
    return (
      <div ref={topRef} className="wood-card wood-board animate-rise space-y-5 px-6 py-10 text-center">
        <div className="flex justify-center gap-2">
          <Stone color="black" size={64} className="animate-stone-drop" />
          <Stone color="white" size={64} className="animate-stone-drop" style={{ animationDelay: "160ms" }} />
        </div>
        <h2 className="text-3xl font-bold">Đã đặt quân cuối.</h2>
        {sentTo.confirmed ? (
          <p className="mx-auto max-w-xs text-[15px] text-ink/80 dark:text-paper/80">
            Ván với <b>{sentTo.player.display_name}</b> đã được ghi ngay vì họ chưa dùng app. Khi họ tham gia, bạn có thể mời họ vào kỳ quán.
          </p>
        ) : (
          <p className="mx-auto max-w-xs text-[15px] text-ink/80 dark:text-paper/80">
            Mình đã mời <b>{sentTo.player.display_name}</b> xác nhận. Khi họ gật đầu, ván này sẽ lên kỳ phổ và được tính vào thống kê của cả hai.
          </p>
        )}
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button size="lg" onClick={reset}>
            <Plus /> Ghi ván khác
          </Button>
          <Button size="lg" variant="outline" asChild className="border-ink/40 dark:border-paper/40">
            <Link href="/">Về kỳ quán</Link>
          </Button>
        </div>
      </div>
    );
  }

  const lossOrWin = result === "loss" ? "Tôi" : "Đối thủ";

  return (
    <form onSubmit={submit} noValidate className="space-y-7">
      <div ref={topRef} />
      <Step n={1} title="Bạn đã đánh với ai?" error={errors.opponent_id}>
        {allPlayers.length === 0 && (
          <p className="paper-card px-4 py-3 text-sm text-muted-foreground">
            Chưa có kỳ thủ nào khác trong kỳ quán. Bấm “Tìm khác” và gõ tên đối thủ, họ không cần có tài khoản.
          </p>
        )}
        <div data-invalid={errors.opponent_id ? "" : undefined}>
          <OpponentPicker
            recents={recents}
            everyone={allPlayers}
            defaultRank={viewerRank}
            onGuestCreated={(g) => setGuests((list) => [g, ...list])}
            value={opponentId}
            onChange={(id) => {
              setOpponentId(id);
              setErrors((e) => ({ ...e, opponent_id: "" }));
            }}
            invalid={!!errors.opponent_id}
          />
        </div>
      </Step>

      <Step n={2} title="Bạn cầm quân nào?" error={errors.my_color}>
        <div data-invalid={errors.my_color ? "" : undefined}>
          <Choice
            label="Màu quân"
            value={color}
            onChange={(c) => {
              setColor(c);
              setErrors((e) => ({ ...e, my_color: "" }));
            }}
            invalid={!!errors.my_color}
            options={[
              { value: "black", label: <Stone color="black" size={30} />, hint: "Đen · đi trước" },
              { value: "white", label: <Stone color="white" size={30} />, hint: "Trắng · đi sau" },
            ]}
          />
        </div>
      </Step>

      <Step n={3} title="Kết quả" error={errors.result}>
        <div data-invalid={errors.result ? "" : undefined}>
          <Choice
            label="Kết quả"
            value={result}
            onChange={(r) => {
              setResult(r);
              setErrors((e) => ({ ...e, result: "" }));
            }}
            invalid={!!errors.result}
            options={[
              { value: "win", label: "Tôi thắng", hint: opponent ? `${opponentFirst} thua` : undefined },
              { value: "loss", label: "Tôi thua", hint: opponent ? `${opponentFirst} thắng` : undefined },
            ]}
          />
        </div>
      </Step>

      <Step n={4} title="Ván kết thúc thế nào?" error={errors.score_difference}>
        <Choice
          label="Cách kết thúc"
          value={method}
          onChange={(m) => setMethod(m)}
          options={[
            { value: "points", label: "Tính điểm" },
            { value: "resign", label: `${lossOrWin} bỏ cuộc` },
            { value: "time", label: `${lossOrWin} hết giờ` },
          ]}
        />
        {method === "points" && (
          <div className="wood-inset space-y-3 rounded-2xl p-3" data-invalid={errors.score_difference ? "" : undefined}>
            <div className="flex items-center justify-between gap-3">
              <span className="pl-1 text-sm text-muted-foreground">{result === "loss" ? "Bạn thua" : "Bạn hơn"}</span>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="icon" aria-label="Giảm 1 điểm" onClick={() => bumpScore(-1)}>
                  <Minus />
                </Button>
                <div className="flex w-24 items-baseline justify-center gap-1">
                  <Input
                    inputMode="decimal"
                    aria-label="Số điểm chênh lệch"
                    value={score}
                    placeholder="0.5"
                    onChange={(e) => setScore(e.target.value.replace(",", ".").replace(/[^\d.]/g, ""))}
                    className="h-12 border-0 bg-transparent text-center font-display text-3xl font-bold shadow-none"
                  />
                </div>
                <Button type="button" variant="outline" size="icon" aria-label="Tăng 1 điểm" onClick={() => bumpScore(1)}>
                  <Plus />
                </Button>
              </div>
              <span className="pr-1 text-sm text-muted-foreground">điểm</span>
            </div>
            <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
              {SCORE_CHIPS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setScore(formatScore(c));
                    setErrors((e) => ({ ...e, score_difference: "" }));
                  }}
                  className={cn(
                    "h-9 shrink-0 rounded-full px-3.5 text-sm tabular-nums transition-colors",
                    scoreNumber === c ? "bg-primary text-primary-foreground" : "border border-input hover:bg-accent/60",
                  )}
                >
                  {formatScore(c)}
                </button>
              ))}
            </div>
          </div>
        )}
      </Step>

      <Step n={5} title="Khi nào, ở đâu?" error={errors.played_on || errors.location}>
        <div className="flex flex-wrap items-center gap-2">
          {[
            ["Hôm nay", today],
            ["Hôm qua", addDays(today, -1)],
          ].map(([label, value]) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setDate(value);
                setCustomDate(false);
              }}
              className={cn(
                "h-10 rounded-full px-4 text-sm font-medium",
                !customDate && date === value ? "bg-primary text-primary-foreground" : "wood-inset",
              )}
            >
              {label}
            </button>
          ))}
          {customDate ? (
            <Input type="date" max={today} value={date} onChange={(e) => setDate(e.target.value)} className="h-10 w-auto rounded-full" aria-label="Ngày đánh" />
          ) : (
            <button type="button" onClick={() => setCustomDate(true)} className="wood-inset h-10 rounded-full px-4 text-sm font-medium">
              Ngày khác…
            </button>
          )}
        </div>

        <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pt-1">
          {clubs.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => pickClub(c.id)}
              className={cn(
                "h-9 shrink-0 rounded-full px-3.5 text-[13px]",
                clubId === c.id ? "bg-secondary text-secondary-foreground" : "border border-input hover:bg-accent/60",
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
        <Input
          placeholder="Hoặc gõ nơi khác: quán cà phê, nhà bạn…"
          value={location}
          maxLength={80}
          aria-label="Địa điểm"
          onChange={(e) => {
            setLocation(e.target.value);
            setClubId(clubs.find((c) => c.name === e.target.value)?.id ?? null);
          }}
        />
      </Step>

      <details className="group wood-inset rounded-2xl">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
          Thêm ghi chú, kỳ phổ, kích thước bàn, chấp
          <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
        </summary>
        <div className="space-y-4 px-4 pt-1 pb-4">
          <div className="space-y-1.5">
            <Label htmlFor="note">Ghi chú — một câu về ván này</Label>
            <Textarea id="note" rows={2} maxLength={280} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ván giằng co ở góc phải dưới…" />
            <p className="text-right text-[11px] text-muted-foreground">{note.length}/280</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sgf">Kỳ phổ (tuỳ chọn)</Label>
            {sgf ? (
              <div className="flex items-center gap-2 rounded-xl border border-input px-3 py-2 text-sm">
                <FileUp className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">
                  {sgf.name}, {sgf.moves} nước, bàn {sgf.size}×{sgf.size}
                </span>
                <button type="button" onClick={() => setSgf(null)} aria-label="Bỏ kỳ phổ" className="grid size-7 place-items-center rounded-full hover:bg-foreground/10">
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <Input id="sgf" type="file" accept={RECORD_ACCEPT} onChange={(e) => attachSgf(e.target.files?.[0])} className="h-auto py-2 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-secondary file:px-3 file:py-1 file:text-secondary-foreground" />
            )}
            <p className="text-xs text-muted-foreground">Mọi người sẽ xem lại được từng nước. Đối thủ cũng có thể tải kỳ phổ lên sau. {SUPPORTED_RECORD_NOTE}</p>
            {errors.sgf && <p className="text-xs font-medium text-loss">{errors.sgf}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="board">Bàn cờ</Label>
              <Select id="board" value={boardSize} onChange={(e) => setBoardSize(Number(e.target.value) as 9 | 13 | 19)}>
                <option value={19}>19 × 19</option>
                <option value={13}>13 × 13</option>
                <option value={9}>9 × 9</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="handicap">Chấp</Label>
              <Select id="handicap" value={handicap} onChange={(e) => setHandicap(Number(e.target.value))}>
                <option value={0}>Không chấp</option>
                {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n} quân
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>
      </details>

      <div className="space-y-2 pt-1">
        <Button type="submit" size="lg" className="h-14 w-full text-base" pending={pending}>
          {!pending && <Check />} {opponent?.isGuest ? "Đặt quân cuối — ghi ván" : `Đặt quân cuối — gửi cho ${opponent ? opponentFirst : "đối thủ"}`}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          {opponent?.isGuest
            ? `${opponent.display_name} chưa dùng app nên ván được ghi ngay, không cần xác nhận.`
            : `Ván chỉ được tính sau khi ${opponent ? opponent.display_name : "đối thủ"} xác nhận.`}
        </p>
      </div>
    </form>
  );
}

