import { Stone } from "@/components/go/stone";

/** Hiện thay cho toàn bộ app khi chưa có biến môi trường Supabase. */
export function SetupNotice() {
  return (
    <div className="grid min-h-dvh place-items-center px-6">
      <div className="wood-card wood-board max-w-md space-y-4 px-7 py-10 text-center">
        <div className="flex justify-center gap-2">
          <Stone color="black" size={52} />
          <Stone color="white" size={52} />
        </div>
        <h1 className="text-4xl font-bold">Kỳ quán chưa mở cửa</h1>
        <p className="text-[15px] text-ink/80 dark:text-paper/80">Go Đà Nẵng chưa được kết nối cơ sở dữ liệu nên chưa đón khách được. Bạn quay lại sau ít phút nhé.</p>
        <p className="border-t border-ink/20 pt-4 text-left text-xs text-ink/70 dark:border-paper/20 dark:text-paper/70">
          Dành cho người quản trị: thêm <code>NEXT_PUBLIC_SUPABASE_URL</code> và <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> vào biến môi trường rồi chạy lại. Xem README.
        </p>
      </div>
    </div>
  );
}
