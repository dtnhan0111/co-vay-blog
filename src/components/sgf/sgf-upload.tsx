"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { FileUp, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client-api";
import {
  RECORD_ACCEPT,
  SUPPORTED_RECORD_NOTE,
  readSgfFile,
} from "@/lib/sgf/read-file";
import { sgfProblem } from "@/lib/validators";

/** Dành cho hai người chơi: thêm, thay hoặc gỡ kỳ phổ .sgf của ván. */
export function SgfUpload({
  matchId,
  hasSgf,
  boardSize,
}: {
  matchId: string;
  hasSgf: boolean;
  boardSize: number;
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"upload" | "remove" | null>(null);

  async function save(sgf: string | null) {
    setBusy(sgf ? "upload" : "remove");
    try {
      await api(`/api/matches/${matchId}/sgf`, {
        method: "PATCH",
        json: { sgf },
      });
      toast.success(sgf ? "Đã lưu kỳ phổ." : "Đã gỡ kỳ phổ.");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    try {
      const text = await readSgfFile(file);
      const problem = sgfProblem(text, boardSize);
      if (problem) return void toast.error(problem);
      await save(text);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={input}
          type="file"
          accept={RECORD_ACCEPT}
          className="sr-only"
          onChange={(e) => onFile(e.target.files?.[0])}
          aria-label="Chọn file kỳ phổ SGF"
        />
        <Button
          variant={hasSgf ? "outline" : "default"}
          pending={busy === "upload"}
          disabled={!!busy}
          onClick={() => input.current?.click()}
        >
          {busy !== "upload" && <FileUp />}{" "}
          {hasSgf ? "Thay kỳ phổ" : "Tải kỳ phổ lên"}
        </Button>
        {hasSgf && (
          <Button
            variant="ghost"
            className="text-muted-foreground"
            pending={busy === "remove"}
            disabled={!!busy}
            onClick={() => save(null)}
          >
            {busy !== "remove" && <Trash2 />} Gỡ kỳ phổ
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{SUPPORTED_RECORD_NOTE}</p>
    </div>
  );
}
