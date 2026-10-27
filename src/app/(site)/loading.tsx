import { Skeleton } from "@/components/ui/skeleton";

/** Khung xương dùng chung khi trang đang tải: một khối tiêu đề và vài thẻ, không nhảy bố cục. */
export default function Loading() {
  return (
    <div className="space-y-6" role="status" aria-live="polite" aria-label="Đang tải">
      <Skeleton className="h-52 rounded-[1.15rem] sm:h-60" />
      <div className="space-y-3.5">
        <Skeleton className="h-8 w-56" />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-44 rounded-[1.15rem]" />
        ))}
      </div>
      <span className="sr-only">Đang tải…</span>
    </div>
  );
}
