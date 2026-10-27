"use client";

import { useMemo, useState } from "react";
import type { CommentView } from "@/lib/data/types";
import { buildReplay } from "@/lib/sgf/replay";
import { CommentsPanel } from "./comments-panel";
import { SgfViewer } from "./sgf-viewer";

type Props = {
  matchId: string;
  sgf: string;
  blackName: string;
  whiteName: string;
  comments: CommentView[];
  viewer: { id: string; isAdmin: boolean } | null;
};

/** Bàn cờ tái hiện + bình luận, dùng chung một "nước đang xem" để bình luận nhảy được tới đúng nước. */
export function SgfSection({ matchId, sgf, blackName, whiteName, comments, viewer }: Props) {
  const [step, setStep] = useState(0);
  const totalMoves = useMemo(() => {
    try {
      return buildReplay(sgf).moves;
    } catch {
      return 0;
    }
  }, [sgf]);

  return (
    <div className="space-y-4">
      <div id="sgf-board">
        <SgfViewer sgf={sgf} blackName={blackName} whiteName={whiteName} step={step} onStepChange={setStep} />
      </div>
      <CommentsPanel
        matchId={matchId}
        comments={comments}
        viewer={viewer}
        step={step}
        totalMoves={totalMoves}
        onJump={(move) => {
          setStep(move);
          document.getElementById("sgf-board")?.scrollIntoView({ behavior: "smooth", block: "center" });
        }}
      />
    </div>
  );
}
