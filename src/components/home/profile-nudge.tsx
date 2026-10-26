import Link from "next/link";
import { UserRoundPen } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Người mới đăng nhập mặc định ở hạng 10 kyu — nhắc cập nhật hạng, CLB cho đúng. */
export function ProfileNudge({ playerId }: { playerId: string }) {
  return (
    <section className="paper-card flex flex-wrap items-center gap-4 p-4 sm:p-5">
      <UserRoundPen className="size-6 shrink-0 text-wood dark:text-board" />
      <div className="min-w-0 flex-1">
        <h2 className="font-display text-xl font-semibold">Hoàn thiện hồ sơ của bạn</h2>
        <p className="text-sm text-muted-foreground">Hồ sơ mới được đặt ở 10 kyu. Chọn đúng hạng và câu lạc bộ để đối thủ nhận ra bạn.</p>
      </div>
      <Button asChild size="sm">
        <Link href={`/players/${playerId}?edit=1`}>Cập nhật</Link>
      </Button>
    </section>
  );
}
