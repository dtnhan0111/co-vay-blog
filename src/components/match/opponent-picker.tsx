"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { RankBadge } from "@/components/go/rank-badge";
import { StoneAvatar } from "@/components/go/stone";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type PickerPlayer = { id: string; display_name: string; rank_value: number; clubName: string | null };

type Props = {
  recents: PickerPlayer[];
  everyone: PickerPlayer[];
  value: string | null;
  onChange: (id: string) => void;
  invalid?: boolean;
};

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").toLowerCase();

/** Chọn đối thủ bằng một chạm: những người hay đánh cùng hiện sẵn, còn lại tìm trong danh bạ. */
export function OpponentPicker({ recents, everyone, value, onChange, invalid }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = everyone.find((p) => p.id === value);
  const chips = selected && !recents.some((r) => r.id === selected.id) ? [selected, ...recents] : recents;

  const results = useMemo(() => {
    const q = fold(query.trim());
    return everyone.filter((p) => !q || fold(p.display_name).includes(q));
  }, [everyone, query]);

  return (
    <>
      <div
        role="radiogroup"
        aria-label="Đối thủ"
        className={cn("no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pt-1 pb-2", invalid && "rounded-2xl ring-2 ring-loss/60")}
      >
        {chips.map((p) => {
          const active = p.id === value;
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(p.id)}
              className={cn(
                "flex w-[84px] shrink-0 flex-col items-center gap-1.5 rounded-2xl px-2 py-3 text-center transition-all",
                active ? "bg-primary text-primary-foreground shadow-lg" : "wood-inset hover:brightness-[1.03]",
              )}
            >
              <StoneAvatar name={p.display_name} size={48} className={cn(active && "ring-2 ring-primary-foreground/70")} />
              <span className="w-full truncate text-xs font-semibold">{p.display_name.split(/\s+/).slice(-2).join(" ")}</span>
              <span className={cn("text-[10px] tabular-nums", active ? "text-primary-foreground/70" : "text-muted-foreground")}>
                {p.rank_value >= 1 ? `${p.rank_value}d` : `${1 - p.rank_value}k`}
              </span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="wood-inset flex w-[84px] shrink-0 flex-col items-center justify-center gap-1.5 rounded-2xl px-2 py-3 text-xs font-medium text-muted-foreground"
        >
          <span className="grid size-12 place-items-center rounded-full border border-dashed border-wood/60">
            <Search className="size-5" />
          </span>
          Tìm khác
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex h-[80dvh] flex-col sm:h-[34rem]">
          <DialogTitle>Chọn đối thủ</DialogTitle>
          <DialogDescription>Gõ tên, có hoặc không dấu đều được.</DialogDescription>
          <Input autoFocus className="mt-4 shrink-0" placeholder="Tìm kỳ thủ…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <ul className="mt-3 -mx-2 min-h-0 flex-1 overflow-y-auto">
            {results.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(p.id);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-foreground/8"
                >
                  <StoneAvatar name={p.display_name} size={40} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{p.display_name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{p.clubName ?? "Chưa vào CLB"}</span>
                  </span>
                  <RankBadge rank={p.rank_value} />
                </button>
              </li>
            ))}
            {results.length === 0 && <li className="py-8 text-center text-sm text-muted-foreground">Không thấy ai tên như vậy.</li>}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}
