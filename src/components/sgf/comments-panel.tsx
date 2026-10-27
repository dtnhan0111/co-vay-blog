"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, MessageCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Stone, StoneAvatar } from "@/components/go/stone";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/client-api";
import type { CommentView } from "@/lib/data/types";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = {
  matchId: string;
  comments: CommentView[];
  viewer: { id: string; isAdmin: boolean } | null;
  /** Nước đang xem trên bàn cờ — dùng để gắn bình luận. */
  step: number;
  totalMoves: number;
  onJump: (move: number) => void;
};

function CommentLike({ comment, signedIn }: { comment: CommentView; signedIn: boolean }) {
  const router = useRouter();
  const [state, setState] = useState({ active: comment.liked_by_me, count: comment.like_count });
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (!signedIn) return void router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
    const previous = state;
    setState({ active: !previous.active, count: previous.count + (previous.active ? -1 : 1) });
    setBusy(true);
    try {
      setState(await api<{ active: boolean; count: number }>(`/api/comments/${comment.id}/like`, { method: "POST" }));
    } catch (e) {
      setState(previous);
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={state.active}
      className={cn("-ml-2 inline-flex h-8 items-center gap-1.5 rounded-full px-2 text-xs font-medium hover:bg-foreground/8", state.active ? "text-foreground" : "text-muted-foreground")}
    >
      <Stone key={String(state.active)} color={state.active ? "black" : "white"} size={14} className={state.active ? "animate-stone-drop" : "opacity-70"} />
      {state.active ? "Đã đặt một quân" : "Đặt một quân"}
      {state.count > 0 && <span className="tabular-nums">· {state.count}</span>}
    </button>
  );
}

/** Bình luận kỳ phổ: nút bung/thu gọn, ai cũng đọc được, thành viên đăng nhập mới viết được. */
export function CommentsPanel({ matchId, comments, viewer, step, totalMoves, onJump }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [attach, setAttach] = useState(true);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api(`/api/matches/${matchId}/comments`, { method: "POST", json: { body, move_number: attach && step > 0 ? step : null } });
      setBody("");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Xoá bình luận này?")) return;
    try {
      await api(`/api/comments/${id}`, { method: "DELETE" });
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <div className="mx-auto max-w-[560px]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="sgf-comments"
        className="wood-inset flex h-12 w-full items-center gap-2.5 rounded-2xl px-4 text-sm font-medium"
      >
        <MessageCircle className="size-4" />
        Bình luận kỳ phổ{comments.length > 0 && <span className="tabular-nums text-muted-foreground">({comments.length})</span>}
        <ChevronDown className={cn("ml-auto size-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div id="sgf-comments" className="mt-3 space-y-4">
          {comments.length === 0 && <p className="px-1 text-sm text-muted-foreground">Chưa có bình luận nào. Nói gì đó về một nước đi hay một thế cờ nhé.</p>}

          <ul className="space-y-3">
            {comments.map((c) => (
              <li key={c.id} className="paper-card flex gap-3 p-3">
                <StoneAvatar player={c.author} size={34} className="mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
                    <Link href={`/players/${c.author.id}`} className="font-semibold hover:underline">
                      {c.author.display_name}
                    </Link>
                    <span className="text-xs text-muted-foreground" suppressHydrationWarning>
                      {timeAgo(c.created_at)}
                    </span>
                    {c.move_number !== null && (
                      <button
                        type="button"
                        onClick={() => onJump(c.move_number!)}
                        className="rounded-full border border-wood/50 px-2 py-px text-xs font-medium text-wood hover:bg-foreground/8 dark:text-board"
                        title="Xem nước này trên bàn cờ"
                      >
                        Nước {c.move_number}
                      </button>
                    )}
                  </p>
                  <p className="mt-0.5 text-[15px] leading-relaxed break-words whitespace-pre-line">{c.body}</p>
                  <div className="mt-1 flex items-center gap-1">
                    <CommentLike comment={c} signedIn={!!viewer} />
                    {viewer && (viewer.id === c.author.id || viewer.isAdmin) && (
                      <button type="button" onClick={() => remove(c.id)} className="inline-flex h-8 items-center gap-1 rounded-full px-2 text-xs text-muted-foreground hover:bg-foreground/8" aria-label="Xoá bình luận">
                        <Trash2 className="size-3.5" /> Xoá
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {viewer ? (
            <form onSubmit={submit} className="space-y-2">
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={500} rows={3} placeholder="Viết nhận xét về ván cờ…" aria-label="Nội dung bình luận" />
              <div className="flex flex-wrap items-center justify-between gap-2">
                {step > 0 && step <= totalMoves ? (
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input type="checkbox" checked={attach} onChange={(e) => setAttach(e.target.checked)} className="size-4 accent-[var(--wood)]" />
                    Gắn với nước {step}
                  </label>
                ) : (
                  <span className="text-xs text-muted-foreground">Kéo bàn cờ tới một nước để gắn bình luận vào đó.</span>
                )}
                <Button type="submit" size="sm" pending={busy} disabled={!body.trim()}>
                  Đăng bình luận
                </Button>
              </div>
            </form>
          ) : (
            <p className="paper-card px-4 py-3 text-sm">
              <Link href={`/login?next=${encodeURIComponent(`/matches/${matchId}`)}`} className="font-medium underline underline-offset-4">
                Đăng nhập
              </Link>{" "}
              để bình luận và đặt một quân cho nhận xét hay.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
