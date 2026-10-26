import { getViewer } from "@/lib/auth";
import { isDemoMode, repo } from "@/lib/data";
import { Brand } from "./brand";
import { DesktopNav } from "./desktop-nav";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

export async function SiteHeader() {
  const viewer = await getViewer();
  const pendingCount = viewer ? (await repo.listIncomingRequests(viewer.id)).length : 0;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      {isDemoMode && (
        <p className="bg-ink px-4 py-1 text-center text-[11px] tracking-wide text-paper">
          Chế độ demo · dữ liệu mẫu hư cấu — chưa kết nối Supabase
        </p>
      )}
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Brand />
        <DesktopNav />
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <UserMenu viewer={viewer && { id: viewer.id, display_name: viewer.display_name, rank_value: viewer.rank_value }} pendingCount={pendingCount} />
        </div>
      </div>
    </header>
  );
}
