import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-8" role="status" aria-live="polite" aria-label="Đang tải hồ sơ">
      <Skeleton className="h-64 rounded-[1.15rem] sm:h-56" />
      <Skeleton className="h-24 rounded-[1.15rem]" />
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Skeleton className="h-72 rounded-[1.15rem]" />
        <Skeleton className="h-72 rounded-[1.15rem]" />
      </div>
      <Skeleton className="h-64 rounded-[1.15rem]" />
      <span className="sr-only">Đang tải…</span>
    </div>
  );
}
