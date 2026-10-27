import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6" role="status" aria-live="polite" aria-label="Đang tải đối đầu">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-11" />
      <Skeleton className="h-72 rounded-[1.15rem]" />
      <Skeleton className="h-40 rounded-[1.15rem]" />
      <span className="sr-only">Đang tải…</span>
    </div>
  );
}
