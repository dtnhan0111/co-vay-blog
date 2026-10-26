"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { formatRankShort } from "@/lib/rank";

type Props = { players: { id: string; display_name: string; rank_value: number }[]; a: string | null; b: string | null };

export function H2HPicker({ players, a, b }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function go(nextA: string | null, nextB: string | null) {
    const qs = new URLSearchParams();
    if (nextA) qs.set("a", nextA);
    if (nextB) qs.set("b", nextB);
    startTransition(() => router.replace(`/head-to-head?${qs}`, { scroll: false }));
  }

  const options = (exclude: string | null) =>
    players
      .filter((p) => p.id !== exclude)
      .map((p) => (
        <option key={p.id} value={p.id}>
          {p.display_name} · {formatRankShort(p.rank_value)}
        </option>
      ));

  return (
    <div className="grid items-end gap-2.5 sm:grid-cols-[1fr_auto_1fr]" aria-busy={pending}>
      <Select value={a ?? ""} onChange={(e) => go(e.target.value || null, b)} aria-label="Kỳ thủ thứ nhất">
        <option value="">Chọn kỳ thủ…</option>
        {options(b)}
      </Select>
      <Button type="button" variant="ghost" size="icon" className="mx-auto" aria-label="Đổi chỗ hai kỳ thủ" disabled={!a || !b} onClick={() => go(b, a)}>
        <ArrowLeftRight />
      </Button>
      <Select value={b ?? ""} onChange={(e) => go(a, e.target.value || null)} aria-label="Kỳ thủ thứ hai">
        <option value="">Chọn đối thủ…</option>
        {options(a)}
      </Select>
    </div>
  );
}
