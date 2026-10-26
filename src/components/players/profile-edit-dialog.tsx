"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil } from "lucide-react";
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
  player: { id: string; display_name: string; rank_value: number; club_id: string | null; bio: string | null; playing_since: number | null };
  clubs: { id: string; name: string }[];
};

export function ProfileEditDialog({ player, clubs }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    display_name: player.display_name,
    rank_value: player.rank_value,
    club_id: player.club_id ?? "",
    bio: player.bio ?? "",
    playing_since: player.playing_since ? String(player.playing_since) : "",
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
        <DialogDescription>Mọi người trong kỳ quán đều xem được thông tin này.</DialogDescription>
        <form onSubmit={save} className="mt-5 space-y-4">
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
