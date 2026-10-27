"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil } from "lucide-react";
import { StoneAvatar } from "@/components/go/stone";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/client-api";
import { RANK_OPTIONS } from "@/lib/rank";

type Props = {
  defaultOpen?: boolean;
  player: { id: string; display_name: string; rank_value: number; club_id: string | null; bio: string | null; playing_since: number | null; avatar_tone: "black" | "white" | null; avatar_glyph: string | null };
  clubs: { id: string; name: string }[];
};

export function ProfileEditDialog({ player, clubs, defaultOpen = false }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    display_name: player.display_name,
    rank_value: player.rank_value,
    club_id: player.club_id ?? "",
    bio: player.bio ?? "",
    playing_since: player.playing_since ? String(player.playing_since) : "",
    avatar_tone: player.avatar_tone as "black" | "white" | null,
    avatar_glyph: player.avatar_glyph ?? "",
  });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      await api(`/api/players/${player.id}`, {
        method: "PATCH",
        json: {
          display_name: form.display_name,
          rank_value: form.rank_value,
          club_id: form.club_id || null,
          bio: form.bio,
          playing_since: form.playing_since ? Number(form.playing_since) : null,
          avatar_tone: form.avatar_tone,
          avatar_glyph: form.avatar_glyph.trim() || null,
        },
      });
      toast.success("Đã cập nhật hồ sơ.");
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-ink/40 dark:border-paper/40">
          <Pencil /> Sửa hồ sơ
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Hồ sơ của bạn</DialogTitle>
        <DialogDescription>Đổi tên hiển thị, avatar quân cờ và thông tin của bạn. Mọi người trong kỳ quán đều xem được.</DialogDescription>
        <form onSubmit={save} className="mt-5 space-y-4">
          <fieldset className="wood-inset space-y-3 rounded-2xl p-3.5">
            <legend className="sr-only">Avatar quân cờ</legend>
            <div className="flex items-center gap-4">
              <StoneAvatar
                player={{ display_name: form.display_name || "?", avatar_tone: form.avatar_tone, avatar_glyph: form.avatar_glyph.trim() || null }}
                size={72}
                labelled
              />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Label>Màu quân</Label>
                <div className="flex gap-1.5" role="radiogroup" aria-label="Màu quân">
                  {([null, "black", "white"] as const).map((t) => (
                    <button
                      key={String(t)}
                      type="button"
                      role="radio"
                      aria-checked={form.avatar_tone === t}
                      onClick={() => setForm({ ...form, avatar_tone: t })}
                      className={`h-9 flex-1 rounded-full text-sm font-medium ${form.avatar_tone === t ? "bg-primary text-primary-foreground" : "border border-input"}`}
                    >
                      {t === null ? "Tự động" : t === "black" ? "Đen" : "Trắng"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="glyph">Chữ khắc trên quân (tối đa 2 ký tự, có thể là emoji)</Label>
              <Input id="glyph" value={form.avatar_glyph} maxLength={8} placeholder="Để trống: chữ cái đầu của tên" onChange={(e) => setForm({ ...form, avatar_glyph: e.target.value })} />
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {["碁", "囲", "勝", "禅", "♟", "☯", "🍵", "🌸", "🐉", "🏯"].map((g) => (
                  <button key={g} type="button" onClick={() => setForm({ ...form, avatar_glyph: g })} className="grid size-9 place-items-center rounded-full border border-input text-lg hover:bg-foreground/8" aria-label={`Khắc ${g}`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </fieldset>
          <div className="space-y-1.5">
            <Label htmlFor="name">Tên hiển thị</Label>
            <Input id="name" required minLength={2} maxLength={60} value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="rank">Hạng</Label>
              <Select id="rank" value={form.rank_value} onChange={(e) => setForm({ ...form, rank_value: Number(e.target.value) })}>
                {RANK_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="since">Chơi từ năm</Label>
              <Input id="since" inputMode="numeric" placeholder="2018" maxLength={4} value={form.playing_since} onChange={(e) => setForm({ ...form, playing_since: e.target.value.replace(/\D/g, "") })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="club">Câu lạc bộ</Label>
            <Select id="club" value={form.club_id} onChange={(e) => setForm({ ...form, club_id: e.target.value })}>
              <option value="">Chưa vào CLB nào</option>
              {clubs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bio">Giới thiệu</Label>
            <Textarea id="bio" rows={3} maxLength={280} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Phong cách, khai cuộc yêu thích…" />
          </div>
          <Button type="submit" size="lg" className="w-full" pending={pending}>
            Lưu hồ sơ
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
